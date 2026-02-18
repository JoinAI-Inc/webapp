-- 次数包功能测试数据准备脚本
-- 在psql或数据库工具中执行

-- ========================================
-- 1. 检查现有Feature
-- ========================================
SELECT id, feature_key, name, is_active 
FROM features;

-- ========================================
-- 2. 创建测试Feature（如果不存在）
-- ========================================
-- 注意：需要先知道app_id，通常BACC的app_id是确定的
INSERT INTO features (feature_key, app_id, name, description, is_active, updated_at)
VALUES (
  'bacc_hanfu_generation', 
  1,  -- 替换为实际的BACC app_id
  '汉服照片生成',
  '使用AI生成汉服形象照片',
  true,
  CURRENT_TIMESTAMP
)
ON CONFLICT (feature_key) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- ========================================
-- 3. 查看测试用户
-- ========================================
SELECT id, email, name 
FROM users 
LIMIT 5;

-- ========================================
-- 4. 为测试用户创建余额（替换user_id）
-- ========================================
-- 方法1：直接插入
INSERT INTO user_feature_balances (
  user_id, 
  feature_id, 
  remaining_count, 
  total_purchased, 
  total_used,
  updated_at
)
SELECT 
  'YOUR_USER_ID_HERE',  -- 替换为实际用户ID
  f.id,
  5,
  5,
  0,
  CURRENT_TIMESTAMP
FROM features f
WHERE f.feature_key = 'bacc_hanfu_generation'
ON CONFLICT (user_id, feature_id) DO UPDATE
SET remaining_count = 5, 
    total_purchased = 5, 
    total_used = 0,
    updated_at = CURRENT_TIMESTAMP;

-- 方法2：使用具体feature_id
-- 先查询feature_id
SELECT id FROM features WHERE feature_key = 'bacc_hanfu_generation';

-- 然后插入
INSERT INTO user_feature_balances (
  user_id, 
  feature_id, 
  remaining_count, 
  total_purchased, 
  total_used,
  updated_at
)
VALUES (
  'YOUR_USER_ID_HERE',
  2,  -- 替换为上面查到的feature_id
  10,  -- 初始10次
  10,
  0,
  CURRENT_TIMESTAMP
)
ON CONFLICT (user_id, feature_id) DO UPDATE
SET remaining_count = 10, 
    total_purchased = 10,
    updated_at = CURRENT_TIMESTAMP;

-- ========================================
-- 5. 验证数据是否创建成功
-- ========================================
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
WHERE ufb.user_id = 'YOUR_USER_ID_HERE';

-- ========================================
-- 6. 清理测试数据（如需要）
-- ========================================
-- 清空特定用户的余额
DELETE FROM user_feature_balances
WHERE user_id = 'YOUR_USER_ID_HERE';

-- 清空特定用户的使用日志
DELETE FROM usage_logs
WHERE user_id = 'YOUR_USER_ID_HERE';

-- ========================================
-- 7. 重置测试余额
-- ========================================
UPDATE user_feature_balances
SET remaining_count = 10,
    total_used = 0,
    total_purchased = 10,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'YOUR_USER_ID_HERE';
