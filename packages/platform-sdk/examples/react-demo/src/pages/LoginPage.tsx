import { useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const { user, login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: '20px'
        }}>
            <h1>平台登录</h1>

            <button
                onClick={() => login('google')}
                style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    backgroundColor: '#4285f4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                使用 Google 登录
            </button>

            <button
                onClick={() => login('discord')}
                style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    backgroundColor: '#5865f2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                使用 Discord 登录
            </button>
        </div>
    );
}
