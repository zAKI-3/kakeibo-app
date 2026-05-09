import { Hono } from 'hono'
import { createNotionClient, NotionProperty, queryDatabaseAll, toNotionProperty } from '../lib/notion'

type Bindings = {
  NOTION_TOKEN: string
  NOTION_DB_MONTHLY_SNAPSHOT: string
  NOTION_DB_FIXED_COSTS: string
  NOTION_DB_LOANS: string
  NOTION_DB_SAVING_GOALS: string
}

const snapshot = new Hono<{ Bindings: Bindings }>()

// POST /api/snapshot - 給与入力時に月次予算スナップショットを作成
snapshot.post('/', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)

  const body = await c.req.json().catch(() => null)
  if (!body) {
    return c.json({ error: 'BAD_REQUEST', message: 'Invalid JSON body' }, 400)
  }

  const { yearMonth, salaryAmount, salaryDate, manualRevoPayment } = body

  if (!yearMonth || salaryAmount == null || !salaryDate) {
    return c.json(
      { error: 'BAD_REQUEST', message: 'yearMonth, salaryAmount, salaryDate are required' },
      400
    )
  }

  if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
    return c.json({ error: 'BAD_REQUEST', message: 'yearMonth must be in YYYY-MM format' }, 400)
  }

  // 並列取得：有効な固定費・有効なローン・今月の目標貯金
  const [year, mon] = yearMonth.split('-').map(Number)
  const startDate = `${yearMonth}-01`
  const lastDay = new Date(year, mon, 0).getDate()
  const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`

  const [fixedCosts, loans, savingGoals] = await Promise.all([
    queryDatabaseAll(notion, c.env.NOTION_DB_FIXED_COSTS, {
      filter: { property: '有効', checkbox: { equals: true } },
    }),
    queryDatabaseAll(notion, c.env.NOTION_DB_LOANS, {
      filter: { property: '有効', checkbox: { equals: true } },
    }),
    notion.queryDatabase(c.env.NOTION_DB_SAVING_GOALS, {
      filter: {
        property: '年月',
        title: { equals: yearMonth },
      },
      pageSize: 1,
    }),
  ])

  // 来月支払う固定費合計（有効な固定費をすべて合算）
  const nextFixedCostsTotal = fixedCosts.reduce((sum: number, page: any) => {
    return sum + (NotionProperty.number(page.properties['金額']) ?? 0)
  }, 0)

  // 来月支払うローン合計（有効なローンの月次返済額を合算）
  const nextLoansTotal = loans.reduce((sum: number, page: any) => {
    return sum + (NotionProperty.number(page.properties['月次返済額']) ?? 0)
  }, 0)

  // 今月の目標貯金
  const savingsGoal =
    savingGoals.results.length > 0
      ? (NotionProperty.number(savingGoals.results[0].properties['目標金額']) ?? 0)
      : 0

  const revoPayment = manualRevoPayment ?? 0

  // クレカ利用可能額（初期）を計算
  const initialAvailable =
    salaryAmount - nextFixedCostsTotal - nextLoansTotal - revoPayment - savingsGoal

  const properties: Record<string, any> = {
    '年月': toNotionProperty.title(yearMonth),
    '給料額': toNotionProperty.number(salaryAmount),
    '給料入金日': toNotionProperty.date(salaryDate),
    '来月支払固定費合計': toNotionProperty.number(nextFixedCostsTotal),
    '来月支払ローン合計': toNotionProperty.number(nextLoansTotal),
    '来月支払リボ額': toNotionProperty.number(revoPayment),
    '目標貯金額': toNotionProperty.number(savingsGoal),
    'クレカ利用可能額初期': toNotionProperty.number(initialAvailable),
    '現在の利用可能残高': toNotionProperty.number(initialAvailable),
  }

  const page = await notion.createPage(c.env.NOTION_DB_MONTHLY_SNAPSHOT, properties)

  return c.json({
    id: page.id,
    yearMonth,
    breakdown: {
      salary: salaryAmount,
      nextFixedCosts: nextFixedCostsTotal,
      nextLoans: nextLoansTotal,
      revoPayment,
      savingsGoal,
    },
    initialAvailable,
    createdAt: page.created_time,
  }, 201)
})

export { snapshot }
