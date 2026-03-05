#!/bin/bash
set -e

# ============================================================
# Cloudflare 部署脚本
# 用法：
#   ./deploy.sh api             - 仅部署 api（含构建+secrets）
#   ./deploy.sh bacc            - 仅部署 bacc（含构建+secrets）
#   ./deploy.sh all             - 先部署 api，再部署 bacc
#   ./deploy.sh secrets api     - 只推 api secrets（不重新构建）
#   ./deploy.sh secrets bacc    - 只推 bacc secrets（不重新构建）
#   ./deploy.sh secrets all     - 推送所有 secrets
#
# 环境变量：
#   CLOUDFLARE_ACCOUNT_ID - 指定 CF 账号（多账号时必填）
#   SKIP_SECRETS=1        - 跳过 secrets 写入（快速部署调试用）
# ============================================================

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="${1:-all}"
SECRETS_TARGET="${2:-all}"

# ── 多账号配置（可通过环境变量覆盖）──────────────────────────
: "${CLOUDFLARE_ACCOUNT_ID:=d2d0a8c5980686084e1d3f3d6ef66a20}"
export CLOUDFLARE_ACCOUNT_ID

log()  { echo "[INFO] $*"; }
err()  { echo "[ERROR] $*" >&2; exit 1; }

# 优先使用本地 wrangler，避免每次 npx 下载
WRANGLER="$(npx --no-install wrangler 2>/dev/null | head -1 || true)"
WRANGLER="wrangler"
if command -v wrangler &>/dev/null; then
  WRANGLER="wrangler"
else
  WRANGLER="npx wrangler@latest"
fi

# 带重试的 secret put（最多 3 次）
_secret_put() {
  local key="$1" val="$2" attempt=1
  while (( attempt <= 3 )); do
    if echo "$val" | $WRANGLER secret put "$key" 2>&1; then
      return 0
    fi
    log "  [$key] 第 $attempt 次失败，3 秒后重试..."
    sleep 3
    (( attempt++ ))
  done
  log "  [WARN] $key 写入失败（已重试 3 次），跳过"
  return 0  # 不因单个 secret 失败终止整体部署
}

# ────────────────────────────────────────────
# 从 .env.prod 自动读取并写入 Secrets
# ────────────────────────────────────────────

# 仅以下 key 会通过 wrangler secret put 写入（其余为 wrangler.toml [vars] 的非敏感变量）
API_SECRET_KEYS=(
  DATABASE_URL
  DIRECT_DATABASE_URL
  ADMIN_SECRET
  JWT_SECRET
  WORKER_SECRET
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
  APPLE_CLIENT_ID
  APPLE_TEAM_ID
  APPLE_KEY_ID
  APPLE_PRIVATE_KEY
  TWITTER_CLIENT_ID
  TWITTER_CLIENT_SECRET
  DISCORD_CLIENT_ID
  DISCORD_CLIENT_SECRET
  OAUTH_CALLBACK_BASE
  NANO_BANANA_API_KEY
  UPSTASH_REDIS_REST_URL
  UPSTASH_REDIS_REST_TOKEN
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  R2_ACCOUNT_ID
  R2_ACCESS_KEY_ID
  R2_SECRET_ACCESS_KEY
  BACC_ORIGIN
  ADMIN_ORIGIN
)

# bacc Pages 侧的 secrets（通过 wrangler pages secret put 写入）
BACC_SECRET_KEYS=(
  NEXTAUTH_SECRET
  NEXTAUTH_URL
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
  API_BACKEND_URL
  WORKER_SECRET
  DATABASE_URL
  DIRECT_DATABASE_URL
  R2_ACCOUNT_ID
  R2_ACCESS_KEY_ID
  R2_SECRET_ACCESS_KEY
  NANO_BANANA_API_KEY
)

# 解析 .env 文件，返回指定 key 的值
_get_env_val() {
  local key="$1" file="$2"
  grep -E "^${key}=" "$file" 2>/dev/null \
    | head -1 \
    | sed "s/^${key}=//" \
    | sed 's/^"\(.*\)"$/\1/' \
    | sed "s/^'\(.*\)'$/\1/"
}

