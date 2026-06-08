// 支付相关API路由
import express, { Request, Response } from 'express';
import {
    createCheckoutSession,
    syncCheckoutSession,
    constructWebhookEvent,
    handleWebhookEvent
} from '../services/stripe/index.js';
import { authenticateJWTOrInternal, AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/payment/create-checkout
 * 创建Stripe Checkout Session（需要 JWT 或内部签名认证）
 */
router.post('/create-checkout', authenticateJWTOrInternal, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { pricingPlanId, successUrl, cancelUrl, billingInterval } = req.body;

        if (!pricingPlanId) {
            return res.status(400).json({ error: 'pricingPlanId is required' });
        }

        const result = await createCheckoutSession({
            userId: userId,
            pricingPlanId: BigInt(pricingPlanId),
            successUrl: successUrl || `${process.env.APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: cancelUrl || `${process.env.APP_URL}/payment/cancel`,
            billingInterval
        });

        // Serialize BigInt
        const serialized = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        res.json(serialized);
    } catch (error: any) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/payment/sync-session
 * 同步Checkout Session结果（支付成功后前端调用）
 */
router.post('/sync-session', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: 'sessionId is required' });
        }

        const result = await syncCheckoutSession({ sessionId });

        // Serialize BigInt
        const serialized = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        res.json(serialized);
    } catch (error: any) {
        console.error('Error syncing session:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/payment/webhook
 * Stripe Webhook端点
 * 
 * 注意：这个路由需要特殊处理，body必须是raw buffer
 * 需要在主app中为这个路由配置: express.raw({ type: 'application/json' })
 */
router.post('/webhook', async (req: Request, res: Response) => {
    try {
        // 验证并解析webhook事件
        const event = constructWebhookEvent(req);

        // 异步处理事件（不阻塞响应）
        handleWebhookEvent(event).catch(error => {
            console.error('[Webhook] Error processing event:', error);
        });

        // 立即返回200，告诉Stripe我们收到了
        res.json({ received: true });
    } catch (error: any) {
        console.error('[Webhook] Error:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;
