# 应用端技术设计文档 (Client Portal / App Store)

## 1. 概述
应用端（Client Portal）是普通用户发现、购买和访问 Web 应用的入口。核心目标是提供流畅的购买体验（Steam-like）和可靠的权限控制（Entitlement）。

## 2. 前端架构设计

### 2.1 技术栈建议
- **框架**: Next.js (推荐，利于商店 SEO 和首屏加载速度) 或 React SPA。
- **样式**: Tailwind CSS (便捷的自定义样式，易于打造 C 端视觉效果)。
- **支付集成**: Stripe.js & React Stripe.js (用于构建安全的支付表单)。
- **状态管理**: SWR / React Query (处理服务端数据缓存)。

### 2.2 页面结构与流程
1.  **商店首页 (Storefront)**
    *   展示所有“上架中”的应用。
    *   支持搜索、分类筛选。
2.  **订阅页面 (Subscribe)**
    *   **全局订阅**：展示平台级订阅套餐（按月/季/年收费）。
    *   订阅后可访问所有应用。
3.  **应用详情页 (App Detail)**
    *   展示应用介绍、截图。
    *   **单应用购买卡片**：仅展示该应用的一次性购买选项（如果有）。
    *   **动作按钮**:
        *   未登录 -> 跳转登录
        *   无权限 -> "立即购买"（一次性）或引导至订阅页面
        *   有权限 -> "启动应用"
4.  **支付收银台 (Checkout)**
    *   集成 Stripe Payment Element。
    *   处理支付成功后的回调页面 (Success Page)，轮询检查订单状态。
5.  **个人中心 (My Dashboard)**
    *   **我的应用**: 列出所有拥有有效 Entitlement 的应用。
    *   **订阅管理**: 查看当前订阅状态，取消订阅（跳转 Stripe Customer Portal 或调用 API）。

## 3. 后端架构与核心逻辑

### 3.1 数据库模型
（复用 **管理端技术设计文档** 中的 ER 图，重点关注 `Order` 和 `Entitlement` 表）

### 3.2 核心业务流程

#### 3.2.1 鉴权与访问控制 (Access Control)
这是系统的核心安全防线。所有对具体应用的访问请求（或启动应用时的 SSO 流程）都必须经过此校验。

1.  **输入**: `UserId`, `AppId`
2.  **校验逻辑**:
    *   查询 `Entitlement` 表。
    *   条件 1: `user_id` 匹配。
    *   条件 2: `app_id` 匹配（或 Entitlement 为全局订阅且该 App 在订阅范围内）。
    *   条件 3: `is_active` = true。
    *   条件 4: `type` = PERMANENT **OR** (`type` = SUBSCRIPTION **AND** `expire_time` > `now()`).
3.  **结果**: 仅当上述条件满足时，返回 `Access Granted`。

#### 3.2.2 支付与自动授权 (Purchase & Provisioning)
1.  **创建支付意向**: 用户点击购买 -> 根据 `PricingPlan` 调用 Stripe API 创建 `PaymentIntent` 或 `Checkout Session`。
2.  **Webhook 处理 (关键)**:
    *   监听 Stripe `payment_intent.succeeded` 或 `invoice.payment_succeeded` 事件。
    *   **幂等处理**: 根据 Stripe 传入的 metadata (含 `UserId`, `PlanId`) 查找或创建系统内的 `Order`。
    *   **发放权益**: 订单状态更新为 `PAID` 后，立即在 `Entitlement` 表插入记录（计算过期时间）。

## 4. API 接口设计 (应用端)

### 4.1 商店浏览

| 方法 | 路径 | 描述 | 权限 |
| :--- | :--- | :--- | :--- |
| GET | `/api/store/apps` | 获取上架应用列表 | Public |
| GET | `/api/store/apps/:id` | 获取应用详情及**仅该应用的一次性购买方案** | Public |
| GET | `/api/store/plans` | 获取**平台级全局订阅方案** | Public |

### 4.2 交易与订单

| 方法 | 路径 | 描述 | 权限 |
| :--- | :--- | :--- | :--- |
| POST | `/api/store/checkout/session` | 创建 Stripe Checkout Session | User |
| POST | `/api/webhooks/stripe` | 接收 Stripe 支付回调 | Stripe IP Only |
| GET | `/api/store/orders/status/:id` | 轮询订单支付结果 | User |

### 4.3 用户权益

| 方法 | 路径 | 描述 | 权限 |
| :--- | :--- | :--- | :--- |
| GET | `/api/user/entitlements` | 获取我拥有的应用权限列表 | User |
| GET | `/api/user/access-check/:appKey` | 检查是否有权访问某应用(用于启动时) | User |
