# Stripe 公共支付模块设计方案

## 📋 业务需求概述

### 场景描述
构建一个类似 Steam 的平台，包含多个 Web 应用，支持两种商业模式：

1. **单应用购买**：用户可以单独购买某个应用的永久使用权（一次性付费）
2. **平台会员订阅**：用户订阅平台会员后，可以使用所有应用（按月/年订阅）

### 核心需求
- ✅ 支持多应用管理（动态增删应用）
- ✅ 支持单应用一次性购买
- ✅ 支持平台级订阅（订阅后访问所有应用）
- ✅ 权限验证（判断用户是否可以访问某个应用）
- ✅ 灵活的价格体系（应用单独定价 + 订阅定价）
- ✅ 易于集成到其他项目

---

## 🏗️ 架构设计

### 1. 数据模型设计

#### 1.1 应用（Application）数据模型

```javascript
{
  appId: "app_image_editor",           // 应用唯一标识
  name: "AI 图片编辑器",                // 应用名称
  description: "强大的AI驱动图片编辑工具", // 应用描述
  stripeProductId: "prod_xxx",         // Stripe 产品ID
  stripePriceId: "price_xxx",          // Stripe 一次性购买价格ID
  price: 2999,                          // 价格（分），$29.99
  currency: "usd",                      // 货币
  status: "active",                     // 状态：active/inactive
  icon: "https://cdn.example.com/icon.png",  // 应用图标
  category: "productivity",             // 分类
  features: [                           // 功能列表
    "AI 背景去除",
    "一键美化",
    "批量处理"
  ],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z"
}
```

**存储位置**：`KV: app:${appId}`  
**应用列表**：`KV: apps_list` (数组)

#### 1.2 订阅计划（Subscription Plan）数据模型

```javascript
{
  planId: "plan_premium",               // 计划唯一标识
  name: "Premium 会员",                 // 计划名称
  description: "解锁所有应用，无限使用", // 计划描述
  stripeProductId: "prod_yyy",          // Stripe 产品ID
  stripePriceIds: {                     // Stripe 价格ID（多周期）
    monthly: "price_monthly_xxx",       // 月度订阅
    yearly: "price_yearly_xxx"          // 年度订阅
  },
  prices: {                             // 价格
    monthly: 999,                       // $9.99/月
    yearly: 9999                        // $99.99/年
  },
  currency: "usd",
  benefits: [                           // 会员权益
    "访问所有应用",
    "优先客服支持",
    "早期体验新功能"
  ],
  includedApps: "all",                  // "all" 或应用ID数组
  status: "active",
  createdAt: "2025-01-01T00:00:00Z"
}
```

**存储位置**：`KV: plan:${planId}`  
**计划列表**：`KV: plans_list`

#### 1.3 用户权限（User Access）数据模型

```javascript
{
  userId: "user_123",                   // 用户ID
  email: "user@example.com",
  customerId: "cus_stripe_xxx",         // Stripe Customer ID
  
  // 订阅信息
  subscription: {
    id: "sub_xxx",                      // Stripe 订阅ID
    planId: "plan_premium",             // 订阅的计划ID
    status: "active",                   // active/canceled/past_due
    currentPeriodEnd: 1735689600,       // 当前周期结束时间
    cancelAtPeriodEnd: false
  },
  
  // 单独购买的应用
  purchasedApps: [
    {
      appId: "app_image_editor",
      purchaseDate: "2025-01-01T00:00:00Z",
      paymentIntentId: "pi_xxx",
      amount: 2999
    }
  ],
  
  // 快速访问权限缓存（性能优化）
  accessCache: {
    hasSubscription: true,              // 是否有活跃订阅
    ownedApps: [                        // 拥有的应用ID列表
      "app_image_editor"
    ],
    lastUpdated: "2025-01-01T00:00:00Z"
  },
  
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z"
}
```

**存储位置**：`KV: user:${userId}`

---

### 2. 核心业务逻辑

#### 2.1 权限验证逻辑

