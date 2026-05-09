#!/bin/bash
# テストデータクリーンアップスクリプト
# Notion API で作成したテストレコードをアーカイブ（削除）する

NOTION_TOKEN="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"
NOTION_VERSION="2022-06-28"

archive_page() {
  local page_id="$1"
  local name="$2"
  echo "削除中: $name ($page_id)"
  curl -s -X PATCH "https://api.notion.com/v1/pages/$page_id" \
    -H "Authorization: Bearer $NOTION_TOKEN" \
    -H "Notion-Version: $NOTION_VERSION" \
    -H "Content-Type: application/json" \
    -d '{"archived": true}' | jq -r '.archived // .message'
}

echo "=========================================="
echo "テストデータ クリーンアップ"
echo "=========================================="

archive_page "35b9e032-4474-81f9-a136-c7416aea3f22"    "テスト現金（支払方法）"
archive_page "35b9e032-4474-8139-8b50-f8337de514d6"   "テストカード（支払方法）"
archive_page "35b9e032-4474-81c5-9e49-dd192a169fa9"      "テスト銀行A（口座）"
archive_page "35b9e032-4474-8190-b95e-d488ca79b150"      "テスト銀行B（口座）"
archive_page "35b9e032-4474-813e-8484-e30d41a131b1" "テスト外食（カテゴリ）"
archive_page "35b9e032-4474-81e6-bf13-cb888a8479d8"  "テスト給与（カテゴリ）"
archive_page "35b9e032-4474-8173-b756-cdadf9ed945b"     "テスト家賃（固定費）"
archive_page "35b9e032-4474-8135-a013-f86430a19a6b"    "テスト貯金目標（目標貯金）"

echo ""
echo "✅ クリーンアップ完了（Notionでアーカイブされました）"
