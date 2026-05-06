import { Hono } from 'hono'
import { createNotionClient, NotionProperty, queryDatabaseAll } from '../lib/notion'

type Bindings = {
  NOTION_TOKEN: string
  NOTION_DB_PAYMENTS: string
  NOTION_DB_ACCOUNTS: string
  NOTION_DB_CATEGORIES: string
  NOTION_DB_CARD_PERKS: string
  NOTION_DB_LOANS: string
  NOTION_DB_INSTALLMENTS: string
}

const master = new Hono<{ Bindings: Bindings }>()

// GET /api/master/payments - 支払方法一覧
master.get('/payments', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)

  const pages = await queryDatabaseAll(notion, c.env.NOTION_DB_PAYMENTS, {
    sorts: [{ property: '表示順', direction: 'ascending' }],
  })

  const payments = pages.map((page: any) => {
    const p = page.properties
    return {
      id: page.id,
      name: NotionProperty.title(p['名称']),
      types: NotionProperty.multiSelect(p['タイプ区分']),
      accountIds: NotionProperty.relation(p['紐づく口座']),
      closingDay: NotionProperty.number(p['締め日']),
      paymentDay: NotionProperty.number(p['支払日']),
      monthlyLimit: NotionProperty.number(p['月次利用上限']),
      limitEnabled: NotionProperty.checkbox(p['利用上限を有効化']),
      feeRates: (() => {
        const raw = NotionProperty.richText(p['分割手数料率表'])
        try {
          return raw ? JSON.parse(raw) : null
        } catch {
          return null
        }
      })(),
      logoUrl: NotionProperty.url(p['ロゴURL']),
      color: NotionProperty.richText(p['表示色']),
      order: NotionProperty.number(p['表示順']),
    }
  })

  return c.json({ payments })
})

// GET /api/master/cards - クレジットカード／デビットのみ
master.get('/cards', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)

  const pages = await queryDatabaseAll(notion, c.env.NOTION_DB_PAYMENTS, {
    filter: {
      or: [
        { property: 'タイプ区分', multi_select: { contains: 'クレジット' } },
        { property: 'タイプ区分', multi_select: { contains: 'デビット' } },
      ],
    },
    sorts: [{ property: '表示順', direction: 'ascending' }],
  })

  const cards = pages.map((page: any) => {
    const p = page.properties
    return {
      id: page.id,
      name: NotionProperty.title(p['名称']),
      types: NotionProperty.multiSelect(p['タイプ区分']),
      accountIds: NotionProperty.relation(p['紐づく口座']),
      closingDay: NotionProperty.number(p['締め日']),
      paymentDay: NotionProperty.number(p['支払日']),
      monthlyLimit: NotionProperty.number(p['月次利用上限']),
      limitEnabled: NotionProperty.checkbox(p['利用上限を有効化']),
      feeRates: (() => {
        const raw = NotionProperty.richText(p['分割手数料率表'])
        try {
          return raw ? JSON.parse(raw) : null
        } catch {
          return null
        }
      })(),
      logoUrl: NotionProperty.url(p['ロゴURL']),
      color: NotionProperty.richText(p['表示色']),
      order: NotionProperty.number(p['表示順']),
    }
  })

  return c.json({ cards })
})

// GET /api/master/accounts - 口座一覧
master.get('/accounts', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)

  const pages = await queryDatabaseAll(notion, c.env.NOTION_DB_ACCOUNTS, {
    sorts: [{ property: '表示順', direction: 'ascending' }],
  })

  const accounts = pages.map((page: any) => {
    const p = page.properties
    return {
      id: page.id,
      name: NotionProperty.title(p['名称']),
      type: NotionProperty.select(p['口座種別']),
      balance: NotionProperty.number(p['現在残高']),
      color: NotionProperty.richText(p['表示色']),
      order: NotionProperty.number(p['表示順']),
    }
  })

  return c.json({ accounts })
})

