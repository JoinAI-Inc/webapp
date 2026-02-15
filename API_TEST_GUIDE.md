# API测试指南（Google OAuth用户）

## 方案1: 使用浏览器Token测试（推荐）

### 步骤1: 获取JWT Token

1. **登录BACC应用**
   ```
   http://localhost:3000
   ```

2. **打开浏览器开发者工具**
   - Chrome/Edge: 按 `F12` 或 `Cmd+Option+I` (Mac)
   - Firefox: 按 `F12` 或 `Cmd+Option+K` (Mac)

3. **在Console标签中执行以下命令之一：**

   **方法A - 从localStorage获取:**
   ```javascript
   localStorage.getItem('token')
   ```
   
   **方法B - 从sessionStorage获取:**
   ```javascript
   sessionStorage.getItem('token')
   ```
   
   **方法C - 查看所有cookie:**
   ```javascript
   document.cookie
   ```
   
   **方法D - 从网络请求中查看:**
   - 切换到 "Network" 标签
   - 刷新页面
   - 点击任何API请求
   - 查看 "Headers" → "Authorization" 字段

4. **复制token**（包括 `Bearer` 之后的部分）

### 步骤2: 获取User ID

**方法A - 从浏览器:**
```javascript
// 如果用户信息存在localStorage
JSON.parse(localStorage.getItem('user')).id

// 或从sessionStorage
JSON.parse(sessionStorage.getItem('user')).id
```

**方法B - 从数据库查询:**
```bash
docker exec webapp-postgres psql -U postgres -d webapp -c \
  "SELECT id, email, name FROM users ORDER BY created_at DESC LIMIT 5;"
```

### 步骤3: 运行测试

```bash
# 使用token和user_id
./test-usage-api-token.sh 'YOUR_JWT_TOKEN' 'YOUR_USER_ID'

# 或只提供token（某些测试需要user_id）
./test-usage-api-token.sh 'YOUR_JWT_TOKEN'
```

**示例:**
```bash
./test-usage-api-token.sh 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWxobWQzeWkw...' 'cmlhmd3yi0000ffakvkg8gwm8'
```

---

## 方案2: 使用Postman测试

### 导入到Postman

1. **创建Collection: "Usage API Tests"**

2. **设置环境变量:**
   - `API_URL`: `http://localhost:3001`
   - `JWT_TOKEN`: `your_token_here`
   - `USER_ID`: `your_user_id`

3. **创建请求:**

#### 请求1: 获取用户余额
```
GET {{API_URL}}/api/usage/balance/{{USER_ID}}
Headers:
  Authorization: Bearer {{JWT_TOKEN}}
  Content-Type: application/json
```

#### 请求2: 检查权限
```
POST {{API_URL}}/api/usage/check-access
Headers:
  Authorization: Bearer {{JWT_TOKEN}}
  Content-Type: application/json
Body (raw JSON):
{
  "userId": "{{USER_ID}}",
  "featureKey": "bacc_hanfu_generation"
}
```

#### 请求3: 消费次数
```
POST {{API_URL}}/api/usage/consume
Headers:
  Authorization: Bearer {{JWT_TOKEN}}
  Content-Type: application/json
Body (raw JSON):
{
  "userId": "{{USER_ID}}",
  "featureKey": "bacc_hanfu_generation",
  "usedCount": 1,
  "metadata": {
    "test": true
  }
}
```

---

## 方案3: 准备测试数据

### 创建测试Feature和余额

```sql
-- 1. 查看现有features
SELECT id, feature_key, name FROM features;

-- 2. 如果不存在，创建feature
INSERT INTO features (feature_key, app_id, name, description, is_active, updated_at)
VALUES (
  'bacc_hanfu_generation',
  1,  -- BACC的app_id
  '汉服照片生成',
  '使用AI生成汉服形象照片',
  true,
  CURRENT_TIMESTAMP
)
ON CONFLICT (feature_key) DO NOTHING;

-- 3. 为您的用户添加余额
INSERT INTO user_feature_balances (
  user_id,
  feature_id,
  remaining_count,
  total_purchased,
  total_used,
  updated_at
)
SELECT 
  'YOUR_USER_ID',  -- 替换为您的user_id
  id,
  10,  -- 初始10次
  10,
  0,
  CURRENT_TIMESTAMP
FROM features
WHERE feature_key = 'bacc_hanfu_generation'
ON CONFLICT (user_id, feature_id) DO UPDATE
SET remaining_count = 10,
    total_purchased = 10,
    total_used = 0;

-- 4. 验证数据
SELECT 
  ufb.remaining_count,
  ufb.total_purchased,
  ufb.total_used,
  f.feature_key,
  f.name
FROM user_feature_balances ufb
JOIN features f ON ufb.feature_id = f.id
WHERE ufb.user_id = 'YOUR_USER_ID';
```

---

## 预期测试结果

### ✅ 成功的响应

**获取余额:**
```json
[
  {
    "id": "1",
    "userId": "cmlhmd3yi0000ffakvkg8gwm8",
    "remainingCount": 10,
    "totalPurchased": 10,
    "totalUsed": 0,
    "feature": {
      "featureKey": "bacc_hanfu_generation",
      "name": "汉服照片生成"
    }
  }
]
```

**检查权限（有次数）:**
```json
{
  "hasAccess": true,
  "source": "USAGE_PACK",
  "remainingCount": 10
}
```

**检查权限（有订阅）:**
```json
{
  "hasAccess": true,
  "source": "SUBSCRIPTION",
  "unlimited": true
}
```

**消费次数成功:**
```json
{
  "success": true,
  "remainingCount": 9,
  "usedCount": 1,
  "logId": "1"
}
```

### ❌ 错误响应

**未授权:**
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authorization header"
}
```

**余额不足:**
```json
{
  "error": "Insufficient balance"
}
```

**无权限:**
```json
{
  "hasAccess": false,
  "source": null
}
```

---

## 快速检查清单

测试前确认：
- [ ] BACC应用已登录
- [ ] API服务已启动（turbo run dev）
- [ ] 数据库有测试数据
- [ ] 已获取JWT token
- [ ] 已获取user_id
- [ ] token未过期

测试验证：
- [ ] 余额查询成功
- [ ] check-access返回正确
- [ ] consume扣减成功
- [ ] 余额数字正确减少
- [ ] 日志记录正确
