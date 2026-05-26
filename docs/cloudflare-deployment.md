# Cloudflare 部署指南

## 架构概览

| 模块 | 部署方式 | 说明 |
|------|----------|------|
| `api` | Cloudflare Containers (Beta) | Node.js/Express，通过 Worker 代理转发到 Docker 容器 |
| `bacc` | Cloudflare Pages | Next.js，使用 `@cloudflare/next-on-pages` 适配 |

---

## 修复的配置问题记录

### api 模块（已修复）

1. **`wrangler.toml` 语法错误（关键）**
   - ❌ 旧语法：`[containers]` + `[[containers.ports]]` + `instance_type`
   - ✅ 正确语法：`[[containers]]` + `class_name` + `[[durable_objects.bindings]]` + `[[migrations]]`
   - CF Containers 底层由 Durable Object 支撑，必须声明 DO binding 和 migration

2. **`worker-entry.js` 结构错误（关键）**
   - ❌ 旧代码：直接用 `env.api.fetch(request)`，没有导出 Container 类
   - ✅ 新代码：导出继承 `Container` 的 `BaccApiContainer` 类，通过 `env.BACC_API` binding 路由

3. **`src/index.ts` CORS 生产域名缺失**
   - ✅ 改为读取 `BACC_ORIGIN` / `ADMIN_ORIGIN` 环境变量

### bacc 模块

4. **缺少 `wrangler.toml`** → 已新建 `apps/bacc/wrangler.toml`

> **注意**：bacc 还需安装 `@cloudflare/next-on-pages` 适配器，详见下方步骤三。

---

## 部署步骤

### 准备工作

```bash
npm install -g wrangler
wrangler login
```

---

### 一、部署 api（Cloudflare Containers）

> Cloudflare Containers 目前处于 Beta 阶段，需在 Cloudflare Dashboard 申请开通。

#### Secrets 配置（api 专用）

api 的 secrets 通过 `wrangler secret put` 写入，**与 bacc 完全独立**。在 `apps/api` 目录下逐一执行：

```bash
cd apps/api

# 数据库
npx wrangler@latest secret put DATABASE_URL
# postgres://avnadmin:<PASSWORD>@<HOST>:<PORT>/defaultdb?sslmode=require
npx wrangler@latest secret put DIRECT_DATABASE_URL
# postgres://avnadmin:<PASSWORD>@<HOST>:<PORT>/defaultdb?sslmode=require

# Auth
npx wrangler@latest secret put ADMIN_SECRET
# <your-admin-secret>
npx wrangler@latest secret put JWT_SECRET
# <your-jwt-secret-base64>
npx wrangler@latest secret put WORKER_SECRET
# <your-worker-secret>

# Google OAuth
npx wrangler@latest secret put GOOGLE_CLIENT_ID
# <your-google-client-id>.apps.googleusercontent.com
npx wrangler@latest secret put GOOGLE_CLIENT_SECRET
# <your-google-client-secret>

# Apple OAuth（如启用）
npx wrangler@latest secret put APPLE_CLIENT_ID
# your-apple-client-id
npx wrangler@latest secret put APPLE_TEAM_ID
# your-apple-team-id
npx wrangler@latest secret put APPLE_KEY_ID
# your-apple-key-id
npx wrangler@latest secret put APPLE_PRIVATE_KEY
# your-apple-private-key

# Twitter/X OAuth（如启用）
npx wrangler@latest secret put TWITTER_CLIENT_ID
# your-twitter-client-id
npx wrangler@latest secret put TWITTER_CLIENT_SECRET
# your-twitter-client-secret

# Discord OAuth（如启用）
npx wrangler@latest secret put DISCORD_CLIENT_ID
# <your-discord-client-id>
npx wrangler@latest secret put DISCORD_CLIENT_SECRET
# <your-discord-client-secret>

# OAuth 回调地址（生产域名）
npx wrangler@latest secret put OAUTH_CALLBACK_BASE
# https://app.yourdomain.com/auth/callback  ← 改为生产域名

# AI API
npx wrangler@latest secret put NANO_BANANA_API_KEY
# <your-nano-banana-api-key>

# Upstash Redis（任务队列）
npx wrangler@latest secret put UPSTASH_REDIS_REST_URL
# https://<your-upstash-endpoint>.upstash.io
npx wrangler@latest secret put UPSTASH_REDIS_REST_TOKEN
# <your-upstash-token>

# Stripe
npx wrangler@latest secret put STRIPE_SECRET_KEY
# sk_test_<your-stripe-secret-key>
npx wrangler@latest secret put STRIPE_WEBHOOK_SECRET
# whsec_<your-stripe-webhook-secret>

# Cloudflare R2 Storage
npx wrangler@latest secret put R2_ACCOUNT_ID
# <your-r2-account-id>
npx wrangler@latest secret put R2_ACCESS_KEY_ID
# <your-r2-access-key-id>
npx wrangler@latest secret put R2_SECRET_ACCESS_KEY
# <your-r2-secret-access-key>

# CORS 生产域名
npx wrangler@latest secret put BACC_ORIGIN
# https://app.yourdomain.com  ← 改为实际域名
npx wrangler@latest secret put ADMIN_ORIGIN
# https://admin.yourdomain.com  ← 改为实际域名
```

