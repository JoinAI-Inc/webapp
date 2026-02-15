# API测试用例文档

## 测试环境准备

### 1. 确保API服务运行
```bash
cd /Users/racoon/Documents/join/team 14/webapp
turbo run dev
```

### 2. 准备测试数据

#### 创建测试Feature
```sql
-- 在数据库中执行
INSERT INTO features (feature_key, app_id, name, description, updated_at)
VALUES ('bacc_hanfu_generation', 1, '汉服照片生成', '使用AI生成汉服形象照片', CURRENT_TIMESTAMP)
ON CONFLICT (feature_key) DO NOTHING;
```

#### 创建测试用户余额
```sql
-- 给测试用户添加5次余额
INSERT INTO user_feature_balances (
  user_id, 
  feature_id, 
  remaining_count, 
  total_purchased, 
  total_used,
  updated_at
)
SELECT 
  'cmlhmd3yi0000ffakvkg8gwm8',  -- 替换为实际用户ID
  id,
  5,
  5,
  0,
  CURRENT_TIMESTAMP
FROM features
WHERE feature_key = 'bacc_hanfu_generation'
ON CONFLICT (user_id, feature_id) DO UPDATE
SET remaining_count = 5, total_purchased = 5;
```

---

## 测试用例

### 测试1: 获取所有Feature
```bash
curl -s http://localhost:3001/api/features | python3 -m json.tool
```

**预期结果:**
```json
[
  {
    "id": "2",
    "featureKey": "bacc_hanfu_generation",
    "name": "汉服照片生成",
    "isActive": true,
    ...
  }
]
```

---

### 测试2: 获取用户余额
```bash
USER_ID="cmlhmd3yi0000ffakvkg8gwm8"
curl -s "http://localhost:3001/api/usage/balance/$USER_ID" | python3 -m json.tool
```

**预期结果:**
```json
[
  {
    "id": "1",
    "userId": "cmlhmd3yi0000ffakvkg8gwm8",
    "featureId": "2",
    "remainingCount": 5,
    "totalPurchased": 5,
    "totalUsed": 0,
    "feature": {
      "id": "2",
      "featureKey": "bacc_hanfu_generation",
      "name": "汉服照片生成"
    }
  }
]
```

---

### 测试3: 检查权限（有订阅）
```bash
curl -s -X POST http://localhost:3001/api/usage/check-access \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "cmlhmd3yi0000ffakvkg8gwm8",
    "featureKey": "bacc_hanfu_generation"
  }' | python3 -m json.tool
```

**预期结果（有订阅）:**
```json
{
  "hasAccess": true,
  "source": "SUBSCRIPTION",
  "unlimited": true
}
```

**预期结果（无订阅但有次数）:**
```json
{
  "hasAccess": true,
  "source": "USAGE_PACK",
  "remainingCount": 5
}
```

**预期结果（无权限）:**
```json
{
  "hasAccess": false,
  "source": null
}
```

---

### 测试4: 消费次数（手动测试）
```bash
curl -s -X POST http://localhost:3001/api/usage/consume \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "cmlhmd3yi0000ffakvkg8gwm8",
    "featureKey": "bacc_hanfu_generation",
    "usedCount": 1,
    "metadata": {
      "imageId": "test-123",
      "action": "manual_test"
    }
  }' | python3 -m json.tool
```

**预期结果:**
```json
{
  "success": true,
  "remainingCount": 4,
  "usedCount": 1,
  "logId": "1"
}
```

---

### 测试5: 再次查询余额（验证扣减）
```bash
USER_ID="cmlhmd3yi0000ffakvkg8gwm8"
curl -s "http://localhost:3001/api/usage/balance/$USER_ID" | python3 -m json.tool
```

**预期结果:**
```json
[
  {
    "remainingCount": 4,  // 应该减少1
    "totalUsed": 1,       // 应该增加1
    ...
  }
]
```

---

### 测试6: 查询使用日志
```bash
USER_ID="cmlhmd3yi0000ffakvkg8gwm8"
curl -s "http://localhost:3001/api/usage/logs/$USER_ID?limit=5" | python3 -m json.tool
```

**预期结果:**
```json
[
  {
    "id": "1",
    "userId": "cmlhmd3yi0000ffakvkg8gwm8",
    "featureId": "2",
    "sourceType": "USAGE_PACK",
    "usedCount": 1,
    "metadata": {
      "imageId": "test-123",
      "action": "manual_test"
    },
    "createdAt": "2026-02-15T02:13:00.000Z",
    "feature": {
      "featureKey": "bacc_hanfu_generation",
      "name": "汉服照片生成"
    }
  }
]
```

---

## 边界测试

### 测试7: 余额不足时消费
```bash
# 先手动将余额设为0
# 然后尝试消费
curl -s -X POST http://localhost:3001/api/usage/consume \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "cmlhmd3yi0000ffakvkg8gwm8",
    "featureKey": "bacc_hanfu_generation",
    "usedCount": 1
  }'
```

**预期结果:**
```json
{
  "error": "Insufficient balance"
}
```

---

### 测试8: 不存在的Feature
```bash
curl -s -X POST http://localhost:3001/api/usage/check-access \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "cmlhmd3yi0000ffakvkg8gwm8",
    "featureKey": "non_existent_feature"
  }' | python3 -m json.tool
```

**预期结果:**
```json
{
  "hasAccess": false,
  "source": null
}
```

---

## 并发测试

### 测试9: 并发消费（验证事务）
```bash
# 同时发起5个消费请求
for i in {1..5}; do
  curl -s -X POST http://localhost:3001/api/usage/consume \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "cmlhmd3yi0000ffakvkg8gwm8",
      "featureKey": "bacc_hanfu_generation",
      "usedCount": 1
    }' &
done
wait

# 查询余额，应该准确扣减5次，不会超扣
curl -s "http://localhost:3001/api/usage/balance/$USER_ID"
```

---

## 快速测试命令

### 一键运行所有测试
```bash
./test-usage-api.sh
```

### 重置测试数据
```sql
-- 重置用户余额为5次
UPDATE user_feature_balances
SET remaining_count = 5, total_used = 0, total_purchased = 5
WHERE user_id = 'cmlhmd3yi0000ffakvkg8gwm8';

-- 清空使用日志
DELETE FROM usage_logs
WHERE user_id = 'cmlhmd3yi0000ffakvkg8gwm8';
```

---

## 检查清单

- [ ] Feature API返回正确
- [ ] Balance API返回正确
- [ ] check-access逻辑正确（订阅优先）
- [ ] consume扣减正确
- [ ] 余额不足时报错
- [ ] 日志记录正确
- [ ] 并发安全（无超扣）
- [ ] 错误处理完善
