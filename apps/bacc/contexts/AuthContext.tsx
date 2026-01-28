'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AppSDK, { User } from '@repo/platform-sdk';

// 创建SDK实例
const sdk = new AppSDK({
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api',
    appId: process.env.NEXT_PUBLIC_APP_ID,
    oauth: {
        google: {
            clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
        },
    },
    autoValidate: {
        enabled: true,
        interval: 5 * 60 * 1000, // 每5分钟校验一次
    },
});

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (provider: 'google' | 'apple' | 'discord' | 'twitter') => void;
    logout: () => void;
    refreshAuth: () => void;
    sdk: AppSDK;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // 手动刷新认证状态
    const refreshAuth = () => {
        console.log('[AuthContext] 刷新认证状态...');
        if (sdk.auth.isAuthenticated()) {
            const currentUser = sdk.auth.getCurrentUser();
            console.log('[AuthContext] 当前用户:', currentUser);
            setUser(currentUser);
        } else {
            console.log('[AuthContext] 未登录');
            setUser(null);
        }
    };

    useEffect(() => {
        // 检查现有登录状态
        refreshAuth();
        setLoading(false);

        // 监听认证状态变更
        const unsubscribe = sdk.onAuthStateChange((result) => {
            console.log('[AuthContext] 认证状态变更:', result);
            if (!result.isValid) {
                console.log('[AuthContext] 认证已失效:', result.message);
                setUser(null);
            } else if (result.user) {
                console.log('[AuthContext] 认证有效，更新用户:', result.user);
                setUser(result.user);
            }
        });

        return () => unsubscribe();
    }, []);

    const login = (provider: 'google' | 'apple' | 'discord' | 'twitter') => {
        sdk.auth.login(provider);
    };

    const logout = () => {
        sdk.auth.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshAuth, sdk }}>
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
