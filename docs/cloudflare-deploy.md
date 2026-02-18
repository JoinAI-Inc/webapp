# Cloudflare 部署操作文档

## 架构概览

```
用户请求
 ├── bacc (Next.js)  →  Cloudflare Pages
 └── api (Express)   →  Cloudflare Containers
                              ↓
                       Upstash Redis（已有）
                       Cloudflare R2（已有）
```

## 前置条件

- Cloudflare 账号，已升级到 **Workers Paid 计划**（$5/月起，Containers 需要）
- 安装 Wrangler CLI：`npm install -g wrangler`
- 登录：`wrangler login`
- Docker 已安装（用于构建 api 镜像）

---

## 第一部分：api 部署到 Cloudflare Containers

### 1. 创建 Dockerfile

在 monorepo 根目录创建 `apps/api/Dockerfile`：

```dockerfile
# 从 monorepo 根目录构建（因为依赖了内部包）
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 monorepo 配置
COPY package.json yarn.lock ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/storage/package.json ./packages/storage/

# 安装依赖
RUN yarn install --frozen-lockfile

# 复制源码
COPY apps/api/ ./apps/api/
COPY packages/database/ ./packages/database/
COPY packages/storage/ ./packages/storage/

# 构建内部包
RUN cd packages/database && yarn build 2>/dev/null || true
RUN cd packages/storage && yarn build 2>/dev/null || true

# 构建 api
RUN cd apps/api && yarn build

# 生产镜像
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/packages/database/dist ./node_modules/@repo/database/dist
COPY --from=builder /app/packages/storage/dist ./node_modules/@media/storage/dist

RUN yarn install --production --frozen-lockfile

EXPOSE 3001
CMD ["node", "dist/index.js"]
```

> [!NOTE]
> 如果内部包没有独立的 build 脚本，可以简化为直接复制整个 node_modules。

### 2. 创建 Containers 配置文件

在 `apps/api/` 创建 `wrangler.toml`：

```toml
name = "bacc-api"
main = "worker-entry.js"
compatibility_date = "2025-06-01"

[containers]
image = "bacc-api:latest"
instance_type = "basic"   # 1GB RAM, 1/4 vCPU
max_instances = 3

[[containers.ports]]
name = "api"
port = 3001
```

### 3. 创建 Worker 入口（路由层）

在 `apps/api/` 创建 `worker-entry.js`：

```javascript
export default {
  async fetch(request, env) {
    // 将所有请求转发到 Container
    const container = env.CONTAINER;
    return container.fetch(request);
  }
};
```

### 4. 配置环境变量

在 Cloudflare Dashboard → Workers & Pages → bacc-api → Settings → Variables 中添加：

| 变量名 | 值 |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `NANO_BANANA_API_KEY` | `sk-xxx...` |
| `NANO_BANANA_BASE_URL` | `http://43.134.55.109:3000/v1beta` |
| `NANO_BANANA_PORTRAIT_SINGLE_MODELS` | `gemini-3-pro-image-preview-2k` |
| `NANO_BANANA_PORTRAIT_MULTI_MODELS` | `gemini-3-pro-image-preview-2k` |
| `UPSTASH_REDIS_REST_URL` | `https://xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | `xxx` |
| `DATABASE_URL` | `libsql://xxx.turso.io` |
| `TURSO_AUTH_TOKEN` | `xxx` |
| `STRIPE_SECRET_KEY` | `sk_live_xxx` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxx` |
| `JWT_SECRET` | `xxx` |
| `WORKER_SECRET` | `xxx` |

### 5. 构建并部署

```bash
# 在 monorepo 根目录执行

# 构建 Docker 镜像
docker build -f apps/api/Dockerfile -t bacc-api:latest .

# 推送到 Cloudflare Container Registry
wrangler containers push bacc-api:latest

# 部署
cd apps/api
wrangler deploy
```

### 6. 获取 api 的公网地址

部署成功后，Cloudflare 会分配一个地址，格式为：
```
https://bacc-api.<your-subdomain>.workers.dev
```

记录这个地址，bacc 的环境变量 `API_BACKEND_URL` 需要用到。

---

## 第二部分：bacc 部署到 Cloudflare Pages

### 1. 在 Cloudflare Dashboard 创建 Pages 项目

1. 进入 **Workers & Pages** → **Create** → **Pages**
2. 连接 GitHub 仓库
3. 配置构建设置：

| 配置项 | 值 |
|---|---|
| Framework preset | `Next.js` |
| Build command | `cd ../.. && yarn build --filter=bacc` |
| Build output directory | `apps/bacc/.next` |
| Root directory | `/` |

### 2. 配置环境变量

在 Pages 项目 → Settings → Environment variables 中添加：

| 变量名 | 值 |
|---|---|
| `NEXTAUTH_URL` | `https://your-domain.pages.dev` |
| `NEXTAUTH_SECRET` | `xxx`（随机字符串） |
| `GOOGLE_CLIENT_ID` | `xxx` |
| `GOOGLE_CLIENT_SECRET` | `xxx` |
| `API_BACKEND_URL` | `https://bacc-api.<subdomain>.workers.dev` |
| `NEXT_PUBLIC_APP_ID` | `app_xxx` |
| `CLOUDFLARE_R2_BUCKET` | `xxx` |
| `CLOUDFLARE_R2_ACCESS_KEY` | `xxx` |
| `CLOUDFLARE_R2_SECRET_KEY` | `xxx` |
| `CLOUDFLARE_R2_ENDPOINT` | `https://xxx.r2.cloudflarestorage.com` |
| `CLOUDFLARE_R2_PUBLIC_URL` | `https://pub-xxx.r2.dev` |

### 3. 触发部署

推送代码到 main 分支，Pages 会自动构建部署。

或手动部署：
```bash
cd apps/bacc
npx @cloudflare/next-on-pages
wrangler pages deploy .vercel/output/static
```

---

## 第三部分：自定义域名（可选）

### bacc 绑定域名
Pages → Custom domains → Add domain → 输入你的域名

### api 绑定域名
Workers → bacc-api → Triggers → Custom domains → Add

---

## 注意事项

> [!WARNING]
> **Cloudflare Containers 目前处于公测阶段**，API 和配置格式可能变化，部署前建议查阅最新文档：
> https://developers.cloudflare.com/containers/

> [!IMPORTANT]
> **冷启动问题**：Containers 支持 scale-to-zero，长时间无请求后容器会停止，下次请求有 1-3 秒冷启动延迟。如果需要保持常驻，可以设置 `min_instances = 1`（会持续计费）。

> [!NOTE]
> **monorepo 构建**：bacc 依赖内部包（`@repo/database`、`@media/storage`），Pages 构建时需要从根目录执行，Build command 设置为 `cd ../.. && yarn build --filter=bacc`。
