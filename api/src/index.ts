import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { conditionalAuth } from './lib/auth'
import { createNotionClient } from './lib/notion'
import { master } from './routes/master'
import { transactions } from './routes/transactions'
import { dashboard } from './routes/dashboard'
import { wishlist } from './routes/wishlist'
import { revolving } from './routes/revolving'
import { transfer } from './routes/transfer'
import { snapshot } from './routes/snapshot'
import { installment } from './routes/installment'
import { cron } from './routes/cron'

// 環境変数の型定義
type Bindings = {
  NOTION_TOKEN: string
  API_KEY: string
  // Notion DB IDs
  NOTION_DB_TRANSACTIONS: string
  NOTION_DB_ACCOUNTS: string
  NOTION_DB_PAYMENTS: string
  NOTION_DB_CATEGORIES: string
  NOTION_DB_FIXED_COSTS: string
  NOTION_DB_LOANS: string
  NOTION_DB_LOAN_HISTORY: string
  NOTION_DB_REVOLVING: string
  NOTION_DB_REVOLVING_HISTORY: string
  NOTION_DB_SAVING_GOALS: string
  NOTION_DB_WISHLIST: string
  NOTION_DB_INSTALLMENTS: string
  NOTION_DB_TRANSFERS: string
  NOTION_DB_CARD_SETTLEMENTS: string
  NOTION_DB_SETTLEMENT_DETAILS: string
  NOTION_DB_MONTHLY_SNAPSHOT: string
  NOTION_DB_MONTHLY_BUDGET: string
  NOTION_DB_CARD_PERKS: string
  NOTION_DB_ASSET_SNAPSHOTS: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS設定（GitHub Pagesからのアクセスを許可）
app.use('/*', cors({
  origin: '*', // 本番環境では適切なオリジンに制限することを推奨
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}))

// 認証ミドルウェア（/ と /api/health は認証不要、それ以外は認証必須）
app.use('/*', conditionalAuth())

// ヘルスチェックエンドポイント（認証不要）
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'kakeibo-api',
    version: '1.0.0'
  })
})

// ルートパス（認証不要）
app.get('/', (c) => {
  return c.json({
    name: 'Kakeibo API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health (public)',
      test: '/api/test (authenticated)',
      dashboard: '/api/dashboard',
      transactions: '/api/transactions?month=YYYY-MM',
      master: '/api/master/{payments|cards|accounts|categories|card-perks|loans|installments}',
      wishlist: '/api/wishlist',
      revolving: '/api/revolving',
      transfer: 'POST /api/transfer',
      snapshot: 'POST /api/snapshot',
      installment: 'POST /api/installment',
    }
  })
})

// テスト用エンドポイント（認証必須）
app.get('/api/test', (c) => {
  const notionClient = createNotionClient(c.env.NOTION_TOKEN)

  return c.json({
    status: 'authenticated',
    message: 'You have successfully authenticated!',
    timestamp: new Date().toISOString(),
    notionClientReady: !!notionClient,
  })
})

// Phase 2: 読み取り系ルート
app.route('/api/dashboard', dashboard)
app.route('/api/master', master)
app.route('/api/transactions', transactions)
app.route('/api/wishlist', wishlist)
app.route('/api/revolving', revolving)

// Phase 3: 書き込み系ルート
app.route('/api/transfer', transfer)
app.route('/api/snapshot', snapshot)
app.route('/api/installment', installment)

// Phase 5: Cron自動化ルート
app.route('/api/cron', cron)

// 404ハンドラー
app.notFound((c) => {
  return c.json({
    error: 'NOT_FOUND',
    message: 'Endpoint not found'
  }, 404)
})

// エラーハンドラー
app.onError((err, c) => {
  console.error('Error:', err)
  return c.json({
    error: 'INTERNAL_ERROR',
    message: err.message || 'An internal error occurred'
  }, 500)
})

// Cloudflare Workers Cron Trigger ハンドラ
// wrangler.toml の [triggers] crons で設定したスケジュールで自動実行
const scheduled: ExportedHandlerScheduledHandler<Bindings> = async (_event, env, ctx) => {
  const url = 'http://localhost/api/cron/daily'
  const req = new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.API_KEY}`,
    },
  })
  const res = await app.fetch(req, env, ctx)
  const body = await res.json()
  console.log('[Cron] daily result:', JSON.stringify(body))
}

export default app
export { scheduled }
