# Claude Code 実装手順書

> 家計管理アプリをClaude Codeで実装する詳細手順

---

## 📋 全体の流れ

```
事前準備 → Phase 1 → Phase 2 → ... → Phase 8
（環境構築）（基盤）（読込API）   （実機テスト）
```

---

## 🛠️ 事前準備（30分〜1時間）

### Step 0-1. Claude Codeのインストール

ターミナルを開いて以下を実行：

```bash
npm install -g @anthropic-ai/claude-code
```

確認：
```bash
claude --version
```

### Step 0-2. 必要なツールの確認

以下が入っているか確認してください。

```bash
node --version    # v18以上推奨
npm --version
git --version
```

入っていなければインストールしてください。
- Node.js: https://nodejs.org/
- Git: https://git-scm.com/

### Step 0-3. プロジェクトディレクトリの準備

```bash
# 任意の場所に作る（例：ホームディレクトリのDevelopフォルダ）
cd ~
mkdir -p Develop
cd Develop

# 引き継ぎzipを解凍した場所に移動 or zipを解凍
unzip ~/Downloads/kakeibo-handoff.zip
cd kakeibo-handoff
```

### Step 0-4. Gitリポジトリ初期化

```bash
git init
git add .
git commit -m "Initial: handoff documents"
```

### Step 0-5. GitHubにリポジトリ作成（後で必要）

GitHub.com で新規リポジトリを作成し、リンクします。

```bash
# GitHubで「kakeibo-app」のリポジトリを作成後
git remote add origin https://github.com/あなたのユーザー名/kakeibo-app.git
git branch -M main
git push -u origin main
```

> ⚠️ Privateリポジトリ推奨（個人の家計データに関わる情報のため）

### Step 0-6. Claude Codeを起動

プロジェクトディレクトリで起動：

```bash
cd ~/Develop/kakeibo-handoff
claude
```

初回起動時にAnthropicアカウントでの認証が求められます。指示に従ってください。

---

## 🚀 Phase 1: Cloudflare Workers基盤構築

### Step 1-1. Claude Codeへの最初の指示

Claude Codeが起動したら、以下を**コピペで指示**してください：

```
プロジェクトの全体像を把握するため、以下のファイルをすべて読んでください。

1. CLAUDE.md
2. docs/requirements.md
3. docs/api-design.md
4. docs/notion-db-ids.json

design-prototype.htmlは長いので、デザインシステムのCSS変数の部分だけ確認してください。

把握できたら、Phase 1（Cloudflare Workers基盤構築）を始めましょう。
api/ ディレクトリにCloudflare Workersプロジェクトを作成してください。

要件:
- Hono frameworkを使用
- TypeScriptで実装
- ヘルスチェックエンドポイント GET /api/health を作成
- まだNotion連携やDB操作は実装しない

実装後、ローカル起動方法を教えてください。
```

### Step 1-2. Claude Codeの提案を確認しながら進める

Claude Codeがファイル作成や実行を提案してきたら：
- **YES（許可）**: コードを読んで問題なければ承認
- **NO（拒否）**: 内容に違和感があれば拒否してClaude Codeに修正させる

### Step 1-3. ローカル起動テスト

Claude Codeに教わった起動方法（おそらく以下）：

```bash
cd api
npm install
npm run dev    # または: npx wrangler dev
```

起動成功したら、別のターミナルで：

```bash
curl http://localhost:8787/api/health
# レスポンス例: {"status":"ok"}
```

レスポンスが返れば成功！

### Step 1-4. 環境変数の設定

Claude Codeに以下を指示：

```
.dev.vars ファイルを作成して、以下の環境変数を設定する手順を教えてください。

- NOTION_TOKEN（Notion APIキー）
- API_KEY（フロント-API認証用、新規生成）
- 各 NOTION_DB_* （19個、docs/notion-db-ids.jsonから）

また、.gitignoreに .dev.vars が含まれていることを確認してください。
```

実際の値の入れ方：

