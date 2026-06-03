import express, { Request, Response, NextFunction } from 'express';
import usersRouter from './admin/users';
import appsRouter from './admin/apps';
import plansRouter from './admin/plans';
import statsRouter from './admin/stats';
import stripeRouter from './admin/stripe';
import templatesRouter from './admin/templates';
import featuresRouter from './admin/features';
import tagsRouter from './admin/tags';
import assetsRouter from './admin/assets';
import siteThemesRouter from './admin/site-themes';
import uploadsRouter from './admin/uploads';
import generationConfigRouter from './admin/generation-config';

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
router.use('/features', featuresRouter);
router.use('/tags', tagsRouter);
router.use('/assets', assetsRouter);
router.use('/site-themes', siteThemesRouter);
router.use('/uploads', uploadsRouter);
router.use('/generation-config', generationConfigRouter);

export default router;