```javascript
/**
 * 检查用户是否有权限访问某个应用
 * @param {string} userId - 用户ID
 * @param {string} appId - 应用ID
 * @returns {boolean} 是否有权限
 */
async function hasAccess(userId, appId) {
  // 1. 获取用户数据
  const user = await getUser(userId);
  if (!user) return false;
  
  // 2. 检查是否有活跃订阅
  if (user.subscription && user.subscription.status === 'active') {
    const plan = await getPlan(user.subscription.planId);
    
    // 如果订阅计划包含所有应用
    if (plan.includedApps === 'all') {
      return true;
    }
    
    // 如果订阅计划包含特定应用
    if (Array.isArray(plan.includedApps) && plan.includedApps.includes(appId)) {
      return true;
    }
  }
  
  // 3. 检查是否单独购买了该应用
  if (user.purchasedApps.some(p => p.appId === appId)) {
    return true;
  }
  
  // 4. 无权限
  return false;
}
```

#### 2.2 支付流程设计

**单应用购买流程：**
```
用户选择应用
  ↓
调用 /api/purchase/create-session
  ↓
创建 Stripe Checkout Session (mode: payment)
  ↓
用户完成支付
  ↓
Stripe Webhook / 前端同步
  ↓
记录购买到 user.purchasedApps
  ↓
更新权限缓存
```

**订阅流程：**
```
用户选择订阅计划
  ↓
调用 /api/subscription/create-session
  ↓
创建 Stripe Checkout Session (mode: subscription)
  ↓
用户完成支付
  ↓
Stripe Webhook / 前端同步
  ↓
记录订阅到 user.subscription
  ↓
更新权限缓存
```

---

### 3. API 接口设计

#### 3.1 应用管理 API

```javascript
// 获取所有应用列表
GET /api/apps
Response: {
  apps: [
    {
      appId: "app_image_editor",
      name: "AI 图片编辑器",
      price: 2999,
      // ...
    }
  ]
}

// 获取单个应用详情
GET /api/apps/:appId
Response: {
  app: { /* 应用详情 */ },
  userAccess: {
    hasAccess: true,
    accessType: "subscription", // 或 "purchased"
    expiresAt: "2025-12-31"     // 订阅到期时间
  }
}

// 创建/更新应用（Admin）
POST /api/admin/apps
Body: {
  appId: "app_image_editor",
  name: "AI 图片编辑器",
  stripeProductId: "prod_xxx",
  stripePriceId: "price_xxx",
  price: 2999
}
```

#### 3.2 订阅计划 API

```javascript
// 获取所有订阅计划
GET /api/plans
Response: {
  plans: [
    {
      planId: "plan_premium",
      name: "Premium 会员",
      prices: { monthly: 999, yearly: 9999 },
      benefits: [...]
    }
  ]
}

// 创建/更新订阅计划（Admin）
POST /api/admin/plans
Body: {
  planId: "plan_premium",
  name: "Premium 会员",
  stripePriceIds: { monthly: "price_xxx", yearly: "price_yyy" }
}
```

#### 3.3 购买/订阅 API

```javascript
// 创建单应用购买会话
POST /api/purchase/create-session
Body: {
  userId: "user_123",
  appId: "app_image_editor",
  successUrl: "https://...",
  cancelUrl: "https://..."
}
Response: {
  sessionId: "cs_xxx",
  url: "https://checkout.stripe.com/..."
}

// 创建订阅会话
POST /api/subscription/create-session
Body: {
  userId: "user_123",
  planId: "plan_premium",
  interval: "monthly",  // 或 "yearly"
  successUrl: "https://...",
  cancelUrl: "https://..."
}
Response: {
  sessionId: "cs_xxx",
  url: "https://checkout.stripe.com/..."
}

// 同步支付结果
POST /api/payment/sync-session
Body: {
  sessionId: "cs_xxx"
}
```

#### 3.4 权限验证 API