```bash
# api/.dev.vars を作る（手動 or Claude Codeに作らせる）
NOTION_TOKEN=ntn_あなたのトークン
API_KEY=ランダムな長い文字列（例：openssl rand -hex 32 で生成可能）
NOTION_DB_TRANSACTIONS=3569e032-4474-81e1-aa09-ec02c771a190
... (続く)
```

> ⚠️ `.dev.vars` は絶対にGitに含めないこと。`.gitignore` に追加されているか確認。

### Step 1-5. コミット

```bash
cd ~/Develop/kakeibo-handoff
git add .
git commit -m "Phase 1: Cloudflare Workers + Hono setup with health check"
```

---

## 📥 Phase 2: 読み取り系API実装

### Step 2-1. Notionクライアントの実装

Claude Codeに指示：

```
次に、Notionクライアントを実装してください。

要件:
- api/src/lib/notion.ts に作成
- Notion APIへのfetchをラップする
- ページネーション対応
- 環境変数から NOTION_TOKEN を取得
- ページのプロパティをフラットなJSONに変換するヘルパー関数を含める

実装したら使用例も教えてください。
```

### Step 2-2. 認証ミドルウェアの実装

```
次に、API認証ミドルウェアを実装してください。

要件:
- api/src/lib/auth.ts に作成
- Authorization: Bearer {API_KEY} を検証
- 不正な場合は401を返す
- /api/health は認証不要、それ以外は要認証

Honoのミドルウェアとして実装してください。
```

### Step 2-3. マスタ取得APIを実装

```
docs/api-design.md の「4. マスタ取得API」を確認して、以下を実装してください。

- GET /api/master/payments
- GET /api/master/cards
- GET /api/master/accounts
- GET /api/master/categories
- GET /api/master/card-perks

各エンドポイントの動作確認用のcurlコマンドも教えてください。
```

### Step 2-4. 動作確認

各エンドポイントをcurlで叩いて確認：

```bash
# 認証ヘッダー付きで叩く
curl -H "Authorization: Bearer あなたのAPI_KEY" \
  http://localhost:8787/api/master/categories
```

### Step 2-5. ダッシュボードAPI実装

```
docs/api-design.md の「3.1 GET /api/dashboard」を実装してください。

このAPIは以下を集約して返します:
- 月次予算スナップショットからの利用可能額
- 各カードの今月の利用額/上限
- 直近の取引10件

複数のNotion DBから取得が必要なので、並列処理（Promise.all）を使ってください。

実装後、レスポンス内容を確認できるようにしてください。
```

### Step 2-6. 取引一覧API実装

```
docs/api-design.md の「3.5 GET /api/transactions」を実装してください。

要件:
- クエリパラメータ month=YYYY-MM で月を指定
- 日付ごとにグルーピングして返す
- フィルター（type=expense|income|transfer|all）対応
```

### Step 2-7. コミット

```bash
git add .
git commit -m "Phase 2: Read-only APIs (master, dashboard, transactions)"
```

---

## ✏️ Phase 3: 書き込み系API実装

### Step 3-1. 取引追加API

```
docs/api-design.md の「3.2 POST /api/transactions」を実装してください。

要件:
- リクエストボディのバリデーション
- Notion DBに新規ページ作成
- 作成成功時はIDを返す
- エラー時は適切なステータスコードとメッセージ

Zodなどでバリデーションするのがおすすめですがどうしますか？
```

### Step 3-2. 振替・分割払い・リボ返済・欲しいもの購入API

順次実装していきます。一度に全部やらず、1つずつ動作確認してから進めるのがおすすめ：

```
次は POST /api/transfer を実装してください。

口座間の振替を記録するAPIです。実装後、curlでの動作確認方法も教えてください。
```

実装→確認→次のAPI、という流れで以下を順次：

1. POST /api/transfer
2. POST /api/installment（10ヶ月分の取引一括作成・手数料計算込み）
3. POST /api/revolving/:id/repay（利息計算込み）
4. POST /api/wishlist/:id/purchase
5. POST /api/snapshot（給与時のスナップショット作成）

