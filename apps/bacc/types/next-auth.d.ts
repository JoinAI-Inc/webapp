declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email?: string | null;
            name?: string | null;
            image?: string | null;
        };
        backendJwt?: string;  // 后端 JWT token
        userId?: string;       // 后端用户 ID
    }
}

export { };
