import { Hono } from 'hono'
import { createNotionClient, NotionProperty, toNotionProperty } from '../lib/notion'

type Bindings = {
  NOTION_TOKEN: string
  NOTION_DB_INSTALLMENTS: string
  NOTION_DB_TRANSACTIONS: string
  NOTION_DB_PAYMENTS: string
}

const installment = new Hono<{ Bindings: Bindings }>()

// POST /api/installment - 分割払いを登録（マスタ＋n ヶ月分の取引を一括作成）
installment.post('/', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)

  const body = await c.req.json().catch(() => null)
  if (!body) {
    return c.json({ error: 'BAD_REQUEST', message: 'Invalid JSON body' }, 400)
  }

  const { name, totalAmount, months, cardId, categoryId, firstPaymentMonth, memo } = body

  if (!name || totalAmount == null || !months || !cardId || !firstPaymentMonth) {
    return c.json(
      {
        error: 'BAD_REQUEST',
        message: 'name, totalAmount, months, cardId, firstPaymentMonth are required',
      },
      400
    )
  }

  if (!/^\d{4}-\d{2}$/.test(firstPaymentMonth)) {
    return c.json(
      { error: 'BAD_REQUEST', message: 'firstPaymentMonth must be in YYYY-MM format' },
      400
    )
  }

  // カードの分割手数料率表を取得
  const cardPage = await notion.retrievePage(cardId)
  if (!cardPage || cardPage.archived) {
    return c.json({ error: 'NOT_FOUND', message: 'Card not found' }, 404)
  }

  const feeRatesRaw = NotionProperty.richText(cardPage.properties['分割手数料率表'])
  let feeRates: Record<string, number> = {}
  try {
    feeRates = feeRatesRaw ? JSON.parse(feeRatesRaw) : {}
  } catch {
    feeRates = {}
  }

  // 手数料率取得（アドオン方式）
  const feeRate = feeRates[String(months)] ?? 0

  // 計算: 手数料総額 = 総額 × 手数料率/100 × 回数 / 12
  const totalFee = Math.round((totalAmount * (feeRate / 100) * months) / 12)
  const monthlyPayment = Math.round((totalAmount + totalFee) / months)

  // 完済予定月を計算
  const [fpYear, fpMon] = firstPaymentMonth.split('-').map(Number)
  const completionDate = new Date(fpYear, fpMon - 1 + months - 1, 1)
  const completionMonth = `${completionDate.getFullYear()}-${String(completionDate.getMonth() + 1).padStart(2, '0')}`

  // 分割払いマスタを作成
  const installmentProperties: Record<string, any> = {
    '商品名': toNotionProperty.title(name),
    '総額': toNotionProperty.number(totalAmount),
    '分割回数': toNotionProperty.number(months),
    '手数料総額': toNotionProperty.number(totalFee),
    '使用カード': toNotionProperty.relation([cardId]),
    '初回支払月': toNotionProperty.date(`${firstPaymentMonth}-01`),
    'ステータス': toNotionProperty.select('支払中'),
  }
  if (categoryId) installmentProperties['カテゴリ'] = toNotionProperty.relation([categoryId])
  if (memo) installmentProperties['メモ'] = toNotionProperty.richText(memo)

  const installmentPage = await notion.createPage(
    c.env.NOTION_DB_INSTALLMENTS,
    installmentProperties
  )

  // n ヶ月分の取引を順番に作成（Notion APIのレート制限：3 req/秒を考慮してシリアル実行）
  const createdTxIds: string[] = []

  for (let i = 0; i < months; i++) {
    const payDate = new Date(fpYear, fpMon - 1 + i, 1)
    const payMonthStr = `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, '0')}-01`

    const txProperties: Record<string, any> = {
      '日時': toNotionProperty.date(payMonthStr),
      '種別': toNotionProperty.select('支出'),
      '金額': toNotionProperty.number(monthlyPayment),
      '記録元': toNotionProperty.select('分割払い'),
      '支払方法': toNotionProperty.relation([cardId]),
      '紐づく分割払い': toNotionProperty.relation([installmentPage.id]),
      '分割進捗': toNotionProperty.richText(`${i + 1}/${months}`),
    }
    if (categoryId) txProperties['カテゴリ（小）'] = toNotionProperty.relation([categoryId])
    if (memo) txProperties['メモ'] = toNotionProperty.richText(`${name}（${i + 1}/${months}回目）`)

    const txPage = await notion.createPage(c.env.NOTION_DB_TRANSACTIONS, txProperties)
    createdTxIds.push(txPage.id)

    // Notion APIのレート制限対策（3 req/秒以内）
    if (i < months - 1) {
      await new Promise((resolve) => setTimeout(resolve, 350))
    }
  }

  return c.json(
    {
      installmentId: installmentPage.id,
      monthlyPayment,
      totalFee,
      feeRate,
      completionMonth,
      createdTransactions: createdTxIds.length,
    },
    201
  )
})

export { installment }
