#!/bin/bash
# Notion API テストデータ作成スクリプト
# 作成後、各レコードIDを出力して test-phase3.sh を自動生成する

set -e

NOTION_TOKEN="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"
NOTION_VERSION="2022-06-28"
BASE_URL="https://api.notion.com/v1"

# DB IDs
DB_PAYMENTS="3569e032-4474-8181-8636-eaaca462e950"
DB_ACCOUNTS="3569e032-4474-81e1-a2e6-f1a2a2f8adda"
DB_CATEGORIES="3569e032-4474-8181-a0ea-daa08a4665ee"
DB_FIXED_COSTS="3569e032-4474-81ab-a2b5-ca561cb4b867"
DB_SAVING_GOALS="3569e032-4474-817f-905a-d5ba9b7d076a"

notion_create() {
  local db_id="$1"
  local body="$2"
  curl -s -X POST "$BASE_URL/pages" \
    -H "Authorization: Bearer $NOTION_TOKEN" \
    -H "Notion-Version: $NOTION_VERSION" \
    -H "Content-Type: application/json" \
    -d "$body"
}

echo "=========================================="
echo "手順1: Notion テストデータ作成"
echo "=========================================="

# ① 支払方法DB: テスト現金
echo ""
echo "① 支払方法DB: テスト現金 を作成中..."
PAYMENT_CASH_RES=$(notion_create "$DB_PAYMENTS" '{
  "parent": { "database_id": "'"$DB_PAYMENTS"'" },
  "properties": {
    "名称": { "title": [{ "text": { "content": "テスト現金" } }] },
    "タイプ区分": { "multi_select": [{ "name": "現金" }] },
    "表示順": { "number": 99 }
  }
}')
PAYMENT_CASH_ID=$(echo "$PAYMENT_CASH_RES" | jq -r '.id')
echo "  → ID: $PAYMENT_CASH_ID"

# ② 支払方法DB: テストカード
echo ""
echo "② 支払方法DB: テストカード を作成中..."
PAYMENT_CARD_RES=$(notion_create "$DB_PAYMENTS" '{
  "parent": { "database_id": "'"$DB_PAYMENTS"'" },
  "properties": {
    "名称": { "title": [{ "text": { "content": "テストカード" } }] },
    "タイプ区分": { "multi_select": [{ "name": "クレジット" }] },
    "締め日": { "number": 15 },
    "支払日": { "number": 10 },
    "月次利用上限": { "number": 100000 },
    "利用上限を有効化": { "checkbox": true },
    "分割手数料率表": { "rich_text": [{ "text": { "content": "{\"3\":12.25,\"10\":14.5}" } }] },
    "表示色": { "rich_text": [{ "text": { "content": "#00E676" } }] },
    "表示順": { "number": 98 }
  }
}')
PAYMENT_CARD_ID=$(echo "$PAYMENT_CARD_RES" | jq -r '.id')
echo "  → ID: $PAYMENT_CARD_ID"

# ③ 口座DB: テスト銀行A
echo ""
echo "③ 口座DB: テスト銀行A を作成中..."
ACCOUNT_A_RES=$(notion_create "$DB_ACCOUNTS" '{
  "parent": { "database_id": "'"$DB_ACCOUNTS"'" },
  "properties": {
    "名称": { "title": [{ "text": { "content": "テスト銀行A" } }] },
    "口座種別": { "select": { "name": "銀行" } },
    "現在残高": { "number": 500000 },
    "表示色": { "rich_text": [{ "text": { "content": "#00E676" } }] },
    "表示順": { "number": 99 }
  }
}')
ACCOUNT_A_ID=$(echo "$ACCOUNT_A_RES" | jq -r '.id')
echo "  → ID: $ACCOUNT_A_ID"

# ④ 口座DB: テスト銀行B
echo ""
echo "④ 口座DB: テスト銀行B を作成中..."
ACCOUNT_B_RES=$(notion_create "$DB_ACCOUNTS" '{
  "parent": { "database_id": "'"$DB_ACCOUNTS"'" },
  "properties": {
    "名称": { "title": [{ "text": { "content": "テスト銀行B" } }] },
    "口座種別": { "select": { "name": "銀行" } },
    "現在残高": { "number": 200000 },
    "表示色": { "rich_text": [{ "text": { "content": "#FFB800" } }] },
    "表示順": { "number": 98 }
  }
}')
ACCOUNT_B_ID=$(echo "$ACCOUNT_B_RES" | jq -r '.id')
echo "  → ID: $ACCOUNT_B_ID"

