# Environment Templates

These files are intentionally not hidden, so IDEs and search tools index them.

Copy the template you need:

```bash
cp config/env/docker.env.example .env.docker
cp config/env/api.env.example apps/api/.env
cp config/env/bacc.env.example apps/bacc/.env.local
cp config/env/worker.env.example apps/worker/.env
```

Real env files stay hidden and ignored by git:

- `.env`
- `.env.docker`
- `apps/*/.env`
- `apps/*/.env.local`

`AUTH_URL` in `bacc.env.example` is the Auth.js v5 public URL name.
`NEXTAUTH_URL` is kept for NextAuth compatibility. Use the same value for both
when running BACC locally.
