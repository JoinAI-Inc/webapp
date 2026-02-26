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