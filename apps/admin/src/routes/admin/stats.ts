import express, { Request, Response } from 'express';
import { prisma } from '@repo/database';

const router = express.Router();

// GET /api/admin/stats/revenue
router.get('/revenue', async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const orders = await prisma.order.findMany({
            where: { status: 'PAID', createdAt: { gte: sevenDaysAgo } },
            select: { amount: true, createdAt: true }
        });

        const revenueByDate: Record<string, number> = {};
        orders.forEach(order => {
            const dateKey = order.createdAt.toISOString().split('T')[0];
            revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + Number(order.amount);
        });

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            date.setHours(0, 0, 0, 0);
            data.push({ name: dayNames[date.getDay()], revenue: revenueByDate[date.toISOString().split('T')[0]] || 0 });
        }
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/stats/overview
router.get('/overview', async (req: Request, res: Response) => {
    try {
        const [totalOrdersCount, paidOrders, totalUsers, activeEntitlements] = await Promise.all([
            prisma.order.count(),
            prisma.order.findMany({ where: { status: 'PAID' }, select: { amount: true, createdAt: true } }),
            prisma.user.count(),
            prisma.userEntitlement.count({ where: { status: 'ACTIVE' } })
        ]);

        const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.amount), 0);
        const now = new Date();
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthOrders = paidOrders.filter(o => o.createdAt >= lastMonthStart && o.createdAt < lastMonthEnd);
        const revenueLastMonth = lastMonthOrders.reduce((sum, o) => sum + Number(o.amount), 0);

        res.json({ totalRevenue, totalOrders: totalOrdersCount, totalUsers, activeEntitlements, revenueLastMonth, ordersLastMonth: lastMonthOrders.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
