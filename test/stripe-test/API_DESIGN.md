# Stripe 支付模块 API 设计文档

版本：v1.0  
最后更新：2025-12-31

---

## 📋 目录

- [基础信息](#基础信息)
- [认证与授权](#认证与授权)
- [通用响应格式](#通用响应格式)
- [应用管理 API](#应用管理-api)
- [订阅计划 API](#订阅计划-api)
- [购买与订阅 API](#购买与订阅-api)
- [权限验证 API](#权限验证-api)
- [Admin 管理 API](#admin-管理-api)
- [Webhook API](#webhook-api)
- [错误码说明](#错误码说明)

---

## 基础信息

### Base URL

- **开发环境**：`http://localhost:8787`
- **生产环境**：`https://your-worker.workers.dev`

### API版本

当前版本：`v1`（路径中不包含版本号，通过header传递）

### Content-Type

所有请求和响应均使用：`application/json`

### CORS

支持跨域请求，允许的origins：`*`（生产环境建议限制）

---

## 认证与授权

### 认证方式

目前API分为两类：

1. **公开API**：无需认证（如获取应用列表）
2. **用户API**：需要传递userId（后续可升级为JWT Token）
3. **Admin API**：需要管理员权限（后续可加入API Key）

### 请求头

```http
Content-Type: application/json
Authorization: Bearer <token>  # 可选，未来实现
X-User-Id: <userId>            # 临时方案，用于标识用户
```

---

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    // 具体业务数据
  },
  "message": "操作成功",  // 可选
  "timestamp": "2025-12-31T00:00:00Z"
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "APP_NOT_FOUND",
    "message": "应用不存在",
    "details": {}  // 可选，额外的错误信息
  },
  "timestamp": "2025-12-31T00:00:00Z"
}
```

### HTTP状态码

- `200`：成功
- `201`：创建成功
- `400`：请求参数错误
- `401`：未授权
- `403`：无权限
- `404`：资源不存在
- `409`：资源冲突
- `500`：服务器错误

---

## 应用管理 API

### 1. 获取所有应用

获取平台所有可用的应用列表。

**请求**

```http
GET /api/apps
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 应用状态：`active`/`inactive`/`all`，默认`active` |
| category | string | 否 | 应用分类，如 `productivity`/`design` |
| page | integer | 否 | 页码，默认1 |
| pageSize | integer | 否 | 每页数量，默认20 |

**响应示例**

```json
{
  "success": true,
  "data": {
    "apps": [
      {
        "appId": "app_image_editor",
        "name": "AI 图片编辑器",
        "description": "强大的AI驱动图片编辑工具",
        "price": 2999,
        "currency": "usd",
        "status": "active",
        "icon": "https://cdn.example.com/icon.png",
        "category": "design",
        "features": [
          "AI 背景去除",
          "一键美化",
          "批量处理"
        ],
        "stripeProductId": "prod_xxx",
        "stripePriceId": "price_xxx",
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 12,
      "totalPages": 1
    }
  }
}
```

---

### 2. 获取单个应用详情

获取指定应用的详细信息，如果传递了userId，会同时返回用户对该应用的访问权限。

**请求**

```http
GET /api/apps/:appId
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appId | string | 是 | 应用ID |

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 否 | 用户ID，传递后会返回用户权限信息 |

**响应示例**

```json
{
  "success": true,
  "data": {
    "app": {
      "appId": "app_image_editor",
      "name": "AI 图片编辑器",
      "description": "强大的AI驱动图片编辑工具",
      "price": 2999,
      "currency": "usd",
      "status": "active",
      "icon": "https://cdn.example.com/icon.png",
      "category": "design",
      "features": ["AI 背景去除", "一键美化", "批量处理"],
      "stripeProductId": "prod_xxx",
      "stripePriceId": "price_xxx",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    },
    "userAccess": {
      "hasAccess": true,
      "accessType": "subscription",
      "source": "plan_premium",
      "expiresAt": "2026-01-01T00:00:00Z"
    }
  }
}
```

**无权限时的响应**

```json
{
  "success": true,
  "data": {
    "app": { /* ... */ },
    "userAccess": {
      "hasAccess": false,
      "reason": "no_access"
    }
  }
}
```

---

## 订阅计划 API

### 3. 获取所有订阅计划

获取平台所有可用的订阅计划。

**请求**

```http
GET /api/plans
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 计划状态：`active`/`inactive`/`all`，默认`active` |

**响应示例**

```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "planId": "plan_premium",
        "name": "Premium 会员",
        "description": "解锁所有应用，无限使用",
        "prices": {
          "monthly": 999,
          "yearly": 9999
        },
        "currency": "usd",
        "benefits": [
          "访问所有应用",
          "优先客服支持",
          "早期体验新功能"
        ],
        "includedApps": "all",
        "stripePriceIds": {
          "monthly": "price_monthly_xxx",
          "yearly": "price_yearly_xxx"
        },
        "status": "active",
        "createdAt": "2025-01-01T00:00:00Z"
      },
      {
        "planId": "plan_starter",
        "name": "Starter 计划",
        "description": "入门级计划，包含3个应用",
        "prices": {
          "monthly": 499,
          "yearly": 4999
        },
        "currency": "usd",
        "benefits": [
          "访问3个精选应用",
          "标准客服支持"
        ],
        "includedApps": ["app_image_editor", "app_video_tools", "app_audio_mixer"],
        "stripePriceIds": {
          "monthly": "price_starter_monthly_xxx",
          "yearly": "price_starter_yearly_xxx"
        },
        "status": "active",
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### 4. 获取单个订阅计划详情

**请求**

```http
GET /api/plans/:planId
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "plan": {
      "planId": "plan_premium",
      "name": "Premium 会员",
      "description": "解锁所有应用，无限使用",
      "prices": {
        "monthly": 999,
        "yearly": 9999
      },
      "currency": "usd",
      "benefits": [
        "访问所有应用",
        "优先客服支持",
        "早期体验新功能"
      ],
      "includedApps": "all",
      "stripePriceIds": {
        "monthly": "price_monthly_xxx",
        "yearly": "price_yearly_xxx"
      },
      "status": "active",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  }
}
```

---

## 购买与订阅 API

### 5. 创建单应用购买会话

创建Stripe Checkout会话，用于用户购买单个应用。

**请求**

```http
POST /api/purchase/create-session
```

**请求体**

```json
{
  "userId": "user_123",
  "appId": "app_image_editor",
  "successUrl": "https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://yourapp.com/store"
}
```

**参数说明**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 用户ID或Stripe Customer ID (cus_xxx) |
| appId | string | 是 | 应用ID |
| successUrl | string | 是 | 支付成功后的回调URL |
| cancelUrl | string | 是 | 支付取消后的回调URL |

**响应示例**

```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_xxx",
    "url": "https://checkout.stripe.com/c/pay/cs_test_xxx",
    "expiresAt": "2025-12-31T01:00:00Z"
  }
}
```

---

### 6. 创建订阅会话

创建Stripe Checkout会话，用于用户订阅计划。

**请求**

```http
POST /api/subscription/create-session
```

**请求体**

```json
{
  "userId": "user_123",
  "planId": "plan_premium",
  "interval": "monthly",
  "successUrl": "https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://yourapp.com/subscriptions"
}
```

**参数说明**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 用户ID或Stripe Customer ID (cus_xxx) |
| planId | string | 是 | 订阅计划ID |
| interval | string | 是 | 订阅周期：`monthly`/`yearly` |
| successUrl | string | 是 | 支付成功后的回调URL |
| cancelUrl | string | 是 | 支付取消后的回调URL |

**响应示例**

```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_xxx",
    "url": "https://checkout.stripe.com/c/pay/cs_test_xxx",
    "expiresAt": "2025-12-31T01:00:00Z"
  }
}
```

---

### 7. 同步支付会话

支付成功后，前端调用此API同步支付结果到后端。

**请求**

```http
POST /api/payment/sync-session
```

**请求体**

```json
{
  "sessionId": "cs_test_xxx"
}
```

**响应示例（购买成功）**

```json
{
  "success": true,
  "data": {
    "type": "purchase",
    "userId": "user_123",
    "appId": "app_image_editor",
    "purchaseDate": "2025-12-31T00:00:00Z",
    "amount": 2999,
    "paymentIntentId": "pi_xxx"
  }
}
```

**响应示例（订阅成功）**

```json
{
  "success": true,
  "data": {
    "type": "subscription",
    "userId": "user_123",
    "subscription": {
      "id": "sub_xxx",
      "planId": "plan_premium",
      "status": "active",
      "currentPeriodEnd": 1735689600,
      "cancelAtPeriodEnd": false
    }
  }
}
```

---

### 8. 取消订阅

取消用户的活跃订阅（周期结束时生效）。

**请求**

```http
POST /api/subscription/cancel
```

**请求体**

```json
{
  "userId": "user_123"
}
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "subscriptionId": "sub_xxx",
    "status": "active",
    "cancelAtPeriodEnd": true,
    "currentPeriodEnd": 1735689600,
    "message": "订阅将在 2025-01-01 到期后取消"
  }
}
```

---

### 9. 恢复订阅

恢复已标记为取消的订阅。

**请求**

```http
POST /api/subscription/reactivate
```

**请求体**

```json
{
  "userId": "user_123"
}
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "subscriptionId": "sub_xxx",
    "status": "active",
    "cancelAtPeriodEnd": false,
    "currentPeriodEnd": 1735689600,
    "message": "订阅已恢复"
  }
}
```

---

## 权限验证 API

### 10. 检查用户对应用的访问权限

检查指定用户是否有权限访问指定应用。

**请求**

```http
GET /api/access/check
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 用户ID |
| appId | string | 是 | 应用ID |

