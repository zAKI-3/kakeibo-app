import { Hono } from 'hono'
import { createNotionClient, NotionProperty, queryDatabaseAll, toNotionProperty } from '../lib/notion'

type Bindings = {
  NOTION_TOKEN: string
  NOTION_DB_REVOLVING: string
  NOTION_DB_REVOLVING_HISTORY: string
  NOTION_DB_TRANSACTIONS: string
}

const revolving = new Hono<{ Bindings: Bindings }>()

// GET /api/revolving - リボ払い一覧（有効なもの）
revolving.get('/', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)
  const activeOnly = c.req.query('active') !== 'false'

  const filter = activeOnly
    ? { property: '有効', checkbox: { equals: true } }
    : undefined

  const pages = await queryDatabaseAll(notion, c.env.NOTION_DB_REVOLVING, { filter })

  const items = pages.map((page: any) => {
    const p = page.properties
    return {
      id: page.id,
      name: NotionProperty.title(p['名称']),
      cardCompany: NotionProperty.richText(p['カード会社']),
      paymentMethodIds: NotionProperty.relation(p['紐づく支払方法']),
      remaining: NotionProperty.number(p['現在残債']),
      annualRate: NotionProperty.number(p['年利（％）']),
      paymentDay: NotionProperty.number(p['返済日']),
      accountIds: NotionProperty.relation(p['引き落とし口座']),
      active: NotionProperty.checkbox(p['有効']),
      memo: NotionProperty.richText(p['メモ']),
    }
  })

  return c.json({ items })
})

// POST /api/revolving/:id/repay - リボ返済を記録
revolving.post('/:id/repay', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)
  const revolvingId = c.req.param('id')

  const body = await c.req.json().catch(() => null)
  if (!body) {
    return c.json({ error: 'BAD_REQUEST', message: 'Invalid JSON body' }, 400)
  }

  const { date, amount, type } = body

  if (!date || amount == null || !type) {
    return c.json({ error: 'BAD_REQUEST', message: 'date, amount, type are required' }, 400)
  }
  if (type !== 'normal' && type !== 'prepayment') {
    return c.json({ error: 'BAD_REQUEST', message: 'type must be "normal" or "prepayment"' }, 400)
  }

  // リボ払いレコードを取得
  const revPage = await notion.retrievePage(revolvingId)
  if (!revPage || revPage.archived) {
    return c.json({ error: 'NOT_FOUND', message: 'Revolving record not found' }, 404)
  }

  const p = revPage.properties
  const currentRemaining = NotionProperty.number(p['現在残債']) ?? 0
  const annualRate = NotionProperty.number(p['年利（％）']) ?? 0
  const revName = NotionProperty.title(p['名称'])
  const paymentMethodIds = NotionProperty.relation(p['紐づく支払方法'])

  // 利息・元金計算
  // 通常返済: 利息 = 残債 × 年利 / 12, 元金 = 支払額 - 利息
  // 繰り上げ返済: 利息 = 0, 元金 = 支払額
  const monthlyRate = annualRate / 100 / 12
  const interest = type === 'normal' ? Math.floor(currentRemaining * monthlyRate) : 0
  const principal = amount - interest
  const newRemaining = Math.max(0, currentRemaining - principal)

  // 取引記録を作成（支出として）
  const txProperties: Record<string, any> = {
    '日時': toNotionProperty.date(date),
    '種別': toNotionProperty.select('支出'),
    '金額': toNotionProperty.number(amount),
    '記録元': toNotionProperty.select('リボ返済'),
    '紐づくリボ': toNotionProperty.relation([revolvingId]),
    'メモ': toNotionProperty.richText(`${revName} リボ返済（元金${principal}円・利息${interest}円）`),
  }
  if (paymentMethodIds.length > 0) {
    txProperties['支払方法'] = toNotionProperty.relation([paymentMethodIds[0]])
  }

  const txPage = await notion.createPage(c.env.NOTION_DB_TRANSACTIONS, txProperties)

  // 返済履歴を記録
  const historyProperties: Record<string, any> = {
    '返済日': toNotionProperty.date(date),
    'リボ': toNotionProperty.relation([revolvingId]),
    '返済種別': toNotionProperty.select(type === 'normal' ? '通常返済' : '繰り上げ'),
    '返済額（合計）': toNotionProperty.number(amount),
    '元金分': toNotionProperty.number(principal),
    '利息分': toNotionProperty.number(interest),
    '返済前残債': toNotionProperty.number(currentRemaining),
    '返済後残債': toNotionProperty.number(newRemaining),
    '紐づく取引記録': toNotionProperty.relation([txPage.id]),
  }

  const historyPage = await notion.createPage(c.env.NOTION_DB_REVOLVING_HISTORY, historyProperties)

  // 残債を更新（完済の場合は有効フラグも落とす）
  const revUpdates: Record<string, any> = {
    '現在残債': toNotionProperty.number(newRemaining),
  }
  if (newRemaining === 0) {
    revUpdates['有効'] = toNotionProperty.checkbox(false)
  }
  await notion.updatePage(revolvingId, revUpdates)

  return c.json({
    revolvingId,
    transactionId: txPage.id,
    historyId: historyPage.id,
    repayment: {
      amount,
      principal,
      interest,
      remainingBefore: currentRemaining,
      remainingAfter: newRemaining,
    },
  }, 201)
})

export { revolving }
