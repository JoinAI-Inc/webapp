# 🚀 Stripe 订阅支付系统

基于 Stripe 和 Cloudflare Workers 的完整订阅支付解决方案，支持订阅和一次性购买。

## ✨ 功能特性

- ✅ 订阅支付（月度/年度）
- ✅ 一次性购买
- ✅ 订阅管理（查看、取消、恢复）
- ✅ 支付方式更新
- ✅ **实时数据读取**（默认直接从 Stripe API 获取最新数据）
- ✅ **完整数据串联**（自动获取订阅 + 发票 + 支付金额）
- ✅ **清晰数据分类**（订阅和一次性购买独立统计，不混淆）
- ✅ **详细用户视图**（专门的用户详情页面，显示所有订阅和购买记录）
- ✅ **智能用户识别**（自动识别 Stripe Customer ID，无缝关联已有客户）
- ✅ **智能分页**（支持大量用户场景，可自定义每页数量）
- ✅ **并行加载**（使用 Promise.all 提升性能）
- ✅ **智能数据源切换**（Admin 面板可选择实时模式或缓存模式）
- ✅ **前端主动同步**（支付成功后立即同步，无需等待 webhook）
- ✅ **零配置启动**（无需运行 stripe listen，开箱即用）
- ✅ 动态价格配置（无需重新部署）
- ✅ 现代化 Admin 管理面板

## 🏗️ 架构设计

### 实时读取 vs 缓存

本系统采用 **"实时优先，缓存备用"** 的架构：

✅ **我们的方案：**
- **默认实时读取**：所有数据直接从 Stripe API 实时获取（推荐）
- **可选缓存模式**：Admin 面板提供切换选项，可从 KV 缓存快速读取
- **前端主动同步**：支付成功页面自动调用 `/api/sync-session` 同步数据
- **Webhook 作为备用**：仅用作辅助同步机制

### 为什么不依赖缓存和 Webhook？

❌ **传统方式的问题：**
- Webhook 可能失败或延迟
- 缓存数据可能过期
- 需要手动点击"同步"按钮
- 本地开发需要额外运行 `stripe listen`
- 用户体验差（数据不准确、需要等待同步）

✅ **实时读取的优势：**
- 🚀 数据永远是最新的
- 💪 无需担心同步问题
- 🎯 代码更简单、更可靠
- ⚡ Stripe API 性能很好，延迟可接受（通常 200-500ms）
- 🛡️ 不依赖 webhook 配置

### 数据流程

```
【订阅查询】
访问 Admin 或测试页面 → /api/subscription/:userId → 实时从 Stripe API 查询 → 返回最新数据

【用户列表（实时模式）】
Admin 面板加载 
→ /api/admin/users?source=stripe&page=1&pageSize=20
→ 并行获取：
   ├─ stripe.customers.list()          // 获取客户列表
   ├─ stripe.subscriptions.list()      // 获取订阅信息（每个客户）
   ├─ stripe.invoices.list()           // 获取发票（订阅支付）
   └─ stripe.charges.list()            // 获取所有支付记录（包括一次性购买）
→ 智能分类：
   ├─ 订阅支付（有订阅 ID 的发票）
   └─ 一次性购买（没有发票的 Charges + 手动发票）
→ 计算总支付金额
→ 返回完整数据

【支付流程】
支付成功 → success.html 自动调用 /api/sync-session → 从 Stripe 获取订阅 → 保存到 KV（可选）
```

### 数据完整性与分类

系统会自动串联以下 Stripe 数据，并清晰分类：

**1. 订阅（Subscriptions）**
- 活跃订阅数量
- 订阅状态、套餐、周期
- 订阅相关的发票

**2. 一次性购买（One-time Purchases）**
- 一次性购买数量
- 购买记录和金额
- 手动创建的发票（无订阅关联）

**3. 总支付金额**
- 自动计算所有已支付的金额
- 包括订阅支付和一次性购买

**4. 智能识别逻辑**
```javascript
// 订阅相关发票
invoices.filter(inv => inv.subscription !== null)

// 一次性购买（两种来源）
// 1. 直接支付（Payment Intent/Charge，没有发票）
charges.filter(charge => 
  charge.paid && 
  !charge.refunded && 
  !charge.invoice
)

// 2. 手动发票（没有订阅）
invoices.filter(inv => 
  inv.subscription === null && 
  inv.billing_reason === 'manual'
)
```

**重要说明：**
- 系统现在同时获取 Charges 和 Invoices
- 支持直接通过 Payment Intent 的支付（如 Stripe Checkout 的一次性购买）
- 所有数据在显示时实时计算，确保准确性

### 性能优化

✅ **已实现的优化：**
- **并行请求**：使用 `Promise.all` 并行获取所有客户的详细数据
- **完整数据串联**：一次性获取订阅（subscriptions）+ 发票（invoices）+ 支付记录（charges）
- **分页支持**：Admin 面板支持分页浏览（默认每页 20 个用户）
- **智能计算**：自动计算总支付金额（从所有成功的支付记录）
- **双重数据源**：同时从 Charges 和 Invoices 获取数据，确保不遗漏任何支付

