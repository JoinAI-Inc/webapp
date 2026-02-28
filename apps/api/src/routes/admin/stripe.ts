import express, { Request, Response } from 'express';

const router = express.Router();

// POST /api/admin/stripe/sync-products
router.post('/sync-products', async (req: Request, res: Response) => {
    try {
        const { syncProductsFromStripe } = await import('../../services/stripe/sync.js');
        res.json(await syncProductsFromStripe());
    } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// GET /api/admin/stripe/reconcile
router.get('/reconcile', async (req: Request, res: Response) => {
    try {
        const days = parseInt(req.query.days as string) || 30;
        const { reconcileOrders } = await import('../../services/stripe/sync.js');
        res.json(await reconcileOrders(days));
    } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// POST /api/admin/stripe/fix-mismatch
router.post('/fix-mismatch', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });
        const { fixOrderMismatch } = await import('../../services/stripe/sync.js');
        await fixOrderMismatch(sessionId);
        res.json({ success: true });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// POST /api/admin/stripe/sync-subscriptions
router.post('/sync-subscriptions', async (req: Request, res: Response) => {
    try {
        const { syncAllSubscriptions } = await import('../../services/stripe/sync.js');
        res.json(await syncAllSubscriptions());
    } catch (error: any) { res.status(500).json({ error: error.message }); }
});

export default router;