# ⑤ カテゴリマスタDB: テスト外食（支出・大）
echo ""
echo "⑤ カテゴリマスタDB: テスト外食 を作成中..."
CATEGORY_EXPENSE_RES=$(notion_create "$DB_CATEGORIES" '{
  "parent": { "database_id": "'"$DB_CATEGORIES"'" },
  "properties": {
    "カテゴリ名": { "title": [{ "text": { "content": "テスト外食" } }] },
    "種別": { "select": { "name": "支出" } },
    "階層": { "select": { "name": "小" } },
    "アイコン": { "rich_text": [{ "text": { "content": "🍔" } }] },
    "表示順": { "number": 99 }
  }
}')
CATEGORY_EXPENSE_ID=$(echo "$CATEGORY_EXPENSE_RES" | jq -r '.id')
echo "  → ID: $CATEGORY_EXPENSE_ID"

# ⑥ カテゴリマスタDB: テスト給与（収入・大）
echo ""
echo "⑥ カテゴリマスタDB: テスト給与 を作成中..."
CATEGORY_INCOME_RES=$(notion_create "$DB_CATEGORIES" '{
  "parent": { "database_id": "'"$DB_CATEGORIES"'" },
  "properties": {
    "カテゴリ名": { "title": [{ "text": { "content": "テスト給与" } }] },
    "種別": { "select": { "name": "収入" } },
    "階層": { "select": { "name": "大" } },
    "アイコン": { "rich_text": [{ "text": { "content": "💰" } }] },
    "表示順": { "number": 98 }
  }
}')
CATEGORY_INCOME_ID=$(echo "$CATEGORY_INCOME_RES" | jq -r '.id')
echo "  → ID: $CATEGORY_INCOME_ID"

# ⑦ 固定費マスタDB: テスト家賃（支払方法: テスト現金）
echo ""
echo "⑦ 固定費マスタDB: テスト家賃 を作成中..."
FIXED_COST_RES=$(notion_create "$DB_FIXED_COSTS" '{
  "parent": { "database_id": "'"$DB_FIXED_COSTS"'" },
  "properties": {
    "名称": { "title": [{ "text": { "content": "テスト家賃" } }] },
    "金額": { "number": 80000 },
    "支払日": { "number": 27 },
    "支払方法": { "relation": [{ "id": "'"$PAYMENT_CASH_ID"'" }] },
    "カテゴリ": { "relation": [{ "id": "'"$CATEGORY_EXPENSE_ID"'" }] },
    "開始月": { "date": { "start": "2026-01-01" } },
    "有効": { "checkbox": true },
    "メモ": { "rich_text": [{ "text": { "content": "テスト用固定費" } }] }
  }
}')
FIXED_COST_ID=$(echo "$FIXED_COST_RES" | jq -r '.id')
echo "  → ID: $FIXED_COST_ID"

# ⑧ 目標貯金DB: テスト貯金目標
echo ""
echo "⑧ 目標貯金DB: テスト貯金目標 を作成中..."
SAVING_GOAL_RES=$(notion_create "$DB_SAVING_GOALS" '{
  "parent": { "database_id": "'"$DB_SAVING_GOALS"'" },
  "properties": {
    "年月": { "title": [{ "text": { "content": "2026-05" } }] },
    "目標金額": { "number": 50000 },
    "メモ": { "rich_text": [{ "text": { "content": "テスト用貯金目標" } }] }
  }
}')
SAVING_GOAL_ID=$(echo "$SAVING_GOAL_RES" | jq -r '.id')
echo "  → ID: $SAVING_GOAL_ID"

echo ""
echo "=========================================="
echo "手順2: 作成結果まとめ"
echo "=========================================="
echo "支払方法DB:"
echo "  テスト現金  ID: $PAYMENT_CASH_ID"
echo "  テストカード ID: $PAYMENT_CARD_ID"
echo ""
echo "口座DB:"
echo "  テスト銀行A ID: $ACCOUNT_A_ID"
echo "  テスト銀行B ID: $ACCOUNT_B_ID"
echo ""
echo "カテゴリマスタDB:"
echo "  テスト外食  ID: $CATEGORY_EXPENSE_ID"
echo "  テスト給与  ID: $CATEGORY_INCOME_ID"
echo ""
echo "固定費マスタDB:"
echo "  テスト家賃  ID: $FIXED_COST_ID"
echo ""
echo "目標貯金DB:"
echo "  テスト貯金目標 ID: $SAVING_GOAL_ID"