```javascript
// 检查用户对某应用的访问权限
GET /api/access/check?userId=xxx&appId=yyy
Response: {
  hasAccess: true,
  accessType: "subscription",  // "subscription" | "purchased" | "none"
  details: {
    source: "plan_premium",    // 权限来源
    expiresAt: "2025-12-31"    // 如果是订阅
  }
}

// 获取用户所有可访问的应用
GET /api/access/apps?userId=xxx
Response: {
  apps: [
    {
      appId: "app_image_editor",
      accessType: "purchased",
      purchaseDate: "2025-01-01"
    }
  ],
  subscription: {
    planId: "plan_premium",
    status: "active",
    expiresAt: "2025-12-31"
  }
}
```

---

### 4. 模块化设计

#### 4.1 代码结构

```
src/
├── modules/
│   ├── stripe/
│   │   ├── client.js              # Stripe 客户端初始化
│   │   ├── checkout.js            # Checkout 相关逻辑
│   │   └── webhook.js             # Webhook 处理
│   ├── apps/
│   │   ├── manager.js             # 应用管理
│   │   └── validator.js           # 应用验证
│   ├── subscriptions/
│   │   ├── manager.js             # 订阅管理
│   │   └── plans.js               # 订阅计划
│   ├── purchases/
│   │   ├── manager.js             # 购买管理
│   │   └── validator.js           # 购买验证
│   └── access/
│       ├── checker.js             # 权限检查
│       └── cache.js               # 权限缓存
├── routes/
│   ├── apps.js                    # 应用相关路由
│   ├── subscriptions.js           # 订阅相关路由
│   ├── purchases.js               # 购买相关路由
│   └── access.js                  # 权限相关路由
├── utils/
│   ├── kv.js                      # KV 存储封装
│   └── response.js                # 响应格式化
└── worker.js                      # 主入口文件
```

#### 4.2 核心模块示例

**应用管理模块 (apps/manager.js)**
```javascript
export class AppManager {
  constructor(kvStore) {
    this.kv = kvStore;
  }
  
  // 创建/更新应用
  async saveApp(appData) {
    await this.kv.put(`app:${appData.appId}`, JSON.stringify(appData));
    
    // 更新应用列表
    const apps = await this.getAppsList();
    if (!apps.includes(appData.appId)) {
      apps.push(appData.appId);
      await this.kv.put('apps_list', JSON.stringify(apps));
    }
  }
  
  // 获取应用
  async getApp(appId) {
    return await this.kv.get(`app:${appId}`, { type: 'json' });
  }
  
  // 获取所有应用
  async getAllApps() {
    const appIds = await this.getAppsList();
    return Promise.all(appIds.map(id => this.getApp(id)));
  }
  
  async getAppsList() {
    return await this.kv.get('apps_list', { type: 'json' }) || [];
  }
}
```

**权限检查模块 (access/checker.js)**
```javascript
export class AccessChecker {
  constructor(kvStore) {
    this.kv = kvStore;
  }
  
  // 检查用户是否有权限访问应用
  async hasAccess(userId, appId) {
    const user = await this.kv.get(`user:${userId}`, { type: 'json' });
    if (!user) return { hasAccess: false, reason: 'user_not_found' };
    
    // 检查订阅
    if (user.subscription?.status === 'active') {
      const plan = await this.kv.get(`plan:${user.subscription.planId}`, { type: 'json' });
      if (plan?.includedApps === 'all' || plan?.includedApps?.includes(appId)) {
        return {
          hasAccess: true,
          accessType: 'subscription',
          source: plan.planId,
          expiresAt: user.subscription.currentPeriodEnd
        };
      }
    }
    
    // 检查单独购买
    const purchase = user.purchasedApps?.find(p => p.appId === appId);
    if (purchase) {
      return {
        hasAccess: true,
        accessType: 'purchased',
        purchaseDate: purchase.purchaseDate
      };
    }
    
    return { hasAccess: false, reason: 'no_access' };
  }
  
  // 获取用户所有可访问的应用
  async getUserAccessibleApps(userId) {
    const user = await this.kv.get(`user:${userId}`, { type: 'json' });
    if (!user) return [];
    
    const apps = [];
    
    // 如果有订阅，获取订阅包含的应用
    if (user.subscription?.status === 'active') {
      const plan = await this.kv.get(`plan:${user.subscription.planId}`, { type: 'json' });
      if (plan?.includedApps === 'all') {
        const allApps = await this.kv.get('apps_list', { type: 'json' }) || [];
        apps.push(...allApps.map(appId => ({
          appId,
          accessType: 'subscription',
          source: plan.planId
        })));
      } else if (Array.isArray(plan?.includedApps)) {
        apps.push(...plan.includedApps.map(appId => ({
          appId,
          accessType: 'subscription',
          source: plan.planId
        })));
      }
    }
    
    // 添加单独购买的应用
    if (user.purchasedApps) {
      const purchasedAppIds = new Set(apps.map(a => a.appId));
      user.purchasedApps.forEach(purchase => {
        if (!purchasedAppIds.has(purchase.appId)) {
          apps.push({
            appId: purchase.appId,
            accessType: 'purchased',
            purchaseDate: purchase.purchaseDate
          });
        }
      });
    }
    
    return apps;
  }
}
```

