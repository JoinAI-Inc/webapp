'use client'

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, message, Dropdown, DatePicker, Space } from 'antd';
import { PlusOutlined, DownOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import {
    getApps, createApp, updateApp, getPlans,
    getAppBlockers, unlistApp, disableApp, sunsetApp, archiveApp, republishApp
} from '../../lib/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const AppList = () => {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingApp, setEditingApp] = useState(null);
    const [plans, setPlans] = useState([]);
    const [form] = Form.useForm();

    const fetchApps = async () => {
        setLoading(true);
        try {
            const data = await getApps();
            setApps(data);
        } catch (error) {
            message.error('Failed to load apps');
        }
        setLoading(false);
    };

    const fetchPlans = async () => {
        const data = await getPlans();
        setPlans(data);
    };

    useEffect(() => {
        fetchApps();
        fetchPlans();
    }, []);

    const handleCreateOrUpdate = async (values) => {
        try {
            if (editingApp) {
                await updateApp(editingApp.id, values);
                message.success('App updated');
            } else {
                await createApp(values);
                message.success('App created');
            }
            setIsModalOpen(false);
            setEditingApp(null);
            form.resetFields();
            fetchApps();
        } catch (error) {
            message.error('Operation failed');
        }
    };

    const openModal = (app = null) => {
        setEditingApp(app);
        if (app) {
            form.setFieldsValue({
                ...app,
                planIds: app.pricingPlans?.map(p => p.pricingPlanId || p.planId) || []
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ appKey: `app_${Date.now()}` });
        }
        setIsModalOpen(true);
    };

    const getStatusColor = (status) => {
        const colors = {
            DRAFT: 'default', PUBLISHED: 'green', UNLISTED: 'orange',
            DISABLED: 'red', SUNSET: 'purple', ARCHIVED: 'default'
        };
        return colors[status] || 'default';
    };

    const handleUnlist = async (app) => {
        const blockers = await getAppBlockers(app.id);
        Modal.confirm({
            title: '确认下架应用？',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>下架后：</p>
                    <ul style={{ paddingLeft: 20 }}>
                        <li>新用户无法购买</li>
                        <li>已购用户仍可正常使用</li>
                        {blockers.hasActivePricingPlans?.length > 0 && (
                            <li style={{ color: '#faad14' }}>⚠️ 此应用被 {blockers.hasActivePricingPlans.length} 个定价计划引用</li>
                        )}
                        {blockers.hasActiveEntitlements > 0 && (
                            <li style={{ color: '#1890ff' }}>📊 当前有 {blockers.hasActiveEntitlements} 个活跃用户权益</li>
                        )}
                    </ul>
                </div>
            ),
            onOk: async () => {
                try {
                    await unlistApp(app.id);
                    message.success('应用已下架');
                    fetchApps();
                } catch (error) {
                    message.error(error.response?.data?.error || '操作失败');
                }
            }
        });
    };

    const handleDisable = async (app) => {
        Modal.confirm({
            title: '确认禁用新授权？',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>禁用后：</p>
                    <ul style={{ paddingLeft: 20 }}>
                        <li>无法被加入新的定价计划</li>
                        <li>现有计划中的用户仍可使用</li>
                    </ul>
                </div>
            ),
            onOk: async () => {
                try {
                    await disableApp(app.id);
                    message.success('已禁用新授权');
                    fetchApps();
                } catch (error) {
                    message.error(error.response?.data?.error || '操作失败');
                }
            }
        });
    };

    const handleSunset = (app) => {
        let sunsetDate;
        let reason;
        Modal.confirm({
            title: '设置终止服务时间',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>在指定时间后，应用将停止服务</p>
                    <Form layout="vertical">
                        <Form.Item label="终止时间">
                            <DatePicker
                                showTime
                                placeholder="选择终止服务时间"
                                disabledDate={(current) => current && current < dayjs().startOf('day')}
                                onChange={(date) => sunsetDate = date}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                        <Form.Item label="原因（可选）">
                            <TextArea rows={3} placeholder="说明终止原因" onChange={(e) => reason = e.target.value} />
                        </Form.Item>
                    </Form>
                </div>
            ),
            onOk: async () => {
                if (!sunsetDate) { message.error('请选择终止时间'); return Promise.reject(); }
                try {
                    await sunsetApp(app.id, { sunsetAt: sunsetDate.toISOString(), reason });
                    message.success('已设置终止时间');
                    fetchApps();
                } catch (error) {
                    message.error(error.response?.data?.error || '操作失败');
                }
            }
        });
    };

    const handleArchive = async (app) => {
        const blockers = await getAppBlockers(app.id);
        if (!blockers.canArchive) {
            Modal.warning({
                title: '无法归档',
                content: (
                    <div>
                        <p>存在以下阻塞条件：</p>
                        <ul style={{ paddingLeft: 20 }}>
                            {blockers.hasActiveEntitlements > 0 && <li>存在 {blockers.hasActiveEntitlements} 个活跃用户权益</li>}
                            {app.status !== 'DISABLED' && app.status !== 'SUNSET' && <li>应用必须先禁用或设置终止时间</li>}
                        </ul>
                    </div>
                )
            });
            return;
        }
        let archiveReason;
        Modal.confirm({
            title: '确认归档应用？',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p style={{ color: '#f5222d' }}>⚠️ 归档后应用将完全不可用</p>
                    <Form layout="vertical">
                        <Form.Item label="归档原因">
                            <TextArea rows={3} placeholder="请说明归档原因" onChange={(e) => archiveReason = e.target.value} />
                        </Form.Item>
                    </Form>
                </div>
            ),
            onOk: async () => {
                try {
                    await archiveApp(app.id, archiveReason);
                    message.success('应用已归档');
                    fetchApps();
                } catch (error) {
                    message.error(error.response?.data?.error || '操作失败');
                }
            }
        });
    };

    const handleRepublish = (app) => {
        Modal.confirm({
            title: '确认重新发布？',
            content: '重新发布后，应用将恢复可见和可购买状态',
            onOk: async () => {
                try {
                    await republishApp(app.id);
                    message.success('应用已重新发布');
                    fetchApps();
                } catch (error) {
                    message.error(error.response?.data?.error || '操作失败');
                }
            }
        });
    };

    const getActionMenuItems = (app) => {
        const items = [];
        if (app.status === 'PUBLISHED') items.push({ key: 'unlist', label: '下架', onClick: () => handleUnlist(app) });
        if (['PUBLISHED', 'UNLISTED'].includes(app.status)) items.push({ key: 'disable', label: '禁用', onClick: () => handleDisable(app) });
        if (['UNLISTED', 'DISABLED'].includes(app.status)) {
            items.push({ key: 'sunset', label: '设置终止时间', onClick: () => handleSunset(app) });
            items.push({ key: 'republish', label: '重新发布', onClick: () => handleRepublish(app) });
        }
        if (['DISABLED', 'SUNSET'].includes(app.status)) items.push({ key: 'archive', label: '归档', danger: true, onClick: () => handleArchive(app) });
        if (app.status === 'ARCHIVED') items.push({ key: 'view', label: '仅查看', disabled: true });
        return items;
    };

    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'App Key', dataIndex: 'appKey', key: 'appKey' },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => (
                <Space direction="vertical" size={0}>
                    <Tag color={getStatusColor(status)}>{status}</Tag>
                    {status === 'SUNSET' && record.sunsetAt && (
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                            截止: {dayjs(record.sunsetAt).format('YYYY-MM-DD HH:mm')}
                        </span>
                    )}
                </Space>
            )
        },
        {
            title: 'URL',
            dataIndex: 'accessUrl',
            key: 'accessUrl',
            render: url => url ? <a href={url} target="_blank" rel="noreferrer">{url}</a> : '-'
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => {
                const menuItems = getActionMenuItems(record);
                return (
                    <Space>
                        <Button type="link" onClick={() => openModal(record)}>Edit</Button>
                        {menuItems.length > 0 && (
                            <Dropdown menu={{ items: menuItems }}>
                                <Button>操作 <DownOutlined /></Button>
                            </Dropdown>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <h2>App Management</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>New App</Button>
            </div>
            <Table columns={columns} dataSource={apps} rowKey="id" loading={loading} />
            <Modal
                title={editingApp ? "Edit App" : "Create App"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                width={600}
            >
                <Form layout="vertical" form={form} onFinish={handleCreateOrUpdate}>
                    <Form.Item name="name" label="App Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="appKey" label="App Key" rules={[{ required: true }]}><Input disabled={!!editingApp} /></Form.Item>
                    <Form.Item name="accessUrl" label="URL"><Input /></Form.Item>
                    <Form.Item name="description" label="Description"><TextArea rows={3} /></Form.Item>
                    {editingApp && (
                        <>
                            <Form.Item name="status" label="Status">
                                <Select>
                                    {['DRAFT', 'PUBLISHED', 'UNLISTED', 'DISABLED', 'SUNSET', 'ARCHIVED'].map(s => <Option key={s} value={s}>{s}</Option>)}
                                </Select>
                            </Form.Item>
                            <Form.Item name="planIds" label="Associated Plans">
                                <Select mode="multiple" placeholder="Select plans">
                                    {plans.map(p => (
                                        <Option key={p.id} value={p.id}>{p.name} ({p.scopeType}) - {p.price} {p.currency}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default AppList;
