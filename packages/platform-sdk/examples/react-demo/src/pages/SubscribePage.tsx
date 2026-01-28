import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plan } from '@repo/platform-sdk';

export default function SubscribePage() {
    const { user, sdk } = useAuth();
    const navigate = useNavigate();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        async function loadPlans() {
            try {
                const data = await sdk.subscription.getPlans();
                setPlans(data);
            } catch (error) {
                console.error('加载计费方案失败:', error);
            } finally {
                setLoading(false);
            }
        }

        loadPlans();
    }, [user, navigate, sdk]);

    const handleSubscribe = async (planId: number) => {
        setPurchasing(true);
        try {
            const checkoutUrl = await sdk.subscription.createCheckout({
                planId,
                successUrl: `${window.location.origin}/dashboard`,
                cancelUrl: `${window.location.origin}/subscribe`,
            });

            window.location.href = checkoutUrl;
        } catch (error: any) {
            console.error('创建支付会话失败:', error);
            alert('支付失败: ' + (error.message || '未知错误'));
            setPurchasing(false);
        }
    };

    if (!user) return null;

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>选择计费方案</h1>

            {loading ? (
                <p>加载中...</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '30px' }}>
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            style={{
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <h3>{plan.name}</h3>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '16px 0' }}>
                                ${plan.price}
                                {plan.type === 'SUBSCRIPTION' && plan.interval && (
                                    <span style={{ fontSize: '16px', fontWeight: 'normal' }}>
                                        /{plan.interval.toLowerCase()}
                                    </span>
                                )}
                            </div>
                            <p style={{ color: '#666', flexGrow: 1 }}>
                                {plan.type === 'SUBSCRIPTION' ? '订阅制' : '一次性购买'}
                            </p>
                            <button
                                onClick={() => handleSubscribe(plan.id)}
                                disabled={purchasing}
                                style={{
                                    padding: '12px',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: purchasing ? 'not-allowed' : 'pointer',
                                    opacity: purchasing ? 0.6 : 1
                                }}
                            >
                                {purchasing ? '处理中...' : '立即订阅'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
