import { Hono } from 'hono'
import { createNotionClient, NotionProperty, queryDatabaseAll, toNotionProperty } from '../lib/notion'

type Bindings = {
  NOTION_TOKEN: string
  NOTION_DB_WISHLIST: string
  NOTION_DB_TRANSACTIONS: string
  NOTION_DB_CATEGORIES: string
}

const wishlist = new Hono<{ Bindings: Bindings }>()

// GET /api/wishlist - 欲しいもの一覧（未購入のみ）
wishlist.get('/', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)
  const status = c.req.query('status') || 'pending'

  const filter =
    status === 'all'
      ? undefined
      : { property: 'ステータス', select: { equals: '未購入' } }

  const pages = await queryDatabaseAll(notion, c.env.NOTION_DB_WISHLIST, {
    filter,
    sorts: [{ property: '優先度', direction: 'ascending' }],
  })

  const items = pages.map((page: any) => {
    const p = page.properties
    return {
      id: page.id,
      name: NotionProperty.title(p['商品名']),
      estimatedAmount: NotionProperty.number(p['想定金額']),
      categoryIds: NotionProperty.relation(p['カテゴリ']),
      priority: NotionProperty.select(p['優先度']),
      status: NotionProperty.select(p['ステータス']),
      purchasedAt: NotionProperty.date(p['購入日']),
      transactionIds: NotionProperty.relation(p['紐づく取引記録']),
      url: NotionProperty.url(p['URL']),
      memo: NotionProperty.richText(p['メモ']),
    }
  })

  return c.json({ items })
})

// POST /api/wishlist/:id/purchase - 欲しいものを購入完了に変換
wishlist.post('/:id/purchase', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)
  const wishlistId = c.req.param('id')

  const body = await c.req.json().catch(() => null)
  if (!body) {
    return c.json({ error: 'BAD_REQUEST', message: 'Invalid JSON body' }, 400)
  }

  const { datetime, amount, paymentMethodId, categoryId, memo } = body

  if (!datetime || amount == null) {
    return c.json({ error: 'BAD_REQUEST', message: 'datetime and amount are required' }, 400)
  }

  // 欲しいものページを取得して存在確認
  const wishlistPage = await notion.retrievePage(wishlistId)
  if (!wishlistPage || wishlistPage.archived) {
    return c.json({ error: 'NOT_FOUND', message: 'Wishlist item not found' }, 404)
  }

  const itemName = NotionProperty.title(wishlistPage.properties['商品名'])

  // 取引記録を作成
  const txProperties: Record<string, any> = {
    '日時': toNotionProperty.date(datetime),
    '種別': toNotionProperty.select('支出'),
    '金額': toNotionProperty.number(amount),
    '記録元': toNotionProperty.select('手動'),
  }

  if (paymentMethodId) txProperties['支払方法'] = toNotionProperty.relation([paymentMethodId])

  // 欲しいものにカテゴリが設定されていればそれを使い、引数で上書き可能
  const resolvedCategoryId =
    categoryId ||
    NotionProperty.relation(wishlistPage.properties['カテゴリ'])[0] ||
    null

  if (resolvedCategoryId) txProperties['カテゴリ（小）'] = toNotionProperty.relation([resolvedCategoryId])

  const txMemo = memo || itemName
  if (txMemo) txProperties['メモ'] = toNotionProperty.richText(txMemo)

  const txPage = await notion.createPage(c.env.NOTION_DB_TRANSACTIONS, txProperties)

  // 欲しいものDBのステータスを「購入済み」に更新・購入日と取引記録を紐づけ
  const purchasedDate = datetime.slice(0, 10)
  await notion.updatePage(wishlistId, {
    'ステータス': toNotionProperty.select('購入済み'),
    '購入日': toNotionProperty.date(purchasedDate),
    '紐づく取引記録': toNotionProperty.relation([txPage.id]),
  })

  return c.json({
    wishlistId,
    transactionId: txPage.id,
    createdAt: txPage.created_time,
  }, 201)
})

export { wishlist }
