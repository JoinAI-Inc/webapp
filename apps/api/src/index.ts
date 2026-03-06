import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量 - 必须在导入routes之前
dotenv.config({ path: join(__dirname, '../.env') });
// Using Neon database


// Routes
import adminRoutes from './routes/admin.js';
import clientRoutes from './routes/client.js';
import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payment.js';
import subscriptionRoutes from './routes/subscription.js';
import nextauthRoutes from './routes/nextauth.js';
import usageRoutes from './routes/usage.js';
import queueRoutes from './routes/queue.js';
import historyRoutes from './routes/history.js';
import templateRoutes from './routes/templates.js';
import { prisma } from '@repo/database';

// Configure global proxy if needed
// Proxy removed by request


const app = express();
const PORT = process.env.PORT || 3001;

// CORS配置 - 允许前端应用访问
const allowedOrigins = [
    'http://localhost:3003', // BACC前端（本地）
    'http://localhost:3000', // 其他前端（本地）
    'http://localhost:3004', // Admin前端（本地）
    // 生产环境域名 - 部署前替换为实际域名
    process.env.BACC_ORIGIN || '',       // 例：https://app.yourdomain.com
    process.env.ADMIN_ORIGIN || '',      // 例：https://admin.yourdomain.com
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true, // 允许携带cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-user-id', 'x-internal-timestamp', 'x-internal-signature']
}));

// Stripe webhook 需要 raw body，单独在 /webhook 子路径加中间件
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// 其他路由使用JSON parser（增加限制以支持图片 base64 上传）
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/admin', adminRoutes);
app.use('/api/store', clientRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', nextauthRoutes);  // NextAuth 专用路由
app.use('/api/payment', paymentRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/history', historyRoutes); // 历史记录路由
app.use('/api/templates', templateRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('✅  Stripe payment integration enabled');

    // DB 心跳：每 4 分钟 ping 一次，防止 Aiven 免费版因空闲触发冷启动
    const DB_HEARTBEAT_INTERVAL = 4 * 60 * 1000;
    const dbHeartbeat = async () => {
        try {
            await prisma.$queryRaw`SELECT 1`;
        } catch (e) {
            console.warn('[DB Heartbeat] ping failed, will retry on next request:', (e as any)?.message);
        }
    };
    setInterval(dbHeartbeat, DB_HEARTBEAT_INTERVAL);
    console.log('💓  DB heartbeat started (interval: 4min)');

    // 启动队列 worker（每 30 秒处理一次）
    import('./lib/queue/worker.js').then(({ queueWorker }) => {
        console.log('🔄  Starting queue worker...');

        const processQueue = async () => {
            try {
                await queueWorker.processBatchSafe(5);
            } catch (error) {
                console.error('[Worker] Error:', error);
            }
        };

        // 先执行孤儿任务恢复，再启动 worker
        import('./lib/queue/recovery.js').then(({ recoverOrphanTasks }) => {
            recoverOrphanTasks()
                .catch(e => console.error('[Recovery] Startup recovery failed:', e))
                .finally(() => {
                    // 立即处理一次（含刚恢复的任务）
                    processQueue();
                    // 每30秒处理一次
                    setInterval(processQueue, 30000);
                });
        });
    });
});
