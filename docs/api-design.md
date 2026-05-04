# 家計管理アプリ API設計書

> Cloudflare Workers で実装するAPIプロキシのエンドポイント一覧と仕様

---

## 1. 全体方針

```
PWA (フロント)
   ↓ HTTPS / JSON
Cloudflare Workers (本ドキュメントのAPI)
   ↓ Notion API
Notion DB (19テーブル)
```

- **認証**：個人利用のため、URLシークレットによる簡易認証（Bearer トークン or クエリパラメータ）
- **データ形式**：すべて JSON
- **エラー**：HTTP ステータス + `{ error: string, message: string }`
- **レート制限**：Cloudflare 無料枠内（月10万リクエスト）

---

## 2. 画面別 必要API マトリクス

### 01. ホーム画面
| API | 役割 |
|---|---|
| `GET /api/dashboard` | ホーム画面用の集約データ（利用可能額・カード状況・最近の取引） |

### 02. 支出入力画面
| API | 役割 |
|---|---|
| `GET /api/master/payments` | 支払方法一覧（現金・カード等） |
| `GET /api/master/categories?type=expense` | 支出カテゴリ一覧 |
| `POST /api/transactions` | 支出を記録 |

### 03. カード選択画面
| API | 役割 |
|---|---|
| `GET /api/master/cards` | カード一覧（クレカのみ） |
| `GET /api/master/card-perks` | カード優遇店舗マスタ |

### 04. 収入入力画面
| API | 役割 |
|---|---|
| `GET /api/master/categories?type=income` | 収入カテゴリ一覧 |
| `GET /api/master/accounts` | 口座一覧（入金先用） |
| `POST /api/transactions` | 収入を記録 |
| `POST /api/snapshot` | 給与時に月次予算スナップショット作成 |

### 05. 振替入力画面
| API | 役割 |
|---|---|
| `GET /api/master/accounts` | 口座一覧 |
| `POST /api/transfer` | 振替を記録 |

### 06. 分割払い入力画面
| API | 役割 |
|---|---|
| `GET /api/master/cards` | カード一覧 |
| `GET /api/master/categories?type=expense` | カテゴリ一覧 |
| `POST /api/installment` | 分割払い登録（10ヶ月分の取引も一括作成） |

### 07. 欲しいもの選択画面
| API | 役割 |
|---|---|
| `GET /api/wishlist` | 欲しいもの一覧 |
| `POST /api/wishlist/:id/purchase` | 欲しいものを購入完了に |

### 08. リボ返済入力画面
| API | 役割 |
|---|---|
| `GET /api/revolving` | リボ払い一覧 |
| `POST /api/revolving/:id/repay` | リボ返済を記録 |

### 09. 取引一覧画面
| API | 役割 |
|---|---|
| `GET /api/transactions?month=YYYY-MM` | 月の取引一覧 |
| `DELETE /api/transactions/:id` | 取引削除 |
| `PATCH /api/transactions/:id` | 取引編集 |

### 10. 取引詳細・編集モーダル
| API | 役割 |
|---|---|
| `GET /api/transactions/:id` | 取引詳細取得 |
| `PATCH /api/transactions/:id` | 取引編集 |
| `DELETE /api/transactions/:id` | 取引削除 |

### 11. 設定画面
| API | 役割 |
|---|---|
| `POST /api/refresh` | データキャッシュをリフレッシュ |
| その他はNotionへ直接遷移 | マスタ管理はNotion側 |

### Cron専用（自動実行）
| API | 役割 |
|---|---|
| `POST /api/cron/daily` | 毎日実行：固定費・ローン・リボ・カード引き落とし |

---

## 3. エンドポイント詳細仕様

### 3.1 GET /api/dashboard
ホーム画面用の集約データを1リクエストで取得。

**レスポンス**
```json
{
  "month": "2026-04",
  "available": {
    "amount": 117000,
    "income": 300000,
    "fixedExpenses": 183000
  },
  "cards": [
    {
      "id": "uuid",
      "name": "楽天カード",
      "logoUrl": "https://...",
      "type": "rakuten",
      "currentUsage": 42000,
      "monthlyLimit": 100000,
      "limitEnabled": true,
      "percentage": 42
    }
  ],
  "recentTransactions": [
    {
      "id": "uuid",
      "datetime": "2026-04-19T14:30:00+09:00",
      "type": "expense",
      "amount": 1500,
      "category": { "id": "...", "name": "外食", "icon": "🍔", "parentName": "食費" },
      "paymentMethod": { "id": "...", "name": "楽天カード" },
      "memo": "マクドナルド"
    }
  ]
}
```