echo ""
echo "=========================================="
echo "手順3: test-phase3.sh を生成中..."
echo "=========================================="

API_KEY="OeLqNwTakLCLOOEK7xvsW6X7jkeJ8C9w1IuZ96AlkoY="
BASE="http://localhost:8787"

cat > "$(dirname "$0")/test-phase3.sh" << SCRIPT
#!/bin/bash
# Phase 3 書き込みAPI テストスクリプト
# テストデータID（Notion直接作成済み）:
#   テスト現金  : $PAYMENT_CASH_ID
#   テストカード: $PAYMENT_CARD_ID
#   テスト銀行A : $ACCOUNT_A_ID
#   テスト銀行B : $ACCOUNT_B_ID
#   テスト外食  : $CATEGORY_EXPENSE_ID
#   テスト給与  : $CATEGORY_INCOME_ID
#   テスト家賃  : $FIXED_COST_ID
#   テスト貯金目標: $SAVING_GOAL_ID

AUTH="Authorization: Bearer $API_KEY"
BASE="$BASE"

PAYMENT_CASH_ID="$PAYMENT_CASH_ID"
PAYMENT_CARD_ID="$PAYMENT_CARD_ID"
ACCOUNT_A_ID="$ACCOUNT_A_ID"
ACCOUNT_B_ID="$ACCOUNT_B_ID"
CATEGORY_EXPENSE_ID="$CATEGORY_EXPENSE_ID"
CATEGORY_INCOME_ID="$CATEGORY_INCOME_ID"
FIXED_COST_ID="$FIXED_COST_ID"
SAVING_GOAL_ID="$SAVING_GOAL_ID"

echo "=========================================="
echo "Phase 3: 書き込みAPI テスト"
echo "=========================================="

# ---- POST /api/transactions (支出) ----
echo ""
echo "=== ① POST /api/transactions（支出） ==="
EXPENSE_RES=\$(curl -s -X POST "\$BASE/api/transactions" \\
  -H "\$AUTH" \\
  -H "Content-Type: application/json" \\
  -d '{
    "datetime": "2026-05-09T14:00:00+09:00",
    "type": "expense",
    "amount": 1500,
    "paymentMethodId": "'\$PAYMENT_CASH_ID'",
    "categoryId": "'\$CATEGORY_EXPENSE_ID'",
    "memo": "テスト支出（現金）",
    "source": "manual"
  }')
echo "\$EXPENSE_RES" | jq .
EXPENSE_TX_ID=\$(echo "\$EXPENSE_RES" | jq -r '.id // empty')
echo "  → 取引ID: \$EXPENSE_TX_ID"

# ---- POST /api/transactions (収入) ----
echo ""
echo "=== ② POST /api/transactions（収入） ==="
INCOME_RES=\$(curl -s -X POST "\$BASE/api/transactions" \\
  -H "\$AUTH" \\
  -H "Content-Type: application/json" \\
  -d '{
    "datetime": "2026-05-09T10:00:00+09:00",
    "type": "income",
    "amount": 300000,
    "paymentMethodId": "'\$PAYMENT_CASH_ID'",
    "categoryId": "'\$CATEGORY_INCOME_ID'",
    "memo": "テスト給与収入",
    "source": "manual"
  }')
echo "\$INCOME_RES" | jq .
INCOME_TX_ID=\$(echo "\$INCOME_RES" | jq -r '.id // empty')
echo "  → 取引ID: \$INCOME_TX_ID"

# ---- PATCH /api/transactions/:id ----
echo ""
echo "=== ③ PATCH /api/transactions/:id（編集） ==="
if [ -n "\$EXPENSE_TX_ID" ]; then
  PATCH_RES=\$(curl -s -X PATCH "\$BASE/api/transactions/\$EXPENSE_TX_ID" \\
    -H "\$AUTH" \\
    -H "Content-Type: application/json" \\
    -d '{
      "amount": 1800,
      "memo": "テスト支出（編集後）"
    }')
  echo "\$PATCH_RES" | jq .
else
  echo "  ⚠️  EXPENSE_TX_ID が取得できなかったためスキップ"
fi

# ---- POST /api/transfer ----
echo ""
echo "=== ④ POST /api/transfer（振替） ==="
TRANSFER_RES=\$(curl -s -X POST "\$BASE/api/transfer" \\
  -H "\$AUTH" \\
  -H "Content-Type: application/json" \\
  -d '{
    "datetime": "2026-05-09T12:00:00+09:00",
    "fromAccountId": "'\$ACCOUNT_A_ID'",
    "toAccountId": "'\$ACCOUNT_B_ID'",
    "amount": 50000,
    "fee": 0,
    "memo": "テスト振替"
  }')