各APIの計算ロジックは `docs/api-design.md` の「8. 計算ロジック」に記載。

### Step 3-3. コミット

```bash
git add .
git commit -m "Phase 3: Write APIs (transactions, transfer, installment, revo, wishlist, snapshot)"
```

---

## 🔧 Phase 4: 編集・削除API

### Step 4-1. 取引編集・削除

```
以下を実装してください。

- PATCH /api/transactions/:id（取引編集）
- DELETE /api/transactions/:id（取引削除、Notionではアーカイブ扱い）
- GET /api/transactions/:id（取引詳細）

削除はNotionのarchived=trueをセットする方式でお願いします。
```

### Step 4-2. コミット

```bash
git add .
git commit -m "Phase 4: Edit/Delete APIs for transactions"
```

---

## 🤖 Phase 5: Cron自動化

### Step 5-1. Cronトリガーの設定

```
Cloudflare Workers のCronトリガーを設定してください。

要件:
- 毎日日本時間 00:30 に実行（UTC 15:30）
- POST /api/cron/daily を実行
- wrangler.toml に triggers設定を追加

このAPIは認証不要（Cloudflareから直接呼ばれるため）にしてください。
```

### Step 5-2. Cron処理の実装

```
POST /api/cron/daily を実装してください。

毎日実行する処理:
1. 今日が支払日の固定費 → 取引記録DBに追加
2. 今日が返済日のローン → 元金・利息計算 → 記録＋残債更新
3. 今日が支払日のカード → 締め期間の取引合計 → 銀行から自動減算

各処理は独立して実装し、エラーがあっても他の処理は続行するようにしてください。
ログ出力も入れて、何が実行されたか分かるようにしてください。
```

### Step 5-3. ローカルテスト

Cronはローカルで時間で発火しないので、手動で叩いて動作確認：

```bash
curl -X POST http://localhost:8787/api/cron/daily
```

### Step 5-4. コミット

```bash
git add .
git commit -m "Phase 5: Cron automation for fixed costs, loans, card settlements"
```

---

## 🌐 Phase 6: Cloudflare Workersデプロイ

### Step 6-1. Cloudflareへのデプロイ準備

```
本番環境にデプロイする前に、wrangler でログインして
シークレットを設定する手順を教えてください。

特に NOTION_TOKEN と API_KEY は wrangler secret put で
本番環境に登録する必要があります。
```

実際のコマンド例：

```bash
cd api
npx wrangler login
npx wrangler secret put NOTION_TOKEN
# プロンプトでトークンを入力

npx wrangler secret put API_KEY
# プロンプトでAPIキーを入力
```

### Step 6-2. デプロイ実行

```bash
npx wrangler deploy
```

デプロイ成功すると以下のようなURLが表示される：

```
https://kakeibo-api.あなたのアカウント.workers.dev
```

このURLをメモしてください。フロントから叩くことになります。

### Step 6-3. 本番環境で動作確認

```bash
curl https://kakeibo-api.xxx.workers.dev/api/health
```

### Step 6-4. コミット

```bash
git add .
git commit -m "Phase 6: Deployed to Cloudflare Workers"
```

---

## 🎨 Phase 7: フロントエンド実装

### Step 7-1. webディレクトリのセットアップ

```
web/ ディレクトリを作成して、フロントエンド実装を始めてください。

要件:
- フレームワーク不使用（Vanilla JS + HTML + CSS）
- 各画面はHTMLファイルとして分離
- 共通CSS は web/assets/css/common.css に作成
- API呼び出しは web/assets/js/api.js にまとめる

まず web/index.html （ホーム画面）と共通CSSから作ってください。
docs/design-prototype.html のスタイルをそのまま流用してOKです。

API_BASE_URL は環境変数的に切り替えできるようにしてください。
（ローカル開発時：http://localhost:8787、本番：Cloudflare WorkersのURL）
```

### Step 7-2. 各画面の実装

順次実装：

