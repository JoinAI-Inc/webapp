import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { Entitlement } from '@repo/platform-sdk';

export default function DashboardPage() {
    const { user, logout, sdk } = useAuth();
    const navigate = useNavigate();
    const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        async function loadEntitlements() {
            try {
                const data = await sdk.subscription.getEntitlements();
                setEntitlements(data);
            } catch (error) {
                console.error('加载授权失败:', error);
            } finally {
                setLoading(false);
            }
        }

        loadEntitlements();
    }, [user, navigate, sdk]);

    if (!user) return null;

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1>欢迎, {user.name}</h1>
                <button onClick={logout}>登出</button>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2>用户信息</h2>
                <p>邮箱: {user.email}</p>
                <p>ID: {user.id}</p>
            </div>

            <div>
                <h2>我的授权</h2>
                {loading ? (
                    <p>加载中...</p>
                ) : entitlements.length === 0 ? (
                    <div>
                        <p>您还没有任何授权</p>
                        <button onClick={() => navigate('/subscribe')}>订阅</button>
                    </div>
                ) : (
                    <ul>
                        {entitlements.map((ent) => (
                            <li key={ent.id}>
                                {ent.scopeType === 'GLOBAL' ? '全局访问' : `应用: ${ent.application?.name || ent.appId}`}
                                {' - '}
                                {ent.entitlementType === 'PERMANENT'
                                    ? '永久'
                                    : `订阅至 ${new Date(ent.expireTime!).toLocaleDateString()}`}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