**响应示例（有权限）**

```json
{
  "success": true,
  "data": {
    "hasAccess": true,
    "accessType": "subscription",
    "details": {
      "source": "plan_premium",
      "planName": "Premium 会员",
      "expiresAt": "2026-01-01T00:00:00Z"
    }
  }
}
```

**响应示例（购买的应用）**

```json
{
  "success": true,
  "data": {
    "hasAccess": true,
    "accessType": "purchased",
    "details": {
      "purchaseDate": "2025-01-01T00:00:00Z",
      "paymentIntentId": "pi_xxx"
    }
  }
}
```

**响应示例（无权限）**

```json
{
  "success": true,
  "data": {
    "hasAccess": false,
    "reason": "no_access",
    "purchaseUrl": "/store?app=app_image_editor"
  }
}
```

---

### 11. 获取用户所有可访问的应用

获取用户通过订阅或购买拥有的所有应用。

**请求**

```http
GET /api/access/apps
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 用户ID |

**响应示例**

```json
{
  "success": true,
  "data": {
    "apps": [
      {
        "appId": "app_image_editor",
        "name": "AI 图片编辑器",
        "accessType": "purchased",
        "purchaseDate": "2025-01-01T00:00:00Z"
      },
      {
        "appId": "app_video_tools",
        "name": "视频工具",
        "accessType": "subscription",
        "source": "plan_premium"
      }
    ],
    "subscription": {
      "planId": "plan_premium",
      "planName": "Premium 会员",
      "status": "active",
      "interval": "monthly",
      "currentPeriodEnd": 1735689600,
      "cancelAtPeriodEnd": false
    }
  }
}
```

---

### 12. 获取用户详情

获取用户的完整信息，包括订阅、购买记录等。

**请求**

```http
GET /api/users/:userId
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "user_123",
      "email": "user@example.com",
      "customerId": "cus_stripe_xxx",
      "subscription": {
        "id": "sub_xxx",
        "planId": "plan_premium",
        "status": "active",
        "currentPeriodEnd": 1735689600,
        "cancelAtPeriodEnd": false
      },
      "purchasedApps": [
        {
          "appId": "app_image_editor",
          "purchaseDate": "2025-01-01T00:00:00Z",
          "paymentIntentId": "pi_xxx",
          "amount": 2999
        }
      ],
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-12-31T00:00:00Z"
    }
  }
}
```

---

## Admin 管理 API

### 13. 创建/更新应用

**请求**

```http
POST /api/admin/apps
```

**请求体**

```json
{
  "appId": "app_image_editor",
  "name": "AI 图片编辑器",
  "description": "强大的AI驱动图片编辑工具",
  "stripeProductId": "prod_xxx",
  "stripePriceId": "price_xxx",
  "price": 2999,
  "currency": "usd",
  "status": "active",
  "icon": "https://cdn.example.com/icon.png",
  "category": "design",
  "features": [
    "AI 背景去除",
    "一键美化",
    "批量处理"
  ]
}
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "app": {
      "appId": "app_image_editor",
      "name": "AI 图片编辑器",
      "createdAt": "2025-12-31T00:00:00Z",
      "updatedAt": "2025-12-31T00:00:00Z"
    },
    "message": "应用创建成功"
  }
}
```

---

### 14. 删除应用

**请求**

```http
DELETE /api/admin/apps/:appId
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "appId": "app_image_editor",
    "message": "应用已删除"
  }
}
```

---

### 15. 创建/更新订阅计划

**请求**

```http
POST /api/admin/plans
```

**请求体**

```json
{
  "planId": "plan_premium",
  "name": "Premium 会员",
  "description": "解锁所有应用，无限使用",
  "stripePriceIds": {
    "monthly": "price_monthly_xxx",
    "yearly": "price_yearly_xxx"
  },
  "prices": {
    "monthly": 999,
    "yearly": 9999
  },
  "currency": "usd",
  "benefits": [
    "访问所有应用",
    "优先客服支持",
    "早期体验新功能"
  ],
  "includedApps": "all",
  "status": "active"
}
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "plan": {
      "planId": "plan_premium",
      "name": "Premium 会员",
      "createdAt": "2025-12-31T00:00:00Z"
    },
    "message": "订阅计划创建成功"
  }
}
```

---

### 16. 删除订阅计划

**请求**

```http
DELETE /api/admin/plans/:planId
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "planId": "plan_premium",
    "message": "订阅计划已删除"
  }
}
```

---

### 17. 批量导入应用

从JSON文件或配置批量导入应用。

**请求**

```http
POST /api/admin/apps/batch-import
```

**请求体**

```json
{
  "apps": [
    {
      "appId": "app_image_editor",
      "name": "AI 图片编辑器",
      "stripeProductId": "prod_xxx",
      "stripePriceId": "price_xxx",
      "price": 2999
    },
    {
      "appId": "app_video_tools",
      "name": "视频工具",
      "stripeProductId": "prod_yyy",
      "stripePriceId": "price_yyy",
      "price": 3999
    }
  ]
}
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "imported": 2,
    "failed": 0,
    "apps": [
      {
        "appId": "app_image_editor",
        "status": "created"
      },
      {
        "appId": "app_video_tools",
        "status": "created"
      }
    ]
  }
}
```

---

### 18. 同步Stripe产品和价格

从Stripe同步所有产品和价格信息。

**请求**

```http
POST /api/admin/sync-stripe
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | 同步类型：`apps`/`plans`/`all`，默认`all` |