---

### 5. 集成方案

#### 5.1 现有项目改造

**Step 1: 迁移现有数据结构**
- 保留现有的 `user:${userId}` 结构
- 添加 `purchasedApps` 字段
- 添加应用和计划的数据结构

**Step 2: 扩展现有 API**
- `/api/create-checkout-session` → 支持 `type: 'app' | 'subscription'`
- 添加新的应用管理 API
- 添加权限检查 API

**Step 3: 价格管理改造**
- 现有的 `price_config` 保留，用于订阅计划
- 新增 `apps_config`，用于应用定价

#### 5.2 新项目集成

**NPM 包方式（推荐）：**
```javascript
import { StripePaymentModule } from '@yourorg/stripe-payment-module';

const paymentModule = new StripePaymentModule({
  stripeSecretKey: env.STRIPE_SECRET_KEY,
  kvStore: env.CUSTOMER_DATA
});

// 使用模块
app.get('/api/apps', async (req) => {
  const apps = await paymentModule.apps.getAll();
  return Response.json(apps);
});
```

**Worker 方式（直接使用）：**
```javascript
// 直接部署到 Cloudflare Workers
// 通过环境变量配置应用列表
```

---

### 6. 定价策略建议

#### 6.1 价格设置建议

```javascript
// 示例定价
const pricingExample = {
  // 单应用价格（一次性）
  apps: {
    "app_image_editor": { price: 2999, name: "AI 图片编辑器" },  // $29.99
    "app_video_tools": { price: 3999, name: "视频工具" },       // $39.99
    "app_audio_mixer": { price: 1999, name: "音频混音器" }      // $19.99
  },
  
  // 订阅计划
  subscriptions: {
    "plan_basic": {
      name: "Basic 会员",
      monthly: 999,    // $9.99/月
      yearly: 9999,    // $99.99/年（相当于 $8.33/月）
      includedApps: ["app_image_editor"]  // 只包含部分应用
    },
    "plan_premium": {
      name: "Premium 会员",
      monthly: 1999,   // $19.99/月
      yearly: 19999,   // $199.99/年（相当于 $16.67/月）
      includedApps: "all"  // 包含所有应用
    }
  }
};
```

#### 6.2 定价心理学

1. **订阅价格 < 单应用总价**：鼓励用户订阅
   - 3个应用单独购买：$29.99 + $39.99 + $19.99 = $89.97
   - Premium 年度订阅：$199.99/年（相当于 $16.67/月）

2. **年付折扣**：鼓励长期订阅
   - 月付：$19.99 × 12 = $239.88
   - 年付：$199.99（节省 $39.89，相当于 8.3 折）

3. **分级订阅**：满足不同用户需求
   - Basic：轻度用户，只需要部分应用
   - Premium：重度用户，需要所有应用

---

### 7. 数据迁移方案

#### 7.1 从现有系统迁移

