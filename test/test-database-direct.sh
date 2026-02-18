#!/bin/bash
# 直接测试数据库 - 绕过API测试业务逻辑
# 使用方法: ./test-database-direct.sh

echo "========================================="
echo "数据库直接测试 - 次数包功能"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 数据库连接信息
DB_CONTAINER="webapp-postgres"
DB_USER="postgres"
DB_NAME="webapp"

sql_exec() {
  local query=$1
  docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "$query"
}

echo -e"${BLUE}步骤1: 查看现有用户${NC}"
echo "执行: SELECT id, email, name FROM users LIMIT 5;"
sql_exec "SELECT id, email, name FROM users ORDER BY created_at DESC LIMIT 5;"
echo ""

read -p "请输入您的USER_ID: " USER_ID
echo ""

echo -e "${BLUE}步骤2: 查看BACC应用ID${NC}"
sql_exec "SELECT id, app_key, name FROM apps WHERE app_key = 'bacc' OR name LIKE '%bacc%';"
echo ""

read -p "请输入BACC的APP_ID (通常是1): " APP_ID
APP_ID=${APP_ID:-1}
echo ""

echo -e "${BLUE}步骤3: 检查/创建测试Feature${NC}"
sql_exec "
INSERT INTO features (feature_key, app_id, name, description, is_active, updated_at)
VALUES (
  'bacc_hanfu_generation',
  $APP_ID,
  '汉服照片生成',
  '使用AI生成汉服形象照片',
  true,
  CURRENT_TIMESTAMP
)
ON CONFLICT (feature_key) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP
RETURNING id, feature_key, name;
"
echo ""

echo -e "${BLUE}步骤4: 为用户添加10次余额${NC}"
sql_exec "
INSERT INTO user_feature_balances (
  user_id,
  feature_id,
  remaining_count,
  total_purchased,
  total_used,
  updated_at
)
SELECT
  '$USER_ID',
  id,
  10,
  10,
  0,
  CURRENT_TIMESTAMP
FROM features
WHERE feature_key = 'bacc_hanfu_generation'
ON CONFLICT (user_id, feature_id) DO UPDATE
SET remaining_count = 10,
    total_purchased = 10,
    total_used = 0,
    updated_at = CURRENT_TIMESTAMP
RETURNING id, user_id, remaining_count, total_purchased, total_used;
"
echo ""

echo -e "${GREEN}✓ 测试数据准备完成${NC}"
echo ""

echo -e "${BLUE}步骤5: 验证数据${NC}"
sql_exec "
SELECT
  ufb.id,
  ufb.user_id,
  ufb.remaining_count,
  ufb.total_purchased,
  ufb.total_used,
  f.feature_key,
  f.name as feature_name
FROM user_feature_balances ufb
JOIN features f ON ufb.feature_id = f.id
WHERE ufb.user_id = '$USER_ID';
"
echo ""

echo -e "${BLUE}步骤6: 测试消费逻辑（模拟）${NC}"
read -p "是否模拟消费1次？[y/N]: " confirm
if [[ $confirm == [yY] ]]; then
  echo "执行消费..."
  sql_exec "
  WITH feature AS (
    SELECT id FROM features WHERE feature_key = 'bacc_hanfu_generation'
  ),
  updated_balance AS (
    UPDATE user_feature_balances
    SET remaining_count = remaining_count - 1,
        total_used = total_used + 1,
        last_used_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = '$USER_ID'
      AND feature_id = (SELECT id FROM feature)
      AND remaining_count > 0
    RETURNING id, remaining_count, total_used
  ),
  log AS (
    INSERT INTO usage_logs (user_id, feature_id, source_type, used_count, metadata)
    SELECT
      '$USER_ID',
      (SELECT id FROM feature),
      'USAGE_PACK',
      1,
      '{\"test\": true, \"simulated\": true}'
    RETURNING id, created_at
  )
  SELECT
    ub.remaining_count,
    ub.total_used,
    l.id as log_id,
    l.created_at
  FROM updated_balance ub, log l;
  "
  echo ""
  
  echo -e "${GREEN}✓ 消费成功，查看最新余额：${NC}"
  sql_exec "
  SELECT
    remaining_count,
    total_purchased,
    total_used,
    last_used_at
  FROM user_feature_balances ufb
  JOIN features f ON ufb.feature_id = f.id
  WHERE ufb.user_id = '$USER_ID'
    AND f.feature_key = 'bacc_hanfu_generation';
  "
fi

echo ""
echo "========================================="
echo "测试完成"
echo "========================================="
echo ""
echo "现在您可以："
echo "1. 登录BACC应用查看UI显示"
echo "2. 测试实际生成功能（如果已集成）"
echo "3. 在admin后台购买次数包测试"
