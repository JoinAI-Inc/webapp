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
# 从 monorepo 根目录构建（使用 turbo prune 优化并解决 Prisma 生成问题）
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g turbo
COPY . .
# 剪裁出 api 及其内部依赖所需的代码
RUN turbo prune --scope=api --docker

FROM node:20-alpine AS installer
WORKDIR /app

# 安装依赖前先复制 package.json 和 lockfile
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock

# ⚠️ 关键点：如果是 Prisma，`yarn install` 的 postinstall 钩子需要 schema.prisma，
# 因此提前把 Prisma 的 schema 拿过来。根据你的路径修改：
COPY --from=builder /app/out/full/packages/database/prisma ./packages/database/prisma/

# 安装所有依赖
RUN yarn install --frozen-lockfile

# 复制完整的项目代码
COPY --from=builder /app/out/full/ .

# 构建内部包和 api
RUN npm install -g turbo
RUN turbo run build --filter=api

# 生产镜像
FROM node:20-alpine AS runner
WORKDIR /app

# 生产环境只需要复制必要文件，保留 yarn workspaces 结构
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
COPY --from=installer /app/packages/database/prisma ./packages/database/prisma/
RUN yarn install --production --frozen-lockfile --ignore-scripts

# 复制构建产物 (dist)
COPY --from=installer /app/apps/api/dist ./apps/api/dist/
COPY --from=installer /app/packages/database/dist ./packages/database/dist/
COPY --from=installer /app/packages/storage/dist ./packages/storage/dist/

EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
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
    // ⚠️ 这里的 binding 名称取决于 wrangler.toml 的 [[containers.ports]] 的 name 字段，上面定义为了 "api"
    const container = env.api;
    return container.fetch(request);
  }
};
```

### 4. 构建并部署

```bash
# 在 monorepo 根目录执行

# 构建 Docker 镜像
docker build -f apps/api/Dockerfile -t bacc-api:latest .

# 推送到 Cloudflare Container Registry
wrangler containers push bacc-api:latest

# 部署 Worker（此时容器还未启动，scale-to-zero 状态）
cd apps/api
wrangler deploy
```

### 5. 立刻写入环境变量（deploy 后、第一次请求前）

> [!IMPORTANT]
> Cloudflare Containers 是 **scale-to-zero**，`wrangler deploy` 本身不启动容器，容器在收到第一个请求时才冷启动。必须在容器处理第一个真实请求**之前**把变量写好。
>
> `wrangler secret put` 要求 Worker 已存在，所以顺序是：先 deploy，立刻写入 secrets，才能接受流量。

在 `apps/api/` 目录创建一个本地的 `.env.production`（**不要提交到 git**）：

```bash
NANO_BANANA_API_KEY=sk-xxx...
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
DATABASE_URL=libsql://xxx.turso.io
TURSO_AUTH_TOKEN=xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
JWT_SECRET=xxx
WORKER_SECRET=xxx
```

然后批量写入：

```bash
cd apps/api
wrangler secret bulk .env.production
```

> [!NOTE]
> `wrangler.toml` 中的 `[vars]` 已配置了非敏感变量（`NODE_ENV`、`PORT`、模型列表等），随代码一起部署，无需在这里写入。

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
| Build command | `cd ../.. && npx @cloudflare/next-on-pages --experimental-minify --cwd apps/bacc` |
| Build output directory | `apps/bacc/.vercel/output/static` |
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