**响应示例**

```json
{
  "success": true,
  "data": {
    "syncedApps": 12,
    "syncedPlans": 3,
    "timestamp": "2025-12-31T00:00:00Z"
  }
}
```

---

### 19. 获取平台统计数据

**请求**

```http
GET /api/admin/analytics
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期，格式：YYYY-MM-DD |
| endDate | string | 否 | 结束日期，格式：YYYY-MM-DD |

**响应示例**

```json
{
  "success": true,
  "data": {
    "revenue": {
      "mrr": 50000,
      "arr": 600000,
      "totalRevenue": 123456
    },
    "users": {
      "total": 1000,
      "subscribers": 200,
      "oneTimePurchasers": 300,
      "activeSubscribers": 180
    },
    "apps": {
      "total": 12,
      "active": 10,
      "topSelling": [
        {
          "appId": "app_image_editor",
          "name": "AI 图片编辑器",
          "purchases": 150,
          "revenue": 44985
        }
      ]
    },
    "plans": {
      "total": 3,
      "active": 3,
      "subscriptionsByPlan": {
        "plan_premium": 150,
        "plan_starter": 50
      }
    }
  }
}
```

---

## Webhook API

### 20. Stripe Webhook

接收Stripe的webhook事件。

**请求**

```http
POST /api/webhook
```

**请求头**

```
stripe-signature: t=xxx,v1=xxx
```

**请求体**

Stripe标准的webhook事件数据（JSON格式）

**支持的事件类型**

- `checkout.session.completed` - 支付完成
- `customer.subscription.created` - 订阅创建
- `customer.subscription.updated` - 订阅更新
- `customer.subscription.deleted` - 订阅取消
- `invoice.payment_succeeded` - 发票支付成功
- `invoice.payment_failed` - 发票支付失败

**响应示例**

```json
{
  "received": true,
  "eventType": "checkout.session.completed",
  "timestamp": "2025-12-31T00:00:00Z"
}
```

---

## 错误码说明

### 通用错误码

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| INVALID_REQUEST | 400 | 请求参数错误 |
| UNAUTHORIZED | 401 | 未授权 |
| FORBIDDEN | 403 | 无权限 |
| NOT_FOUND | 404 | 资源不存在 |
| CONFLICT | 409 | 资源冲突 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

### 业务错误码

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| APP_NOT_FOUND | 404 | 应用不存在 |
| APP_ALREADY_EXISTS | 409 | 应用已存在 |
| APP_INACTIVE | 400 | 应用已下架 |
| PLAN_NOT_FOUND | 404 | 订阅计划不存在 |
| PLAN_ALREADY_EXISTS | 409 | 订阅计划已存在 |
| PLAN_INACTIVE | 400 | 订阅计划已下架 |
| USER_NOT_FOUND | 404 | 用户不存在 |
| NO_ACCESS | 403 | 无访问权限 |
| ALREADY_PURCHASED | 409 | 已购买该应用 |
| ALREADY_SUBSCRIBED | 409 | 已订阅 |
| NO_ACTIVE_SUBSCRIPTION | 404 | 没有活跃订阅 |
| PAYMENT_SESSION_EXPIRED | 400 | 支付会话已过期 |
| PAYMENT_NOT_COMPLETED | 400 | 支付未完成 |
| STRIPE_API_ERROR | 500 | Stripe API错误 |
| WEBHOOK_VERIFICATION_FAILED | 400 | Webhook签名验证失败 |

---

## 示例场景

### 场景1：用户购买单个应用

```
1. 用户浏览应用商店
   GET /api/apps

