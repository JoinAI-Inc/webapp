'use client'

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Tag, Space } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { getFeatures, createFeature, updateFeature, getApps } from '../../lib/api';

const { Option } = Select;
const { TextArea } = Input;

const FeatureList = () => {
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFeature, setEditingFeature] = useState(null);
    const [apps, setApps] = useState([]);
    const [form] = Form.useForm();

    const fetchFeatures = async () => {
        setLoading(true);
        try {
            const data = await getFeatures();
            setFeatures(data);
        } catch (error) {
            message.error('加载功能点失败');
        }
        setLoading(false);
    };

    const fetchApps = async () => {
        try {
            const data = await getApps();
            setApps(data);
        } catch (error) {
            message.error('加载应用列表失败');
        }
    };

    useEffect(() => {
        fetchFeatures();
        fetchApps();
    }, []);

    const handleCreate = () => {
        setEditingFeature(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (feature) => {
        setEditingFeature(feature);
        form.setFieldsValue({
            featureKey: feature.featureKey,
            appId: feature.appId,
            name: feature.name,
            description: feature.description,
            isActive: feature.isActive,
            chargingType: feature.chargingType || 'COUNT',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (values) => {
        try {
            if (editingFeature) {
                await updateFeature(editingFeature.id, values);
                message.success('功能点更新成功');
            } else {
                await createFeature(values);
                message.success('功能点创建成功');
            }
            setIsModalOpen(false);
            form.resetFields();
            fetchFeatures();
        } catch (error) {
            message.error('操作失败: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingFeature(null);
        form.resetFields();
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        { title: '功能Key', dataIndex: 'featureKey', key: 'featureKey', render: (text) => <code>{text}</code> },
        { title: '功能名称', dataIndex: 'name', key: 'name' },
        { title: '所属应用', dataIndex: ['app', 'name'], key: 'app' },
        { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
        {
            title: '计费类型',
            dataIndex: 'chargingType',
            key: 'chargingType',
            render: (t) => <Tag color={t === 'TOGGLE' ? 'purple' : 'blue'}>{t === 'TOGGLE' ? '开关解锁' : '按次数'}</Tag>
        },
        {
            title: '状态',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? '启用' : '禁用'}</Tag>
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString('zh-CN')
        },
        {
            title: '操作',
            key: 'action',
            fixed: 'right',
            width: 100,
            render: (_, record) => (
                <Space>
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <h2>功能点管理</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新建功能点</Button>
            </div>
            <Table
                columns={columns}
                dataSource={features}
                loading={loading}
                rowKey="id"
                scroll={{ x: 1000 }}
                pagination={{ showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
            />
            <Modal
                title={editingFeature ? '编辑功能点' : '新建功能点'}
                open={isModalOpen}
                onCancel={handleModalClose}
                footer={null}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        name="featureKey" label="功能Key"
                        rules={[{ required: true, message: '请输入功能Key' }, { pattern: /^[a-z0-9_]+$/, message: '只能包含小写字母、数字和下划线' }]}
                        extra="格式: app_feature_name，如: bacc_hanfu_generation"
                    >
                        <Input placeholder="bacc_hanfu_generation" disabled={!!editingFeature} />
                    </Form.Item>
                    <Form.Item name="appId" label="所属应用" rules={[{ required: true, message: '请选择所属应用' }]}>
                        <Select placeholder="选择应用">
                            {apps.map(app => <Option key={app.id} value={app.id}>{app.name} ({app.appKey})</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="name" label="功能名称" rules={[{ required: true, message: '请输入功能名称' }]}>
                        <Input placeholder="汉服照片生成" />
                    </Form.Item>
                    <Form.Item name="description" label="功能描述">
                        <TextArea rows={3} placeholder="使用AI生成汉服形象照片" />
                    </Form.Item>
                    <Form.Item name="chargingType" label="计费类型" initialValue="COUNT" rules={[{ required: true }]}
                        extra="COUNT=按次数消费；TOGGLE=付费开关解锁（永久/有期限）"
                    >
                        <Select>
                            <Option value="COUNT">COUNT - 按次数消费</Option>
                            <Option value="TOGGLE">TOGGLE - 开关解锁</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="isActive" label="状态" initialValue={true} rules={[{ required: true }]}>
                        <Select>
                            <Option value={true}>启用</Option>
                            <Option value={false}>禁用</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={handleModalClose}>取消</Button>
                            <Button type="primary" htmlType="submit">{editingFeature ? '更新' : '创建'}</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default FeatureList;
