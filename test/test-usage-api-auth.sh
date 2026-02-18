#!/bin/bash
# API测试脚本 - 次数包功能（带认证）
# 使用方法: ./test-usage-api-auth.sh <email> <password>

API_URL="http://localhost:3001"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================="
echo "次数包功能 API 测试（带认证）"
echo "========================================="
echo ""

# 检查参数
if [ $# -lt 2 ]; then
  echo -e "${RED}用法: $0 <email> <password>${NC}"
  echo "示例: $0 test@example.com password123"
  exit 1
fi

EMAIL=$1
PASSWORD=$2

echo -e "${BLUE}步骤1: 登录获取token${NC}"
echo "邮箱: $EMAIL"

# 登录获取JWT token
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "登录响应:"
echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"

# 提取token和userId
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
USER_ID=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('user', {}).get('id', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ 登录失败，无法获取token${NC}"
  exit 1
fi

echo -e "${GREEN}✓ 登录成功${NC}"
echo "User ID: $USER_ID"
echo "Token: ${TOKEN:0:20}..."
echo ""

FEATURE_KEY="bacc_hanfu_generation"

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
      -H "Authorization: Bearer $TOKEN" \
      -d "$data")
  else
    response=$(curl -s -X $method "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN")
  fi
  
  echo "响应:"
  echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
  
  # 检查是否成功
  if echo "$response" | grep -q '"error"'; then
    echo -e "${RED}✗ 测试失败${NC}"
    return 1
  else
    echo -e "${GREEN}✓ 测试成功${NC}"
    return 0
  fi
  
  echo ""
  echo "-----------------------------------------"
  echo ""
}

echo "========================================="
echo "开始API测试"
echo "========================================="
echo ""

# 1. 测试获取用户余额
test_api \
  "获取用户余额" \
  "GET" \
  "/api/usage/balance/$USER_ID"

# 2. 测试获取特定功能的余额
test_api \
  "获取特定功能余额" \
  "GET" \
  "/api/usage/balance/$USER_ID/$FEATURE_KEY"

# 3. 测试权限检查（check-access）
test_api \
  "检查用户权限" \
  "POST" \
  "/api/usage/check-access" \
  "{
    \"userId\": \"$USER_ID\",
    \"featureKey\": \"$FEATURE_KEY\"
  }"

# 4. 测试获取使用日志
test_api \
  "获取使用日志" \
  "GET" \
  "/api/usage/logs/$USER_ID?limit=5"

# 5. 测试消费次数（可选，会实际扣减）
read -p "是否测试消费次数？(会实际扣减余额) [y/N]: " confirm
if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
  test_api \
    "消费1次" \
    "POST" \
    "/api/usage/consume" \
    "{
      \"userId\": \"$USER_ID\",
      \"featureKey\": \"$FEATURE_KEY\",
      \"usedCount\": 1,
      \"metadata\": {
        \"test\": true,
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
      }
    }"
  
  # 再次查询余额验证扣减
  echo ""
  test_api \
    "验证余额扣减" \
    "GET" \
    "/api/usage/balance/$USER_ID/$FEATURE_KEY"
fi

echo ""
echo "========================================="
echo "测试完成"
echo "========================================="
