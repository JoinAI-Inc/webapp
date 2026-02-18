"""
Mock数据定义
用于单元测试（不依赖真实API）
"""

# 应用列表Mock数据
MOCK_APPS_LIST = {
    "success": True,
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
                "features": ["AI 背景去除", "一键美化", "批量处理"],
                "stripeProductId": "prod_test_xxx",
                "stripePriceId": "price_test_xxx",
                "createdAt": "2025-01-01T00:00:00Z",
                "updatedAt": "2025-01-01T00:00:00Z"
            },
            {
                "appId": "app_video_tools",
                "name": "视频工具",
                "description": "专业的视频编辑和处理工具",
                "price": 3999,
                "currency": "usd",
                "status": "active",
                "icon": "https://cdn.example.com/video-icon.png",
                "category": "video",
                "features": ["视频剪辑", "格式转换", "水印添加"],
                "stripeProductId": "prod_test_yyy",
                "stripePriceId": "price_test_yyy",
                "createdAt": "2025-01-01T00:00:00Z",
                "updatedAt": "2025-01-01T00:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "pageSize": 20,
            "total": 2,
            "totalPages": 1
        }
    }
}

# 单个应用详情Mock数据
MOCK_APP_DETAIL = {
    "success": True,
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
            "stripeProductId": "prod_test_xxx",
            "stripePriceId": "price_test_xxx",
            "createdAt": "2025-01-01T00:00:00Z",
            "updatedAt": "2025-01-01T00:00:00Z"
        },
        "userAccess": {
            "hasAccess": True,
            "accessType": "subscription",
            "source": "plan_premium",
            "expiresAt": "2026-01-01T00:00:00Z"
        }
    }
}

# 订阅计划列表Mock数据
MOCK_PLANS_LIST = {
    "success": True,
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
                "benefits": ["访问所有应用", "优先客服支持", "早期体验新功能"],
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
                "benefits": ["访问3个精选应用", "标准客服支持"],
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

# 单个计划详情Mock数据
MOCK_PLAN_DETAIL = {
    "success": True,
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
            "benefits": ["访问所有应用", "优先客服支持", "早期体验新功能"],
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

# 创建购买会话Mock数据
MOCK_CREATE_PURCHASE_SESSION = {
    "success": True,
    "data": {
        "sessionId": "cs_test_mock123",
        "url": "https://checkout.stripe.com/c/pay/cs_test_mock123",
        "expiresAt": "2025-12-31T01:00:00Z"
    }
}

# 创建订阅会话Mock数据
MOCK_CREATE_SUBSCRIPTION_SESSION = {
    "success": True,
    "data": {
        "sessionId": "cs_test_mock456",
        "url": "https://checkout.stripe.com/c/pay/cs_test_mock456",
        "expiresAt": "2025-12-31T01:00:00Z"
    }
}

# 同步支付会话（购买）Mock数据
MOCK_SYNC_PURCHASE_SESSION = {
    "success": True,
    "data": {
        "type": "purchase",
        "userId": "test_user_123",
        "appId": "app_image_editor",
        "purchaseDate": "2025-12-31T00:00:00Z",
        "amount": 2999,
        "paymentIntentId": "pi_test_xxx"
    }
}

# 同步支付会话（订阅）Mock数据
MOCK_SYNC_SUBSCRIPTION_SESSION = {
    "success": True,
    "data": {
        "type": "subscription",
        "userId": "test_user_123",
        "subscription": {
            "id": "sub_test_xxx",
            "planId": "plan_premium",
            "status": "active",
            "currentPeriodEnd": 1735689600,
            "cancelAtPeriodEnd": False
        }
    }
}

# 取消订阅Mock数据
MOCK_CANCEL_SUBSCRIPTION = {
    "success": True,
    "data": {
        "subscriptionId": "sub_test_xxx",
        "status": "active",
        "cancelAtPeriodEnd": True,
        "currentPeriodEnd": 1735689600,
        "message": "订阅将在 2025-01-01 到期后取消"
    }
}

# 恢复订阅Mock数据
MOCK_REACTIVATE_SUBSCRIPTION = {
    "success": True,
    "data": {
        "subscriptionId": "sub_test_xxx",
        "status": "active",
        "cancelAtPeriodEnd": False,
        "currentPeriodEnd": 1735689600,
        "message": "订阅已恢复"
    }
}

# 检查权限（有权限）Mock数据
MOCK_ACCESS_CHECK_HAS_ACCESS = {
    "success": True,
    "data": {
        "hasAccess": True,
        "accessType": "subscription",
        "details": {
            "source": "plan_premium",
            "planName": "Premium 会员",
            "expiresAt": "2026-01-01T00:00:00Z"
        }
    }
}

# 检查权限（无权限）Mock数据
MOCK_ACCESS_CHECK_NO_ACCESS = {
    "success": True,
    "data": {
        "hasAccess": False,
        "reason": "no_access",
        "purchaseUrl": "/store?app=app_image_editor"
    }
}

# 获取用户可访问的应用Mock数据
MOCK_USER_ACCESSIBLE_APPS = {
    "success": True,
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
            "cancelAtPeriodEnd": False
        }
    }
}

