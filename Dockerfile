# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json yarn.lock turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/bacc/package.json apps/bacc/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/database/prisma packages/database/prisma
COPY packages/storage/package.json packages/storage/package.json
COPY packages/queue/package.json packages/queue/package.json
RUN npm install

FROM deps AS source
COPY . .
RUN npm run build --workspace @repo/database \
    && npm run build --workspace @media/storage \
    && npm run build --workspace @repo/queue

FROM source AS api
ENV NODE_ENV=production
ENV PORT=3001
RUN npm run build --workspace api
EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]

FROM source AS worker
ENV NODE_ENV=production
RUN npm run build --workspace @repo/worker
CMD ["node", "apps/worker/dist/index.js"]

FROM source AS bacc
ARG API_BACKEND_URL=http://api:3001
ARG NEXT_PUBLIC_IMAGE_URL=
ARG NEXT_PUBLIC_API_BASE_URL=
ARG NEXT_PUBLIC_APP_ID=bacc
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ENV NODE_ENV=production
ENV PORT=3003
ENV HOSTNAME=0.0.0.0
ENV API_BACKEND_URL=${API_BACKEND_URL}
ENV NEXT_PUBLIC_IMAGE_URL=${NEXT_PUBLIC_IMAGE_URL}
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_APP_ID=${NEXT_PUBLIC_APP_ID}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
RUN npm run build --workspace @repo/bacc
EXPOSE 3003
CMD ["npm", "run", "start", "--workspace", "@repo/bacc"]

FROM source AS admin
ARG NEXT_PUBLIC_ADMIN_API_TOKEN=admin_secret_123
ENV NODE_ENV=production
ENV PORT=3004
ENV HOSTNAME=0.0.0.0
ENV NEXT_PUBLIC_ADMIN_API_TOKEN=${NEXT_PUBLIC_ADMIN_API_TOKEN}
RUN npm run build --workspace @repo/admin
EXPOSE 3004
CMD ["npm", "run", "start", "--workspace", "@repo/admin"]
