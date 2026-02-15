'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';

// 本地类型定义
interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (provider: 'google' | 'apple' | 'discord' | 'twitter') => void;
    logout: () => void;
    refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // 从 NextAuth session 同步到 AuthContext
    useEffect(() => {
        console.log('[AuthContext] Session status:', status);
        console.log('[AuthContext] Session data:', session);

        if (status === 'loading') {
            setLoading(true);
            return;
        }

        if (status === 'authenticated' && session?.user) {
            // 使用后端返回的数据库user ID，而不是OAuth provider ID
            const dbUserId = (session as any).userId; // 从后端callback返回的真实数据库ID
            const userData = {
                id: dbUserId || session.user.email!, // fallback到email
                email: session.user.email!,
                name: session.user.name || '',
            };
            console.log('[AuthContext] User data:', userData);
            setUser(userData);
            setLoading(false);
        } else {
            setUser(null);
            setLoading(false);
        }
    }, [session, status]);

    // 手动刷新认证状态
    const refreshAuth = () => {
        // NextAuth 会自动管理 session
    };

    const login = (provider: 'google' | 'apple' | 'discord' | 'twitter') => {
        // 请直接使用 signIn 方法登录
    };

    const logout = async () => {
        // 调用 NextAuth signOut
        await signOut({ callbackUrl: '/' });
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
