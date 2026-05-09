import { Hono } from 'hono'
import { createNotionClient, NotionProperty } from '../lib/notion'

type Bindings = {
  NOTION_TOKEN: string
  NOTION_DB_TRANSACTIONS: string
  NOTION_DB_PAYMENTS: string
  NOTION_DB_CATEGORIES: string
  NOTION_DB_MONTHLY_SNAPSHOT: string
}

const dashboard = new Hono<{ Bindings: Bindings }>()

// GET /api/dashboard - ホーム画面用集約データ
dashboard.get('/', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)

  const now = new Date()
  const jstOffset = 9 * 60 * 60 * 1000
  const jstNow = new Date(now.getTime() + jstOffset)
  const year = jstNow.getUTCFullYear()
  const mon = jstNow.getUTCMonth() + 1
  const month = `${year}-${String(mon).padStart(2, '0')}`
  const startDate = `${month}-01`
  const lastDay = new Date(year, mon, 0).getDate()
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}`

  // 並列取得：今月スナップショット・今月取引・支払方法（カード）
  const [snapshotRes, txRes, paymentRes] = await Promise.all([
    // 今月のスナップショット（年月はtitle型: "2026-05" 形式）
    notion.queryDatabase(c.env.NOTION_DB_MONTHLY_SNAPSHOT, {
      filter: {
        property: '年月',
        title: { equals: month },
      },
      pageSize: 1,
    }),
    // 今月の取引（最新100件）
    notion.queryDatabase(c.env.NOTION_DB_TRANSACTIONS, {
      filter: {
        and: [
          { property: '日時', date: { on_or_after: startDate } },
          { property: '日時', date: { on_or_before: endDate } },
        ],
      },
      sorts: [{ property: '日時', direction: 'descending' }],
      pageSize: 100,
    }),
    // カード一覧
    notion.queryDatabase(c.env.NOTION_DB_PAYMENTS, {
      filter: {
        or: [
          { property: 'タイプ区分', multi_select: { contains: 'クレジット' } },
          { property: 'タイプ区分', multi_select: { contains: 'デビット' } },
        ],
      },
      sorts: [{ property: '表示順', direction: 'ascending' }],
    }),
  ])

  // スナップショットから利用可能額を取得
  let available = null
  if (snapshotRes.results.length > 0) {
    const sp = snapshotRes.results[0].properties
    available = {
      amount: NotionProperty.number(sp['現在の利用可能残高']),
      income: NotionProperty.number(sp['給料額']),
      fixedExpenses:
      (NotionProperty.number(sp['来月支払固定費合計']) ?? 0) +
      (NotionProperty.number(sp['来月支払ローン合計']) ?? 0) +
      (NotionProperty.number(sp['来月支払リボ額']) ?? 0) +
      (NotionProperty.number(sp['目標貯金額']) ?? 0),
    }
  }

  // カード別今月利用額を集計
  const cardUsageMap = new Map<string, number>()
  for (const page of txRes.results) {
    const p = page.properties
    if (NotionProperty.select(p['種別']) !== '支出') continue
    const amount = NotionProperty.number(p['金額']) ?? 0
    const paymentIds = NotionProperty.relation(p['支払方法'])
    for (const pid of paymentIds) {
      cardUsageMap.set(pid, (cardUsageMap.get(pid) ?? 0) + amount)
    }
  }

  // カード情報を整形
  const cards = paymentRes.results.map((page: any) => {
    const p = page.properties
    const usage = cardUsageMap.get(page.id) ?? 0
    const limit = NotionProperty.number(p['月次利用上限']) ?? 0
    const limitEnabled = NotionProperty.checkbox(p['利用上限を有効化'])
    return {
      id: page.id,
      name: NotionProperty.title(p['名称']),
      logoUrl: NotionProperty.url(p['ロゴURL']),
      types: NotionProperty.multiSelect(p['タイプ区分']),
      currentUsage: usage,
      monthlyLimit: limit,
      limitEnabled,
      percentage: limitEnabled && limit > 0 ? Math.round((usage / limit) * 100) : null,
    }
  })

  // 最近の取引（最大10件）
  const recentTransactions = txRes.results.slice(0, 10).map((page: any) => {
    const p = page.properties
    return {
      id: page.id,
      datetime: NotionProperty.date(p['日時']),
      type: NotionProperty.select(p['種別']),
      amount: NotionProperty.number(p['金額']),
      categoryIds: NotionProperty.relation(p['カテゴリ']),
      paymentMethodIds: NotionProperty.relation(p['支払方法']),
      memo: NotionProperty.richText(p['メモ']),
    }
  })

  return c.json({
    month,
    available,
    cards,
    recentTransactions,
  })
})

export { dashboard }
