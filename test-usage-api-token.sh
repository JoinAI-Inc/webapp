#!/bin/bash
# API测试脚本 - 使用现有token
# 使用方法: ./test-usage-api-token.sh <JWT_TOKEN> [USER_ID]

API_URL="http://localhost:3001"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================="
echo "次数包功能 API 测试（使用Token）"
echo "========================================="
echo ""

# 检查token参数
if [ $# -lt 1 ]; then
  echo -e "${RED}用法: $0 <JWT_TOKEN> [USER_ID]${NC}"
  echo ""
  echo "获取Token方法："
  echo "1. 登录BACC应用"
  echo "2. 打开浏览器开发者工具 (F12)"
  echo "3. 在Console中执行:"
  echo "   localStorage.getItem('token')"
  echo "   或"
  echo "   document.cookie"
  echo ""
  echo "示例:"
  echo "  $0 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'"
  echo "  $0 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 'user_id_123'"
  exit 1
fi

TOKEN=$1
USER_ID=${2:-""}

echo -e "${BLUE}使用Token: ${TOKEN:0:30}...${NC}"

# 如果没有提供USER_ID，尝试从token解析
if [ -z "$USER_ID" ]; then
  echo -e "${YELLOW}未提供USER_ID，将从API响应中获取${NC}"
  echo ""
fi

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
  formatted=$(echo "$response" | python3 -m json.tool 2>/dev/null)
  if [ $? -eq 0 ]; then
    echo "$formatted"
  else
    echo "$response"
  fi
  
  # 检查是否成功
  if echo "$response" | grep -q '"error"'; then
    echo -e "${RED}✗ 测试失败${NC}"
    return 1
  else
    echo -e "${GREEN}✓ 测试成功${NC}"
    
    # 如果是第一个API且没有USER_ID，尝试提取
    if [ -z "$USER_ID" ] && echo "$response" | grep -q '"userId"'; then
      USER_ID=$(echo "$response" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data[0].get('userId', '') if isinstance(data, list) and len(data) > 0 else '')" 2>/dev/null)
      if [ -n "$USER_ID" ]; then
        echo -e "${GREEN}检测到 USER_ID: $USER_ID${NC}"
      fi
    fi
    
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

# 1. 测试获取用户余额（如果有USER_ID）
if [ -n "$USER_ID" ]; then
  test_api \
    "获取用户余额" \
    "GET" \
    "/api/usage/balance/$USER_ID"
  
  # 2. 测试获取特定功能的余额
  test_api \
    "获取特定功能余额" \
    "GET" \
    "/api/usage/balance/$USER_ID/$FEATURE_KEY"
  
  # 3. 测试权限检查
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
  
  # 5. 测试消费次数（可选）
  echo ""
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
else
  echo -e "${YELLOW}请提供USER_ID以继续测试${NC}"
  echo "方法1: 重新运行脚本并提供USER_ID"
  echo "  $0 '$TOKEN' 'your_user_id'"
  echo ""
  echo "方法2: 查询数据库"
  echo "  SELECT id, email FROM users LIMIT 5;"
fi

echo ""
echo "========================================="
echo "测试完成"
echo "========================================="
