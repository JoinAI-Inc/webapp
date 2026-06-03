'use client'

import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Table, Tag, Spin, Button, message } from 'antd';
import { ArrowLeftOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { getUserDetail, lockUser } from '../../../lib/api';

const UserDetail = () => {
    const { id } = useParams();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        setLoading(true);
        try {
            const data = await getUserDetail(id);
            setUser(data);
        } catch (error) {
            message.error('Failed to load user');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUser();
    }, [id]);

    const handleLockToggle = async () => {
        try {
            await lockUser(user.id, !user.isLocked);
            message.success(`User ${user.isLocked ? 'unlocked' : 'locked'}`);
            fetchUser();
        } catch (error) {
            message.error('Operation failed');
        }
    };

    if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
    if (!user) return <div>User not found</div>;

    const orderColumns = [
        {
            title: 'Order ID',
            dataIndex: 'id',
            key: 'id',
            render: (id) => id.substring(0, 16) + '...'
        },
        { title: 'Plan', dataIndex: ['pricingPlan', 'name'], key: 'plan' },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (val, record) => `$${Number(val).toFixed(2)} ${record.pricingPlan.currency}`
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'PAID' ? 'green' : status === 'PENDING' ? 'orange' : 'red'}>
                    {status}
                </Tag>
            )
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString()
        },
    ];

    return (
        <div>
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push('/users')}
                style={{ marginBottom: 16 }}
            >
                Back to Users
            </Button>

            <Card
                title="User Information"
                extra={
                    <Button
                        danger={!user.isLocked}
                        icon={user.isLocked ? <UnlockOutlined /> : <LockOutlined />}
                        onClick={handleLockToggle}
                    >
                        {user.isLocked ? 'Unlock User' : 'Lock User'}
                    </Button>
                }
            >
                <Descriptions column={2}>
                    <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                    <Descriptions.Item label="Name">{user.name || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Status">
                        {user.isLocked ? <Tag color="red">LOCKED</Tag> : <Tag color="green">ACTIVE</Tag>}
                    </Descriptions.Item>
                    <Descriptions.Item label="Joined">
                        {new Date(user.createdAt).toLocaleDateString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Spent">
                        <span style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a' }}>
                            ${Number(user.totalSpent).toFixed(2)}
                        </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Active Entitlements">
                        {user.entitlements.length}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <Card title="Active Entitlements" style={{ marginTop: 16 }}>
                {user.entitlements.length === 0 ? (
                    <p style={{ color: '#999' }}>No active entitlements</p>
                ) : (
                    <ul>
                        {user.entitlements.map(ent => (
                            <li key={ent.id}>
                                <strong>{ent.application ? ent.application.name : 'Global Access'}</strong>
                                {' - '}
                                <Tag>{ent.type}</Tag>
                                {ent.expireTime && ` (Expires: ${new Date(ent.expireTime).toLocaleDateString()})`}
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <Card title="Order History" style={{ marginTop: 16 }}>
                <Table
                    columns={orderColumns}
                    dataSource={user.orders}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
};

export default UserDetail;
