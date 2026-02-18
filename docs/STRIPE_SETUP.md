# Stripe支付集成环境配置

## 环境变量配置

在 `apps/api/.env` 中添加以下配置：

```bash
# ===================
# Stripe配置
# ===================

# Stripe测试密钥
STRIPE_SECRET_KEY=sk_test_51xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx

# Stripe Webhook密钥
# 从Stripe Dashboard → Developers → Webhooks获取
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# ===================
# 应用URL配置
# ===================

# 前端应用URL（用于支付成功/取消回调）
APP_URL=http://localhost:3000

# API服务URL
API_URL=http://localhost:3001

# ===================
# 已有配置保持不变
# ===================

# 数据库连接
DATABASE_URL="postgresql://user:password@localhost:5432/webapp"

# 管理员密钥
ADMIN_SECRET=your-secret-key

# OAuth配置
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
DISCORD_CLIENT_ID=xxx
DISCORD_CLIENT_SECRET=xxx
```

## Stripe Dashboard配置步骤

### 1. 获取API密钥

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com)
2. 切换到**测试模式**（右上角开关）
3. 进入 **Developers** → **API keys**
4. 复制以下密钥：
   - `Publishable key` → `STRIPE_PUBLISHABLE_KEY`
   - `Secret key` → `STRIPE_SECRET_KEY`

### 2. 配置Webhook

1. 进入 **Developers** → **Webhooks**
2. 点击 **Add endpoint**
3. 配置：
   - **Endpoint URL**: `http://localhost:3001/api/payment/webhook` (本地测试)
     - 生产环境: `https://your-api-domain.com/api/payment/webhook`
   - **Events to send**: 选择以下事件
     - ✅ `checkout.session.completed`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
4. 点击 **Add endpoint**
5. 点击创建好的endpoint，查看 **Signing secret**
6. 复制signing secret → `STRIPE_WEBHOOK_SECRET`

### 3. 创建测试产品

#### 方式1: 通过Dashboard创建

1. 进入 **Products**
2. 点击 **Add product**
3. 填写信息：
   - Name: `Premium Subscription` 或 `Basic Plan`
   - Description: 描述信息
4. 添加价格：
   - **订阅**: 选择 Recurring, 设置金额和周期（月/年）
   - **一次性**: 选择 One time, 设置金额
5. 创建后，记录：
   - Product ID: `prod_xxxxx`
   - Price ID: `price_xxxxx`

#### 方式2: 通过API同步

在admin面板中调用API自动同步：
```bash
POST http://localhost:3001/api/admin/stripe/sync-products
Authorization: Bearer your-admin-secret
```

## 本地测试Webhook

### 使用Stripe CLI

1. **安装Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # 或下载: https://stripe.com/docs/stripe-cli
   ```

2. **登录**:
   ```bash
   stripe login
   ```

3. **监听Webhook**:
   ```bash
   stripe listen --forward-to localhost:3001/api/payment/webhook
   ```
   
   这会输出一个webhook signing secret，将其添加到 `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

4. **触发测试事件**:
   ```bash
   # 测试checkout完成
   stripe trigger checkout.session.completed
   
   # 测试订阅支付成功
   stripe trigger invoice.payment_succeeded
   
   # 测试订阅取消
   stripe trigger customer.subscription.deleted
   ```

## 测试支付流程

### 1. 创建支付会话

```bash
curl -X POST http://localhost:3001/api/payment/create-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "1",
    "pricingPlanId": "1",
    "successUrl": "http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}",
    "cancelUrl": "http://localhost:3000/payment/cancel"
  }'
```

响应：
```json
{
  "sessionId": "cs_test_xxxxx",
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxxxx",
  "orderId": "123"
}
```

### 2. 使用测试卡号

在Stripe Checkout页面使用以下测试卡号：

- **成功支付**: `4242 4242 4242 4242`
- **需要3D验证**: `4000 0027 6000 3184`
- **支付失败**: `4000 0000 0000 0002`

其他信息随意填写（邮箱、日期、CVC等）

### 3. 同步支付结果

```bash
curl -X POST http://localhost:3001/api/payment/sync-session \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "cs_test_xxxxx"
  }'
```

## API测试清单

- [  ] 创建checkout session (一次性购买)
- [ ] 创建checkout session (订阅)
- [ ] 完成支付并同步结果
- [ ] 验证Order状态更新为PAID
- [ ] 验证UserEntitlement已创建
- [ ] 取消订阅
- [ ] 恢复订阅
- [ ] Webhook: checkout.session.completed
- [ ] Webhook: invoice.payment_succeeded
- [ ] Webhook: customer.subscription.deleted
- [ ] 同步Stripe产品
- [ ] 对账检查
- [ ] 修复数据不一致

## 常见问题

### Q: Webhook签名验证失败？
A: 确保 `STRIPE_WEBHOOK_SECRET` 正确配置。本地测试时使用 `stripe listen` 提供的密钥。

### Q: 支付成功但Order状态没更新？
A: 
1. 检查webhook是否正常接收（查看日志）
2. 手动调用 `POST /api/payment/sync-session`
3. 使用对账工具: `GET /api/admin/stripe/reconcile`

### Q: 找不到Product/Price ID？
A: 使用 `POST /api/admin/stripe/sync-products` 自动同步

### Q: TypeScript类型错误？
A: 类型扩展文件 `types.d.ts` 已处理Stripe SDK类型问题，可忽略IDE警告

## 生产环境部署

1. **切换到生产模式密钥**
   - 在Stripe Dashboard关闭测试模式
   - 获取生产环境的密钥
   - 更新环境变量

2. **配置生产Webhook**
   - URL使用实际域名
   - SSL证书必须有效
   - 确保防火墙允许Stripe IP

3. **验证配置**
   ```bash
   # 检查环境变量
   echo $STRIPE_SECRET_KEY
   
   # 测试API连接
   curl http://your-api-domain.com/health
   ```

## 监控和日志

- Webhook事件在控制台有详细日志
- 可在Stripe Dashboard查看Webhook delivery状态
- 定期运行对账: `GET /api/admin/stripe/reconcile`
