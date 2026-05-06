# Kakeibo API - Cloudflare Workers

家計管理アプリ Kakeibo のバックエンド API（Cloudflare Workers + Hono framework）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.dev.vars.example` をコピーして `.dev.vars` を作成し、実際の値を設定してください。

```bash
cp .dev.vars.example .dev.vars
```

`.dev.vars` の内容：

```env
# Notion Integration Token (https://www.notion.so/my-integrations で作成)
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# API認証キー（フロント↔Workers間の簡易認証）
# 任意の文字列を生成（例: openssl rand -base64 32）
API_KEY=your_generated_api_key_here
```

### 3. Notion DB IDの確認

Notion DB IDは `wrangler.toml` の `[vars]` セクションに設定済みです。
変更が必要な場合は、`/docs/notion-db-ids.json` を参照して更新してください。

## ローカル開発

### 開発サーバーの起動

```bash
npm run dev
# または
npm start
```

サーバーは `http://localhost:8787` で起動します。

### 動作確認

```bash
# ヘルスチェック（認証不要）
curl http://localhost:8787/api/health

# ルートエンドポイント（認証不要）
curl http://localhost:8787/

# 認証テスト - 認証なしでアクセス（401エラーになる）
curl http://localhost:8787/api/test

# 認証テスト - Bearer トークンで認証
curl -H "Authorization: Bearer OeLqNwTakLCLOOEK7xvsW6X7jkeJ8C9w1IuZ96AlkoY=" \
  http://localhost:8787/api/test

# 認証テスト - クエリパラメータで認証
curl "http://localhost:8787/api/test?key=OeLqNwTakLCLOOEK7xvsW6X7jkeJ8C9w1IuZ96AlkoY="
```

### 型チェック

```bash
npm run type-check
```

## デプロイ

### 本番環境への環境変数設定

```bash
# Notion Token
wrangler secret put NOTION_TOKEN

# API Key
wrangler secret put API_KEY
```

### デプロイ実行

```bash
npm run deploy
```

## 現在のステータス

- [x] Phase 1: Cloudflare Workers基盤構築
  - [x] Hono frameworkセットアップ
  - [x] TypeScript設定
  - [x] 環境変数設定
  - [x] CORS設定
  - [x] ヘルスチェックエンドポイント (`GET /api/health`)
  - [x] エラーハンドリング
  - [x] 認証ミドルウェア実装
  - [x] Notion APIクライアント実装
- [ ] Phase 2: 読み取り系API実装（進行中）
  - [x] Notion APIクライアント (`src/lib/notion.ts`)
  - [x] 認証ミドルウェア (`src/lib/auth.ts`)
  - [ ] `GET /api/dashboard`
  - [ ] `GET /api/master/*` (マスタデータ取得)
  - [ ] `GET /api/transactions`
  - [ ] その他の読み取り系API
- [ ] Phase 3: 書き込み系API実装
- [ ] Phase 4: 編集・削除API実装
- [ ] Phase 5: Cron自動化実装

## エンドポイント

### GET /api/health

ヘルスチェック用エンドポイント（認証不要）

**レスポンス例:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-05T02:05:37.848Z",
  "service": "kakeibo-api",
  "version": "1.0.0"
}
```

### GET /api/test

認証テスト用エンドポイント（認証必須）

**認証方法:**
- Bearer トークン: `Authorization: Bearer {API_KEY}`
- クエリパラメータ: `?key={API_KEY}`

**レスポンス例（認証成功）:**
```json
{
  "status": "authenticated",
  "message": "You have successfully authenticated!",
  "timestamp": "2026-05-05T03:06:20.453Z",
  "notionClientReady": true
}
```

**レスポンス例（認証失敗）:**
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid API key"
}
```

### その他のエンドポイント

API設計書（`/docs/api-design.md`）を参照してください。

## プロジェクト構成

```
api/
├── src/
│   ├── index.ts              # エントリーポイント
│   ├── lib/
│   │   ├── notion.ts         # Notion APIクライアント ✅
│   │   └── auth.ts           # 認証ミドルウェア ✅
│   ├── routes/               # APIエンドポイント（今後追加）
│   └── utils/                # 計算ロジック等（今後追加）
├── wrangler.toml             # Cloudflare Workers設定
├── package.json
├── tsconfig.json
├── .dev.vars                 # ローカル環境変数（gitignore済み）
└── .dev.vars.example         # 環境変数テンプレート
```

## 参考リンク

- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Hono フレームワーク](https://hono.dev/)
- [Notion API](https://developers.notion.com/)
