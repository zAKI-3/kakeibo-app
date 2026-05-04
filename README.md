# 家計管理アプリ Kakeibo App

個人用 PWA 家計管理アプリ。Notion をデータベースとして利用する完全無料構成。

## 🎯 概要

- **プラットフォーム**: iPhone Safari (PWA)
- **ホスティング**: GitHub Pages（無料）
- **APIプロキシ**: Cloudflare Workers（無料）
- **データベース**: Notion DB（無料プランで運用）
- **デザイン**: ターミナル風ダークUI（緑アクセント）

## 📁 ディレクトリ構成

```
.
├── CLAUDE.md                    # Claude Code 用コンテキスト（最初に読む）
├── README.md                    # このファイル
└── docs/                        # 設計ドキュメント
    ├── requirements.md          # 要件定義書 v2.0
    ├── api-design.md            # API設計書
    ├── design-prototype.html    # 全11画面プロトタイプ
    └── notion-db-ids.json       # Notion DB ID一覧
```

## 🚀 はじめ方

### 1. ドキュメントを読む

すべての実装の前に、以下を順番に読んでください。

1. `CLAUDE.md` - プロジェクト全体像
2. `docs/requirements.md` - 要件定義
3. `docs/api-design.md` - API仕様
4. `docs/design-prototype.html` - デザイン（ブラウザで開く）

### 2. 環境変数の準備

実装には以下の情報が必要です。

```bash
# Notion API トークン（既に発行済み）
NOTION_TOKEN=ntn_xxxxxxxxxx

# API認証用キー（新規生成、フロント↔Workers間）
API_KEY=任意の長い文字列

# Notion DB IDs（docs/notion-db-ids.json 参照）
NOTION_DB_TRANSACTIONS=3569e032-4474-81e1-aa09-ec02c771a190
... (19個分)
```

### 3. 実装フェーズ

API設計書の Phase 順に進めてください。

```
Phase 1: 基盤構築 (Cloudflare Workers + Hono + Notion クライアント)
Phase 2: 読み取り系API (GET エンドポイント)
Phase 3: 書き込み系API (POST エンドポイント)
Phase 4: 編集・削除API (PATCH / DELETE)
Phase 5: Cron自動化
Phase 6: フロントエンド実装
Phase 7: PWA化（manifest + Service Worker）
Phase 8: GitHub Pages デプロイ
```

## 📊 既存のNotion環境

- **親ページID**: `3569e032447480aaa88ef18362c0522c`
- **DB**: 19テーブル全て構築済み（`docs/notion-db-ids.json` 参照）
- **Integration名**: 「家計管理アプリ」
- **接続済み**: 親ページにIntegrationコネクト済み

## 🎨 デザインシステム

詳細は `docs/design-prototype.html` を参照。

```css
--bg: #0A0A0B;           /* 背景 */
--surface-1: #131315;    /* サーフェス */
--accent: #00E676;       /* 緑（強調） */
--danger: #FF5757;       /* 赤（支出） */
--warning: #FFB800;      /* 黄（警告） */
--text-1: #E8E8EA;
--font-mono: 'JetBrains Mono';
--font-jp: 'Noto Sans JP';
```

## 📝 開発時の注意

- Notion APIキーは絶対にコードに直書きしない
- `.dev.vars` と `.gitignore` を必ず設定
- Notion API レート制限：3 req/秒
- 大きな実装は機能単位で動作確認してから進める

## 🔗 関連リンク

- [Notion API Reference](https://developers.notion.com/reference)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)
- [PWA Guide (web.dev)](https://web.dev/progressive-web-apps/)