# 获取用户详情Mock数据
MOCK_USER_DETAIL = {
    "success": True,
    "data": {
        "user": {
            "userId": "test_user_123",
            "email": "test@example.com",
            "customerId": "cus_test_xxx",
            "subscription": {
                "id": "sub_test_xxx",
                "planId": "plan_premium",
                "status": "active",
                "currentPeriodEnd": 1735689600,
                "cancelAtPeriodEnd": False
            },
            "purchasedApps": [
                {
                    "appId": "app_image_editor",
                    "purchaseDate": "2025-01-01T00:00:00Z",
                    "paymentIntentId": "pi_test_xxx",
                    "amount": 2999
                }
            ],
            "createdAt": "2025-01-01T00:00:00Z",
            "updatedAt": "2025-12-31T00:00:00Z"
        }
    }
}

# 创建应用（Admin）Mock数据
MOCK_CREATE_APP = {
    "success": True,
    "data": {
        "app": {
            "appId": "app_new_tool",
            "name": "新工具",
            "createdAt": "2025-12-31T00:00:00Z",
            "updatedAt": "2025-12-31T00:00:00Z"
        },
        "message": "应用创建成功"
    }
}

# 删除应用（Admin）Mock数据
MOCK_DELETE_APP = {
    "success": True,
    "data": {
        "appId": "app_image_editor",
        "message": "应用已删除"
    }
}

# 创建订阅计划（Admin）Mock数据
MOCK_CREATE_PLAN = {
    "success": True,
    "data": {
        "plan": {
            "planId": "plan_new",
            "name": "新计划",
            "createdAt": "2025-12-31T00:00:00Z"
        },
        "message": "订阅计划创建成功"
    }
}

# 删除订阅计划（Admin）Mock数据
MOCK_DELETE_PLAN = {
    "success": True,
    "data": {
        "planId": "plan_premium",
        "message": "订阅计划已删除"
    }
}

# 批量导入应用（Admin）Mock数据
MOCK_BATCH_IMPORT_APPS = {
    "success": True,
    "data": {
        "imported": 2,
        "failed": 0,
        "apps": [
            {"appId": "app_image_editor", "status": "created"},
            {"appId": "app_video_tools", "status": "created"}
        ]
    }
}

# 同步Stripe数据（Admin）Mock数据
MOCK_SYNC_STRIPE = {
    "success": True,
    "data": {
        "syncedApps": 12,
        "syncedPlans": 3,
        "timestamp": "2025-12-31T00:00:00Z"
    }
}

# 获取统计数据（Admin）Mock数据
MOCK_ANALYTICS = {
    "success": True,
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

# 错误响应Mock数据
MOCK_ERROR_NOT_FOUND = {
    "success": False,
    "error": {
        "code": "APP_NOT_FOUND",
        "message": "应用不存在",
        "details": {}
    },
    "timestamp": "2025-12-31T00:00:00Z"
}

MOCK_ERROR_NO_ACCESS = {
    "success": False,
    "error": {
        "code": "NO_ACCESS",
        "message": "无访问权限",
        "details": {}
    },
    "timestamp": "2025-12-31T00:00:00Z"
}

MOCK_ERROR_INVALID_REQUEST = {
    "success": False,
    "error": {
        "code": "INVALID_REQUEST",
        "message": "请求参数错误",
        "details": {}
    },
    "timestamp": "2025-12-31T00:00:00Z"
}

