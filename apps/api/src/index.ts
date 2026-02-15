import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { HttpsProxyAgent } from 'https-proxy-agent';
import path from 'path';

// 加载环境变量 - 必须在导入routes之前
dotenv.config({ path: path.join(__dirname, '../.env') });
// Using Neon database


// Routes
import adminRoutes from './routes/admin';
import clientRoutes from './routes/client';
import authRoutes from './routes/auth';
import paymentRoutes from './routes/payment';
import subscriptionRoutes from './routes/subscription';
import nextauthRoutes from './routes/nextauth';
import usageRoutes from './routes/usage';

// Configure global proxy if needed
// Proxy removed by request


const app = express();
const PORT = process.env.PORT || 3001;

// CORS配置 - 允许前端应用访问
app.use(cors({
    origin: [
        'http://localhost:3003', // BACC前端
        'http://localhost:3000', // 其他前端应用
        'http://localhost:3002', // Admin前端
    ],
    credentials: true, // 允许携带cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Stripe webhook需要raw body，所以要在这个路由上使用express.raw
// 其他路由使用bodyParser.json
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }), paymentRoutes);

// 其他路由使用JSON parser
app.use(bodyParser.json());

app.use('/api/admin', adminRoutes);
app.use('/api/store', clientRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', nextauthRoutes);  // NextAuth 专用路由
app.use('/api/payment', paymentRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/usage', usageRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('✅  Stripe payment integration enabled');
});
