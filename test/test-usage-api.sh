#!/bin/bash
# API测试脚本 - 次数包功能
# 使用方法: ./test-usage-api.sh

API_URL="http://localhost:3001"
USER_ID="cmlhmd3yi0000ffakvkg8gwm8"  # 替换为实际的测试用户ID
FEATURE_KEY="bacc_hanfu_generation"

echo "========================================="
echo "次数包功能 API 测试"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试函数
test_api() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  
  echo -e "${YELLOW}测试: $name${NC}"
  echo "请求: $method $endpoint"
  
  if [ -n "$data" ]; then
    echo "数据: $data"
    response=$(curl -s -X $method "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  else
    response=$(curl -s -X $method "$API_URL$endpoint" \
      -H "Content-Type: application/json")
  fi
  
  echo "响应:"
  echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
  
  # 检查是否成功
  if echo "$response" | grep -q '"error"'; then
    echo -e "${RED}✗ 测试失败${NC}"
  else
    echo -e "${GREEN}✓ 测试成功${NC}"
  fi
  
  echo ""
  echo "-----------------------------------------"
  echo ""
}

# 1. 测试获取所有Feature
test_api \
  "获取所有功能点" \
  "GET" \
  "/api/features"

# 2. 测试获取用户余额
test_api \
  "获取用户余额" \
  "GET" \
  "/api/usage/balance/$USER_ID"

# 3. 测试获取特定功能的余额
test_api \
  "获取特定功能余额" \
  "GET" \
  "/api/usage/balance/$USER_ID/$FEATURE_KEY"

# 4. 测试权限检查（check-access）
test_api \
  "检查用户权限" \
  "POST" \
  "/api/usage/check-access" \
  '{
    "userId": "'"$USER_ID"'",
    "featureKey": "'"$FEATURE_KEY"'"
  }'

# 5. 测试获取使用日志
test_api \
  "获取使用日志" \
  "GET" \
  "/api/usage/logs/$USER_ID?limit=5"

echo "========================================="
echo "测试完成"
echo "========================================="