### 3.2 POST /api/transactions
取引を記録（支出・収入共通）。

**リクエスト**
```json
{
  "datetime": "2026-04-19T14:30:00+09:00",
  "type": "expense",
  "amount": 1500,
  "paymentMethodId": "uuid",
  "categoryId": "uuid",
  "memo": "マクドナルド",
  "source": "manual"
}
```

**レスポンス**
```json
{
  "id": "uuid",
  "createdAt": "2026-04-19T14:30:05+09:00"
}
```

### 3.3 PATCH /api/transactions/:id
取引を編集。

**リクエスト**：上記と同じフォーマット（部分更新可）

### 3.4 DELETE /api/transactions/:id
取引を削除（Notionでアーカイブ扱い）。

### 3.5 GET /api/transactions
月の取引一覧。

**クエリパラメータ**
- `month=2026-04` 必須
- `type=expense|income|transfer|all` オプション

**レスポンス**
```json
{
  "month": "2026-04",
  "summary": {
    "income": 300000,
    "expense": 183000,
    "net": 117000
  },
  "groups": [
    {
      "date": "2026-04-19",
      "dayTotal": -4500,
      "transactions": [...]
    }
  ]
}
```

### 3.6 POST /api/transfer
口座間の振替を記録。

**リクエスト**
```json
{
  "datetime": "2026-04-19T10:00:00+09:00",
  "fromAccountId": "uuid",
  "toAccountId": "uuid",
  "amount": 50000,
  "fee": 0,
  "memo": "投資資金移動"
}
```

### 3.7 POST /api/installment
分割払いを登録（マスタ＋10ヶ月分の取引を一括作成）。

**リクエスト**
```json
{
  "name": "iPad Pro 11インチ M4",
  "totalAmount": 100000,
  "months": 10,
  "cardId": "uuid",
  "categoryId": "uuid",
  "firstPaymentMonth": "2026-05",
  "memo": ""
}
```

**処理**
1. カードの分割手数料率表から `months` の率を取得
2. 手数料総額・月次支払額を計算
3. 分割払いマスタDBに1レコード作成
4. 取引記録DBに10件追加（紐づけ含む）

**レスポンス**
```json
{
  "installmentId": "uuid",
  "monthlyPayment": 11208,
  "totalFee": 12083,
  "completionMonth": "2027-04",
  "createdTransactions": 10
}
```

### 3.8 POST /api/revolving/:id/repay
リボ返済を記録。

**リクエスト**
```json
{
  "date": "2026-04-27",
  "amount": 10000,
  "type": "normal"
}
```

**処理**
- `normal`: 利息計算 → 元金 = 額 - 利息
- `prepayment`: 全額元金充当（利息0）
- 残債更新・取引記録DBに支出として追加・履歴DBに明細追加

### 3.9 POST /api/wishlist/:id/purchase
欲しいものを購入完了に変換。

**リクエスト**
```json
{
  "datetime": "2026-04-19T15:00:00+09:00",
  "amount": 39800,
  "paymentMethodId": "uuid",
  "memo": "Apple Storeで購入"
}
```

**処理**
- 取引記録DBに支出を追加
- 欲しいものDBのステータスを「購入済み」に更新
- 紐づけ

### 3.10 POST /api/snapshot
給与入力時に月次予算スナップショットを作成。

**リクエスト**
```json
{
  "yearMonth": "2026-04",
  "salaryAmount": 300000,
  "salaryDate": "2026-04-25",
  "manualRevoPayment": 10000
}
```

**処理**
- 来月支払う固定費合計を計算
- 来月支払うローン合計を計算
- 目標貯金DBから今月の目標を取得
- クレカ利用可能額を算出
- 月次予算スナップショットDBに作成

### 3.11 POST /api/cron/daily
毎日Cronで自動実行される処理。

**処理（順番に実行）**
1. 今日が支払日の固定費 → 取引記録DBに追加
2. 今日が返済日のローン → 元金・利息計算 → 記録＋残債更新
3. 今日が支払日のカード → 締め期間の取引合計 → 銀行口座から自動減算

---

