/**
 * Notion API クライアント
 *
 * Notion APIをラップし、以下の機能を提供：
 * - データベースクエリ
 * - ページ作成・更新・削除
 * - ページネーション対応
 * - プロパティのフラット化
 */

const NOTION_API_VERSION = '2022-06-28'
const NOTION_API_BASE = 'https://api.notion.com/v1'

/**
 * Notion APIクライアントのインターフェース
 */
export interface NotionClient {
  token: string
  queryDatabase: (databaseId: string, options?: QueryDatabaseOptions) => Promise<any>
  createPage: (databaseId: string, properties: any) => Promise<any>
  updatePage: (pageId: string, properties: any) => Promise<any>
  retrievePage: (pageId: string) => Promise<any>
  archivePage: (pageId: string) => Promise<any>
}

/**
 * データベースクエリのオプション
 */
export interface QueryDatabaseOptions {
  filter?: any
  sorts?: any[]
  startCursor?: string
  pageSize?: number
}

/**
 * Notion APIクライアントを作成
 */
export function createNotionClient(token: string): NotionClient {
  /**
   * Notion APIにリクエストを送信
   */
  async function request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${NOTION_API_BASE}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': NOTION_API_VERSION,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        `Notion API Error: ${response.status} ${response.statusText} - ${JSON.stringify(error)}`
      )
    }

    return response.json()
  }

  /**
   * データベースをクエリ
   */
  async function queryDatabase(
    databaseId: string,
    options: QueryDatabaseOptions = {}
  ): Promise<any> {
    const body: any = {}

    if (options.filter) body.filter = options.filter
    if (options.sorts) body.sorts = options.sorts
    if (options.startCursor) body.start_cursor = options.startCursor
    if (options.pageSize) body.page_size = options.pageSize

    return request(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /**
   * ページを作成
   */
  async function createPage(databaseId: string, properties: any): Promise<any> {
    return request('/pages', {
      method: 'POST',
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
      }),
    })
  }

  /**
   * ページを更新
   */
  async function updatePage(pageId: string, properties: any): Promise<any> {
    return request(`/pages/${pageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties }),
    })
  }

  /**
   * ページを取得
   */
  async function retrievePage(pageId: string): Promise<any> {
    return request(`/pages/${pageId}`)
  }

  /**
   * ページをアーカイブ（削除）
   */
  async function archivePage(pageId: string): Promise<any> {
    return request(`/pages/${pageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ archived: true }),
    })
  }

  return {
    token,
    queryDatabase,
    createPage,
    updatePage,
    retrievePage,
    archivePage,
  }
}

/**
 * Notion APIレスポンスのページネーション対応
 * すべての結果を取得するまで再帰的にクエリ
 */
export async function queryDatabaseAll(
  client: NotionClient,
  databaseId: string,
  options: QueryDatabaseOptions = {}
): Promise<any[]> {
  const results: any[] = []
  let hasMore = true
  let startCursor: string | undefined

  while (hasMore) {
    const response = await client.queryDatabase(databaseId, {
      ...options,
      startCursor,
      pageSize: options.pageSize || 100,
    })

    results.push(...response.results)
    hasMore = response.has_more
    startCursor = response.next_cursor
  }

  return results
}

/**
 * Notionプロパティから値を抽出するヘルパー関数
 */
