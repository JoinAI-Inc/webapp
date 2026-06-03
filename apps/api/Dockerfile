# 预构建模式：由 deploy.sh 提前构建并 staging 到 .docker-stage/
# wrangler containers 不支持自定义 build context，始终以 apps/api/ 为根

FROM node:20-alpine AS runner
WORKDIR /app

# Prisma engine 依赖 libssl 1.1（alpine 默认没有）
RUN apk add --no-cache openssl1.1-compat || \
    (apk add --no-cache --repository=https://dl-cdn.alpinelinux.org/alpine/v3.16/main openssl1.1-compat || \
    apk add --no-cache openssl libssl3)

# 复制 workspace 结构（用于 yarn install --production）
COPY .docker-stage/package.json ./
COPY .docker-stage/yarn.lock ./
COPY .docker-stage/apps/api/package.json ./apps/api/
COPY .docker-stage/packages/database/package.json ./packages/database/
COPY .docker-stage/packages/queue/package.json ./packages/queue/

# Prisma schema（postinstall 钩子需要）
COPY .docker-stage/packages/database/prisma ./packages/database/prisma/

# database 编译产物（dist/index.js）
COPY .docker-stage/packages/database/dist ./packages/database/dist/

# 安装依赖（需要包含 devDeps 以便 postinstall 中的 prisma generate 能执行）
RUN yarn install --frozen-lockfile

# 复制预构建产物
COPY .docker-stage/apps/api/dist ./apps/api/dist/
COPY .docker-stage/packages/queue/dist ./packages/queue/dist/

EXPOSE 3001
WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]