2. 用户查看应用详情
   GET /api/apps/app_image_editor?userId=user_123

3. 用户点击购买，创建支付会话
   POST /api/purchase/create-session
   Body: { userId: "user_123", appId: "app_image_editor", ... }

4. 前端跳转到Stripe Checkout
   window.location.href = response.data.url

5. 用户完成支付，Stripe重定向回成功页面
   https://yourapp.com/success?session_id=cs_xxx

6. 前端同步支付结果
   POST /api/payment/sync-session
   Body: { sessionId: "cs_xxx" }

7. 验证用户是否有权限访问应用
   GET /api/access/check?userId=user_123&appId=app_image_editor
```

---

### 场景2：用户订阅平台会员

```
1. 用户查看订阅计划
   GET /api/plans

2. 用户选择计划，创建订阅会话
   POST /api/subscription/create-session
   Body: { userId: "user_123", planId: "plan_premium", interval: "monthly", ... }

3. 前端跳转到Stripe Checkout

4. 用户完成支付，前端同步结果
   POST /api/payment/sync-session

5. 查看用户所有可访问的应用
   GET /api/access/apps?userId=user_123
```

---

### 场景3：用户访问应用时验证权限

```
1. 用户尝试访问应用
   用户访问：https://yourapp.com/apps/app_image_editor

