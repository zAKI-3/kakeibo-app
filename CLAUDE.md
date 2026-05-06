# 家計管理アプリ Kakeibo App

> 個人用 PWA 家計管理アプリ。Notion をデータベースとして利用し、Cloudflare Workers をAPIプロキシとして経由する構成。

## このプロジェクトについて

iPhoneのSafariで開いてホーム画面に追加して使う、PWA形式の個人用家計管理アプリです。完全無料の構成で運用することが要件です。

**主な特徴**
- アプリは「素早い入力」と「今月の利用可能額確認」に特化
- データ管理・閲覧・分析はすべてNotion側で完結
- カードの締め日・支払日を考慮した「今月使えるお金」の自動計算
- 固定費・ローン・リボ払いの月次自動記録（Cron実行）

## 必読ドキュメント

実装を始める前に、以下のファイルをすべて読んでください。

1. `docs/requirements.md` - 要件定義書 v2.0（19テーブルのDB設計含む）
2. `docs/api-design.md` - API設計書（エンドポイント仕様）
3. `docs/design-prototype.html` - 全11画面のデザインプロトタイプ（ターミナル風UI）
4. `docs/notion-db-ids.json` - Notion DB IDのリファレンス

## 技術構成

```
iPhone Safari (PWA)
       ↓ HTTPS / JSON
Cloudflare Workers (Hono framework)
       ↓ Notion API
Notion DB (19 tables)
```

| レイヤー | 技術 | 備考 |
|---|---|---|
| フロントエンド | HTML / CSS / Vanilla JS | フレームワーク不使用（PWA、軽量重視） |
| ホスティング | GitHub Pages | 無料・永続 |
| APIプロキシ | Cloudflare Workers + Hono | 無料枠：月10万リクエスト |
| 定期処理 | Cloudflare Workers Cron | 毎日実行 |
| データベース | Notion DB | 全19テーブル |
| デザイン | ターミナル風ダーク（緑アクセント） | docs/design-prototype.html 参照 |

## 現在の進捗

- [x] 要件定義（v2.0）
- [x] Notion DB構築（19テーブル）
- [x] API設計
- [x] デザイン作成（全11画面プロトタイプ）
- [x] **Phase 1: Cloudflare Workers基盤構築**
- [x] Phase 2: 読み取り系API実装
- [x] Phase 3: 書き込み系API実装
- [x] Phase 4: 編集・削除API実装
- [x] Phase 5: Cron自動化実装（固定費・ローン返済・カード引き落とし）
- [x] フロントエンドHTML/JS実装（SPA、全11画面相当）
- [x] PWA化（manifest.json + Service Worker）
- [x] GitHub Pages自動デプロイ設定（.github/workflows/deploy.yml）
- [ ] Cloudflare Workers デプロイ（wrangler deploy）← 次にここ
- [ ] GitHub リポジトリ作成 → push → Pages 有効化
- [ ] iPhone実機テスト

## プロジェクト構成（推奨）

```
kakeibo-app/
├── CLAUDE.md                     # このファイル
├── README.md
├── docs/                          # 設計ドキュメント（読み取り専用）
│   ├── requirements.md
│   ├── api-design.md
│   ├── design-prototype.html
│   └── notion-db-ids.json
├── api/                           # Cloudflare Workers (バックエンド)
│   ├── src/
│   │   ├── index.ts              # エントリーポイント
│   │   ├── routes/               # APIエンドポイント
│   │   ├── lib/
│   │   │   ├── notion.ts         # Notion APIクライアント
│   │   │   └── auth.ts           # 認証ミドルウェア
│   │   └── utils/                # 計算ロジック等
│   ├── wrangler.toml
│   ├── package.json
│   └── tsconfig.json
├── web/                           # フロントエンド (GitHub Pages)
│   ├── index.html                # ホーム画面
│   ├── screens/                  # 各画面
│   │   ├── expense.html
│   │   ├── income.html
│   │   ├── transfer.html
│   │   └── ...
│   ├── assets/
│   │   ├── css/
│   │   ├── js/
│   │   └── icons/
│   ├── manifest.json             # PWAマニフェスト
│   └── service-worker.js         # PWAサービスワーカー
└── .gitignore
```

## 重要な注意事項

### セキュリティ・認証
- **Notion APIキーをコードに直書きしない** - 必ず Cloudflare Workers の環境変数（Secret）を使う
- ローカル開発時は `.dev.vars` ファイルに記述し、これは `.gitignore` に追加する
- `wrangler secret put NOTION_TOKEN` でデプロイ環境にもセット
- フロントとAPIの通信はBearer トークンによる簡易認証

### Notion API の制約
- レート制限：3 req/秒
- ページネーション必須（100件ずつ）
- リレーションフィールドはUUIDで参照
- レスポンスのプロパティ構造が複雑なので、Workers側でフラットなJSONに変換してフロントに返す

### 設計判断の根拠
- **「画面ファースト」設計**：UIを先に決めてから必要なAPIを設計したので、過剰なAPI実装はしない
- **アプリは入力特化**：レポート・グラフはNotion側で見る。アプリで実装しない
- **マスタ管理はNotion側**：カテゴリやカードの追加・編集はNotionで直接操作
- **完全無料運用**：すべての構成要素が永続無料枠で動く

### コーディングスタイル
- TypeScriptを推奨（型安全のため）
- Workers側はHono frameworkを採用
- フロント側はフレームワーク不使用、Vanilla JSで軽量に
- 関数は小さく、責務を分ける
- エラーハンドリングを丁寧に（Notion APIは普通に失敗する）

## デザインシステム（重要）

`docs/design-prototype.html` に全11画面のデザインがあります。実装時は**プロトタイプのCSSをベースに、共通CSSとして切り出して使う**のがおすすめです。

主なデザイントークン：
```css
--bg: #0A0A0B;
--surface-1: #131315;
--accent: #00E676;       /* 緑 */
--danger: #FF5757;       /* 赤（支出） */
--warning: #FFB800;
--text-1: #E8E8EA;
--font-mono: 'JetBrains Mono', monospace;
--font-jp: 'Noto Sans JP', sans-serif;
```

## 次のセッションでやること

最初のセッションでは、以下の作業をおすすめします。

```
【実装はすべて完了】次のセッションでやること：

1. Cloudflare Workers のデプロイ
   cd api/
   wrangler secret put NOTION_TOKEN    # Notion APIキーをセット
   wrangler secret put API_KEY         # 任意の文字列をAPIキーとしてセット
   wrangler deploy

2. GitHub リポジトリを作成して push
   git remote add origin https://github.com/<user>/kakeibo-app.git
   git push -u origin main

3. GitHub Pages を有効化
   Settings > Pages > Source: GitHub Actions

4. Web アプリの設定画面で API 情報を入力
   - API URL: https://kakeibo-api.<subdomain>.workers.dev
   - API KEY: 上でセットした API_KEY の値

5. iPhone Safari でアクセスしてホーム画面に追加 → PWA化
```

## 開発時の確認事項

実装中に判断に迷ったら、以下のドキュメントを確認してください。

| 迷ったら | 確認するファイル |
|---|---|
| データ構造どうする？ | `docs/requirements.md` の「5. データ要件」 |
| API のレスポンス形式は？ | `docs/api-design.md` |
| 画面のレイアウト・色は？ | `docs/design-prototype.html` |
| Notion DB IDは？ | `docs/notion-db-ids.json` |
| 計算ロジック（利息・分割手数料）は？ | `docs/api-design.md` の「8. 計算ロジック」 |
