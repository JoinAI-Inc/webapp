# Deployment Architecture
# =======================
# This API uses **Cloudflare Containers** (NOT Cloudflare Workers edge runtime).
#
# Flow:
#   1. `docker build` creates the `bacc-api:latest` image using Dockerfile
#   2. `wrangler deploy` pushes image to Cloudflare and starts container instances
#
# The Dockerfile and wrangler.toml are COMPLEMENTARY, not competing:
#   - Dockerfile  → builds the Node.js/Express image
#   - wrangler.toml → deploys that image to CF Containers infrastructure
#
# Local development:
#   npm run dev   (runs ts-node directly, no Docker needed)
#
# Production deploy:
#   docker build -t bacc-api:latest .
#   wrangler deploy