2. 前端检查权限
   GET /api/access/check?userId=user_123&appId=app_image_editor

3a. 如果有权限
   - 显示应用内容

3b. 如果无权限
   - 重定向到购买页面
   window.location.href = "/store?app=app_image_editor"
```

---

## 附录

### 数据类型说明

**Application**
```typescript
interface Application {
  appId: string;
  name: string;
  description: string;
  price: number;              // 单位：分
  currency: string;           // ISO 4217货币代码
  status: 'active' | 'inactive';
  icon: string;               // URL
  category: string;
  features: string[];
  stripeProductId: string;
  stripePriceId: string;
  createdAt: string;          // ISO 8601
  updatedAt: string;          // ISO 8601
}
```

**SubscriptionPlan**
```typescript
interface SubscriptionPlan {
  planId: string;
  name: string;
  description: string;
  prices: {
    monthly: number;          // 单位：分
    yearly: number;           // 单位：分
  };
  currency: string;
  benefits: string[];
  includedApps: 'all' | string[];  // 'all' 或应用ID数组
  stripePriceIds: {
    monthly: string;
    yearly: string;
  };
  status: 'active' | 'inactive';
  createdAt: string;
}
```

**User**
```typescript
interface User {
  userId: string;
  email: string;
  customerId: string;         // Stripe Customer ID
  subscription?: {
    id: string;               // Stripe Subscription ID
    planId: string;
    status: 'active' | 'canceled' | 'past_due';
    currentPeriodEnd: number; // Unix timestamp
    cancelAtPeriodEnd: boolean;
  };
  purchasedApps: Array<{
    appId: string;
    purchaseDate: string;
    paymentIntentId: string;
    amount: number;
  }>;
  createdAt: string;
  updatedAt: string;
}
```

---

**文档版本**：v1.0  
**最后更新**：2025-12-31

