// Cloudflare Worker V3 - 支持动态价格管理
// 价格配置存储在 KV 中，可在运行时更新

import Stripe from 'stripe';

export default {
    async fetch(request, env) {
        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
            apiVersion: '2023-10-16',
        });

        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // ========== Price Config API (新增) ==========
            if (path === '/api/admin/prices' && request.method === 'GET') {
                return await handleGetPrices(env, corsHeaders);
            }

            if (path === '/api/admin/prices' && request.method === 'POST') {
                return await handleUpdatePrices(request, env, corsHeaders);
            }

            if (path === '/api/admin/prices/sync' && request.method === 'POST') {
                return await handleSyncPricesFromStripe(stripe, env, corsHeaders);
            }

            // ========== Admin API ==========
            if (path === '/api/admin/users' && request.method === 'GET') {
                return await handleGetAllUsers(env, corsHeaders, stripe, url);
            }

            if (path === '/api/admin/users' && request.method === 'POST') {
                return await handleCreateUser(request, stripe, env, corsHeaders);
            }

            if (path.match(/^\/api\/admin\/users\/[^/]+$/) && request.method === 'DELETE') {
                return await handleDeleteUser(request, env, corsHeaders);
            }

            if (path.match(/^\/api\/admin\/users\/[^/]+\/sync$/) && request.method === 'POST') {
                return await handleSyncUser(request, stripe, env, corsHeaders);
            }

            if (path === '/api/admin/sync-all' && request.method === 'POST') {
                return await handleSyncAll(stripe, env, corsHeaders);
            }

            if (path === '/api/admin/import-customers' && request.method === 'POST') {
                return await handleImportCustomers(stripe, env, corsHeaders);
            }

            // ========== Customer API ==========
            if (path === '/api/create-checkout-session' && request.method === 'POST') {
                return await handleCreateCheckoutSession(request, stripe, env, corsHeaders);
            }

            if (path === '/api/sync-session' && request.method === 'POST') {
                return await handleSyncSession(request, stripe, env, corsHeaders);
            }

            if (path.startsWith('/api/subscription/') && request.method === 'GET') {
                return await handleGetSubscription(request, stripe, env, corsHeaders);
            }

            if (path === '/api/cancel-subscription' && request.method === 'POST') {
                return await handleCancelSubscription(request, stripe, env, corsHeaders);
            }

            if (path === '/api/reactivate-subscription' && request.method === 'POST') {
                return await handleReactivateSubscription(request, stripe, env, corsHeaders);
            }

            if (path === '/api/create-portal-session' && request.method === 'POST') {
                return await handleCreatePortalSession(request, stripe, env, corsHeaders);
            }

            if (path === '/api/webhook' && request.method === 'POST') {
                return await handleWebhook(request, stripe, env);
            }

            return new Response(JSON.stringify({ error: 'Not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });

        } catch (error) {
            console.error('Error:', error);
            return new Response(JSON.stringify({
                error: error.message,
                stack: error.stack
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
    },
};

// ==================== Price Management (新增) ====================

// 获取价格配置
async function handleGetPrices(env, corsHeaders) {
    const priceConfig = await env.CUSTOMER_DATA.get('price_config', { type: 'json' });

    if (!priceConfig || Object.keys(priceConfig).length === 0) {
        // 返回空对象（首次使用）
        return new Response(JSON.stringify({}), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // 直接返回价格配置对象
    return new Response(JSON.stringify(priceConfig), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// 更新价格配置
async function handleUpdatePrices(request, env, corsHeaders) {
    const { prices } = await request.json();

    await env.CUSTOMER_DATA.put('price_config', JSON.stringify(prices));

    return new Response(JSON.stringify({
        success: true,
        prices: prices
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// 从 Stripe 同步价格
async function handleSyncPricesFromStripe(stripe, env, corsHeaders) {
    // 获取所有产品和价格
    const products = await stripe.products.list({ limit: 100, active: true });
    const priceConfig = {};

    for (const product of products.data) {
        // 跳过未激活的产品
        if (!product.active) {
            continue;
        }

        // 获取该产品的所有价格
        const prices = await stripe.prices.list({
            product: product.id,
            active: true,
        });

        if (prices.data.length > 0) {
            const price = prices.data[0]; // 使用第一个活跃价格

            // 使用产品 ID 作为配置键（唯一且不会冲突）
            const configKey = product.id;

            priceConfig[configKey] = {
                priceId: price.id,
                productId: product.id,
                productName: product.name,
                amount: price.unit_amount,
                currency: price.currency,
                type: price.type,
                recurring: price.recurring ? {
                    interval: price.recurring.interval,
                    interval_count: price.recurring.interval_count,
                } : null,
                active: price.active,
                created: price.created,
            };
        }
    }

    // 保存到 KV
    await env.CUSTOMER_DATA.put('price_config', JSON.stringify(priceConfig));

    return new Response(JSON.stringify({
        success: true,
        syncedPrices: Object.keys(priceConfig).length,
        prices: priceConfig
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}


// ==================== Admin 功能 ====================

// 获取所有用户
async function handleGetAllUsers(env, corsHeaders, stripe, url) {
    // 支持查询参数：source=stripe 表示从 Stripe 实时读取
    const source = url.searchParams.get('source') || 'kv';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

    if (source === 'stripe') {
        // 🚀 直接从 Stripe API 实时获取所有客户（带分页）
        const customers = await stripe.customers.list({
            limit: pageSize,
            // Stripe 使用游标分页，这里简化处理
        });

        const users = [];

        // 并行获取所有客户的详细数据（提升性能）
        await Promise.all(customers.data.map(async (customer) => {
            try {
                // 并行获取订阅、发票和支付记录
                const [subscriptions, invoices, charges] = await Promise.all([
                    stripe.subscriptions.list({
                        customer: customer.id,
                        limit: 10,
                    }),
                    stripe.invoices.list({
                        customer: customer.id,
                        limit: 100,
                        status: 'paid',
                    }),
                    stripe.charges.list({
                        customer: customer.id,
                        limit: 100,
                    })
                ]);

                // 获取所有已成功的支付
                const successfulCharges = charges.data.filter(charge =>
                    charge.paid && !charge.refunded
                );

                // 找出没有发票关联的直接支付（一次性购买）
                const chargesWithoutInvoice = successfulCharges.filter(charge =>
                    !charge.invoice
                );

                // 计算总支付金额（从所有成功的支付）
                const totalSpent = successfulCharges.reduce((sum, charge) => {
                    return sum + (charge.amount || 0);
                }, 0) / 100; // 转换为美元

                // 区分订阅支付和一次性购买
                const subscriptionInvoices = invoices.data.filter(inv =>
                    inv.subscription !== null
                );

                // 一次性购买：没有关联发票的直接支付 + 手动创建的发票
                const oneTimePurchases = [
                    // 直接支付（没有发票）
                    ...chargesWithoutInvoice.map(charge => ({
                        id: charge.id,
                        type: 'charge',
                        amount: charge.amount / 100,
                        description: charge.description || charge.metadata?.description || '一次性购买',
                        created: charge.created,
                        createdDate: new Date(charge.created * 1000).toLocaleDateString(),
                    })),
                    // 手动发票（没有订阅）
                    ...invoices.data
                        .filter(inv => inv.subscription === null && inv.billing_reason === 'manual')
                        .map(inv => ({
                            id: inv.id,
                            type: 'invoice',
                            amount: inv.amount_paid / 100,
                            description: inv.description || inv.lines?.data[0]?.description || '一次性购买',
                            created: inv.created,
                            createdDate: new Date(inv.created * 1000).toLocaleDateString(),
                        }))
                ];

                const userData = {
                    userId: `stripe_${customer.id}`, // 临时 ID
                    name: customer.name || customer.email?.split('@')[0] || 'Unknown',
                    email: customer.email,
                    phone: customer.phone,
                    customerId: customer.id,
                    createdAt: customer.created ? new Date(customer.created * 1000).toISOString() : new Date().toISOString(),
                    // 订阅信息（活跃的订阅）
                    subscriptions: subscriptions.data.map(sub => ({
                        id: sub.id,
                        status: sub.status,
                        planName: sub.items.data[0].price.recurring?.interval === 'month' ? '月度订阅' : '年度订阅',
                        amount: sub.items.data[0].price.unit_amount,
                        interval: sub.items.data[0].price.recurring?.interval || 'one_time',
                        current_period_end: sub.current_period_end,
                        cancel_at_period_end: sub.cancel_at_period_end,
                    })),
                    // 订阅数量（活跃订阅）
                    subscriptionCount: subscriptions.data.filter(sub => sub.status === 'active' || sub.status === 'trialing').length,
                    // 一次性购买记录（已经包含了 charges 和 invoices）
                    purchases: oneTimePurchases,
                    // 一次性购买数量
                    purchaseCount: oneTimePurchases.length,
                    // 总支付金额（包括订阅和一次性购买）
                    totalSpent: totalSpent,
                };

                users.push(userData);
            } catch (error) {
                console.error(`Error fetching data for customer ${customer.id}:`, error);
                // 即使单个客户数据获取失败，也继续处理其他客户
            }
        }));

        return new Response(JSON.stringify({
            users,
            source: 'stripe',
            count: users.length,
            page: page,
            pageSize: pageSize,
            hasMore: customers.has_more
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } else {
        // 📦 从 KV 缓存读取（快速但可能不是最新）
        const usersList = await env.CUSTOMER_DATA.get('users_list', { type: 'json' }) || [];
        const users = [];

        for (const userId of usersList) {
            const userData = await env.CUSTOMER_DATA.get(`user:${userId}`, { type: 'json' });
            if (userData) {
                users.push(userData);
            }
        }

        return new Response(JSON.stringify({
            users,
            source: 'kv',
            count: users.length
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}

// 创建用户
async function handleCreateUser(request, stripe, env, corsHeaders) {
    const { username, email, phone } = await request.json();

    const customer = await stripe.customers.create({
        name: username,
        email: email,
        phone: phone,
        metadata: {
            source: 'test_system'
        }
    });

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const userData = {
        userId: userId,
        name: username,
        email: email,
        phone: phone,
        customerId: customer.id,
        subscriptions: [],
        purchases: [],
        totalSpent: 0,
        createdAt: new Date().toISOString(),
    };

    await env.CUSTOMER_DATA.put(`user:${userId}`, JSON.stringify(userData));

    const usersList = await env.CUSTOMER_DATA.get('users_list', { type: 'json' }) || [];
    usersList.push(userId);
    await env.CUSTOMER_DATA.put('users_list', JSON.stringify(usersList));

    return new Response(JSON.stringify({
        success: true,
        userId: userId,
        customerId: customer.id,
        user: userData
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// 删除用户
async function handleDeleteUser(request, env, corsHeaders) {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();

    await env.CUSTOMER_DATA.delete(`user:${userId}`);

    const usersList = await env.CUSTOMER_DATA.get('users_list', { type: 'json' }) || [];
    const newUsersList = usersList.filter(id => id !== userId);
    await env.CUSTOMER_DATA.put('users_list', JSON.stringify(newUsersList));

    return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// 同步单个用户数据
async function handleSyncUser(request, stripe, env, corsHeaders) {
    const url = new URL(request.url);
    const userId = url.pathname.split('/')[4];

    const userData = await env.CUSTOMER_DATA.get(`user:${userId}`, { type: 'json' });
    if (!userData) {
        throw new Error('User not found');
    }

    const subscriptions = await stripe.subscriptions.list({
        customer: userData.customerId,
        limit: 100,
    });

    const charges = await stripe.charges.list({
        customer: userData.customerId,
        limit: 100,
    });

    userData.subscriptions = subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        planName: sub.items.data[0].price.recurring?.interval === 'month' ? '月度订阅' : '年度订阅',
        amount: sub.items.data[0].price.unit_amount,
        interval: sub.items.data[0].price.recurring?.interval || 'one_time',
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
    }));

    userData.purchases = charges.data
        .filter(charge => charge.paid && !charge.refunded)
        .map(charge => ({
            id: charge.id,
            amount: charge.amount,
            description: charge.description,
            created: charge.created,
        }));

    userData.totalSpent = charges.data.reduce((sum, charge) => {
        return charge.paid && !charge.refunded ? sum + charge.amount : sum;
    }, 0) / 100;

    await env.CUSTOMER_DATA.put(`user:${userId}`, JSON.stringify(userData));

    return new Response(JSON.stringify({
        success: true,
        user: userData
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// 从 Stripe 导入所有客户
async function handleImportCustomers(stripe, env, corsHeaders) {
    // 获取 Stripe 上的所有客户
    const customers = await stripe.customers.list({ limit: 100 });

    let importedCount = 0;
    let updatedCount = 0;
    const usersList = await env.CUSTOMER_DATA.get('users_list', { type: 'json' }) || [];

    for (const customer of customers.data) {
        // 尝试通过 customerId 查找已有用户
        let existingUserId = null;
        for (const userId of usersList) {
            const userData = await env.CUSTOMER_DATA.get(`user:${userId}`, { type: 'json' });
            if (userData?.customerId === customer.id) {
                existingUserId = userId;
                break;
            }
        }

        let userData;
        let userId;

        if (existingUserId) {
            // 用户已存在，更新数据
            userId = existingUserId;
            userData = await env.CUSTOMER_DATA.get(`user:${userId}`, { type: 'json' });
            updatedCount++;
        } else {
            // 创建新用户
            userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            userData = {
                userId: userId,
                name: customer.name || customer.email?.split('@')[0] || 'Unknown',
                email: customer.email,
                phone: customer.phone,
                customerId: customer.id,
                createdAt: customer.created ? new Date(customer.created * 1000).toISOString() : new Date().toISOString(),
                purchases: [],
                subscriptions: [],
            };

            // 添加到用户列表
            if (!usersList.includes(userId)) {
                usersList.push(userId);
            }
            importedCount++;
        }

        // 从 Stripe 获取该客户的订阅信息
        const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            limit: 100,
        });

        userData.subscriptions = subscriptions.data.map(sub => ({
            id: sub.id,
            status: sub.status,
            planName: sub.items.data[0].price.recurring?.interval === 'month' ? '月度订阅' : '年度订阅',
            amount: sub.items.data[0].price.unit_amount,
            interval: sub.items.data[0].price.recurring?.interval || 'one_time',
            current_period_end: sub.current_period_end,
            cancel_at_period_end: sub.cancel_at_period_end,
        }));

        // 保存用户数据
        await env.CUSTOMER_DATA.put(`user:${userId}`, JSON.stringify(userData));
    }

    // 更新用户列表
    await env.CUSTOMER_DATA.put('users_list', JSON.stringify(usersList));

    return new Response(JSON.stringify({
        success: true,
        importedCount,
        updatedCount,
        totalCustomers: customers.data.length
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// 同步所有用户
async function handleSyncAll(stripe, env, corsHeaders) {
    const usersList = await env.CUSTOMER_DATA.get('users_list', { type: 'json' }) || [];
    let syncedUsers = 0;
    let updatedSubscriptions = 0;

    for (const userId of usersList) {
        try {
            const userData = await env.CUSTOMER_DATA.get(`user:${userId}`, { type: 'json' });
            if (userData && userData.customerId) {
                const subscriptions = await stripe.subscriptions.list({
                    customer: userData.customerId,
                });

                userData.subscriptions = subscriptions.data.map(sub => ({
                    id: sub.id,
                    status: sub.status,
                    planName: sub.items.data[0].price.recurring?.interval === 'month' ? '月度订阅' : '年度订阅',
                    amount: sub.items.data[0].price.unit_amount,
                    interval: sub.items.data[0].price.recurring?.interval || 'one_time',
                    current_period_end: sub.current_period_end,
                    cancel_at_period_end: sub.cancel_at_period_end,
                }));

                await env.CUSTOMER_DATA.put(`user:${userId}`, JSON.stringify(userData));
                syncedUsers++;
                updatedSubscriptions += subscriptions.data.length;
            }
        } catch (error) {
            console.error(`Error syncing user ${userId}:`, error);
        }
    }

    return new Response(JSON.stringify({
        success: true,
        syncedUsers,
        updatedSubscriptions
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// ==================== Customer 功能 ====================

// 创建 Checkout Session（使用动态价格）
async function handleCreateCheckoutSession(request, stripe, env, corsHeaders) {
    const body = await request.json();
    const { plan, userId, successUrl, cancelUrl } = body;

    // 🎯 从 KV 获取价格配置
    const priceConfig = await env.CUSTOMER_DATA.get('price_config', { type: 'json' });
    if (!priceConfig || !priceConfig[plan]) {
        throw new Error(`Price configuration for '${plan}' not found. Please sync prices from Stripe.`);
    }

    const selectedPrice = priceConfig[plan];
    const priceId = selectedPrice.priceId;

    // 根据价格类型判断 mode
    const mode = selectedPrice.type === 'recurring' ? 'subscription' : 'payment';

    // 构建 Session 参数
    const sessionParams = {
        mode: mode,
        line_items: [{
            price: priceId,
            quantity: 1,
        }],
        payment_method_types: ['card', 'alipay', 'paypal'],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
            userId: userId,
            plan: plan,
        },
    };

    // 🔍 智能识别 customerId：支持直接传递 Stripe Customer ID 或从 KV 查找
    let customerId = null;

    // 如果 userId 是 Stripe Customer ID 格式（cus_xxx），直接使用
    if (userId.startsWith('cus_')) {
        customerId = userId;
        console.log('Using Stripe Customer ID directly:', customerId);
    } else {
        // 否则从 KV 中查找用户数据
        const userData = await env.CUSTOMER_DATA.get(`user:${userId}`, { type: 'json' });
        if (userData?.customerId) {
            customerId = userData.customerId;
            console.log('Found customerId from KV:', customerId);
        }
    }

    // 如果找到了 customerId，关联到现有客户
    if (customerId) {
        sessionParams.customer = customerId;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // 💾 立即保存 session 信息到 KV，用于后续查询
    await env.CUSTOMER_DATA.put(`session:${session.id}`, JSON.stringify({
        userId: userId,
        sessionId: session.id,
        customerId: session.customer,
        mode: mode,
        plan: plan,
        createdAt: new Date().toISOString(),
    }), {
        expirationTtl: 86400, // 24小时后自动删除
    });

    // ✅ 返回 session.url，让前端直接跳转（官方推荐方式）
    return new Response(JSON.stringify({
        sessionId: session.id,
        url: session.url
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// 同步 Checkout Session（支付成功后调用，不依赖 webhook）
async function handleSyncSession(request, stripe, env, corsHeaders) {
    const { sessionId } = await request.json();

    if (!sessionId) {
        throw new Error('Session ID is required');
    }

    // 从 Stripe 获取 session 详情
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
        return new Response(JSON.stringify({
            success: false,
            message: 'Payment not completed yet'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const userId = session.metadata.userId;
    const customerId = session.customer;

    // 获取或创建用户数据
    let userData = await env.CUSTOMER_DATA.get(`user:${userId}`, { type: 'json' });

    if (!userData) {
        // 首次购买，创建新用户
        userData = {
            userId: userId,
            email: session.customer_details?.email || session.customer_email,
            customerId: customerId,
            createdAt: new Date().toISOString(),
            purchases: [],
            subscriptions: [],
        };

        // 添加到用户列表
        const usersList = await env.CUSTOMER_DATA.get('users_list', { type: 'json' }) || [];
        if (!usersList.includes(userId)) {
            usersList.push(userId);
            await env.CUSTOMER_DATA.put('users_list', JSON.stringify(usersList));
        }
    } else {
        // 用户已存在，更新 customerId（如果 checkout 时创建了新 customer）
        if (customerId) {
            userData.customerId = customerId;
            console.log(`Updated customerId for user ${userId}: ${customerId}`);
        }
        // 更新邮箱（如果有）
        if (session.customer_details?.email || session.customer_email) {
            userData.email = session.customer_details?.email || session.customer_email;
        }
    }

    // 如果是订阅模式，从 Stripe 实时获取订阅信息
    if (session.mode === 'subscription' && userData.customerId) {
        const subscriptions = await stripe.subscriptions.list({
            customer: userData.customerId,
            limit: 10,
        });

        userData.subscriptions = subscriptions.data.map(sub => ({
            id: sub.id,
            status: sub.status,
            planName: sub.items.data[0].price.recurring?.interval === 'month' ? '月度订阅' : '年度订阅',
            amount: sub.items.data[0].price.unit_amount,
            interval: sub.items.data[0].price.recurring?.interval || 'one_time',
            current_period_end: sub.current_period_end,
            cancel_at_period_end: sub.cancel_at_period_end,
        }));
    }

    // 如果是一次性购买
    if (session.mode === 'payment') {
        userData.purchases = userData.purchases || [];
        userData.purchases.push({
            sessionId: sessionId,
            purchaseDate: new Date().toISOString(),
            paymentIntentId: session.payment_intent,
            amount: session.amount_total,
        });
    }

    // 保存用户数据
    await env.CUSTOMER_DATA.put(`user:${userId}`, JSON.stringify(userData));

    return new Response(JSON.stringify({
        success: true,
        user: userData
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// 获取订阅信息
async function handleGetSubscription(request, stripe, env, corsHeaders) {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();

    let customerId = null;
    let userEmail = null;
    let userName = null;

    // 🔍 智能识别：支持直接传递 Stripe Customer ID 或从 KV 查找
    if (userId.startsWith('cus_')) {
        // 直接使用 Stripe Customer ID
        customerId = userId;

        // 从 Stripe 获取客户信息
        try {
            const customer = await stripe.customers.retrieve(customerId);
            userEmail = customer.email;
            userName = customer.name || customer.email?.split('@')[0];
        } catch (error) {
            console.error('Failed to retrieve customer from Stripe:', error);
        }
    } else {
        // 从 KV 中查找用户数据
        const userData = await env.CUSTOMER_DATA.get(`user:${userId}`, { type: 'json' });

        if (!userData) {
            return new Response(JSON.stringify({
                error: 'No user found',
                subscription: null,
                purchases: []
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        customerId = userData.customerId;
        userEmail = userData.email;
        userName = userData.name;
    }

    // 如果没有 customerId，返回错误
    if (!customerId) {
        return new Response(JSON.stringify({
            error: 'No customer ID found',
            subscription: null,
            purchases: []
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // 并行获取订阅、发票和支付记录
    const [subscriptions, invoices, charges] = await Promise.all([
        stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
            limit: 10,
        }),
        stripe.invoices.list({
            customer: customerId,
            limit: 100,
            status: 'paid',
        }),
        stripe.charges.list({
            customer: customerId,
            limit: 100,
        })
    ]);

    let subscriptionData = null;
    if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0];
        const price = sub.items.data[0].price;

        subscriptionData = {
            id: sub.id,
            status: sub.status,
            planName: price.recurring?.interval === 'month' ? '月度订阅' : '年度订阅',
            amount: price.unit_amount,
            interval: price.recurring?.interval || 'one_time',
            current_period_end: sub.current_period_end,
            cancel_at_period_end: sub.cancel_at_period_end,
        };
    }

    // 获取所有已成功的支付
    const successfulCharges = charges.data.filter(charge =>
        charge.paid && !charge.refunded
    );

    // 找出没有发票关联的直接支付（一次性购买）
    const chargesWithoutInvoice = successfulCharges.filter(charge =>
        !charge.invoice
    );

    // 一次性购买：没有关联发票的直接支付 + 手动创建的发票
    const oneTimePurchases = [
        // 直接支付（没有发票）
        ...chargesWithoutInvoice.map(charge => ({
            id: charge.id,
            type: 'charge',
            amount: charge.amount / 100,
            description: charge.description || charge.metadata?.description || '一次性购买',
            created: charge.created,
            createdDate: new Date(charge.created * 1000).toLocaleDateString(),
        })),
        // 手动发票（没有订阅）
        ...invoices.data
            .filter(inv => inv.subscription === null && inv.billing_reason === 'manual')
            .map(inv => ({
                id: inv.id,
                type: 'invoice',
                amount: inv.amount_paid / 100,
                description: inv.description || inv.lines?.data[0]?.description || '一次性购买',
                created: inv.created,
                createdDate: new Date(inv.created * 1000).toLocaleDateString(),
            }))
    ];

    return new Response(JSON.stringify({
        subscription: subscriptionData,
        purchases: oneTimePurchases,
        user: {
            name: userName,
            email: userEmail,
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// 取消订阅
async function handleCancelSubscription(request, stripe, env, corsHeaders) {
    const body = await request.json();
    const { userId } = body;

    const userData = await env.CUSTOMER_DATA.get(`user:${userId}`, { type: 'json' });
    if (!userData) {
        throw new Error('User not found');
    }

    const subscriptions = await stripe.subscriptions.list({
        customer: userData.customerId,
        status: 'active',
        limit: 1,
    });

    if (subscriptions.data.length === 0) {
        throw new Error('No active subscription found');
    }

    const subscription = await stripe.subscriptions.update(subscriptions.data[0].id, {
        cancel_at_period_end: true,
    });

    return new Response(JSON.stringify({
        success: true,
        subscription: {
            id: subscription.id,
            cancel_at_period_end: subscription.cancel_at_period_end,
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// 恢复订阅
async function handleReactivateSubscription(request, stripe, env, corsHeaders) {
    const body = await request.json();
    const { userId } = body;

    const userData = await env.CUSTOMER_DATA.get(`user:${userId}`, { type: 'json' });
    if (!userData) {
        throw new Error('User not found');
    }

    const subscriptions = await stripe.subscriptions.list({
        customer: userData.customerId,
        limit: 1,
    });

    if (subscriptions.data.length === 0) {
        throw new Error('No subscription found');
    }

    const subscription = await stripe.subscriptions.update(subscriptions.data[0].id, {
        cancel_at_period_end: false,
    });

    return new Response(JSON.stringify({
        success: true,
        subscription: {
            id: subscription.id,
            cancel_at_period_end: subscription.cancel_at_period_end,
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// 创建 Customer Portal Session
async function handleCreatePortalSession(request, stripe, env, corsHeaders) {
    const body = await request.json();
    const { userId, returnUrl } = body;

    const userData = await env.CUSTOMER_DATA.get(`user:${userId}`, { type: 'json' });
    if (!userData) {
        throw new Error('User not found');
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: userData.customerId,
        return_url: returnUrl,
    });

    return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// 处理 Webhook
async function handleWebhook(request, stripe, env) {
    const signature = request.headers.get('stripe-signature');
    const body = await request.text();

    let event;
    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object, stripe, env);
                break;

            case 'invoice.payment_succeeded':
                console.log('Payment succeeded:', event.data.object.id);
                break;

            case 'invoice.payment_failed':
                console.log('Payment failed:', event.data.object.id);
                break;

            case 'customer.subscription.deleted':
                console.log('Subscription deleted:', event.data.object.id);
                break;

            case 'customer.subscription.updated':
                console.log('Subscription updated:', event.data.object.id);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error processing webhook:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// 处理 Checkout 完成
async function handleCheckoutCompleted(session, stripe, env) {
    const userId = session.metadata.userId;
    const plan = session.metadata.plan;

    // 获取或创建用户数据
    let userData = await env.CUSTOMER_DATA.get(`user:${userId}`, { type: 'json' });

    if (!userData) {
        // 首次购买，创建新用户
        console.log('Creating new user:', userId);
        userData = {
            userId: userId,
            email: session.customer_details?.email || session.customer_email,
            customerId: session.customer,
            createdAt: new Date().toISOString(),
            purchases: [],
            subscriptions: [],
        };
    }

    // 更新用户的 Stripe Customer ID（如果还没有）
    if (session.customer && !userData.customerId) {
        userData.customerId = session.customer;
    }

    // 处理订阅
    if (session.mode === 'subscription') {
        console.log('Subscription created, syncing subscription data for user:', userId);

        // 从 Stripe 获取最新的订阅信息
        const subscriptions = await stripe.subscriptions.list({
            customer: userData.customerId,
            limit: 10,
        });

        userData.subscriptions = subscriptions.data.map(sub => ({
            id: sub.id,
            status: sub.status,
            planName: sub.items.data[0].price.recurring?.interval === 'month' ? '月度订阅' : '年度订阅',
            amount: sub.items.data[0].price.unit_amount,
            interval: sub.items.data[0].price.recurring?.interval || 'one_time',
            current_period_end: sub.current_period_end,
            cancel_at_period_end: sub.cancel_at_period_end,
        }));

        console.log('Synced subscriptions:', userData.subscriptions.length);
    }

    // 处理一次性购买
    if (plan.startsWith('app_') || session.mode === 'payment') {
        userData.purchases = userData.purchases || [];
        userData.purchases.push({
            appId: plan,
            purchaseDate: new Date().toISOString(),
            paymentIntentId: session.payment_intent,
        });
    }

    // 保存用户数据
    await env.CUSTOMER_DATA.put(`user:${userId}`, JSON.stringify(userData));

    console.log('Checkout completed for user:', userId, 'plan:', plan, 'mode:', session.mode);
}

