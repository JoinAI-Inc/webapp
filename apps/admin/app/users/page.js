'use client'

import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, message, Modal } from 'antd';
import { LockOutlined, UnlockOutlined, EyeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { getUsers, lockUser } from '../../lib/api';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            message.error('Failed to load users');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleLockToggle = async (user) => {
        Modal.confirm({
            title: `${user.isLocked ? 'Unlock' : 'Lock'} User`,
            content: `Are you sure you want to ${user.isLocked ? 'unlock' : 'lock'} ${user.email}?`,
            onOk: async () => {
                try {
                    await lockUser(user.id, !user.isLocked);
                    message.success(`User ${user.isLocked ? 'unlocked' : 'locked'} successfully`);
                    fetchUsers();
                } catch (error) {
                    message.error('Operation failed');
                }
            },
        });
    };

    const columns = [
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (email, record) => (
                <span>
                    {email}
                    {record.isLocked && <Tag color="red" style={{ marginLeft: 8 }}>LOCKED</Tag>}
                </span>
            )
        },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        {
            title: 'Total Spent',
            dataIndex: 'totalSpent',
            key: 'totalSpent',
            render: (val) => `$${Number(val).toFixed(2)}`,
            sorter: (a, b) => Number(a.totalSpent) - Number(b.totalSpent)
        },
        {
            title: 'Orders',
            dataIndex: 'orderCount',
            key: 'orderCount',
            sorter: (a, b) => a.orderCount - b.orderCount
        },
        {
            title: 'Active Licenses',
            dataIndex: 'activeEntitlements',
            key: 'activeEntitlements'
        },
        {
            title: 'Joined',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString()
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => router.push(`/users/${record.id}`)}
                    >
                        Details
                    </Button>
                    <Button
                        type="link"
                        danger={!record.isLocked}
                        icon={record.isLocked ? <UnlockOutlined /> : <LockOutlined />}
                        onClick={() => handleLockToggle(record)}
                    >
                        {record.isLocked ? 'Unlock' : 'Lock'}
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <h2>User Management</h2>
            </div>

            <Table
                columns={columns}
                dataSource={users}
                rowKey="id"
                loading={loading}
            />
        </div>
    );
};

export default UserList;
