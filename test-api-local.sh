#!/bin/bash
# 本地测试 API 容器（无需部署到 Cloudflare）
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
STAGE="$ROOT_DIR/apps/api/.docker-stage"
IMAGE="bacc-api-test"
PORT="${PORT:-3001}"

log() { echo "[test] $*"; }

# ── 1. 构建 ────────────────────────────────
log "构建 API 及依赖包..."
npx turbo run build --filter=api... --filter=@repo/database

# ── 2. Staging ─────────────────────────────
log "Staging 构建产物到 $STAGE ..."
rm -rf "$STAGE"
mkdir -p "$STAGE/apps/api" "$STAGE/packages/database/prisma" "$STAGE/packages/storage"
cp "$ROOT_DIR/package.json"                      "$STAGE/"
cp "$ROOT_DIR/yarn.lock"                         "$STAGE/"
cp "$ROOT_DIR/apps/api/package.json"             "$STAGE/apps/api/"
cp "$ROOT_DIR/packages/database/package.json"    "$STAGE/packages/database/"
cp "$ROOT_DIR/packages/storage/package.json"     "$STAGE/packages/storage/"
cp -r "$ROOT_DIR/packages/database/prisma/"      "$STAGE/packages/database/prisma/"
cp -r "$ROOT_DIR/packages/database/dist"         "$STAGE/packages/database/dist"
cp -r "$ROOT_DIR/apps/api/dist"                  "$STAGE/apps/api/dist"
cp -r "$ROOT_DIR/packages/storage/dist"          "$STAGE/packages/storage/dist"

# ── 3. Docker build ────────────────────────
log "构建 Docker 镜像 $IMAGE ..."
docker build -t "$IMAGE" -f "$ROOT_DIR/apps/api/Dockerfile" "$ROOT_DIR/apps/api/"

# ── 4. 清理 staging ────────────────────────
rm -rf "$STAGE"

# ── 5. 运行容器 ────────────────────────────
log "启动容器，监听 http://localhost:$PORT"
log "按 Ctrl+C 停止"
docker run --rm -p "$PORT:3001" --env-file "$ROOT_DIR/apps/api/.env" "$IMAGE"
