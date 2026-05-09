import { Hono } from 'hono'
import { createNotionClient, NotionProperty, queryDatabaseAll, toNotionProperty } from '../lib/notion'

type Bindings = {
  NOTION_TOKEN: string
  NOTION_DB_TRANSACTIONS: string
  NOTION_DB_FIXED_COSTS: string
  NOTION_DB_LOANS: string
  NOTION_DB_LOAN_HISTORY: string
  NOTION_DB_PAYMENTS: string
  NOTION_DB_ACCOUNTS: string
  NOTION_DB_CARD_SETTLEMENTS: string
  NOTION_DB_SETTLEMENT_DETAILS: string
}

const cron = new Hono<{ Bindings: Bindings }>()

// JST の今日の日付情報を返す
function getJSTToday() {
  const jstOffset = 9 * 60 * 60 * 1000
  const jst = new Date(Date.now() + jstOffset)
  const year = jst.getUTCFullYear()
  const month = jst.getUTCMonth() + 1
  const day = jst.getUTCDate()
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return { year, month, day, dateStr }
}

// 月の最終日を取得
function lastDayOf(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

// YYYY-MM-DD 文字列を生成
function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// カード締め期間を計算する
// 例: 締め日=15, 支払日=翌10 → 4/10支払い分 = 2/16〜3/15
function getSettlementPeriod(
  closingDay: number,
  payYear: number,
  payMonth: number
): { start: string; end: string } {
  const prevYear = payMonth === 1 ? payYear - 1 : payYear
  const prevMonth = payMonth === 1 ? 12 : payMonth - 1
  const prevLastDay = lastDayOf(prevYear, prevMonth)

  // 締め日が月末相当の場合: 前月全体
  if (closingDay === 0 || closingDay >= prevLastDay) {
    return {
      start: toDateStr(prevYear, prevMonth, 1),
      end: toDateStr(prevYear, prevMonth, prevLastDay),
    }
  }

  // 締め日が月中の場合: 前々月締め日+1 〜 前月締め日
  const endDay = closingDay
  const end = toDateStr(prevYear, prevMonth, endDay)

  const prev2Year = prevMonth === 1 ? prevYear - 1 : prevYear
  const prev2Month = prevMonth === 1 ? 12 : prevMonth - 1
  const prev2LastDay = lastDayOf(prev2Year, prev2Month)
  const startDay = closingDay + 1

  if (startDay > prev2LastDay) {
    return { start: toDateStr(prevYear, prevMonth, 1), end }
  }
  return { start: toDateStr(prev2Year, prev2Month, startDay), end }
}

// Notion APIレート制限対策
async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

// POST /api/cron/daily - 毎日Cronで自動実行
cron.post('/daily', async (c) => {
  const notion = createNotionClient(c.env.NOTION_TOKEN)
  const { year, month, day, dateStr } = getJSTToday()

  const results = {
    date: dateStr,
    fixedCosts: { processed: 0, skipped: 0, errors: [] as string[] },
    loans: { processed: 0, skipped: 0, errors: [] as string[] },
    cardSettlements: { processed: 0, skipped: 0, errors: [] as string[] },
  }

  // ===== 1. 固定費の記録 =====
  try {
    const monthStart = toDateStr(year, month, 1)
    const monthEnd = toDateStr(year, month, lastDayOf(year, month))

    const fixedCosts = await queryDatabaseAll(notion, c.env.NOTION_DB_FIXED_COSTS, {
      filter: {
        and: [
          { property: '有効', checkbox: { equals: true } },
          { property: '支払日', number: { equals: day } },
        ],
      },
    })

    for (const fc of fixedCosts) {
      try {
        const p = fc.properties
        const fcId = fc.id
        const fcName = NotionProperty.title(p['名称'])
        const amount = NotionProperty.number(p['金額']) ?? 0
        const paymentMethodIds = NotionProperty.relation(p['支払方法'])
        const categoryIds = NotionProperty.relation(p['カテゴリ'])
        const endMonthStr = NotionProperty.date(p['終了月'])
        const memo = NotionProperty.richText(p['メモ'])

        // 終了月が設定されていて、今月以前なら処理しない
        if (endMonthStr) {
          const endMonth = endMonthStr.slice(0, 7) // YYYY-MM
          const currentMonth = dateStr.slice(0, 7)
          if (endMonth < currentMonth) {
            results.fixedCosts.skipped++
            continue
          }
        }

        // 今月この固定費の取引が既にあるか確認（重複防止）
        const existing = await notion.queryDatabase(c.env.NOTION_DB_TRANSACTIONS, {
          filter: {
            and: [
              { property: '日時', date: { on_or_after: monthStart } },
              { property: '日時', date: { on_or_before: monthEnd } },
              { property: '紐づく固定費', relation: { contains: fcId } },
            ],
          },
          pageSize: 1,
        })

        if (existing.results.length > 0) {
          results.fixedCosts.skipped++
          continue
        }

        const props: Record<string, any> = {
          '日時': toNotionProperty.date(`${dateStr}T00:00:00+09:00`),
          '種別': toNotionProperty.select('支出'),
          '金額': toNotionProperty.number(amount),
          '記録元': toNotionProperty.select('固定費'),
          '紐づく固定費': toNotionProperty.relation([fcId]),
        }
        if (paymentMethodIds.length > 0) {
          props['支払方法'] = toNotionProperty.relation([paymentMethodIds[0]])
        }
        if (categoryIds.length > 0) {
          props['カテゴリ'] = toNotionProperty.relation([categoryIds[0]])
        }
        if (memo || fcName) {
          props['メモ'] = toNotionProperty.richText(fcName || memo)
        }

        await notion.createPage(c.env.NOTION_DB_TRANSACTIONS, props)
        results.fixedCosts.processed++

        await sleep(350)
      } catch (err: any) {
        results.fixedCosts.errors.push(`${NotionProperty.title(fc.properties['名称'])}: ${err.message}`)
      }
    }
  } catch (err: any) {
    results.fixedCosts.errors.push(`Query failed: ${err.message}`)
  }

  // ===== 2. ローン返済の記録 =====
  try {
    const monthStart = toDateStr(year, month, 1)
    const monthEnd = toDateStr(year, month, lastDayOf(year, month))

    const loans = await queryDatabaseAll(notion, c.env.NOTION_DB_LOANS, {
      filter: {
        and: [
          { property: '有効', checkbox: { equals: true } },
          { property: '返済日', number: { equals: day } },
        ],
      },
    })

    for (const loan of loans) {
      try {
        const p = loan.properties
        const loanId = loan.id
        const loanName = NotionProperty.title(p['名称'])
        const remaining = NotionProperty.number(p['現在残債']) ?? 0
        const annualRate = (NotionProperty.number(p['年利（％）']) ?? 0) / 100
        const monthlyPayment = NotionProperty.number(p['月次返済額']) ?? 0

        if (remaining <= 0 || monthlyPayment <= 0) {
          results.loans.skipped++
          continue
        }

        // 今月このローンの返済履歴が既にあるか確認（重複防止）
        const existing = await notion.queryDatabase(c.env.NOTION_DB_LOAN_HISTORY, {
          filter: {
            and: [
              { property: '返済日', date: { on_or_after: monthStart } },
              { property: '返済日', date: { on_or_before: monthEnd } },
              { property: 'ローン', relation: { contains: loanId } },
            ],
          },
          pageSize: 1,
        })

        if (existing.results.length > 0) {
          results.loans.skipped++
          continue
        }

        // 元利均等返済の計算
        const monthlyRate = annualRate / 12
        const interest = Math.round(remaining * monthlyRate)
        const principal = Math.min(monthlyPayment - interest, remaining)
        const newRemaining = Math.max(remaining - principal, 0)

        // 取引記録を作成
        const tx = await notion.createPage(c.env.NOTION_DB_TRANSACTIONS, {
          '日時': toNotionProperty.date(`${dateStr}T00:00:00+09:00`),
          '種別': toNotionProperty.select('支出'),
          '金額': toNotionProperty.number(monthlyPayment),
          '記録元': toNotionProperty.select('ローン返済'),
          '紐づくローン': toNotionProperty.relation([loanId]),
          'メモ': toNotionProperty.richText(
            `${loanName} 返済（元金:${principal}円 利息:${interest}円）`
          ),
        })

        await sleep(350)

        // ローン返済履歴を作成
        await notion.createPage(c.env.NOTION_DB_LOAN_HISTORY, {
          '返済日': toNotionProperty.date(dateStr),
          'ローン': toNotionProperty.relation([loanId]),
          '返済額（合計）': toNotionProperty.number(monthlyPayment),
          '元金分': toNotionProperty.number(principal),
          '利息分': toNotionProperty.number(interest),
          '返済後残債': toNotionProperty.number(newRemaining),
          '紐づく取引記録': toNotionProperty.relation([tx.id]),
        })

        await sleep(350)

        // ローンの残債を更新（完済なら有効フラグを下げる）
        const updateProps: Record<string, any> = {
          '現在残債': toNotionProperty.number(newRemaining),
        }
        if (newRemaining === 0) {
          updateProps['有効'] = toNotionProperty.checkbox(false)
        }
        await notion.updatePage(loanId, updateProps)

        results.loans.processed++
        await sleep(350)
      } catch (err: any) {
        results.loans.errors.push(`${NotionProperty.title(loan.properties['名称'])}: ${err.message}`)
      }
    }
  } catch (err: any) {
    results.loans.errors.push(`Query failed: ${err.message}`)
  }

  // ===== 3. カード引き落とし処理 =====
  try {
    // 今日が支払日のクレジットカードを取得
    const cards = await queryDatabaseAll(notion, c.env.NOTION_DB_PAYMENTS, {
      filter: {
        and: [
          {
            or: [
              { property: 'タイプ区分', multi_select: { contains: 'クレジット' } },
              { property: 'タイプ区分', multi_select: { contains: 'デビット' } },
            ],
          },
          { property: '支払日', number: { equals: day } },
        ],
      },
    })

    // 口座別にカードをグループ化
    const accountToCards = new Map<string, any[]>()
    for (const card of cards) {
      const accountIds = NotionProperty.relation(card.properties['紐づく口座'])
      const accountId = accountIds[0]
      if (!accountId) continue
      if (!accountToCards.has(accountId)) accountToCards.set(accountId, [])
      accountToCards.get(accountId)!.push(card)
    }

    for (const [accountId, accountCards] of accountToCards) {
      try {
        // 今日この口座への引き落とし記録が既にあるか確認（重複防止）
        const monthStart = toDateStr(year, month, 1)
        const monthEnd = toDateStr(year, month, lastDayOf(year, month))

        const existingSettlement = await notion.queryDatabase(c.env.NOTION_DB_CARD_SETTLEMENTS, {
          filter: {
            and: [
              { property: '引き落とし日', date: { on_or_after: monthStart } },
              { property: '引き落とし日', date: { on_or_before: monthEnd } },
              { property: '引き落とし口座', relation: { contains: accountId } },
            ],
          },
          pageSize: 1,
        })

        if (existingSettlement.results.length > 0) {
          results.cardSettlements.skipped += accountCards.length
          continue
        }

        // 各カードの締め期間と取引合計を集計
        let groupTotal = 0
        const cardDetails: Array<{
          cardId: string
          cardName: string
          amount: number
          txIds: string[]
          settlPeriod: { start: string; end: string }
        }> = []

        for (const card of accountCards) {
          const cardId = card.id
          const cardName = NotionProperty.title(card.properties['名称'])
          const closingDay = NotionProperty.number(card.properties['締め日']) ?? 0
          const { start, end } = getSettlementPeriod(closingDay, year, month)

          // 締め期間のこのカードの支出取引を集計
          const txPages: any[] = []
          let hasMore = true
          let startCursor: string | undefined

          while (hasMore) {
            const resp = await notion.queryDatabase(c.env.NOTION_DB_TRANSACTIONS, {
              filter: {
                and: [
                  { property: '日時', date: { on_or_after: start } },
                  { property: '日時', date: { on_or_before: end } },
                  { property: '支払方法', relation: { contains: cardId } },
                  { property: '種別', select: { equals: '支出' } },
                ],
              },
              startCursor,
              pageSize: 100,
            })
            txPages.push(...resp.results)
            hasMore = resp.has_more
            startCursor = resp.next_cursor
          }

          if (txPages.length === 0) continue

          const cardTotal = txPages.reduce((sum: number, tx: any) => {
            return sum + (NotionProperty.number(tx.properties['金額']) ?? 0)
          }, 0)

          groupTotal += cardTotal
          cardDetails.push({
            cardId,
            cardName,
            amount: cardTotal,
            txIds: txPages.map((tx: any) => tx.id),
            settlPeriod: { start, end },
          })

          await sleep(350)
        }

        if (groupTotal === 0 || cardDetails.length === 0) {
          results.cardSettlements.skipped += accountCards.length
          continue
        }

        // カード引き落としDBに1件作成（口座グループ単位）
        const cardNames = cardDetails.map((d) => d.cardName).join('・')
        const settlPeriod = cardDetails[0].settlPeriod

        const settlement = await notion.createPage(c.env.NOTION_DB_CARD_SETTLEMENTS, {
          '引き落とし日': toNotionProperty.date(dateStr),
          '引き落とし口座': toNotionProperty.relation([accountId]),
          '引き落とし総額': toNotionProperty.number(groupTotal),
          '対象月': toNotionProperty.date(settlPeriod.end),
          'ステータス': toNotionProperty.select('確定'),
          'メモ': toNotionProperty.richText(`${cardNames} 引き落とし`),
        })

        await sleep(350)

        // 各カードの明細DBに登録
        for (const detail of cardDetails) {
          await notion.createPage(c.env.NOTION_DB_SETTLEMENT_DETAILS, {
            'カード引き落とし': toNotionProperty.relation([settlement.id]),
            'カード': toNotionProperty.relation([detail.cardId]),
            '金額': toNotionProperty.number(detail.amount),
            '対象取引': toNotionProperty.relation(detail.txIds.slice(0, 100)),
          })
          await sleep(350)
        }

        results.cardSettlements.processed += cardDetails.length
      } catch (err: any) {
        const cardNames = accountCards.map((c: any) => NotionProperty.title(c.properties['名称'])).join(', ')
        results.cardSettlements.errors.push(`[${cardNames}]: ${err.message}`)
      }
    }
  } catch (err: any) {
    results.cardSettlements.errors.push(`Query failed: ${err.message}`)
  }

  const hasErrors =
    results.fixedCosts.errors.length > 0 ||
    results.loans.errors.length > 0 ||
    results.cardSettlements.errors.length > 0

  return c.json({ ok: !hasErrors, results }, hasErrors ? 207 : 200)
})

export { cron }