**非敏感变量**（已在 `wrangler.toml` 的 `[vars]` 里声明，无需重复设置）：

| 变量名 | 说明 |
|--------|------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `NANO_BANANA_BASE_URL` | AI 接口地址 |
| `NANO_BANANA_PORTRAIT_SINGLE_MODELS` | 单图模型名 |
| `NANO_BANANA_PORTRAIT_MULTI_MODELS` | 多图模型名 |
| `R2_BUCKET_NAME` | R2 桶名（非敏感，可放 vars） |
| `R2_PUBLIC_DOMAIN` | R2 公开访问域名（非敏感）|
| `QUEUE_MAX_RETRIES` | 队列最大重试次数，默认 3 |
| `QUEUE_RETRY_DELAY` | 重试间隔（ms），默认 5000 |
| `QUEUE_WORKER_INTERVAL` | Worker 轮询间隔（ms），默认 10000 |

#### 部署

```bash
cd apps/api

# 确保 Docker 在运行
docker info

# 一键构建镜像 + 推送 + 部署 Worker
wrangler deploy
```

> ⚠️ 首次部署后需等待数分钟，Container 实例正在预热。

#### 验证

```bash
wrangler deployments list   # 查看部署状态
wrangler tail               # 实时日志
```

---

### 二、部署 bacc（Cloudflare Pages）

#### 1. 安装适配器

```bash
cd apps/bacc
npm install --save-dev @cloudflare/next-on-pages
```

#### 2. 修改 `next.config.js`

去掉 `output: 'standalone'`（next-on-pages 有自己的 output 处理）：

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'standalone',  ← 删除这行

    experimental: {
        serverActions: { bodySizeLimit: '2mb' },
    },
    images: { unoptimized: true },
    env: {
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
        NEXT_PUBLIC_APP_ID: process.env.NEXT_PUBLIC_APP_ID,
        NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    },
    async rewrites() {
        const apiBackend = process.env.API_BACKEND_URL || 'http://localhost:3001';
        return [
            { source: '/api/store/:path*', destination: `${apiBackend}/api/store/:path*` },
            { source: '/api/admin/:path*', destination: `${apiBackend}/api/admin/:path*` },
            { source: '/api/subscription/:path*', destination: `${apiBackend}/api/subscription/:path*` },
            { source: '/api/payment/:path*', destination: `${apiBackend}/api/payment/:path*` },
        ];
    },
};
module.exports = nextConfig;
```

#### 3. 添加构建脚本到 `package.json`

```json
{
  "scripts": {
    "pages:deploy": "next-on-pages && wrangler pages deploy"
  }
}
```

#### 4. Secrets 配置（bacc 专用）

bacc 的 secrets 在 **Cloudflare Dashboard → Pages → 项目 → Settings → Environment Variables → Production** 中设置，**不使用 wrangler secret put**：

| 变量名 | 说明 |
|--------|------|
| `NEXTAUTH_URL` | `https://your-bacc-domain.com` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` 生成 |
| `NEXT_PUBLIC_API_BASE_URL` | `/api` |
| `API_BACKEND_URL` | api Worker 的 `workers.dev` 地址（wrangler deploy 完成后获取）|
| `NEXT_PUBLIC_APP_ID` | App ID |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `NEXT_PUBLIC_IMAGE_URL` | `https://your-r2-domain/bacc/image` |
| `R2_ACCOUNT_ID` | R2 账号 ID |
| `R2_BUCKET_NAME` | R2 Bucket 名 |
| `R2_ACCESS_KEY_ID` | R2 密钥 ID |
| `R2_SECRET_ACCESS_KEY` | R2 密钥 |

> **关键**：`API_BACKEND_URL` 必须填 api Worker 的生产地址，不是 localhost。

#### 5. 部署

```bash
cd apps/bacc
npm run pages:deploy
```

---

## Secrets 分工总结

| | api | bacc |
|--|-----|------|
| **配置方式** | `wrangler secret put`（命令行） | Cloudflare Dashboard → Pages 环境变量 |
| **存储位置** | Cloudflare Workers Secrets | Cloudflare Pages Secrets |
| **是否共享** | ❌ 完全独立 | ❌ 完全独立 |

---

## 注意事项

- `Dockerfile` 构建上下文是 **monorepo 根目录**，`wrangler deploy` 会自动处理，不需要手动 `docker build`。
- Stripe Webhook endpoint 需要在 Stripe Dashboard 中更新为 api 的生产 URL。
- bacc 的 `/api/*` rewrites 在生产环境会代理到 `API_BACKEND_URL`，先部署 api、再部署 bacc。