📊 **性能指标：**
- **Stripe API 限速**：测试模式 100 req/s，生产模式更高
- **并行加载**：20 个用户约 1-3 秒（包含完整订阅、发票和支付数据）
- **API 调用数**：每个客户 3 个并行请求（subscriptions + invoices + charges）
- **适用规模**：适合中小型应用（<10000 用户）
- **大规模场景**：如有更多用户，建议增大每页数量或使用缓存模式

## 📁 项目结构

```
cloudflare-test/
├── worker-v3.js        # Cloudflare Worker（主程序）
├── wrangler.toml       # Worker 配置
├── package.json        # 依赖配置
├── .env                # 本地环境变量（不提交 Git）
├── env.example         # 环境变量示例文件
├── .gitignore          # Git 忽略配置
├── admin.html          # 管理面板
├── user-details.html   # 用户详情页面
├── index.html          # 首页
├── test.html           # 测试页面
└── success.html        # 支付成功页
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制示例文件并填入真实密钥：

```bash
# 复制示例文件
cp env.example .env

# 编辑 .env 文件，填入你的真实密钥
```

`.env` 文件内容：

```bash
STRIPE_SECRET_KEY=sk_test_你的密钥
STRIPE_WEBHOOK_SECRET=whsec_你的webhook密钥
```

**获取密钥：**
- Secret Key: https://dashboard.stripe.com/test/apikeys
- Webhook Secret: 运行 `stripe listen --forward-to localhost:8787/api/webhook`

### 3. 创建 KV 命名空间

```bash
wrangler kv:namespace create "CUSTOMER_DATA"
wrangler kv:namespace create "CUSTOMER_DATA" --preview
```

将返回的 ID 更新到 `wrangler.toml`。

### 4. 启动本地开发

```bash
npm run dev
```

**注意**：现在订阅数据通过前端主动同步，**无需启动 `stripe listen`**！

如果你想测试 webhook 作为备用同步机制，可以可选地运行：

```bash
stripe listen --forward-to localhost:8787/api/webhook
```

### 5. 同步价格配置

访问 Admin 面板：`http://localhost:8787/admin.html`

点击 **"同步 Stripe 价格"** 按钮，系统会自动从 Stripe 获取所有产品和价格。

### 6. 测试

访问测试页面：`http://localhost:8787/test.html`

使用 Stripe 测试卡：
- 成功支付：`4242 4242 4242 4242`
- 支付失败：`4000 0000 0000 9995`

### 7. 了解数据源模式和分页

Admin 面板提供两种数据源模式：

**🔴 实时从 Stripe 读取（默认推荐）**
- 优点：数据永远是最新的，包含完整的订阅和支付信息
- 特性：支持分页，可选择每页 10/20/50/100 个用户
- 性能：20 个用户约 1-2 秒加载时间
- 适用：大多数场景，推荐使用

**💾 从缓存读取（快速模式）**
- 优点：加载速度快（毫秒级）
- 缺点：需要手动同步，可能不是最新
- 特性：目前不支持分页，一次性加载所有
- 适用：用户量大且不需要实时数据的场景

**分页功能：**
- 默认每页 20 个用户
- 可切换为 10/50/100 个用户
- 上一页/下一页按钮自动启用/禁用
- 显示当前页码和用户数量

## 🌍 生产部署

### 1. 配置生产环境变量

```bash
wrangler secret put STRIPE_SECRET_KEY
# 输入生产环境密钥：sk_live_xxx

wrangler secret put STRIPE_WEBHOOK_SECRET  
# 输入生产环境 webhook 密钥
```

### 2. 部署 Worker

```bash
npm run deploy
```

### 3. 配置 Stripe Webhook

在 Stripe Dashboard 添加 webhook 端点：
```
https://your-worker.workers.dev/api/webhook
```

选择监听事件：
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### 4. 同步价格配置

访问生产环境的 Admin 面板并同步价格。

## 💰 价格管理

**重要**：价格 ID 不存储在环境变量中，而是动态存储在 Cloudflare KV 中。

### 管理价格的步骤

1. 在 Stripe Dashboard 创建或修改产品和价格
2. 访问 Admin 面板：`/admin.html`
3. 点击 **"同步 Stripe 价格"**
4. 系统自动从 Stripe API 获取最新价格并存储到 KV

### 为什么这样设计？

✅ **优势：**
- 无需重新部署即可更新价格
- 价格配置统一在 Stripe Dashboard 管理
- 避免在多个地方维护价格 ID
- 测试和生产环境自动隔离

### 价格配置的 API

```bash
# 查看所有价格
curl https://your-worker.workers.dev/api/admin/prices

# 同步价格
curl -X POST https://your-worker.workers.dev/api/admin/prices/sync
```

