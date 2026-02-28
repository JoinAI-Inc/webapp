import express, { Request, Response, NextFunction } from 'express';
import usersRouter from './admin/users.js';
import appsRouter from './admin/apps.js';
import plansRouter from './admin/plans.js';
import statsRouter from './admin/stats.js';
import stripeRouter from './admin/stripe.js';
import templatesRouter from './admin/templates.js';

const router = express.Router();

// 管理员认证中间件
const adminAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization'];
    if (token !== `Bearer ${process.env.ADMIN_SECRET}`) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
};

router.use(adminAuth);

// 各业务域子路由
router.use('/users', usersRouter);
router.use('/apps', appsRouter);
router.use('/plans', plansRouter);
router.use('/stats', statsRouter);
router.use('/stripe', stripeRouter);
router.use('/templates', templatesRouter);
// features 和 tags 在 users.ts / templates.ts 中已定义

export default router;