1. ホーム画面（index.html）
2. 支出入力画面（screens/expense.html）
3. カード選択画面（screens/card-select.html）
4. 収入入力画面（screens/income.html）
5. 振替入力画面（screens/transfer.html）
6. 分割払い入力画面（screens/installment.html）
7. 欲しいもの選択画面（screens/wishlist.html）
8. リボ返済画面（screens/revo.html）
9. 取引一覧画面（screens/logs.html）
10. 取引詳細モーダル（screens/detail.html）
11. 設定画面（screens/conf.html）

各画面の実装指示の例：

```
web/screens/expense.html を作ってください。

design-prototype.html の「02_EXPENSE_INPUT.tsx」のセクションを参考にして、
HTMLとして実装してください。

要件:
- カード選択時は web/screens/card-select.html へ遷移
- 保存ボタン押下で POST /api/transactions を呼び出す
- 成功したらホーム画面に戻る
- ローディング表示・エラー表示も入れる
```

### Step 7-3. ローカルプレビュー

簡易的なHTTPサーバーで確認：

```bash
cd web
npx serve .
# または
python3 -m http.server 3000
```

ブラウザで http://localhost:3000 を開く。

### Step 7-4. コミット

```bash
git add .
git commit -m "Phase 7: Frontend implementation (all 11 screens)"
```

---

## 📱 Phase 8: PWA化

### Step 8-1. manifest.json作成

```
web/manifest.json を作成してください。

PWA対応のために必要な設定:
- name: 家計簿
- short_name: kakeibo
- start_url: /
- display: standalone
- background_color: #0A0A0B
- theme_color: #0A0A0B
- iconsはあとで作成するので一旦placeholderで

iPhone対応のための apple-touch-icon の設定方法も教えてください。
```

### Step 8-2. Service Worker実装

```
web/service-worker.js を作成してください。

要件:
- 静的ファイルをキャッシュ
- オフラインでもUIが表示される
- API呼び出しは常にネットワーク（キャッシュしない）
- 適切なキャッシュ戦略
```

### Step 8-3. アイコン作成

任意の画像作成ツール（FigmaでもOK、あるいはAIで生成）で512x512のアイコンを作成。
ターミナル風UIに合わせるなら、緑色背景に「¥」マークなど。

```bash
# web/assets/icons/ に配置
icon-192.png
icon-512.png
apple-touch-icon.png
```

### Step 8-4. HTMLにメタタグ追加

```
web/index.html などに以下のメタタグを追加してください。

- <link rel="manifest" href="/manifest.json">
- <meta name="apple-mobile-web-app-capable" content="yes">
- <meta name="theme-color" content="#0A0A0B">
- <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
- <script>でservice-worker.jsを登録
```

### Step 8-5. コミット

```bash
git add .
git commit -m "Phase 8: PWA support (manifest, service worker, icons)"
```

---

## 🚢 Phase 9: GitHub Pagesデプロイ

### Step 9-1. GitHub Pages有効化

GitHubのリポジトリページで：
1. Settings → Pages
2. Source: Deploy from a branch
3. Branch: main / web フォルダ
4. Save

### Step 9-2. ベースパスの調整

GitHub Pagesは `https://username.github.io/kakeibo-app/` のようなパスになります。
画像やリンクのパスを相対パスにする必要があるので、Claude Codeに：

```
GitHub Pagesでデプロイした場合、パスが /kakeibo-app/ になります。
すべての画像・CSS・JSのパスを相対パスに変更してください。

manifest.json の start_url や icons パスも修正お願いします。
```

### Step 9-3. プッシュしてデプロイ

```bash
git push origin main
```

数分後、`https://username.github.io/kakeibo-app/web/` でアクセス可能になります。

### Step 9-4. デプロイ確認

ブラウザでURL開いて動作確認。
APIへのアクセスはCORS設定が必要なので、Workers側で対応：

```
api/src/index.ts にCORS設定を追加してください。

GitHub Pagesのドメイン（https://username.github.io）からのアクセスを許可してください。
```

---

## 📲 Phase 10: iPhone実機テスト