## 🔌 API 端点

### 支付相关

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/create-checkout-session` | POST | 创建支付会话 |
| `/api/sync-session` | POST | 同步订阅数据（支付成功后调用，**不依赖 webhook**） |
| `/api/subscription/:userId` | GET | 获取用户订阅信息（**实时从 Stripe API 查询**） |
| `/api/cancel-subscription` | POST | 取消订阅 |
| `/api/reactivate-subscription` | POST | 恢复订阅 |
| `/api/create-portal-session` | POST | 创建客户门户会话 |
| `/api/webhook` | POST | Stripe Webhook 回调（备用同步） |

### Admin 管理

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/admin/prices` | GET | 查看价格配置 |
| `/api/admin/prices/sync` | POST | 同步 Stripe 价格 |
| `/api/admin/users` | GET | 查看所有用户 |
| `/api/admin/users` | POST | 创建测试用户 |
| `/api/admin/users/:userId` | DELETE | 删除用户 |
| `/api/admin/import-customers` | POST | **从 Stripe 导入所有客户**（解决用户数据不完整问题） |
| `/api/admin/sync-all` | POST | 同步所有已有用户的订阅数据 |

## 🔒 安全性

- ✅ Stripe Checkout（PCI 合规）
- ✅ Webhook 签名验证
- ✅ 环境变量管理敏感信息
- ✅ Cloudflare Workers 沙箱环境
- ✅ CORS 安全配置

## 📚 技术栈

- **后端**: Cloudflare Workers (Serverless)
- **支付**: Stripe API
- **数据库**: Cloudflare KV (无服务器 KV 存储)
- **前端**: 纯 HTML/CSS/JavaScript

## 🧪 测试卡号

| 场景 | 卡号 | 日期 | CVV |
|------|------|------|-----|
| 支付成功 | 4242 4242 4242 4242 | 任意未来日期 | 任意 3 位 |
| 支付失败 | 4000 0000 0000 9995 | 任意未来日期 | 任意 3 位 |
| 需要 3D 验证 | 4000 0025 0000 3155 | 任意未来日期 | 任意 3 位 |

更多测试卡：https://stripe.com/docs/testing

## 🛠️ 故障排查

### Worker 启动失败

```bash
# 检查环境变量
cat .env

# 重启 Worker
npm run dev
```

### 价格配置错误

```bash
# 重新同步价格
curl -X POST http://localhost:8787/api/admin/prices/sync
```

### 用户列表显示不全

**原因**：Admin 面板可能在缓存模式下运行

**解决方案**：
1. 访问 Admin 面板（`/admin.html`）
2. 将数据源切换到 **"🔴 实时从 Stripe 读取（推荐）"**
3. 系统会自动显示 Stripe 上的所有客户

### 订阅数据显示为 0 或总支付为 $0.00

**原因**：旧版本未串联发票数据，或 Stripe 确实没有支付记录

**解决方案**：
1. 确认 Admin 面板使用 "🔴 实时从 Stripe 读取" 模式
2. 点击 "🔄 刷新数据" 按钮（会自动获取发票和支付数据）
3. 在 Stripe Dashboard 确认：
   - 订阅确实存在
   - 订阅已经产生了至少一张已支付的发票
4. 测试页面的订阅查询始终是实时的，应该能看到最新数据

**注意**：新创建的订阅可能需要几秒钟才能生成第一张发票。

### 支付后创建了新用户而不是关联到已有用户

**原因**：已修复！系统现在能自动识别 Stripe Customer ID

**解决方案**：
- ✅ 从 Admin 面板点击"开始测试"时，会自动传递 Stripe Customer ID
- ✅ 后端智能识别 `cus_xxx` 格式的 ID，直接关联到已有客户
- ✅ 订阅信息查询也支持直接使用 Stripe Customer ID
- 无需任何额外配置，系统会自动处理

### 加载速度慢

**原因**：实时模式需要并行请求多个 Stripe API

**解决方案**：
1. 减小每页数量（从 20 改为 10）
2. 如果有很多用户（>100），考虑使用"缓存读取"模式
3. 实时模式的加载时间是正常的（20 用户约 1-2 秒）

### Webhook 验证失败（可选）

**注意**：现在 webhook 只是备用同步机制，不影响核心功能。

如果你想测试 webhook，确保 `.env` 中的 `STRIPE_WEBHOOK_SECRET` 与 Stripe CLI 显示的密钥一致。

**技术说明**：Cloudflare Workers 环境需要使用 `constructEventAsync()` 而非 `constructEvent()`，这已在代码中正确实现。

## 📖 参考文档

- [Stripe API 文档](https://stripe.com/docs/api)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Stripe Checkout 指南](https://stripe.com/docs/payments/checkout)

## 📄 许可

ISC License

---

Made with ❤️ using Stripe and Cloudflare Workers
