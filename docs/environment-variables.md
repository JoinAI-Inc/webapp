# Environment Variables

This project has two separate concerns. Keep both explicit:

- What the address is used for: auth redirects, CORS, payment redirects, browser API calls, or container-to-container calls.
- Where the address is resolved: a user's browser, or the Docker network.

Use separate variables even when several values are currently identical. For
example, auth callback URLs and payment return URLs may both point at BACC today,
but they are different responsibilities.

- `*_ORIGIN`: scheme + host + optional port, without a trailing slash.
- `INTERNAL_*`: Docker-network addresses used by containers.
- Framework/runtime names: variables required by NextAuth, Prisma, Stripe, or existing code.

For Docker Compose deployment, prefer setting the clearer variables in `.env.docker`.
`docker-compose.yml` maps them into the framework/runtime names the apps currently read.

## Canonical Docker Variables

| Variable | Meaning | Example |
| --- | --- | --- |
| `AUTH_PUBLIC_ORIGIN` | Browser-visible BACC origin used by Auth.js/NextAuth and OAuth callbacks. | `http://localhost:3003` |
| `API_ALLOWED_ORIGIN` | Browser origin allowed by the API CORS policy. | `http://localhost:3003` |
| `PAYMENT_RETURN_ORIGIN` | Browser redirect base for payment success/cancel URLs. | `http://localhost:3003` |
| `PUBLIC_API_ORIGIN` | Browser-visible API origin for legacy browser-direct API calls. | `http://localhost:3001` |
| `INTERNAL_API_ORIGIN` | Container-to-container API origin used by BACC server routes. | `http://api:3001` |
| `AUTH_SECRET` | Auth.js/NextAuth session/JWT secret. | `openssl rand -base64 32` |
| `API_JWT_SECRET` | API-issued backend JWT secret. | `openssl rand -base64 32` |
| `INTERNAL_SERVICE_SECRET` | Shared secret for BACC/API internal requests. | `openssl rand -base64 32` |

## Compose Mappings

| Canonical variable | Runtime/framework variables |
| --- | --- |
| `AUTH_PUBLIC_ORIGIN` | `AUTH_URL`, `NEXTAUTH_URL` |
| `API_ALLOWED_ORIGIN` | `BACC_ORIGIN` |
| `PAYMENT_RETURN_ORIGIN` | `APP_URL` |
| `PUBLIC_API_ORIGIN` | `NEXT_PUBLIC_API_URL` |
| `INTERNAL_API_ORIGIN` | `API_BACKEND_URL` |
| `AUTH_SECRET` | `AUTH_SECRET`, `NEXTAUTH_SECRET` |
| `API_JWT_SECRET` | `JWT_SECRET` |
| `INTERNAL_SERVICE_SECRET` | `WORKER_SECRET` |
| `PUBLIC_GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_ID` | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` |

## Variables That Should Stay Internal

These should use Docker service names or private provider endpoints, not browser
addresses:

- `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/webapp`
- `DIRECT_DATABASE_URL=postgresql://postgres:postgres@postgres:5432/webapp`
- `INTERNAL_API_ORIGIN=http://api:3001`

## Variables That Are Public by Design

These are bundled into browser-side JavaScript or used in browser redirects:

- `AUTH_PUBLIC_ORIGIN`
- `PAYMENT_RETURN_ORIGIN`
- `PUBLIC_API_ORIGIN`
- `NEXT_PUBLIC_IMAGE_URL`
- `NEXT_PUBLIC_APP_ID`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_ENABLE_DEBUG_LOGS`

## Legacy Names

The codebase still reads some legacy names directly:

- `APP_URL`: API/Admin payment redirect base.
- `BACC_ORIGIN`: API CORS origin.
- `NEXTAUTH_URL` / `NEXTAUTH_SECRET`: NextAuth v4-compatible names.
- `AUTH_URL` / `AUTH_SECRET`: Auth.js/NextAuth v5 names.
- `WORKER_SECRET`: internal request signing secret, not only worker-specific.
- `OAUTH_CALLBACK_BASE`: legacy apps/api OAuth callback, not used by BACC NextAuth login.
- `PUBLIC_WEB_ORIGIN`: deprecated umbrella fallback for older `.env.docker` files.

Keep these out of `.env.docker` unless you need compatibility with an older
deployment. Prefer the canonical variables above.
