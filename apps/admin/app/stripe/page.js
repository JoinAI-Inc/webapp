'use client'

import React, { useState } from 'react';
import { Card, Button, message, Descriptions, Badge, Divider, Row, Col, Statistic } from 'antd';
import {
    SyncOutlined, CheckCircleOutlined, WarningOutlined,
    DollarCircleOutlined, ApiOutlined
} from '@ant-design/icons';
import { syncStripeProducts, reconcileStripeOrders, syncAllSubscriptions } from '../../lib/api';

const StripeManagement = () => {
    const [syncing, setSyncing] = useState(false);
    const [reconciling, setReconciling] = useState(false);
    const [syncingSubscriptions, setSyncingSubscriptions] = useState(false);
    const [syncResult, setSyncResult] = useState(null);
    const [reconcileResult, setReconcileResult] = useState(null);

    const handleSyncProducts = async () => {
        try {
            setSyncing(true);
            const result = await syncStripeProducts();
            setSyncResult(result);
            message.success(`同步成功！创建 ${result.created} 个，更新 ${result.updated} 个产品`);
        } catch (error) {
            message.error('同步失败: ' + (error.response?.data?.error || error.message));
        } finally {
            setSyncing(false);
        }
    };

    const handleReconcile = async () => {
        try {
            setReconciling(true);
            const result = await reconcileStripeOrders(30);
            setReconcileResult(result);
            if (result.mismatches.length === 0) {
                message.success(`对账完成！检查了 ${result.totalChecked} 笔订单，数据一致`);
            } else {
                message.warning(`发现 ${result.mismatches.length} 个不一致项，请查看详情`);
            }
        } catch (error) {
            message.error('对账失败: ' + (error.response?.data?.error || error.message));
        } finally {
            setReconciling(false);
        }
    };

    const handleSyncSubscriptions = async () => {
        try {
            setSyncingSubscriptions(true);
            const result = await syncAllSubscriptions();
            message.success(`订阅同步完成！成功同步 ${result.synced} 个订阅`);
            if (result.errors.length > 0) message.warning(`${result.errors.length} 个订阅同步失败`);
        } catch (error) {
            message.error('订阅同步失败: ' + (error.response?.data?.error || error.message));
        } finally {
            setSyncingSubscriptions(false);
        }
    };

    return (
        <div>
            <Card title={<span><ApiOutlined style={{ marginRight: 8 }} />Stripe 集成管理</span>} bordered={false}>
                <p style={{ marginBottom: 24, color: '#666' }}>管理Stripe支付集成，同步产品数据，检查订单一致性</p>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={8}>
                        <Card>
                            <Statistic title="产品同步" value="自动同步" prefix={<SyncOutlined />} valueStyle={{ fontSize: 16 }} />
                            <Button type="primary" icon={<SyncOutlined />} loading={syncing} onClick={handleSyncProducts} block style={{ marginTop: 12 }}>从Stripe同步产品</Button>
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic title="数据对账" value="检查一致性" prefix={<CheckCircleOutlined />} valueStyle={{ fontSize: 16 }} />
                            <Button icon={<CheckCircleOutlined />} loading={reconciling} onClick={handleReconcile} block style={{ marginTop: 12 }}>对账检查（30天）</Button>
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic title="订阅同步" value="更新状态" prefix={<DollarCircleOutlined />} valueStyle={{ fontSize: 16 }} />
                            <Button icon={<SyncOutlined />} loading={syncingSubscriptions} onClick={handleSyncSubscriptions} block style={{ marginTop: 12 }}>同步所有订阅状态</Button>
                        </Card>
                    </Col>
                </Row>
                <Divider />
                {syncResult && (
                    <Card title="产品同步结果" style={{ marginBottom: 16 }} type="inner">
                        <Descriptions bordered column={2}>
                            <Descriptions.Item label="已同步"><Badge status="success" text={syncResult.synced} /></Descriptions.Item>
                            <Descriptions.Item label="新创建"><Badge status="processing" text={syncResult.created} /></Descriptions.Item>
                            <Descriptions.Item label="已更新"><Badge status="warning" text={syncResult.updated} /></Descriptions.Item>
                            <Descriptions.Item label="错误"><Badge status="error" text={syncResult.errors.length} /></Descriptions.Item>
                        </Descriptions>
                        {syncResult.errors.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <h4>错误详情：</h4>
                                <ul>{syncResult.errors.map((err, idx) => <li key={idx} style={{ color: 'red' }}>{err}</li>)}</ul>
                            </div>
                        )}
                    </Card>
                )}
                {reconcileResult && (
                    <Card title="对账结果" style={{ marginBottom: 16 }} type="inner">
                        <Descriptions bordered column={2}>
                            <Descriptions.Item label="检查总数">{reconcileResult.totalChecked}</Descriptions.Item>
                            <Descriptions.Item label="不一致项">
                                <Badge status={reconcileResult.mismatches.length > 0 ? "error" : "success"} text={reconcileResult.mismatches.length} />
                            </Descriptions.Item>
                        </Descriptions>
                        {reconcileResult.mismatches.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <h4><WarningOutlined style={{ color: 'orange', marginRight: 8 }} />发现以下不一致项：</h4>
                                <ul>
                                    {reconcileResult.mismatches.map((mismatch, idx) => (
                                        <li key={idx}>
                                            <strong>{mismatch.type}</strong>: Session {mismatch.sessionId || 'N/A'} - Order {mismatch.orderId || 'N/A'}
                                            <pre style={{ fontSize: 12, background: '#f5f5f5', padding: 8, marginTop: 4 }}>
                                                {JSON.stringify(mismatch.details, null, 2)}
                                            </pre>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </Card>
                )}
                <Card title="使用说明" type="inner">
                    <ul>
                        <li><strong>产品同步</strong>: 从Stripe Dashboard同步所有产品和价格到数据库</li>
                        <li><strong>数据对账</strong>: 检查Stripe和数据库的订单数据是否一致</li>
                        <li><strong>订阅同步</strong>: 更新所有订阅的状态和到期时间</li>
                        <li><strong>定期执行</strong>: 建议每天执行一次对账，确保数据一致性</li>
                    </ul>
                </Card>
            </Card>
        </div>
    );
};

export default StripeManagement;
