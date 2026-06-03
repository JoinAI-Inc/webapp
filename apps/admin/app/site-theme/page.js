'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Image, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { deleteSiteTheme, getSiteThemes } from '../../lib/api';
import { normalizeConfig } from './themeConfig';

const { Text } = Typography;

const STATUS_COLORS = {
    draft: 'default',
    active: 'green',
    archived: 'volcano',
};

export default function SiteThemesPage() {
    const router = useRouter();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            setMaterials(await getSiteThemes());
        } catch (e) {
            message.error(e.response?.data?.error || '加载官网素材失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMaterials(); }, []);

    const handleDelete = async (id) => {
        try {
            await deleteSiteTheme(id);
            message.success('已删除');
            fetchMaterials();
        } catch (e) {
            message.error(e.response?.data?.error || '删除失败');
        }
    };

    const columns = [
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            render: (name, row) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{name}</div>
                    <Text type="secondary">{row.id}</Text>
                </div>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            render: status => <Tag color={STATUS_COLORS[status]}>{status}</Tag>,
        },
        {
            title: '主题色',
            key: 'primaryColor',
            width: 140,
            render: (_, row) => {
                const color = normalizeConfig(row.config).theme.primaryColor;
                return (
                    <Space>
                        <span style={{ display: 'inline-block', width: 18, height: 18, borderRadius: 4, background: color, border: '1px solid #ddd' }} />
                        {color}
                    </Space>
                );
            },
        },
        {
            title: '首页素材',
            key: 'homeAssets',
            render: (_, row) => {
                const config = normalizeConfig(row.config);
                const images = [
                    ...config.hero.rows.flat(),
                    ...config.gallery.images,
                    config.redBrand.iconUrl,
                    config.announcement.imageUrl,
                ].filter(Boolean).slice(0, 6);
                return (
                    <Space>
                        {images.map((src, index) => (
                            <Image
                                key={`${src}-${index}`}
                                src={src}
                                width={42}
                                height={42}
                                preview={false}
                                style={{ objectFit: 'cover', borderRadius: 4, background: '#f5f5f5' }}
                            />
                        ))}
                    </Space>
                );
            },
        },
        {
            title: '更新时间',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            width: 190,
            render: value => new Date(value).toLocaleString(),
        },
        {
            title: '操作',
            key: 'action',
            width: 160,
            render: (_, row) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => router.push(`/site-theme/${row.id}`)}>编辑</Button>
                    <Popconfirm title="确认删除？" onConfirm={() => handleDelete(row.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Site Theme</h2>
                    <Text type="secondary">配置官网 Home、About、Poke 的活动主题、颜色、背景图和页面图片素材。</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/site-theme/new')}>新建官网素材</Button>
            </div>
            <Table columns={columns} dataSource={materials} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
        </div>
    );
}