_set_api_secrets_from_env() {
  local env_file="$ROOT_DIR/apps/api/.env.prod"
  [[ -f "$env_file" ]] || err "找不到 $env_file"

  log "--- 从 apps/api/.env.prod 配置 API Secrets ---"
  local skipped=()
  for key in "${API_SECRET_KEYS[@]}"; do
    val="$(_get_env_val "$key" "$env_file")"
    if [[ -z "$val" ]]; then skipped+=("$key"); continue; fi
    log "  设置 $key"
    cd "$ROOT_DIR/apps/api" && _secret_put "$key" "$val"
  done
  [[ ${#skipped[@]} -gt 0 ]] && { log "--- 跳过（未配置）---"; for k in "${skipped[@]}"; do log "  $k"; done; }
  log "--- API Secrets 配置完成 ---"
}

_set_bacc_secrets_from_env() {
  local env_file="$ROOT_DIR/apps/bacc/.env.prod"
  [[ -f "$env_file" ]] || err "找不到 $env_file"

  log "--- 从 apps/bacc/.env.prod 配置 BACC Secrets ---"
  local skipped=()
  for key in "${BACC_SECRET_KEYS[@]}"; do
    val="$(_get_env_val "$key" "$env_file")"
    if [[ -z "$val" ]]; then skipped+=("$key"); continue; fi
    log "  设置 $key"
    cd "$ROOT_DIR/apps/bacc" && echo "$val" | $WRANGLER pages secret put "$key" --project-name bacc
  done
  [[ ${#skipped[@]} -gt 0 ]] && { log "--- 跳过（未配置）---"; for k in "${skipped[@]}"; do log "  $k"; done; }
  log "--- BACC Secrets 配置完成 ---"
}

# ────────────────────────────────────────────
# 部署 API（Cloudflare Containers）
# ────────────────────────────────────────────
deploy_api() {
  log "===== 开始部署 API ====="
  cd "$ROOT_DIR"

  docker info > /dev/null 2>&1 || err "Docker 未运行，请先启动 Docker"

  if [[ "${SKIP_SECRETS:-}" != "1" ]]; then
    cd "$ROOT_DIR/apps/api"
    _set_api_secrets_from_env
    cd "$ROOT_DIR"
  fi

  # ── Step 1: 构建所有依赖 ──────────────────────────────────
  log "构建 API 及依赖包..."
  npx turbo run build --filter=api... --filter=@repo/database

  # ── Step 2: Staging 产物到 apps/api/.docker-stage ─────────
  # wrangler containers 始终以 apps/api/ 为 Docker 构建上下文，
  # 无法自定义 context，因此需要提前把 monorepo 依赖复制进来
  STAGE="$ROOT_DIR/apps/api/.docker-stage"
  log "Staging 构建产物到 $STAGE ..."
  rm -rf "$STAGE"
  mkdir -p \
    "$STAGE/apps/api" \
    "$STAGE/packages/database/prisma" \
    "$STAGE/packages/storage"

  # monorepo 根文件
  cp "$ROOT_DIR/package.json"  "$STAGE/"
  cp "$ROOT_DIR/yarn.lock"     "$STAGE/"

  # package.json（供 yarn install --production 用）
  cp "$ROOT_DIR/apps/api/package.json"         "$STAGE/apps/api/"
  cp "$ROOT_DIR/packages/database/package.json" "$STAGE/packages/database/"
  cp "$ROOT_DIR/packages/storage/package.json"  "$STAGE/packages/storage/"

  # Prisma schema
  cp -r "$ROOT_DIR/packages/database/prisma/"  "$STAGE/packages/database/prisma/"

  # database 编译产物（dist/index.js）
  cp -r "$ROOT_DIR/packages/database/dist"      "$STAGE/packages/database/dist"

  # 构建产物
  cp -r "$ROOT_DIR/apps/api/dist"              "$STAGE/apps/api/dist"
  cp -r "$ROOT_DIR/packages/storage/dist"      "$STAGE/packages/storage/dist"

  # ── Step 3: wrangler deploy（带重试）────────────────────────
  cd "$ROOT_DIR/apps/api"
  local attempt=1
  while (( attempt <= 3 )); do
    log "执行 wrangler deploy（第 $attempt 次）..."
    if $WRANGLER deploy; then
      break
    fi
    if (( attempt == 3 )); then
      rm -rf "$STAGE"
      err "wrangler deploy 连续失败 3 次，请检查网络后重试"
    fi
    log "deploy 失败，10 秒后重试..."
    sleep 10
    (( attempt++ ))
  done

  # 清理 staging 目录
  rm -rf "$STAGE"

  log "===== API 部署完成 ====="
  log "首次部署后需等待数分钟，Container 实例正在预热"
}

# ────────────────────────────────────────────
# 部署 BACC（Cloudflare Pages）
# ────────────────────────────────────────────
deploy_bacc() {
  log "===== 开始部署 BACC ====="
  cd "$ROOT_DIR/apps/bacc"

  if ! grep -q "next-on-pages" package.json 2>/dev/null; then
    log "安装 @cloudflare/next-on-pages..."
    npm install --save-dev @cloudflare/next-on-pages
  fi

  grep -q "pages:deploy" package.json 2>/dev/null \
    || err 'package.json 缺少 "pages:deploy" 脚本，请添加：
  "pages:deploy": "next-on-pages && wrangler pages deploy"'

  log "提示：bacc Secrets 需在 CF Dashboard → Pages → Settings → Environment Variables 中手动配置"
  log "执行 npm run pages:deploy..."
  npm run pages:deploy

  log "===== BACC 部署完成 ====="
}

# ────────────────────────────────────────────
# 主流程
# ────────────────────────────────────────────
log "使用账号 ID：$CLOUDFLARE_ACCOUNT_ID"
log "检查 wrangler 登录状态..."
$WRANGLER whoami > /dev/null 2>&1 || {
  log "未登录，执行 wrangler login..."
  $WRANGLER login
}

case "$TARGET" in
  api)   deploy_api ;;
  bacc)  deploy_bacc ;;
  all)
    deploy_api
    echo ""
    deploy_bacc
    ;;
  secrets)
    case "$SECRETS_TARGET" in
      api)
        cd "$ROOT_DIR/apps/api"
        _set_api_secrets_from_env
        ;;
      bacc)
        _set_bacc_secrets_from_env
        ;;
      all)
        cd "$ROOT_DIR/apps/api"
        _set_api_secrets_from_env
        echo ""
        _set_bacc_secrets_from_env
        ;;
      *)
        echo "用法：$0 secrets [api|bacc|all]"
        exit 1
        ;;
    esac
    ;;
  *)
    echo "用法：$0 [api|bacc|all|secrets [api|bacc|all]]"
    exit 1
    ;;
esac

log "全部部署完成 🎉"