## 4. マスタ取得API（共通）

### GET /api/master/payments
全支払方法一覧。

### GET /api/master/cards
クレジットカード／デビットのみ。

### GET /api/master/accounts
口座（銀行・現金・証券）。

### GET /api/master/categories
カテゴリマスタ。

**クエリ**
- `type=expense|income|all`
- `level=large|small|all`

### GET /api/master/card-perks
カード優遇店舗一覧。

**クエリ**
- `cardId=uuid` でフィルタ可

### GET /api/master/installments?status=active
進行中の分割払い一覧。

### GET /api/master/loans?active=true
有効なローン一覧。

---

## 5. 認証

簡易認証として、URLにシークレットを含める方式。

```
https://kakeibo-api.xxx.workers.dev/api/dashboard?key=SECRET_KEY
```

または Bearer トークン
```
Authorization: Bearer SECRET_KEY
```

シークレットは Cloudflare Workers の環境変数 `API_KEY` として保管。

---

## 6. 実装順序（推奨）

```
Phase 1: 基盤
  ├ Cloudflare Workers の Hono 等ルーターセットアップ
  ├ Notion APIクライアント
  ├ 認証ミドルウェア
  └ CORS対応

Phase 2: 読み取り系API（フロントが先に動かせる）
  ├ GET /api/dashboard
  ├ GET /api/master/* (5個)
  ├ GET /api/transactions
  └ GET /api/wishlist, /api/revolving, /api/master/loans

Phase 3: 書き込み系API
  ├ POST /api/transactions
  ├ POST /api/transfer
  ├ POST /api/snapshot
  ├ POST /api/installment
  ├ POST /api/revolving/:id/repay
  └ POST /api/wishlist/:id/purchase

Phase 4: 編集・削除
  ├ PATCH /api/transactions/:id
  └ DELETE /api/transactions/:id

Phase 5: 自動化
  └ POST /api/cron/daily
```

---

## 7. データ変換ロジック

### Notion API ↔ アプリ用フォーマット
Notion APIのレスポンスは複雑（プロパティが入れ子）なので、Workers側で**シンプルなフラットJSONに変換**してからフロントに返す。

例：
```javascript
// Notion API response
{
  "properties": {
    "金額": { "number": 1500 },
    "カテゴリ": { "relation": [{ "id": "..." }] }
  }
}

// → アプリ用 (変換後)
{
  "amount": 1500,
  "categoryId": "..."
}
```

これによりフロント側はシンプルなコードで済む。

---

## 8. 計算ロジック

### 8.1 利用可能額計算（GET /api/dashboard）
```
今月の利用可能額 =
  今月の月次予算スナップショットの「クレカ利用可能額初期」
  − 今月の現金・QR等の支出合計
  − 今月のクレカ利用合計
```

### 8.2 ローン元利均等返済
```
月利 = 年利 / 12
利息 = 残債 × 月利
元金 = 月次返済額 − 利息
返済後残債 = 残債 − 元金
```

### 8.3 リボ利息（簡易月計算）
```
利息 = 残債 × 年利 / 12
元金 = 支払額 − 利息（通常返済）
元金 = 支払額（繰り上げ返済、利息0）
```

### 8.4 分割手数料（アドオン方式）
```
手数料総額 = 総額 × 手数料率 × 回数 / 12
月次支払額 = (総額 + 手数料総額) / 回数
```

### 8.5 カード引き落とし対象期間
```
締め日が15日、支払日が翌10日のカードの場合:
4月10日支払い分 = 2/16 〜 3/15 の利用合計

締め日が月末、支払日が翌27日のカードの場合:
4月27日支払い分 = 3/1 〜 3/31 の利用合計
```

---

## 9. エラーハンドリング

```json
// 400 Bad Request
{ "error": "BAD_REQUEST", "message": "amount is required" }

// 401 Unauthorized
{ "error": "UNAUTHORIZED", "message": "Invalid API key" }

// 404 Not Found
{ "error": "NOT_FOUND", "message": "Transaction not found" }

// 500 Internal Server Error
{ "error": "INTERNAL_ERROR", "message": "Notion API failed" }
```

---

## 10. 次のステップ

1. **Phase 1 の基盤を実装**（Workers + Hono + Notion クライアント）
2. **読み取り系APIを実装**して、フロントから疎通確認
3. その後、書き込み系・編集削除・Cronを順次追加