### Step 10-1. iPhoneで開く

iPhoneのSafariで `https://username.github.io/kakeibo-app/web/` を開く。

### Step 10-2. ホーム画面に追加

1. Safariの共有ボタン（中央下）
2. 「ホーム画面に追加」
3. 名前を確認して「追加」

### Step 10-3. アプリとして起動

ホーム画面にアイコンが追加され、タップするとPWAとして全画面表示で起動。

### Step 10-4. 動作確認チェックリスト

- [ ] ホーム画面が表示される
- [ ] 利用可能額が正しく計算されている
- [ ] 支出入力ができる
- [ ] 収入入力ができる
- [ ] 振替ができる
- [ ] 取引一覧で編集・削除できる
- [ ] Notion側にデータが反映されている
- [ ] iPhone再起動後もアプリが動く
- [ ] オフライン時はUIが表示される

---

## 🐛 トラブルシューティング

### CORSエラーが出る
→ Workers側の `cors()` ミドルウェアの設定を確認

### Notion APIが401を返す
→ Integrationが各DBにコネクトされているか確認
→ APIキーが正しいか確認

### Cronが動かない
→ Cloudflare ダッシュボードの Workers → 該当Worker → Triggers タブで設定確認
→ wrangler.toml の triggers が正しく書かれているか確認

### iPhone PWAでスクロールがおかしい
→ `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">` 確認
→ overflow: hidden が body に効いていないか

### データ更新がリアルタイムに反映されない
→ Notion APIのキャッシュ戦略を確認
→ 必要に応じて手動リフレッシュボタンを追加

---

## 💡 開発を効率化するコツ

### Git運用
- 各Phase完了時にコミット
- セッション開始前に commit してから始める
- うまく行かなかったら git reset で戻せる

### Claude Codeの使い方
- 大きな指示を一度にしない（1機能ずつ）
- 動作確認後に次へ進む
- エラー出たらエラーメッセージをそのまま貼って聞く

### デバッグ
- Workers側は `console.log` をたくさん入れる
- `wrangler tail` でリアルタイムログ確認できる
- Notion APIのレスポンスは複雑なので、最初は生のレスポンスを見る

### Notion API クォータ管理
- 開発中はキャッシュを活用
- 本番では Cron で手動更新
- レート制限：3 req/秒（並列実行は控えめに）

---

## 📊 開発時間の目安

| Phase | 内容 | 時間目安 |
|---|---|---|
| 0 | 事前準備 | 30分〜1時間 |
| 1 | Workers基盤 | 1〜2時間 |
| 2 | 読み取り系API | 2〜4時間 |
| 3 | 書き込み系API | 4〜6時間 |
| 4 | 編集削除API | 1〜2時間 |
| 5 | Cron自動化 | 2〜3時間 |
| 6 | デプロイ | 30分 |
| 7 | フロント実装 | 8〜12時間 |
| 8 | PWA化 | 1〜2時間 |
| 9 | GitHub Pages | 30分〜1時間 |
| 10 | 実機テスト | 1〜2時間 |
| **合計** | | **20〜35時間** |

> Claude Codeを使うので、純粋な実装時間は半分くらいになる可能性大。

---

## 🎯 完了後の運用

実装が完了したら：

1. **Notionに初期マスタデータを入力**
   - 口座（銀行・現金等）
   - カード（締め日・支払日・分割手数料率）
   - カテゴリ（食費・交通費・給与等）

2. **最初の月次予算スナップショットを作成**
   - 給与日に「収入」を入力 → 自動でスナップショット作成

3. **継続的な改善**
   - 使ってみて気になる点をメモ
   - 機能追加したくなったら戻ってきて Claude Code に相談

---

## 🔗 困ったときの参考リンク

- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- Hono Framework: https://hono.dev/
- Notion API: https://developers.notion.com/
- PWA Guide: https://web.dev/progressive-web-apps/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/

困ったら Claude Code に「〇〇でエラーが出た、どう解決すればいい？」と聞けばOKです。
