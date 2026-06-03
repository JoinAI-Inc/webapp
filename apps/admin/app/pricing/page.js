'use client'

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Tag, message, Dropdown, Space } from 'antd';
import { PlusOutlined, DownOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import {
    getPlans, createPlan, updatePlan, getApps,
    getPlanBlockers, retirePlan, archivePlan, reactivatePlan,
    getFeatures
} from '../../lib/api';

const { Option } = Select;
const { TextArea } = Input;

const PricingList = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [apps, setApps] = useState([]);
    const [features, setFeatures] = useState([]);
    const [selectedAppId, setSelectedAppId] = useState(null); // 联动过滤功能点
    const [form] = Form.useForm();

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const data = await getPlans();
            setPlans(data);
        } catch (error) {
            message.error('Failed to load plans');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPlans();
        getApps().then(setApps).catch(() => { });
        getFeatures().then(setFeatures).catch(() => { });
    }, []);

    const handleCreate = async (values) => {
        try {
            // 订阅型必须选 App
            if (values.type === 'SUBSCRIPTION' && (!values.appIds || values.appIds.length === 0)) {
                message.error('订阅类型请至少选择一个 App');
                return;
            }
            await createPlan(values);
            message.success('Plan created');
            setIsModalOpen(false);
            form.resetFields();
            setSelectedAppId(null);
            fetchPlans();
        } catch (error) {
            message.error('Operation failed: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        const pf = plan.planFeatures?.[0];
        const appIdForFeature = pf?.feature?.appId || null;
        setSelectedAppId(appIdForFeature);
        form.setFieldsValue({
            name: plan.name, type: plan.planType, price: plan.price,
            currency: plan.currency, interval: plan.billingInterval,
            appIds: plan.apps?.map(a => a.appId) || [],
            featureId: pf?.featureId || null,
            usageCount: pf?.usageCount || null,
        });
        setIsModalOpen(true);
    };

    const handleUpdate = async (values) => {
        try {
            if (values.type === 'SUBSCRIPTION' && (!values.appIds || values.appIds.length === 0)) {
                message.error('订阅类型请至少选择一个 App');
                return;
            }
            await updatePlan(editingPlan.id, values);
            message.success('Plan updated');
            setIsModalOpen(false);
            setEditingPlan(null);
            form.resetFields();
            setSelectedAppId(null);
            fetchPlans();
        } catch (error) {
            message.error('Operation failed: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingPlan(null);
        form.resetFields();
        setSelectedAppId(null);
    };

    const getStatusColor = (status) => ({ ACTIVE: 'green', RETIRED: 'orange', ARCHIVED: 'default' }[status] || 'default');

    const handleRetire = async (plan) => {
        const blockers = await getPlanBlockers(plan.id);
        const activePlans = plans.filter(p => p.status === 'ACTIVE' && p.id !== plan.id);
        let replacementPlanId;
        Modal.confirm({
            title: '确认停售计划？',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>停售后：</p>
                    <ul style={{ paddingLeft: 20 }}>
                        <li>新用户无法购买此计划</li>
                        <li>现有订阅用户继续享受服务至到期</li>
                        {blockers.activeSubscriptions > 0 && <li style={{ color: '#1890ff' }}>📊 当前有 {blockers.activeSubscriptions} 个活跃订阅</li>}
                        {blockers.activeOrders > 0 && <li>总订单数: {blockers.activeOrders}</li>}
                        {blockers.totalRevenue > 0 && <li>总收入: ${blockers.totalRevenue.toFixed(2)}</li>}
                    </ul>
                    {activePlans.length > 0 && (
                        <Form layout="vertical" style={{ marginTop: 16 }}>
                            <Form.Item label="推荐替代计划（可选）">
                                <Select placeholder="选择替代计划" allowClear onChange={(value) => replacementPlanId = value}>
                                    {activePlans.map(p => <Option key={p.id} value={p.id}>{p.name} - {p.price} {p.currency}</Option>)}
                                </Select>
                            </Form.Item>
                        </Form>
                    )}
                </div>
            ),
            okText: '确认停售',
            onOk: async () => {
                try {
                    await retirePlan(plan.id, replacementPlanId ? { replacementPlanId } : {});
                    message.success('计划已停售');
                    fetchPlans();
                } catch (error) {
                    message.error(error.response?.data?.error || '操作失败');
                }
            }
        });
    };

    const handleArchive = async (plan) => {
        const blockers = await getPlanBlockers(plan.id);
        if (!blockers.canArchive) {
            Modal.warning({
                title: '无法归档',
                content: (
                    <div>
                        <p>存在以下阻塞条件：</p>
                        <ul style={{ paddingLeft: 20 }}>
                            {blockers.activeSubscriptions > 0 && <li>存在 {blockers.activeSubscriptions} 个活跃订阅</li>}
                            {blockers.pendingOrders > 0 && <li>存在 {blockers.pendingOrders} 个待处理订单</li>}
                            {plan.status !== 'RETIRED' && <li>计划必须先停售</li>}
                        </ul>
                    </div>
                )
            });
            return;
        }
        let archiveReason;
        Modal.confirm({
            title: '确认归档计划？',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p style={{ color: '#f5222d' }}>⚠️ 归档后计划将完全不可用</p>
                    <Form layout="vertical">
                        <Form.Item label="归档原因">
                            <TextArea rows={3} placeholder="请说明归档原因" onChange={(e) => archiveReason = e.target.value} />
                        </Form.Item>
                    </Form>
                </div>
            ),
            onOk: async () => {
                try {
                    await archivePlan(plan.id, archiveReason);
                    message.success('计划已归档');
                    fetchPlans();
                } catch (error) {
                    message.error(error.response?.data?.error || '操作失败');
                }
            }
        });
    };

    const handleReactivate = (plan) => {
        Modal.confirm({
            title: '确认重新激活？',
            content: '重新激活后，计划将恢复可售卖状态',
            onOk: async () => {
                try {
                    await reactivatePlan(plan.id);
                    message.success('计划已重新激活');
                    fetchPlans();
                } catch (error) {
                    message.error(error.response?.data?.error || '操作失败');
                }
            }
        });
    };

    const getActionMenuItems = (plan) => {
        const items = [];
        if (['ACTIVE', 'RETIRED'].includes(plan.status)) items.push({ key: 'edit', label: '编辑', onClick: () => handleEdit(plan) });
        if (plan.status === 'ACTIVE') items.push({ key: 'retire', label: '停售', onClick: () => handleRetire(plan) });
        if (plan.status === 'RETIRED') {
            items.push({ key: 'reactivate', label: '重新激活', onClick: () => handleReactivate(plan) });
            items.push({ key: 'archive', label: '归档', danger: true, onClick: () => handleArchive(plan) });
        }
        if (plan.status === 'ARCHIVED') items.push({ key: 'view', label: '仅查看', disabled: true });
        return items;
    };

    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Type', dataIndex: 'planType', key: 'planType', render: (type) => type || '—' },
        { title: 'Apps', key: 'apps', render: (_, record) => { const n = record.apps?.length || 0; return n > 0 ? `${n} app(s)` : '—'; } },
        {
            title: '功能点',
            key: 'features',
            render: (_, record) => {
                const pfs = record.planFeatures || [];
                if (pfs.length === 0) return <span style={{ color: '#8c8c8c' }}>—</span>;
                return pfs.map(pf => (
                    <Tag key={pf.featureId} color={pf.feature?.chargingType === 'TOGGLE' ? 'purple' : 'blue'}>
                        {pf.feature?.name || pf.featureId}
                        {pf.usageCount ? ` ×${pf.usageCount}` : ' (开关)'}
                    </Tag>
                ));
            }
        },
        { title: 'Price', key: 'price', render: (_, r) => `${r.price} ${r.currency}` },
        { title: 'Interval', dataIndex: 'billingInterval', key: 'billingInterval', render: (interval) => interval || '—' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={getStatusColor(status)}>{status || 'ACTIVE'}</Tag> },
        { title: 'Active', dataIndex: 'isActive', key: 'isActive', render: val => val ? 'Yes' : 'No' },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => {
                const menuItems = getActionMenuItems(record);
                return menuItems.length > 0 ? (
                    <Dropdown menu={{ items: menuItems }}><Button>操作 <DownOutlined /></Button></Dropdown>
                ) : <span style={{ color: '#8c8c8c' }}>—</span>;
            },
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <h2>Pricing Plans</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingPlan(null); setSelectedAppId(null); form.resetFields(); setIsModalOpen(true); }}>New Plan</Button>
            </div>
            <Table columns={columns} dataSource={plans} rowKey="id" loading={loading} />
            <Modal
                title={editingPlan ? "Edit Pricing Plan" : "Create Pricing Plan"}
                open={isModalOpen}
                onCancel={handleModalClose}
                onOk={() => form.submit()}
                width={600}
            >
                <Form layout="vertical" form={form} onFinish={editingPlan ? handleUpdate : handleCreate} initialValues={{ type: 'SUBSCRIPTION', currency: 'USD' }}>
                    <Form.Item name="name" label="Plan Name" rules={[{ required: true }]}><Input placeholder="e.g., Pro Monthly, Editor License" /></Form.Item>
                    <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                        <Select onChange={() => { setSelectedAppId(null); form.resetFields(['appIds', 'featureId', 'usageCount', 'interval']); }}>
                            <Option value="SUBSCRIPTION">SUBSCRIPTION - 订阅（授权整个 App）</Option>
                            <Option value="USAGE_PACK">USAGE_PACK - 按次数消费</Option>
                            <Option value="ONE_TIME">ONE_TIME - 一次性购买（功能解锁）</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="price" label="Price" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} precision={2} /></Form.Item>
                    <Form.Item name="currency" label="Currency">
                        <Select><Option value="USD">USD</Option><Option value="CNY">CNY</Option></Select>
                    </Form.Item>

                    {/* 动态内容按 type 切换 */}
                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
                        {({ getFieldValue }) => {
                            const type = getFieldValue('type');
                            if (type === 'SUBSCRIPTION') return (
                                <>
                                    <Form.Item name="interval" label="Billing Interval">
                                        <Select placeholder="Select interval">
                                            <Option value="MONTH">Monthly</Option>
                                            <Option value="QUARTER">Quarterly</Option>
                                            <Option value="YEAR">Yearly</Option>
                                        </Select>
                                    </Form.Item>
                                    <Form.Item name="appIds" label="授权 App" rules={[{ required: true, message: '订阅请至少选一个 App' }]}
                                        extra="订阅后用户可访问所选 App 的所有功能">
                                        <Select mode="multiple" placeholder="Select apps">
                                            {apps.filter(a => a.status === 'PUBLISHED').map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
                                        </Select>
                                    </Form.Item>
                                </>
                            );
                            if (type === 'USAGE_PACK') return (
                                <>
                                    <Form.Item label="属于 App" required extra="先选择 App，下方功能点列表将自动过滤">
                                        <Select
                                            placeholder="选择 App"
                                            value={selectedAppId}
                                            onChange={(v) => { setSelectedAppId(v); form.resetFields(['featureId']); }}
                                        >
                                            {apps.filter(a => a.status === 'PUBLISHED').map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
                                        </Select>
                                    </Form.Item>
                                    <Form.Item name="featureId" label="功能点" rules={[{ required: true, message: '请选择功能点' }]}>
                                        <Select placeholder={selectedAppId ? '选择按次数计费的功能点' : '请先选择 App'} disabled={!selectedAppId}>
                                            {features
                                                .filter(f => (f.chargingType === 'COUNT' || !f.chargingType) && f.appId == selectedAppId)
                                                .map(f => <Option key={f.id} value={f.id}>{f.name} ({f.featureKey})</Option>)
                                            }
                                        </Select>
                                    </Form.Item>
                                    <Form.Item name="usageCount" label="包含次数" rules={[{ required: true, message: '请输入包含次数' }]}>
                                        <InputNumber min={1} style={{ width: '100%' }} placeholder="例如: 3" />
                                    </Form.Item>
                                </>
                            );
                            if (type === 'ONE_TIME') return (
                                <>
                                    <Form.Item label="属于 App" extra="先选择 App，下方只显示该 App 的 TOGGLE 功能点">
                                        <Select
                                            placeholder="选择 App"
                                            value={selectedAppId}
                                            allowClear
                                            onChange={(v) => { setSelectedAppId(v || null); form.resetFields(['featureId']); }}
                                        >
                                            {apps.filter(a => a.status === 'PUBLISHED').map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
                                        </Select>
                                    </Form.Item>
                                    <Form.Item name="featureId" label="绑定 TOGGLE 功能点 (可选)"
                                        extra="付费后该功能永久解锁；不选则仅开通 App 访问权限">
                                        <Select placeholder={selectedAppId ? '选择 TOGGLE 功能点' : '请先选择 App'} disabled={!selectedAppId} allowClear>
                                            {features
                                                .filter(f => f.chargingType === 'TOGGLE' && f.appId == selectedAppId)
                                                .map(f => <Option key={f.id} value={f.id}>{f.name} ({f.featureKey})</Option>)
                                            }
                                        </Select>
                                    </Form.Item>
                                </>
                            );
                            return null;
                        }}
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default PricingList;
