import { Container } from "@cloudflare/containers";

// 需要从 Worker env 注入到容器 process.env 的 secrets
const SECRET_KEYS = [
    "DATABASE_URL", "DIRECT_DATABASE_URL", "ADMIN_SECRET", "JWT_SECRET",
    "WORKER_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET",
    "APPLE_CLIENT_ID", "APPLE_TEAM_ID", "APPLE_KEY_ID", "APPLE_PRIVATE_KEY",
    "TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET",
    "DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET",
    "OAUTH_CALLBACK_BASE", "NANO_BANANA_API_KEY",
    "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN",
    "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET",
    "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY",
    "BACC_ORIGIN", "ADMIN_ORIGIN",
];

export class BaccApiContainer extends Container {
    defaultPort = 3001;
    sleepAfter = "5m";

    constructor(ctx, env) {
        super(ctx, env);
        // envVars 会直接注入到容器的 process.env，无需 header 中转
        for (const key of SECRET_KEYS) {
            if (env[key]) this.envVars[key] = env[key];
        }
    }

    onStart() { console.log("BaccApiContainer started"); }
    onStop() { console.log("BaccApiContainer stopped"); }
    onError(error) { console.error("BaccApiContainer error:", error); }
}

export default {
    async fetch(request, env) {
        const container = env.BACC_API.get(
            env.BACC_API.idFromName("singleton")
        );
        return container.fetch(request);
    }
};