export const NotionProperty = {
  /**
   * タイトルプロパティから文字列を取得
   */
  title(property: any): string {
    if (!property?.title) return ''
    return property.title.map((t: any) => t.plain_text).join('')
  },

  /**
   * リッチテキストから文字列を取得
   */
  richText(property: any): string {
    if (!property?.rich_text) return ''
    return property.rich_text.map((t: any) => t.plain_text).join('')
  },

  /**
   * 数値プロパティを取得
   */
  number(property: any): number | null {
    return property?.number ?? null
  },

  /**
   * セレクトプロパティの値を取得
   */
  select(property: any): string | null {
    return property?.select?.name ?? null
  },

  /**
   * マルチセレクトプロパティの値を取得
   */
  multiSelect(property: any): string[] {
    if (!property?.multi_select) return []
    return property.multi_select.map((s: any) => s.name)
  },

  /**
   * 日付プロパティを取得
   */
  date(property: any): string | null {
    return property?.date?.start ?? null
  },

  /**
   * チェックボックスの値を取得
   */
  checkbox(property: any): boolean {
    return property?.checkbox ?? false
  },

  /**
   * URLプロパティを取得
   */
  url(property: any): string | null {
    return property?.url ?? null
  },

  /**
   * メールプロパティを取得
   */
  email(property: any): string | null {
    return property?.email ?? null
  },

  /**
   * 電話番号プロパティを取得
   */
  phoneNumber(property: any): string | null {
    return property?.phone_number ?? null
  },

  /**
   * リレーションプロパティからIDの配列を取得
   */
  relation(property: any): string[] {
    if (!property?.relation) return []
    return property.relation.map((r: any) => r.id)
  },

  /**
   * ロールアッププロパティの値を取得
   */
  rollup(property: any): any {
    if (!property?.rollup) return null
    const type = property.rollup.type

    if (type === 'number') return property.rollup.number
    if (type === 'date') return property.rollup.date?.start
    if (type === 'array') return property.rollup.array

    return null
  },

  /**
   * 作成日時を取得
   */
  createdTime(property: any): string | null {
    return property?.created_time ?? null
  },

  /**
   * 更新日時を取得
   */
  lastEditedTime(property: any): string | null {
    return property?.last_edited_time ?? null
  },
}

/**
 * Notionプロパティをアプリ用のフォーマットに変換するヘルパー
 *
 * 使用例:
 * const flattened = flattenProperties(page.properties, {
 *   name: 'title',
 *   amount: 'number',
 *   category: 'relation',
 * })
 */
export function flattenProperties(
  properties: any,
  mapping: Record<string, string>
): Record<string, any> {
  const result: Record<string, any> = {}

  for (const [key, type] of Object.entries(mapping)) {
    const property = properties[key]
    if (!property) continue

    switch (type) {
      case 'title':
        result[key] = NotionProperty.title(property)
        break
      case 'rich_text':
        result[key] = NotionProperty.richText(property)
        break
      case 'number':
        result[key] = NotionProperty.number(property)
        break
      case 'select':
        result[key] = NotionProperty.select(property)
        break
      case 'multi_select':
        result[key] = NotionProperty.multiSelect(property)
        break
      case 'date':
        result[key] = NotionProperty.date(property)
        break
      case 'checkbox':
        result[key] = NotionProperty.checkbox(property)
        break
      case 'url':
        result[key] = NotionProperty.url(property)
        break
      case 'email':
        result[key] = NotionProperty.email(property)
        break
      case 'phone_number':
        result[key] = NotionProperty.phoneNumber(property)
        break
      case 'relation':
        result[key] = NotionProperty.relation(property)
        break
      case 'rollup':
        result[key] = NotionProperty.rollup(property)
        break
      case 'created_time':
        result[key] = NotionProperty.createdTime(property)
        break
      case 'last_edited_time':
        result[key] = NotionProperty.lastEditedTime(property)
        break
      default:
        result[key] = property
    }
  }

  return result
}

/**
 * アプリ用のプロパティをNotion API形式に変換
 */
export const toNotionProperty = {
  /**
   * タイトルプロパティを生成
   */
  title(text: string) {
    return {
      title: [{ text: { content: text } }],
    }
  },

  /**
   * リッチテキストプロパティを生成
   */
  richText(text: string) {
    return {
      rich_text: [{ text: { content: text } }],
    }
  },

  /**
   * 数値プロパティを生成
   */
  number(value: number) {
    return { number: value }
  },

  /**
   * セレクトプロパティを生成
   */
  select(name: string) {
    return { select: { name } }
  },

  /**
   * マルチセレクトプロパティを生成
   */
  multiSelect(names: string[]) {
    return {
      multi_select: names.map(name => ({ name })),
    }
  },

  /**
   * 日付プロパティを生成
   */
  date(date: string) {
    return { date: { start: date } }
  },

  /**
   * チェックボックスプロパティを生成
   */
  checkbox(checked: boolean) {
    return { checkbox: checked }
  },

  /**
   * URLプロパティを生成
   */
  url(url: string) {
    return { url }
  },

  /**
   * リレーションプロパティを生成
   */
  relation(ids: string[]) {
    return {
      relation: ids.map(id => ({ id })),
    }
  },
}
