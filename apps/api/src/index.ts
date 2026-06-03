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
import clientRoutes from './routes/client.js';
import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payment.js';
import subscriptionRoutes from './routes/subscription.js';
import nextauthRoutes from './routes/nextauth.js';
import usageRoutes from './routes/usage.js';
import queueRoutes from './routes/queue.js';
import historyRoutes from './routes/history.js';
import templateRoutes from './routes/templates.js';
import siteThemeRoutes from './routes/site-theme.js';

// Configure global proxy if needed
// Proxy removed by request


const app = express();
const PORT = process.env.PORT || 3001;

// CORS配置 - 允许前端应用访问
const allowedOrigins = [
    'http://localhost:3003', // BACC前端（本地）
    'http://localhost:3000', // 其他前端（本地）
    // 生产环境域名 - 部署前替换为实际域名
    process.env.BACC_ORIGIN || '',       // 例：https://app.yourdomain.com
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

app.use('/api/store', clientRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', nextauthRoutes);  // NextAuth 专用路由
app.use('/api/payment', paymentRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/history', historyRoutes); // 历史记录路由
app.use('/api/templates', templateRoutes);
app.use('/api/site-theme', siteThemeRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('✅  Stripe payment integration enabled');
});