```javascript
// 迁移脚本示例
async function migrateToNewStructure(env) {
  // 1. 创建默认订阅计划
  await env.CUSTOMER_DATA.put('plan:plan_premium', JSON.stringify({
    planId: 'plan_premium',
    name: 'Premium 会员',
    includedApps: 'all',
    stripePriceIds: {
      monthly: 'price_xxx',  // 从现有 price_config 获取
      yearly: 'price_yyy'
    }
  }));
  
  await env.CUSTOMER_DATA.put('plans_list', JSON.stringify(['plan_premium']));
  
  // 2. 迁移现有用户
  const usersList = await env.CUSTOMER_DATA.get('users_list', { type: 'json' }) || [];
  
  for (const userId of usersList) {
    const user = await env.CUSTOMER_DATA.get(`user:${userId}`, { type: 'json' });
    
    // 将现有订阅关联到 plan_premium
    if (user.subscriptions && user.subscriptions.length > 0) {
      user.subscription = {
        id: user.subscriptions[0].id,
        planId: 'plan_premium',
        status: user.subscriptions[0].status,
        currentPeriodEnd: user.subscriptions[0].current_period_end,
        cancelAtPeriodEnd: user.subscriptions[0].cancel_at_period_end
      };
    }
    
    // 初始化 purchasedApps（如果之前没有）
    if (!user.purchasedApps) {
      user.purchasedApps = [];
    }
    
    await env.CUSTOMER_DATA.put(`user:${userId}`, JSON.stringify(user));
  }
}
```

---

### 8. 安全性考虑

#### 8.1 权限验证

```javascript
// 在每个应用入口处验证权限
async function validateAccess(request, env) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const appId = url.searchParams.get('appId');
  
  // 从 token 或 cookie 中提取用户身份
  const token = request.headers.get('Authorization');
  const verifiedUserId = await verifyToken(token);
  
  if (verifiedUserId !== userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // 检查权限
  const checker = new AccessChecker(env.CUSTOMER_DATA);
  const access = await checker.hasAccess(userId, appId);
  
  if (!access.hasAccess) {
    return new Response('Access Denied', { status: 403 });
  }
  
  return null; // 验证通过
}
```

#### 8.2 防止滥用

1. **Rate Limiting**：限制 API 调用频率
2. **Token 验证**：使用 JWT 或 Session 验证用户身份
3. **Webhook 签名验证**：已实现
4. **日志记录**：记录所有访问和购买行为

---

### 9. 监控与分析

#### 9.1 关键指标

```javascript
// 需要追踪的指标
const metrics = {
  // 收入指标
  mrr: 0,                      // 月度经常性收入 (Monthly Recurring Revenue)
  arr: 0,                      // 年度经常性收入 (Annual Recurring Revenue)
  
  // 用户指标
  totalUsers: 0,               // 总用户数
  activeSubscribers: 0,        // 活跃订阅用户数
  churnRate: 0,                // 流失率
  
  // 应用指标
  appPurchases: {},            // 每个应用的购买次数
  popularApps: [],             // 最受欢迎的应用
  
  // 转化指标
  conversionRate: 0,           // 从免费到付费的转化率
  subscriptionVsPurchase: {}   // 订阅 vs 单次购买比例
};
```

#### 9.2 数据分析 API

```javascript
// 获取平台统计数据（Admin）
GET /api/admin/analytics
Response: {
  revenue: {
    mrr: 50000,        // $500/月
    arr: 600000,       // $6000/年
    totalRevenue: 123456
  },
  users: {
    total: 1000,
    subscribers: 200,
    oneTimePurchasers: 300
  },
  apps: {
    "app_image_editor": {
      purchases: 150,
      revenue: 44985  // $449.85
    }
  }
}
```

---

### 10. 扩展性考虑

#### 10.1 未来功能扩展

1. **团队/企业订阅**
   - 支持多用户共享订阅
   - 团队管理功能

2. **应用内购买**
   - 每个应用内的高级功能付费
   - Credits/配额系统

