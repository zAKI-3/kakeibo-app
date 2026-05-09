#!/bin/bash
# Phase 3 書き込みAPI テストスクリプト
# テストデータID（Notion直接作成済み）:
#   テスト現金  : 35b9e032-4474-81f9-a136-c7416aea3f22
#   テストカード: 35b9e032-4474-8139-8b50-f8337de514d6
#   テスト銀行A : 35b9e032-4474-81c5-9e49-dd192a169fa9
#   テスト銀行B : 35b9e032-4474-8190-b95e-d488ca79b150
#   テスト外食  : 35b9e032-4474-813e-8484-e30d41a131b1
#   テスト給与  : 35b9e032-4474-81e6-bf13-cb888a8479d8
#   テスト家賃  : 35b9e032-4474-8173-b756-cdadf9ed945b
#   テスト貯金目標: 35b9e032-4474-8135-a013-f86430a19a6b

AUTH="Authorization: Bearer OeLqNwTakLCLOOEK7xvsW6X7jkeJ8C9w1IuZ96AlkoY="
BASE="http://localhost:8787"

PAYMENT_CASH_ID="35b9e032-4474-81f9-a136-c7416aea3f22"
PAYMENT_CARD_ID="35b9e032-4474-8139-8b50-f8337de514d6"
ACCOUNT_A_ID="35b9e032-4474-81c5-9e49-dd192a169fa9"
ACCOUNT_B_ID="35b9e032-4474-8190-b95e-d488ca79b150"
CATEGORY_EXPENSE_ID="35b9e032-4474-813e-8484-e30d41a131b1"
CATEGORY_INCOME_ID="35b9e032-4474-81e6-bf13-cb888a8479d8"
FIXED_COST_ID="35b9e032-4474-8173-b756-cdadf9ed945b"
SAVING_GOAL_ID="35b9e032-4474-8135-a013-f86430a19a6b"

echo "=========================================="
echo "Phase 3: 書き込みAPI テスト"
echo "=========================================="

# ---- POST /api/transactions (支出) ----
echo ""
echo "=== ① POST /api/transactions（支出） ==="
EXPENSE_RES=$(curl -s -X POST "$BASE/api/transactions" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "datetime": "2026-05-09T14:00:00+09:00",
    "type": "expense",
    "amount": 1500,
    "paymentMethodId": "'$PAYMENT_CASH_ID'",
    "categoryId": "'$CATEGORY_EXPENSE_ID'",
    "memo": "テスト支出（現金）",
    "source": "manual"
  }')
echo "$EXPENSE_RES" | jq .
EXPENSE_TX_ID=$(echo "$EXPENSE_RES" | jq -r '.id // empty')
echo "  → 取引ID: $EXPENSE_TX_ID"

# ---- POST /api/transactions (収入) ----
echo ""
echo "=== ② POST /api/transactions（収入） ==="
INCOME_RES=$(curl -s -X POST "$BASE/api/transactions" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "datetime": "2026-05-09T10:00:00+09:00",
    "type": "income",
    "amount": 300000,
    "paymentMethodId": "'$PAYMENT_CASH_ID'",
    "categoryId": "'$CATEGORY_INCOME_ID'",
    "memo": "テスト給与収入",
    "source": "manual"
  }')
echo "$INCOME_RES" | jq .
INCOME_TX_ID=$(echo "$INCOME_RES" | jq -r '.id // empty')
echo "  → 取引ID: $INCOME_TX_ID"

# ---- PATCH /api/transactions/:id ----
echo ""
echo "=== ③ PATCH /api/transactions/:id（編集） ==="
if [ -n "$EXPENSE_TX_ID" ]; then
  PATCH_RES=$(curl -s -X PATCH "$BASE/api/transactions/$EXPENSE_TX_ID" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d '{
      "amount": 1800,
      "memo": "テスト支出（編集後）"
    }')
  echo "$PATCH_RES" | jq .
else
  echo "  ⚠️  EXPENSE_TX_ID が取得できなかったためスキップ"
fi

# ---- POST /api/transfer ----
echo ""
echo "=== ④ POST /api/transfer（振替） ==="
TRANSFER_RES=$(curl -s -X POST "$BASE/api/transfer" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "datetime": "2026-05-09T12:00:00+09:00",
    "fromAccountId": "'$ACCOUNT_A_ID'",
    "toAccountId": "'$ACCOUNT_B_ID'",
    "amount": 50000,
    "fee": 0,
    "memo": "テスト振替"
  }')
echo "$TRANSFER_RES" | jq .

# ---- POST /api/snapshot ----
echo ""
echo "=== ⑤ POST /api/snapshot（月次予算スナップショット） ==="
SNAPSHOT_RES=$(curl -s -X POST "$BASE/api/snapshot" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "yearMonth": "2026-05",
    "salaryAmount": 300000,
    "salaryDate": "2026-05-09",
    "manualRevoPayment": 10000
  }')
echo "$SNAPSHOT_RES" | jq .

# ---- POST /api/installment ----
echo ""
echo "=== ⑥ POST /api/installment（分割払い） ==="
INSTALLMENT_RES=$(curl -s -X POST "$BASE/api/installment" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "テストiPad 分割払い",
    "totalAmount": 100000,
    "months": 10,
    "cardId": "'$PAYMENT_CARD_ID'",
    "categoryId": "'$CATEGORY_EXPENSE_ID'",
    "firstPaymentMonth": "2026-05",
    "memo": "テスト分割払い"
  }')
echo "$INSTALLMENT_RES" | jq .

# ---- DELETE /api/transactions/:id ----
echo ""
echo "=== ⑦ DELETE /api/transactions/:id（削除） ==="
if [ -n "$INCOME_TX_ID" ]; then
  DELETE_RES=$(curl -s -X DELETE "$BASE/api/transactions/$INCOME_TX_ID" \
    -H "$AUTH")
  echo "$DELETE_RES" | jq .
else
  echo "  ⚠️  INCOME_TX_ID が取得できなかったためスキップ"
fi

echo ""
echo "=========================================="
echo "Phase 3 テスト完了"
echo "=========================================="
echo "※ テストデータのクリーンアップは cleanup-test-data.sh を実行してください"
