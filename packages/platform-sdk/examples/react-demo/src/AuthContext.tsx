import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AppSDK, { User } from '@repo/platform-sdk';

// 创建SDK实例
const sdk = new AppSDK({
    apiBaseUrl: 'http://localhost:3001/api',
    oauth: {
        google: { clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '' },
        discord: { clientId: import.meta.env.VITE_DISCORD_CLIENT_ID || '' },
    },
    callbackUrl: `${window.location.origin}/auth/callback`,
});

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (provider: 'google' | 'apple' | 'discord' | 'twitter') => void;
    logout: () => void;
    sdk: AppSDK;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 检查现有登录状态
        if (sdk.auth.isAuthenticated()) {
            setUser(sdk.auth.getCurrentUser());
        }
        setLoading(false);
    }, []);

    const login = (provider: 'google' | 'apple' | 'discord' | 'twitter') => {
        sdk.auth.login(provider);
    };

    const logout = () => {
        sdk.auth.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, sdk }}>
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
