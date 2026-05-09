#!/bin/bash

AUTH="Authorization: Bearer OeLqNwTakLCLOOEK7xvsW6X7jkeJ8C9w1IuZ96AlkoY="
BASE="http://localhost:8787"

echo "=== ① Health ==="
curl -s $BASE/api/health
echo -e "\n"

echo "=== ② No auth (should be 401) ==="
curl -s $BASE/api/master/categories
echo -e "\n"

echo "=== ③ Master Categories ==="
curl -s -H "$AUTH" $BASE/api/master/categories
echo -e "\n"

echo "=== ④ Master Accounts ==="
curl -s -H "$AUTH" $BASE/api/master/accounts
echo -e "\n"

echo "=== ⑤ Master Payments ==="
curl -s -H "$AUTH" $BASE/api/master/payments
echo -e "\n"

echo "=== ⑥ Master Cards ==="
curl -s -H "$AUTH" $BASE/api/master/cards
echo -e "\n"

echo "=== ⑦ Dashboard ==="
curl -s -H "$AUTH" $BASE/api/dashboard
echo -e "\n"

echo "=== ⑧ Transactions ==="
curl -s -H "$AUTH" "$BASE/api/transactions?month=2026-04"
echo -e "\n"

echo "=== ⑨ Wishlist ==="
curl -s -H "$AUTH" $BASE/api/wishlist
echo -e "\n"

echo "=== ⑩ Revolving ==="
curl -s -H "$AUTH" $BASE/api/revolving
echo -e "\n"