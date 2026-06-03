'use client'

import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { DollarCircleOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getRevenueStats, getOverviewStats } from '../lib/api';

const Dashboard = () => {
    const [stats, setStats] = useState([]);
    const [overview, setOverview] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalUsers: 0,
        activeEntitlements: 0
    });

    useEffect(() => {
        getRevenueStats().then(setStats);
        getOverviewStats().then(setOverview);
    }, []);

    const totalRevenue = stats.reduce((acc, curr) => acc + curr.revenue, 0);

    return (
        <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={12}>
                    <Card bordered={false}>
                        <Statistic
                            title="Total Revenue (7 Days)"
                            value={totalRevenue}
                            precision={2}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<DollarCircleOutlined />}
                            suffix="$"
                        />
                    </Card>
                </Col>
                <Col span={12}>
                    <Card bordered={false}>
                        <Statistic
                            title="Total Orders"
                            value={overview.totalOrders}
                            valueStyle={{ color: '#cf1322' }}
                            prefix={<ShoppingCartOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title="Revenue Trend" bordered={false}>
                <div style={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer>
                        <AreaChart
                            data={stats}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;
