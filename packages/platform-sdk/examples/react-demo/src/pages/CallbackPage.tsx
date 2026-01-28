import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

export default function CallbackPage() {
    const { sdk } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function handleCallback() {
            try {
                const result = await sdk.auth.handleCallback();
                console.log('登录成功:', result.user);

                // 重定向到主页
                navigate('/dashboard');
            } catch (err: any) {
                console.error('登录失败:', err);
                setError(err.message || '登录失败');
            }
        }

        handleCallback();
    }, [sdk, navigate]);

    if (error) {
        return (
            <div style={{ textAlign: 'center', marginTop: '100px' }}>
                <h2>登录失败</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/login')}>返回登录</button>
            </div>
        );
    }

    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h2>正在登录...</h2>
        </div>
    );
}