3. **优惠券系统**
   - 折扣码
   - 推广活动

4. **推荐奖励**
   - 推荐新用户获得奖励
   - 联盟营销

5. **地区定价**
   - 根据用户所在地区调整价格
   - 多货币支持

#### 10.2 技术扩展

1. **多支付网关**
   - 除了 Stripe，支持 PayPal、支付宝等
   - 抽象支付接口

2. **自定义计费周期**
   - 季度订阅
   - 自定义周期

3. **用量计费**
   - 根据 API 调用量计费
   - 阶梯定价

---

## 📊 实施优先级

### Phase 1: 核心功能（1-2周）
- ✅ 应用管理（CRUD）
- ✅ 订阅计划管理
- ✅ 单应用购买流程
- ✅ 订阅流程
- ✅ 权限验证逻辑

### Phase 2: 用户体验（1周）
- ✅ 用户中心页面（显示拥有的应用）
- ✅ 应用商店页面
- ✅ 订阅管理页面

### Phase 3: Admin 功能（1周）
- ✅ 应用管理后台
- ✅ 订阅计划管理后台
- ✅ 数据分析面板

### Phase 4: 优化与扩展（持续）
- ✅ 性能优化
- ✅ 监控与日志
- ✅ 优惠券系统
- ✅ 推荐奖励

---

## ✅ 需求确认（已确认）

1. **应用数量**：每年新增12个应用，需要灵活的应用管理系统 ✅
2. **订阅层级**：需要支持动态增加订阅层级（不限于Basic/Premium）✅
3. **免费试用**：不提供免费试用 ✅
4. **权限粒度**：应用级别权限（有权限即可使用整个应用）✅
5. **用户量级**：未知，需要支持动态扩展（KV + 性能优化）✅
6. **前端框架**：React + Next.js ✅

---

## 🎯 针对你场景的特别说明

### 应用动态管理能力
由于每年新增12个应用，系统设计重点在于：
- ✅ **零停机添加应用**：通过Admin API随时添加新应用，无需重启服务
- ✅ **应用元数据灵活**：支持应用图标、描述、分类等信息
- ✅ **批量导入**：支持从配置文件批量导入应用
- ✅ **应用上下架**：支持应用状态管理（active/inactive）

### 订阅层级动态管理
设计支持无限制的订阅层级：
```javascript
// 示例：可以创建任意多个订阅计划
const plans = [
  {
    planId: "plan_starter",
    name: "Starter",
    includedApps: ["app_1", "app_2", "app_3"]  // 指定3个应用
  },
  {
    planId: "plan_professional",
    name: "Professional",
    includedApps: ["app_1", "app_2", "app_3", "app_4", "app_5", "app_6"]  // 指定6个应用
  },
  {
    planId: "plan_ultimate",
    name: "Ultimate",
    includedApps: "all"  // 所有应用
  }
];
```

### KV存储扩展性说明
**Cloudflare KV 特点：**
- ✅ **无容量限制**：单个KV命名空间可以存储无限键值对
- ✅ **全球分布**：自动在全球边缘节点复制
- ✅ **高性能读取**：读取延迟 < 50ms
- ⚠️ **写入限制**：每秒最多1000次写入（对于用户注册/购买场景足够）

**性能考量：**
- **小于10万用户**：KV完全够用，性能优秀
- **10万-100万用户**：需要优化查询策略（如增加索引、缓存）
- **超过100万用户**：考虑迁移到D1（SQLite）或Durable Objects

**建议：**先用KV开发，后续根据实际规模评估是否需要迁移。设计模块化架构，方便未来切换存储方案。

### React + Next.js 集成示例