echo "\$TRANSFER_RES" | jq .

# ---- POST /api/snapshot ----
echo ""
echo "=== ⑤ POST /api/snapshot（月次予算スナップショット） ==="
SNAPSHOT_RES=\$(curl -s -X POST "\$BASE/api/snapshot" \\
  -H "\$AUTH" \\
  -H "Content-Type: application/json" \\
  -d '{
    "yearMonth": "2026-05",
    "salaryAmount": 300000,
    "salaryDate": "2026-05-09",
    "manualRevoPayment": 10000
  }')
echo "\$SNAPSHOT_RES" | jq .

# ---- POST /api/installment ----
echo ""
echo "=== ⑥ POST /api/installment（分割払い） ==="
INSTALLMENT_RES=\$(curl -s -X POST "\$BASE/api/installment" \\
  -H "\$AUTH" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "テストiPad 分割払い",
    "totalAmount": 100000,
    "months": 10,
    "cardId": "'\$PAYMENT_CARD_ID'",
    "categoryId": "'\$CATEGORY_EXPENSE_ID'",
    "firstPaymentMonth": "2026-05",
    "memo": "テスト分割払い"
  }')
echo "\$INSTALLMENT_RES" | jq .

# ---- DELETE /api/transactions/:id ----
echo ""
echo "=== ⑦ DELETE /api/transactions/:id（削除） ==="
if [ -n "\$INCOME_TX_ID" ]; then
  DELETE_RES=\$(curl -s -X DELETE "\$BASE/api/transactions/\$INCOME_TX_ID" \\
    -H "\$AUTH")
  echo "\$DELETE_RES" | jq .
else
  echo "  ⚠️  INCOME_TX_ID が取得できなかったためスキップ"
fi

echo ""
echo "=========================================="
echo "Phase 3 テスト完了"
echo "=========================================="
echo "※ テストデータのクリーンアップは cleanup-test-data.sh を実行してください"
SCRIPT

chmod +x "$(dirname "$0")/test-phase3.sh"
echo "✅ test-phase3.sh 生成完了"

echo ""
echo "=========================================="
echo "すべての作業が完了しました"
echo "=========================================="
echo ""
echo "次のステップ:"
echo "  1. wrangler dev でローカルサーバーを起動"
echo "  2. bash api/test-phase3.sh を実行"
echo "  3. テスト完了後に bash api/cleanup-test-data.sh を実行"
echo ""

# クリーンアップスクリプトも生成
cat > "$(dirname "$0")/cleanup-test-data.sh" << CLEANUP
#!/bin/bash
# テストデータクリーンアップスクリプト
# Notion API で作成したテストレコードをアーカイブ（削除）する

NOTION_TOKEN="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"
NOTION_VERSION="2022-06-28"

archive_page() {
  local page_id="\$1"
  local name="\$2"
  echo "削除中: \$name (\$page_id)"
  curl -s -X PATCH "https://api.notion.com/v1/pages/\$page_id" \\
    -H "Authorization: Bearer \$NOTION_TOKEN" \\
    -H "Notion-Version: \$NOTION_VERSION" \\
    -H "Content-Type: application/json" \\
    -d '{"archived": true}' | jq -r '.archived // .message'
}

echo "=========================================="
echo "テストデータ クリーンアップ"
echo "=========================================="

archive_page "$PAYMENT_CASH_ID"    "テスト現金（支払方法）"
archive_page "$PAYMENT_CARD_ID"   "テストカード（支払方法）"
archive_page "$ACCOUNT_A_ID"      "テスト銀行A（口座）"
archive_page "$ACCOUNT_B_ID"      "テスト銀行B（口座）"
archive_page "$CATEGORY_EXPENSE_ID" "テスト外食（カテゴリ）"
archive_page "$CATEGORY_INCOME_ID"  "テスト給与（カテゴリ）"
archive_page "$FIXED_COST_ID"     "テスト家賃（固定費）"
archive_page "$SAVING_GOAL_ID"    "テスト貯金目標（目標貯金）"

echo ""
echo "✅ クリーンアップ完了（Notionでアーカイブされました）"
CLEANUP

chmod +x "$(dirname "$0")/cleanup-test-data.sh"
echo "✅ cleanup-test-data.sh 生成完了"
