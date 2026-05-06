import { Hono } from 'hono'
import { createNotionClient, NotionProperty, toNotionProperty } from '../lib/notion'

type Bindings = {
  NOTION_TOKEN: string
  NOTION_DB_TRANSACTIONS: string
  NOTION_DB_CATEGORIES: string
  NOTION_DB_PAYMENTS: string
}

const transactions = new Hono<{ Bindings: Bindings }>()

// Notionページを取引レコードに変換
function pageToTransaction(page: any) {
  const p = page.properties
  return {
    id: page.id,
    datetime: NotionProperty.date(p['日時']),
    type: NotionProperty.select(p['種別']),
    amount: NotionProperty.number(p['金額']),
    paymentMethodIds: NotionProperty.relation(p['支払方法']),
    categoryIds: NotionProperty.relation(p['カテゴリ（小）']),
    source: NotionProperty.select(p['記録元']),
    installmentProgress: NotionProperty.richText(p['分割進捗']),
    memo: NotionProperty.richText(p['メモ']),
    createdAt: page.created_time,
  }
}

// GET /api/transactions?month=YYYY-MM&type=expense|income|transfer|all
transactions.get('/', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)
  const month = c.req.query('month')
  const type = c.req.query('type') || 'all'

  if (!month) {
    return c.json({ error: 'BAD_REQUEST', message: 'month parameter is required (YYYY-MM)' }, 400)
  }

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return c.json({ error: 'BAD_REQUEST', message: 'month must be in YYYY-MM format' }, 400)
  }

  const [year, mon] = month.split('-').map(Number)
  const startDate = `${month}-01`
  const lastDay = new Date(year, mon, 0).getDate()
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}`

  const filters: any[] = [
    {
      property: '日時',
      date: { on_or_after: startDate },
    },
    {
      property: '日時',
      date: { on_or_before: endDate },
    },
  ]

  if (type !== 'all') {
    const typeLabel = type === 'expense' ? '支出' : type === 'income' ? '収入' : type
    filters.push({ property: '種別', select: { equals: typeLabel } })
  }

  const results: any[] = []
  let hasMore = true
  let startCursor: string | undefined

  while (hasMore) {
    const response = await notion.queryDatabase(c.env.NOTION_DB_TRANSACTIONS, {
      filter: { and: filters },
      sorts: [{ property: '日時', direction: 'descending' }],
      startCursor,
      pageSize: 100,
    })
    results.push(...response.results)
    hasMore = response.has_more
    startCursor = response.next_cursor
  }

  const txList = results.map(pageToTransaction)

  // サマリー計算
  let income = 0
  let expense = 0
  for (const tx of txList) {
    const amount = tx.amount ?? 0
    if (tx.type === '収入') income += amount
    else if (tx.type === '支出') expense += amount
  }

  // 日付グループ化
  const groupMap = new Map<string, typeof txList>()
  for (const tx of txList) {
    const date = tx.datetime ? tx.datetime.slice(0, 10) : 'unknown'
    if (!groupMap.has(date)) groupMap.set(date, [])
    groupMap.get(date)!.push(tx)
  }

  const groups = Array.from(groupMap.entries()).map(([date, txs]) => {
    const dayTotal = txs.reduce((sum, tx) => {
      const amount = tx.amount ?? 0
      if (tx.type === '収入') return sum + amount
      if (tx.type === '支出') return sum - amount
      return sum
    }, 0)
    return { date, dayTotal, transactions: txs }
  })

  return c.json({
    month,
    summary: { income, expense, net: income - expense },
    groups,
  })
})

// POST /api/transactions - 取引を記録
transactions.post('/', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)
  const body = await c.req.json().catch(() => null)

  if (!body) {
    return c.json({ error: 'BAD_REQUEST', message: 'Invalid JSON body' }, 400)
  }

  const { datetime, type, amount, paymentMethodId, categoryId, memo, source } = body

  if (!datetime || !type || amount == null) {
    return c.json({ error: 'BAD_REQUEST', message: 'datetime, type, amount are required' }, 400)
  }

  const typeLabel = type === 'expense' ? '支出' : type === 'income' ? '収入' : String(type)
  const sourceLabel = source || '手動'

  const properties: Record<string, any> = {
    '日時': toNotionProperty.date(datetime),
    '種別': toNotionProperty.select(typeLabel),
    '金額': toNotionProperty.number(amount),
    '記録元': toNotionProperty.select(sourceLabel),
  }

  if (paymentMethodId) properties['支払方法'] = toNotionProperty.relation([paymentMethodId])
  if (categoryId) properties['カテゴリ（小）'] = toNotionProperty.relation([categoryId])
  if (memo) properties['メモ'] = toNotionProperty.richText(memo)

  const page = await notion.createPage(c.env.NOTION_DB_TRANSACTIONS, properties)

  return c.json({ id: page.id, createdAt: page.created_time }, 201)
})

// PATCH /api/transactions/:id - 取引を編集
transactions.patch('/:id', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => null)

  if (!body) {
    return c.json({ error: 'BAD_REQUEST', message: 'Invalid JSON body' }, 400)
  }

  const { datetime, type, amount, paymentMethodId, categoryId, memo } = body
  const properties: Record<string, any> = {}

  if (datetime) properties['日時'] = toNotionProperty.date(datetime)
  if (type) {
    const typeLabel = type === 'expense' ? '支出' : type === 'income' ? '収入' : String(type)
    properties['種別'] = toNotionProperty.select(typeLabel)
  }
  if (amount != null) properties['金額'] = toNotionProperty.number(amount)
  if (paymentMethodId) properties['支払方法'] = toNotionProperty.relation([paymentMethodId])
  if (categoryId) properties['カテゴリ（小）'] = toNotionProperty.relation([categoryId])
  if (memo !== undefined) properties['メモ'] = toNotionProperty.richText(memo)

  if (Object.keys(properties).length === 0) {
    return c.json({ error: 'BAD_REQUEST', message: 'No fields to update' }, 400)
  }

  await notion.updatePage(id, properties)

  return c.json({ id, updatedAt: new Date().toISOString() })
})

// DELETE /api/transactions/:id - 取引削除（アーカイブ）
transactions.delete('/:id', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)
  const id = c.req.param('id')

  await notion.archivePage(id)

  return c.json({ id, deleted: true })
})

// GET /api/transactions/:id - 取引詳細
transactions.get('/:id', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)
  const id = c.req.param('id')

  const page = await notion.retrievePage(id)
  if (!page || page.archived) {
    return c.json({ error: 'NOT_FOUND', message: 'Transaction not found' }, 404)
  }

  return c.json({ transaction: pageToTransaction(page) })
})

export { transactions }
