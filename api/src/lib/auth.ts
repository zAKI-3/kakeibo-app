/**
 * 認証ミドルウェア
 *
 * Bearer トークンまたはクエリパラメータによる簡易認証を実装
 */

import { Context, Next } from 'hono'

/**
 * 認証ミドルウェア
 *
 * 以下の方法で認証をサポート：
 * 1. Authorization: Bearer {API_KEY} ヘッダー
 * 2. ?key={API_KEY} クエリパラメータ
 *
 * 認証に失敗した場合は401 Unauthorizedを返す
 */
export function authMiddleware() {
  return async (c: Context, next: Next) => {
    const apiKey = c.env.API_KEY

    if (!apiKey) {
      console.error('API_KEY is not configured in environment variables')
      return c.json(
        {
          error: 'INTERNAL_ERROR',
          message: 'API authentication is not properly configured',
        },
        500
      )
    }

    // Authorization ヘッダーから取得
    const authHeader = c.req.header('Authorization')
    let providedKey: string | undefined

    if (authHeader && authHeader.startsWith('Bearer ')) {
      providedKey = authHeader.substring(7)
    }

    // クエリパラメータから取得（Authorization ヘッダーがない場合）
    if (!providedKey) {
      providedKey = c.req.query('key')
    }

    // 認証キーが提供されていない
    if (!providedKey) {
      return c.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Missing API key. Provide via Authorization header or ?key= query parameter',
        },
        401
      )
    }

    // 認証キーの検証
    if (providedKey !== apiKey) {
      return c.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Invalid API key',
        },
        401
      )
    }

    // 認証成功、次の処理へ
    return await next()
  }
}

/**
 * 認証不要パスのリスト
 */
const PUBLIC_PATHS = [
  '/',
  '/api/health',
]

/**
 * パスが認証不要かどうかをチェック
 */
export function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.includes(path)
}

/**
 * 条件付き認証ミドルウェア
 *
 * PUBLIC_PATHS に含まれるパスは認証をスキップし、
 * それ以外のパスは認証を要求する
 */
export function conditionalAuth() {
  const auth = authMiddleware()

  return async (c: Context, next: Next) => {
    const path = new URL(c.req.url).pathname

    // 認証不要パスの場合はスキップ
    if (isPublicPath(path)) {
      return await next()
    }

    // それ以外は認証を要求
    return await auth(c, next)
  }
}