// GET /api/master/categories?type=expense|income|all&level=large|small|all
master.get('/categories', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)
  const type = c.req.query('type') || 'all'
  const level = c.req.query('level') || 'all'

  const filters: any[] = []

  if (type !== 'all') {
    const typeLabel = type === 'expense' ? '支出' : '収入'
    filters.push({ property: '種別', select: { equals: typeLabel } })
  }

  if (level !== 'all') {
    const levelLabel = level === 'large' ? '大' : '小'
    filters.push({ property: '階層', select: { equals: levelLabel } })
  }

  const filter =
    filters.length === 1
      ? filters[0]
      : filters.length > 1
      ? { and: filters }
      : undefined

  const pages = await queryDatabaseAll(notion, c.env.NOTION_DB_CATEGORIES, {
    filter,
    sorts: [{ property: '表示順', direction: 'ascending' }],
  })

  const categories = pages.map((page: any) => {
    const p = page.properties
    return {
      id: page.id,
      name: NotionProperty.title(p['カテゴリ名']),
      type: NotionProperty.select(p['種別']),
      level: NotionProperty.select(p['階層']),
      parentIds: NotionProperty.relation(p['親カテゴリ']),
      icon: NotionProperty.richText(p['アイコン']),
      order: NotionProperty.number(p['表示順']),
    }
  })

  return c.json({ categories })
})

// GET /api/master/card-perks?cardId=uuid
master.get('/card-perks', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)
  const cardId = c.req.query('cardId')

  const filter = cardId
    ? { property: 'カード', relation: { contains: cardId } }
    : undefined

  const pages = await queryDatabaseAll(notion, c.env.NOTION_DB_CARD_PERKS, { filter })

  const perks = pages.map((page: any) => {
    const p = page.properties
    return {
      id: page.id,
      cardIds: NotionProperty.relation(p['カード']),
      storeName: NotionProperty.title(p['店舗名']),
      storeLogoUrl: NotionProperty.url(p['店舗ロゴURL']),
      pointMultiplier: NotionProperty.number(p['ポイント倍率']),
    }
  })

  return c.json({ perks })
})

// GET /api/master/loans?active=true
master.get('/loans', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)
  const activeOnly = c.req.query('active') === 'true'

  const filter = activeOnly
    ? { property: '有効', checkbox: { equals: true } }
    : undefined

  const pages = await queryDatabaseAll(notion, c.env.NOTION_DB_LOANS, { filter })

  const loans = pages.map((page: any) => {
    const p = page.properties
    return {
      id: page.id,
      name: NotionProperty.title(p['名称']),
      lender: NotionProperty.richText(p['借入元']),
      borrowedAt: NotionProperty.date(p['借入日']),
      principal: NotionProperty.number(p['借入元金']),
      remaining: NotionProperty.number(p['現在残債']),
      annualRate: NotionProperty.number(p['年利（％）']),
      repaymentType: NotionProperty.select(p['返済方式']),
      totalPayments: NotionProperty.number(p['返済回数']),
      monthlyPayment: NotionProperty.number(p['月次返済額']),
      paymentDay: NotionProperty.number(p['返済日']),
      accountIds: NotionProperty.relation(p['引き落とし口座']),
      completionDate: NotionProperty.date(p['完済予定日']),
      active: NotionProperty.checkbox(p['有効']),
      memo: NotionProperty.richText(p['メモ']),
    }
  })

  return c.json({ loans })
})

// GET /api/master/installments?status=active
master.get('/installments', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)
  const status = c.req.query('status')

  const filter =
    status === 'active'
      ? { property: 'ステータス', select: { equals: '支払中' } }
      : undefined

  const pages = await queryDatabaseAll(notion, c.env.NOTION_DB_INSTALLMENTS, { filter })

  const installments = pages.map((page: any) => {
    const p = page.properties
    return {
      id: page.id,
      name: NotionProperty.title(p['商品名']),
      totalAmount: NotionProperty.number(p['総額']),
      months: NotionProperty.number(p['分割回数']),
      totalFee: NotionProperty.number(p['手数料総額']),
      cardIds: NotionProperty.relation(p['使用カード']),
      categoryIds: NotionProperty.relation(p['カテゴリ']),
      firstPaymentMonth: NotionProperty.date(p['初回支払月']),
      status: NotionProperty.select(p['ステータス']),
      memo: NotionProperty.richText(p['メモ']),
    }
  })

  return c.json({ installments })
})

export { master }