#### 前端项目结构
```
nextjs-app/
├── app/
│   ├── store/                    # 应用商店
│   │   └── page.tsx
│   ├── subscriptions/            # 订阅页面
│   │   └── page.tsx
│   ├── dashboard/                # 用户中心
│   │   └── page.tsx
│   └── apps/
│       └── [appId]/              # 动态应用页面
│           └── page.tsx
├── components/
│   ├── AppCard.tsx               # 应用卡片
│   ├── SubscriptionCard.tsx      # 订阅卡片
│   └── AccessGate.tsx            # 权限门控组件
├── lib/
│   ├── stripe-api.ts             # Stripe API 客户端
│   └── access-checker.ts         # 权限检查封装
└── hooks/
    ├── useUserAccess.ts          # 用户权限 Hook
    └── useApps.ts                # 应用列表 Hook
```

#### 权限门控组件示例
```typescript
// components/AccessGate.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AccessGateProps {
  appId: string;
  userId: string;
  children: React.ReactNode;
}

export function AccessGate({ appId, userId, children }: AccessGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch(
          `/api/access/check?userId=${userId}&appId=${appId}`
        );
        const data = await response.json();
        
        if (data.hasAccess) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
          // 重定向到购买页面
          router.push(`/store?app=${appId}`);
        }
      } catch (error) {
        console.error('Failed to check access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [appId, userId, router]);

  if (loading) {
    return <div>验证权限中...</div>;
  }

  if (!hasAccess) {
    return <div>无权限访问，正在跳转...</div>;
  }

  return <>{children}</>;
}
```

#### 应用商店页面示例
```typescript
// app/store/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { AppCard } from '@/components/AppCard';

export default function StorePage() {
  const [apps, setApps] = useState([]);
  const [userAccess, setUserAccess] = useState({});

  useEffect(() => {
    async function loadData() {
      // 获取所有应用
      const appsRes = await fetch('https://your-worker.workers.dev/api/apps');
      const appsData = await appsRes.json();
      setApps(appsData.apps);

      // 获取用户可访问的应用
      const userId = getUserId(); // 从session/cookie获取
      const accessRes = await fetch(
        `https://your-worker.workers.dev/api/access/apps?userId=${userId}`
      );
      const accessData = await accessRes.json();
      
      // 构建访问权限映射
      const accessMap = {};
      accessData.apps.forEach(app => {
        accessMap[app.appId] = app.accessType;
      });
      setUserAccess(accessMap);
    }

    loadData();
  }, []);

  const handlePurchase = async (appId: string) => {
    const userId = getUserId();
    
    // 创建购买会话
    const response = await fetch(
      'https://your-worker.workers.dev/api/purchase/create-session',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          appId,
          successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/store`
        })
      }
    );
    
    const data = await response.json();
    
    // 跳转到Stripe Checkout
    window.location.href = data.url;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">应用商店</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map(app => (
          <AppCard
            key={app.appId}
            app={app}
            hasAccess={!!userAccess[app.appId]}
            accessType={userAccess[app.appId]}
            onPurchase={() => handlePurchase(app.appId)}
          />
        ))}
      </div>
    </div>
  );
}
```

#### 自定义Hook示例
```typescript
// hooks/useUserAccess.ts
import { useEffect, useState } from 'react';

export function useUserAccess(userId: string) {
  const [accessibleApps, setAccessibleApps] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAccess() {
      try {
        const response = await fetch(
          `https://your-worker.workers.dev/api/access/apps?userId=${userId}`
        );
        const data = await response.json();
        
        setAccessibleApps(data.apps);
        setSubscription(data.subscription);
      } catch (error) {
        console.error('Failed to fetch user access:', error);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchAccess();
    }
  }, [userId]);

  const hasAccessToApp = (appId: string) => {
    return accessibleApps.some(app => app.appId === appId);
  };

  return {
    accessibleApps,
    subscription,
    loading,
    hasAccessToApp
  };
}
```

---

## 📝 后续步骤

1. ✅ **需求确认完成**
2. **开始编码**：
   - 创建模块化的Stripe支付模块
   - 实现应用管理API
   - 实现订阅计划管理API
   - 实现权限验证API
   - 提供React组件和Hooks
3. **测试与部署**：提供测试用例和部署指南

---

**设计完成日期**：2025-12-30  
**设计者**：AI Assistant  
**版本**：v1.1（已根据需求更新）

