import { Hono } from 'hono'
import { createNotionClient, toNotionProperty } from '../lib/notion'

type Bindings = {
  NOTION_TOKEN: string
  NOTION_DB_TRANSFERS: string
}

const transfer = new Hono<{ Bindings: Bindings }>()

// POST /api/transfer - 口座間振替を記録
transfer.post('/', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)

  const body = await c.req.json().catch(() => null)
  if (!body) {
    return c.json({ error: 'BAD_REQUEST', message: 'Invalid JSON body' }, 400)
  }

  const { datetime, fromAccountId, toAccountId, amount, fee, memo } = body

  if (!datetime || !fromAccountId || !toAccountId || amount == null) {
    return c.json(
      { error: 'BAD_REQUEST', message: 'datetime, fromAccountId, toAccountId, amount are required' },
      400
    )
  }

  if (fromAccountId === toAccountId) {
    return c.json(
      { error: 'BAD_REQUEST', message: 'fromAccountId and toAccountId must be different' },
      400
    )
  }

  const properties: Record<string, any> = {
    '日時': toNotionProperty.title(datetime),
    '実行日': toNotionProperty.date(datetime),
    '振替元口座': toNotionProperty.relation([fromAccountId]),
    '振替先口座': toNotionProperty.relation([toAccountId]),
    '金額': toNotionProperty.number(amount),
    '手数料': toNotionProperty.number(fee ?? 0),
  }

  if (memo) properties['メモ'] = toNotionProperty.richText(memo)

  const page = await notion.createPage(c.env.NOTION_DB_TRANSFERS, properties)

  return c.json({ id: page.id, createdAt: page.created_time }, 201)
})

export { transfer }
