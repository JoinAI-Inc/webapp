'use client'

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Button, Card, Form, Image, Input, Modal, Select, Space,
    Spin, Tabs, Typography, Upload, message,
} from 'antd';
import { DeleteOutlined, LoadingOutlined, PlusOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import {
    createSiteTheme,
    getSiteTheme,
    uploadAdminImage,
    updateSiteTheme,
} from '../../lib/api';
import { DEFAULT_CONFIG, normalizeConfig } from './themeConfig';

const { Option } = Select;
const { Text, Title } = Typography;
const { TextArea } = Input;

const FIELD_GRID_STYLE = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 12,
};

function ColorInput(props) {
    return <Input type="color" {...props} style={{ width: 64, padding: 4, ...(props.style || {}) }} />;
}

function Field({ label, children, help }) {
    return (
        <div>
            <Text type="secondary">{label}</Text>
            <div style={{ marginTop: 4 }}>{children}</div>
            {help ? <Text type="secondary" style={{ fontSize: 12 }}>{help}</Text> : null}
        </div>
    );
}

function TextField({ label, value, onChange, placeholder }) {
    return (
        <Field label={label}>
            <Input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
        </Field>
    );
}

function TextAreaField({ label, value, onChange, rows = 3, placeholder }) {
    return (
        <Field label={label}>
            <TextArea value={value} rows={rows} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
        </Field>
    );
}

function ColorField({ label, value, onChange }) {
    return (
        <Field label={label}>
            <Space>
                <ColorInput value={value} onChange={(event) => onChange(event.target.value)} />
                <Input value={value} onChange={(event) => onChange(event.target.value)} style={{ width: 128 }} />
            </Space>
        </Field>
    );
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function ImageUploadButton({ uploadMeta, onUploaded, disabled }) {
    const [uploading, setUploading] = useState(false);

    const customRequest = async ({ file, onSuccess, onError }) => {
        setUploading(true);
        try {
            const dataUrl = await fileToDataUrl(file);
            const result = await uploadAdminImage({
                file: dataUrl,
                fileName: file.name,
                ...uploadMeta,
            });
            onUploaded(result.url);
            message.success('图片已上传');
            onSuccess?.(result);
        } catch (error) {
            message.error(error.response?.data?.error || error.message || '上传失败');
            onError?.(error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Upload
            accept="image/*"
            showUploadList={false}
            customRequest={customRequest}
            disabled={disabled || uploading}
        >
            <Button
                icon={uploading ? <LoadingOutlined /> : <UploadOutlined />}
                loading={uploading}
                disabled={disabled || uploading}
            >
                {uploading ? '上传中...' : '上传图片'}
            </Button>
        </Upload>
    );
}

function ImageUrlField({ label, value, onChange, aspectRatio = '16 / 9', help, uploadMeta }) {
    return (
        <Field label={label} help={help}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr)', gap: 12, alignItems: 'center' }}>
                <div style={{ aspectRatio, overflow: 'hidden', borderRadius: 8, border: '1px solid #eee', background: '#fafafa' }}>
                    {value ? (
                        <Image src={value} width="100%" height="100%" preview={false} style={{ objectFit: 'cover' }} />
                    ) : null}
                </div>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                        <ImageUploadButton
                            uploadMeta={uploadMeta}
                            onUploaded={onChange}
                        />
                        <Button disabled={!value} onClick={() => onChange('')}>清空</Button>
                    </Space>
                    <Input value={value} readOnly placeholder="上传后自动生成图片地址" />
                </Space>
            </div>
        </Field>
    );
}

function ImageListEditor({ title, images, onChange, aspectRatio = '3 / 4', minItems = 0, uploadMeta }) {
    const updateImage = (index, value) => {
        onChange(images.map((image, imageIndex) => imageIndex === index ? value : image));
    };

    return (
        <Card size="small" title={title} style={{ marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                {images.map((url, index) => (
                    <Card
                        size="small"
                        key={`${url}-${index}`}
                        title={`图片 ${index + 1}`}
                        extra={
                            <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                disabled={images.length <= minItems}
                                onClick={() => onChange(images.filter((_, imageIndex) => imageIndex !== index))}
                            />
                        }
                    >
                        <div style={{ aspectRatio, borderRadius: 8, overflow: 'hidden', border: '1px solid #eee', background: '#fafafa', marginBottom: 8 }}>
                            {url ? <Image src={url} width="100%" height="100%" preview={false} style={{ objectFit: 'cover' }} /> : null}
                        </div>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <ImageUploadButton
                                uploadMeta={{
                                    ...uploadMeta,
                                    field: `${uploadMeta?.field || 'image'}-${index + 1}`,
                                }}
                                onUploaded={(nextUrl) => updateImage(index, nextUrl)}
                            />
                            <Input value={url} readOnly placeholder="上传后自动生成图片地址" />
                        </Space>
                    </Card>
                ))}
            </div>
            <Space align="start" style={{ marginTop: 12, display: 'flex' }}>
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => onChange([...images, ''])}>添加图片</Button>
            </Space>
        </Card>
    );
}

function normalizeHeroRows(rows) {
    return Array.from({ length: 3 }, (_, index) => {
        const row = rows?.[index];
        return Array.isArray(row) ? row.filter(Boolean) : [];
    });
}

function HeroRowsEditor({ rows, onChange }) {
    const normalizedRows = normalizeHeroRows(rows);

    const updateRow = (rowIndex, nextRow) => {
        const nextRows = normalizeHeroRows(normalizedRows);
        nextRows[rowIndex] = nextRow;
        onChange(nextRows);
    };

    return (
        <Card size="small" title="Hero 图片墙" style={{ marginBottom: 12 }}>
            <Text type="secondary">首页 Hero 当前按 3 行展示；每行可以放多张图片。</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                {normalizedRows.map((row, rowIndex) => (
                    <Card
                        key={rowIndex}
                        size="small"
                        title={`第 ${rowIndex + 1} 行`}
                        extra={<Text type="secondary">{row.length} 张</Text>}
                        style={{ background: '#fafafa' }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {row.map((url, imageIndex) => (
                                <Space key={`${rowIndex}-${imageIndex}`} align="start" style={{ display: 'flex' }}>
                                    <div style={{ width: 56, height: 70, overflow: 'hidden', borderRadius: 6, border: '1px solid #eee', background: '#fff' }}>
                                        {url ? <Image src={url} width={56} height={70} preview={false} style={{ objectFit: 'cover' }} /> : null}
                                    </div>
                                    <Space direction="vertical" style={{ flex: 1, minWidth: 520 }}>
                                        <ImageUploadButton
                                            uploadMeta={{
                                                context: 'site-theme',
                                                page: 'home',
                                                section: 'hero',
                                                field: `row-${rowIndex + 1}-image-${imageIndex + 1}`,
                                            }}
                                            onUploaded={(nextUrl) => {
                                                const nextRow = [...row];
                                                nextRow[imageIndex] = nextUrl;
                                                updateRow(rowIndex, nextRow);
                                            }}
                                        />
                                        <Input
                                            value={url}
                                            readOnly
                                            placeholder={`第 ${imageIndex + 1} 张图片上传后自动生成地址`}
                                        />
                                    </Space>
                                    <Button danger icon={<DeleteOutlined />} onClick={() => updateRow(rowIndex, row.filter((_, index) => index !== imageIndex))} />
                                </Space>
                            ))}
                            <Space>
                                <Button type="dashed" icon={<PlusOutlined />} onClick={() => updateRow(rowIndex, [...row, ''])}>添加图片槽位</Button>
                                {row.length === 0 ? (
                                    <ImageUploadButton
                                        uploadMeta={{
                                            context: 'site-theme',
                                            page: 'home',
                                            section: 'hero',
                                            field: `row-${rowIndex + 1}-image-1`,
                                        }}
                                        onUploaded={(nextUrl) => updateRow(rowIndex, [nextUrl])}
                                    />
                                ) : null}
                            </Space>
                        </div>
                    </Card>
                ))}
            </div>
        </Card>
    );
}

function OotdItemsEditor({ items, onChange }) {
    const updateItem = (index, patch) => {
        onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
    };

    return (
        <Card size="small" title="OOTD 单图素材" style={{ marginBottom: 12 }}>
            <Text type="secondary">每个 item 对应一张响应式图片；没有图片时用颜色占位。</Text>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginTop: 12 }}>
                {items.map((item, index) => (
                    <Card
                        key={`${item.label}-${index}`}
                        size="small"
                        title={item.label || `OOTD ${index + 1}`}
                        extra={
                            <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                disabled={items.length <= 1}
                                onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                            />
                        }
                    >
                        <div style={{ aspectRatio: '342 / 512', borderRadius: 8, overflow: 'hidden', background: item.placeholderColor, marginBottom: 12 }}>
                            {item.imageUrl ? <Image src={item.imageUrl} preview={false} width="100%" height="100%" style={{ objectFit: 'cover' }} /> : null}
                        </div>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Input value={item.label} placeholder="名称" onChange={(event) => updateItem(index, { label: event.target.value })} />
                            <ImageUploadButton
                                uploadMeta={{
                                    context: 'site-theme',
                                    page: 'home',
                                    section: 'ootd',
                                    field: `item-${index + 1}`,
                                }}
                                onUploaded={(nextUrl) => updateItem(index, { imageUrl: nextUrl })}
                            />
                            <Input value={item.imageUrl} readOnly placeholder="上传后自动生成图片地址" />
                            <Space>
                                <ColorInput value={item.placeholderColor} onChange={(event) => updateItem(index, { placeholderColor: event.target.value })} />
                                <Input value={item.placeholderColor} onChange={(event) => updateItem(index, { placeholderColor: event.target.value })} />
                            </Space>
                        </Space>
                    </Card>
                ))}
            </div>
            <Button
                type="dashed"
                icon={<PlusOutlined />}
                style={{ marginTop: 12 }}
                onClick={() => onChange([...items, { imageUrl: '', placeholderColor: '#F5F5F5', label: `OOTD ${items.length + 1}` }])}
            >
                添加 OOTD
            </Button>
        </Card>
    );
}

function PeopleListEditor({ title, items, onChange }) {
    const updateItem = (index, patch) => {
        onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
    };

    return (
        <Card size="small" title={title} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((item, index) => (
                    <Space key={`${item.id}-${index}`} style={{ display: 'flex' }} align="start">
                        <Input value={item.name} placeholder="名称" onChange={(event) => updateItem(index, { name: event.target.value })} />
                        <Input value={item.id} placeholder="小红书 ID" onChange={(event) => updateItem(index, { id: event.target.value })} />
                        <Button danger icon={<DeleteOutlined />} disabled={items.length <= 1} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} />
                    </Space>
                ))}
            </div>
            <Button type="dashed" icon={<PlusOutlined />} style={{ marginTop: 12 }} onClick={() => onChange([...items, { name: '', id: '' }])}>
                添加人员
            </Button>
        </Card>
    );
}

function PokeParticipantsEditor({ items, onChange }) {
    const updateItem = (index, patch) => {
        onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
    };

    return (
        <Card
            size="small"
            title="Poke 中间名单"
            extra={<Text type="secondary">{items.length} 人</Text>}
            style={{ marginBottom: 12 }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((item, index) => (
                    <Space key={`${item.id}-${index}`} style={{ display: 'flex' }} align="start">
                        <Input value={item.name} placeholder="名称" onChange={(event) => updateItem(index, { name: event.target.value })} />
                        <Input value={item.id} placeholder="小红书 ID" onChange={(event) => updateItem(index, { id: event.target.value })} />
                        <Input value={item.followers} placeholder="Followers" onChange={(event) => updateItem(index, { followers: event.target.value })} />
                        <Button danger icon={<DeleteOutlined />} disabled={items.length <= 1} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} />
                    </Space>
                ))}
            </div>
            <Button
                type="dashed"
                icon={<PlusOutlined />}
                style={{ marginTop: 12 }}
                onClick={() => onChange([...items, { name: '', id: '', followers: '' }])}
            >
                添加人员
            </Button>
        </Card>
    );
}

function TextLinesEditor({ title, lines, onChange }) {
    const updateLine = (index, value) => {
        onChange(lines.map((line, lineIndex) => lineIndex === index ? value : line));
    };

    return (
        <Card size="small" title={title} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lines.map((line, index) => (
                    <Space key={index} style={{ display: 'flex' }}>
                        <Input value={line} placeholder={`第 ${index + 1} 行`} onChange={(event) => updateLine(index, event.target.value)} />
                        <Button danger icon={<DeleteOutlined />} disabled={lines.length <= 1} onClick={() => onChange(lines.filter((_, lineIndex) => lineIndex !== index))} />
                    </Space>
                ))}
            </div>
            <Button type="dashed" icon={<PlusOutlined />} style={{ marginTop: 12 }} onClick={() => onChange([...lines, ''])}>
                添加一行
            </Button>
        </Card>
    );
}

function SectionCard({ title, children }) {
    return <Card size="small" title={title} style={{ marginBottom: 12 }}>{children}</Card>;
}

export default function SiteThemeEditor({ id }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const isCreate = id === 'new';
    const [loading, setLoading] = useState(!isCreate);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState(normalizeConfig(DEFAULT_CONFIG));
    const pristineRef = useRef('');

    const snapshot = () => JSON.stringify({
        name: form.getFieldValue('name') || '',
        status: form.getFieldValue('status') || 'draft',
        config,
    });
    const snapshotFor = (name, status, nextConfig) => JSON.stringify({
        name: name || '',
        status: status || 'draft',
        config: nextConfig,
    });
    const isDirty = () => snapshot() !== pristineRef.current;
    useEffect(() => {
        const load = async () => {
            if (isCreate) {
                const nextConfig = normalizeConfig(DEFAULT_CONFIG);
                form.setFieldsValue({ name: 'New site theme', status: 'draft' });
                setConfig(nextConfig);
                pristineRef.current = snapshotFor('New site theme', 'draft', nextConfig);
                return;
            }

            setLoading(true);
            try {
                const material = await getSiteTheme(id);
                const nextConfig = normalizeConfig(material.config);
                form.setFieldsValue({ name: material.name, status: material.status });
                setConfig(nextConfig);
                pristineRef.current = snapshotFor(material.name, material.status, nextConfig);
            } catch (e) {
                message.error(e.response?.data?.error || '加载官网素材失败');
                router.push('/site-theme');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    useEffect(() => {
        const handler = (event) => {
            if (!isDirty()) return;
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    });

    const setSection = (section, value) => {
        setConfig((prev) => normalizeConfig({ ...prev, [section]: value }));
    };

    const setNested = (section, field, value) => {
        setConfig((prev) => normalizeConfig({
            ...prev,
            [section]: { ...prev[section], [field]: value },
        }));
    };

    const confirmLeave = () => {
        if (!isDirty()) {
            router.push('/site-theme');
            return;
        }

        Modal.confirm({
            title: '离开并丢弃未保存内容？',
            content: '当前配置还没有保存，离开后会丢失未保存信息。',
            okText: '丢弃并离开',
            okButtonProps: { danger: true },
            cancelText: '继续编辑',
            onOk: () => router.push('/site-theme'),
        });
    };

    const handleSave = async () => {
        let values;
        try {
            values = await form.validateFields();
        } catch {
            return;
        }

        setSaving(true);
        try {
            const payload = { name: values.name, status: values.status, config: normalizeConfig(config) };
            let saved;
            if (isCreate) {
                saved = await createSiteTheme(payload);
                message.success('官网素材已创建');
            } else {
                saved = await updateSiteTheme(id, payload);
                message.success('官网素材已更新');
            }

            const nextConfig = normalizeConfig(saved?.config || payload.config);
            form.setFieldsValue({
                name: saved?.name || values.name,
                status: saved?.status || values.status,
            });
            setConfig(nextConfig);
            pristineRef.current = snapshotFor(
                saved?.name || values.name,
                saved?.status || values.status,
                nextConfig
            );

            if (isCreate && saved?.id) {
                router.replace(`/site-theme/${saved.id}`);
            }
        } catch (e) {
            message.error(e.response?.data?.error || '保存失败');
        } finally {
            setSaving(false);
        }
    };

    const uploadMeta = (page, section, field) => ({
        context: 'site-theme',
        page,
        section,
        field,
    });

    const homeTabItems = [
        {
            key: 'hero',
            label: 'Hero',
            children: (
                <>
                    <SectionCard title="Hero 文案">
                        <div style={FIELD_GRID_STYLE}>
                            <TextField label="标题前半" value={config.hero.titlePrefix} onChange={(value) => setNested('hero', 'titlePrefix', value)} />
                            <TextField label="标题高亮" value={config.hero.titleHighlight} onChange={(value) => setNested('hero', 'titleHighlight', value)} />
                            <TextField label="标题后半" value={config.hero.titleSuffix} onChange={(value) => setNested('hero', 'titleSuffix', value)} />
                            <TextField label="Logo 前文字" value={config.hero.logoPrefix} onChange={(value) => setNested('hero', 'logoPrefix', value)} />
                            <TextField label="副标题前半" value={config.hero.subtitlePrefix} onChange={(value) => setNested('hero', 'subtitlePrefix', value)} />
                            <TextField label="副标题后半" value={config.hero.subtitleSuffix} onChange={(value) => setNested('hero', 'subtitleSuffix', value)} />
                            <TextField label="按钮文字" value={config.hero.ctaLabel} onChange={(value) => setNested('hero', 'ctaLabel', value)} />
                        </div>
                    </SectionCard>
                    <SectionCard title="Hero 图片">
                        <div style={FIELD_GRID_STYLE}>
                            <ImageUrlField label="顶部图标" value={config.hero.brandIconUrl} aspectRatio="1 / 1" uploadMeta={uploadMeta('home', 'hero', 'brand-icon')} onChange={(value) => setNested('hero', 'brandIconUrl', value)} />
                            <ImageUrlField label="活动 Logo" value={config.hero.logoImageUrl} aspectRatio="1 / 1" uploadMeta={uploadMeta('home', 'hero', 'logo')} onChange={(value) => setNested('hero', 'logoImageUrl', value)} />
                            <ImageUrlField label="背景图" value={config.hero.backgroundImageUrl} uploadMeta={uploadMeta('home', 'hero', 'background')} onChange={(value) => setNested('hero', 'backgroundImageUrl', value)} />
                            <ImageUrlField label="按钮纹理图" value={config.hero.ctaBackgroundImageUrl} uploadMeta={uploadMeta('home', 'hero', 'cta-background')} onChange={(value) => setNested('hero', 'ctaBackgroundImageUrl', value)} />
                        </div>
                    </SectionCard>
                    <HeroRowsEditor rows={config.hero.rows} onChange={(rows) => setNested('hero', 'rows', rows)} />
                </>
            ),
        },
        {
            key: 'redBrand',
            label: '红色主题块',
            children: (
                <>
                    <SectionCard title="文案和颜色">
                        <div style={FIELD_GRID_STYLE}>
                            <TextField label="标题" value={config.redBrand.title} onChange={(value) => setNested('redBrand', 'title', value)} />
                            <ColorField label="背景色" value={config.redBrand.backgroundColor} onChange={(value) => setNested('redBrand', 'backgroundColor', value)} />
                            <ColorField label="标题颜色" value={config.redBrand.titleColor} onChange={(value) => setNested('redBrand', 'titleColor', value)} />
                            <ColorField label="说明文字颜色" value={config.redBrand.supportColor} onChange={(value) => setNested('redBrand', 'supportColor', value)} />
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <TextAreaField label="说明文字" value={config.redBrand.support} rows={4} onChange={(value) => setNested('redBrand', 'support', value)} />
                        </div>
                    </SectionCard>
                    <SectionCard title="装饰图片">
                        <div style={FIELD_GRID_STYLE}>
                            <ImageUrlField label="背景纹理" value={config.redBrand.patternImageUrl} uploadMeta={uploadMeta('home', 'red-brand', 'pattern')} onChange={(value) => setNested('redBrand', 'patternImageUrl', value)} />
                            <ImageUrlField label="左侧底图" value={config.redBrand.leftBaseImageUrl} uploadMeta={uploadMeta('home', 'red-brand', 'left-base')} onChange={(value) => setNested('redBrand', 'leftBaseImageUrl', value)} />
                            <ImageUrlField label="左侧叠图" value={config.redBrand.leftOverlayImageUrl} uploadMeta={uploadMeta('home', 'red-brand', 'left-overlay')} onChange={(value) => setNested('redBrand', 'leftOverlayImageUrl', value)} />
                            <ImageUrlField label="右侧底图" value={config.redBrand.rightBaseImageUrl} uploadMeta={uploadMeta('home', 'red-brand', 'right-base')} onChange={(value) => setNested('redBrand', 'rightBaseImageUrl', value)} />
                            <ImageUrlField label="右侧叠图" value={config.redBrand.rightOverlayImageUrl} uploadMeta={uploadMeta('home', 'red-brand', 'right-overlay')} onChange={(value) => setNested('redBrand', 'rightOverlayImageUrl', value)} />
                            <ImageUrlField label="中间图标" value={config.redBrand.iconUrl} aspectRatio="1 / 1" uploadMeta={uploadMeta('home', 'red-brand', 'icon')} onChange={(value) => setNested('redBrand', 'iconUrl', value)} />
                        </div>
                    </SectionCard>
                </>
            ),
        },
        {
            key: 'gallery',
            label: '图片墙',
            children: (
                <>
                    <SectionCard title="文案和颜色">
                        <div style={FIELD_GRID_STYLE}>
                            <TextField label="标题前半" value={config.gallery.title} onChange={(value) => setNested('gallery', 'title', value)} />
                            <TextField label="标题高亮" value={config.gallery.highlight} onChange={(value) => setNested('gallery', 'highlight', value)} />
                            <TextField label="标题后半" value={config.gallery.suffix} onChange={(value) => setNested('gallery', 'suffix', value)} />
                            <ColorField label="背景色" value={config.gallery.backgroundColor} onChange={(value) => setNested('gallery', 'backgroundColor', value)} />
                            <ColorField label="标题颜色" value={config.gallery.titleColor} onChange={(value) => setNested('gallery', 'titleColor', value)} />
                            <ColorField label="高亮颜色" value={config.gallery.highlightColor} onChange={(value) => setNested('gallery', 'highlightColor', value)} />
                            <ColorField label="说明文字颜色" value={config.gallery.supportColor} onChange={(value) => setNested('gallery', 'supportColor', value)} />
                            <ColorField label="卡片底色" value={config.gallery.cardBackgroundColor} onChange={(value) => setNested('gallery', 'cardBackgroundColor', value)} />
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <TextAreaField label="说明文字" value={config.gallery.support} rows={3} onChange={(value) => setNested('gallery', 'support', value)} />
                        </div>
                    </SectionCard>
                    <ImageListEditor title="图片墙素材" images={config.gallery.images} uploadMeta={uploadMeta('home', 'gallery', 'image')} onChange={(images) => setNested('gallery', 'images', images)} />
                </>
            ),
        },
        {
            key: 'pet',
            label: '宠物模块',
            children: (
                <>
                    <SectionCard title="文案和颜色">
                        <div style={FIELD_GRID_STYLE}>
                            <TextField label="标题前缀" value={config.pet.titlePrefix} onChange={(value) => setNested('pet', 'titlePrefix', value)} />
                            <TextField label="标题中段" value={config.pet.titleMiddle} onChange={(value) => setNested('pet', 'titleMiddle', value)} />
                            <TextField label="标题高亮" value={config.pet.titleHighlight} onChange={(value) => setNested('pet', 'titleHighlight', value)} />
                            <ColorField label="背景色" value={config.pet.backgroundColor} onChange={(value) => setNested('pet', 'backgroundColor', value)} />
                            <ColorField label="标题颜色" value={config.pet.titleColor} onChange={(value) => setNested('pet', 'titleColor', value)} />
                            <ColorField label="高亮颜色" value={config.pet.highlightColor} onChange={(value) => setNested('pet', 'highlightColor', value)} />
                            <ColorField label="说明文字颜色" value={config.pet.textColor} onChange={(value) => setNested('pet', 'textColor', value)} />
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <TextAreaField label="说明文字" value={config.pet.text} rows={3} onChange={(value) => setNested('pet', 'text', value)} />
                        </div>
                    </SectionCard>
                    <SectionCard title="宠物模块图片">
                        <div style={FIELD_GRID_STYLE}>
                            <ImageUrlField label="云朵背景" value={config.pet.cloudImageUrl} uploadMeta={uploadMeta('home', 'pet', 'cloud')} onChange={(value) => setNested('pet', 'cloudImageUrl', value)} />
                            <ImageUrlField label="左上图片" value={config.pet.topLeftImageUrl} aspectRatio="3 / 4" uploadMeta={uploadMeta('home', 'pet', 'top-left')} onChange={(value) => setNested('pet', 'topLeftImageUrl', value)} />
                            <ImageUrlField label="右上图片" value={config.pet.topRightImageUrl} aspectRatio="3 / 4" uploadMeta={uploadMeta('home', 'pet', 'top-right')} onChange={(value) => setNested('pet', 'topRightImageUrl', value)} />
                            <ImageUrlField label="左下图片" value={config.pet.bottomLeftImageUrl} aspectRatio="3 / 4" uploadMeta={uploadMeta('home', 'pet', 'bottom-left')} onChange={(value) => setNested('pet', 'bottomLeftImageUrl', value)} />
                            <ImageUrlField label="右下图片" value={config.pet.bottomRightImageUrl} aspectRatio="3 / 4" uploadMeta={uploadMeta('home', 'pet', 'bottom-right')} onChange={(value) => setNested('pet', 'bottomRightImageUrl', value)} />
                        </div>
                    </SectionCard>
                </>
            ),
        },
        {
            key: 'ootd',
            label: 'OOTD',
            children: (
                <>
                    <SectionCard title="文案和颜色">
                        <div style={FIELD_GRID_STYLE}>
                            <TextField label="标题前半" value={config.ootd.title} onChange={(value) => setNested('ootd', 'title', value)} />
                            <TextField label="标题高亮" value={config.ootd.highlight} onChange={(value) => setNested('ootd', 'highlight', value)} />
                            <TextField label="标题后半" value={config.ootd.suffix} onChange={(value) => setNested('ootd', 'suffix', value)} />
                            <ColorField label="背景色" value={config.ootd.backgroundColor} onChange={(value) => setNested('ootd', 'backgroundColor', value)} />
                            <ColorField label="标题颜色" value={config.ootd.titleColor} onChange={(value) => setNested('ootd', 'titleColor', value)} />
                            <ColorField label="高亮颜色" value={config.ootd.highlightColor} onChange={(value) => setNested('ootd', 'highlightColor', value)} />
                            <ColorField label="说明文字颜色" value={config.ootd.supportColor} onChange={(value) => setNested('ootd', 'supportColor', value)} />
                            <ColorField label="卡片底色" value={config.ootd.cardBackgroundColor} onChange={(value) => setNested('ootd', 'cardBackgroundColor', value)} />
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <TextAreaField label="说明文字" value={config.ootd.support} rows={3} onChange={(value) => setNested('ootd', 'support', value)} />
                        </div>
                    </SectionCard>
                    <OotdItemsEditor items={config.ootd.items} onChange={(items) => setNested('ootd', 'items', items)} />
                </>
            ),
        },
        {
            key: 'inspiration',
            label: '鸣谢',
            children: (
                <>
                    <SectionCard title="文案和颜色">
                        <div style={FIELD_GRID_STYLE}>
                            <TextField label="标题" value={config.inspiration.title} onChange={(value) => setNested('inspiration', 'title', value)} />
                            <TextField label="底部鸣谢文字" value={config.inspiration.specialThanksText} onChange={(value) => setNested('inspiration', 'specialThanksText', value)} />
                            <ColorField label="背景渐变起始" value={config.inspiration.backgroundStartColor} onChange={(value) => setNested('inspiration', 'backgroundStartColor', value)} />
                            <ColorField label="背景渐变结束" value={config.inspiration.backgroundEndColor} onChange={(value) => setNested('inspiration', 'backgroundEndColor', value)} />
                            <ColorField label="标题颜色" value={config.inspiration.titleColor} onChange={(value) => setNested('inspiration', 'titleColor', value)} />
                            <ColorField label="名单文字颜色" value={config.inspiration.entryColor} onChange={(value) => setNested('inspiration', 'entryColor', value)} />
                            <ColorField label="分隔线颜色" value={config.inspiration.dividerColor} onChange={(value) => setNested('inspiration', 'dividerColor', value)} />
                            <ColorField label="备注颜色" value={config.inspiration.noteColor} onChange={(value) => setNested('inspiration', 'noteColor', value)} />
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <TextAreaField label="备注文字" value={config.inspiration.note} rows={3} onChange={(value) => setNested('inspiration', 'note', value)} />
                        </div>
                    </SectionCard>
                    <SectionCard title="装饰图片">
                        <div style={FIELD_GRID_STYLE}>
                            <ImageUrlField label="背景纹理" value={config.inspiration.patternImageUrl} uploadMeta={uploadMeta('home', 'inspiration', 'pattern')} onChange={(value) => setNested('inspiration', 'patternImageUrl', value)} />
                            <ImageUrlField label="左侧装饰" value={config.inspiration.leftDecorImageUrl} uploadMeta={uploadMeta('home', 'inspiration', 'left-decor')} onChange={(value) => setNested('inspiration', 'leftDecorImageUrl', value)} />
                            <ImageUrlField label="右侧装饰" value={config.inspiration.rightDecorImageUrl} uploadMeta={uploadMeta('home', 'inspiration', 'right-decor')} onChange={(value) => setNested('inspiration', 'rightDecorImageUrl', value)} />
                            <ImageUrlField label="小红书图标" value={config.inspiration.thanksIconUrl} aspectRatio="1 / 1" uploadMeta={uploadMeta('home', 'inspiration', 'thanks-icon')} onChange={(value) => setNested('inspiration', 'thanksIconUrl', value)} />
                        </div>
                    </SectionCard>
                    <PeopleListEditor title="鸣谢名单" items={config.inspiration.items} onChange={(items) => setNested('inspiration', 'items', items)} />
                </>
            ),
        },
        {
            key: 'announcement',
            label: '公告',
            children: (
                <>
                    <SectionCard title="文案和颜色">
                        <div style={FIELD_GRID_STYLE}>
                            <TextField label="标题前半" value={config.announcement.titlePrefix} onChange={(value) => setNested('announcement', 'titlePrefix', value)} />
                            <TextField label="标题高亮" value={config.announcement.titleHighlight} onChange={(value) => setNested('announcement', 'titleHighlight', value)} />
                            <ColorField label="背景色" value={config.announcement.backgroundColor} onChange={(value) => setNested('announcement', 'backgroundColor', value)} />
                            <ColorField label="标题颜色" value={config.announcement.titleColor} onChange={(value) => setNested('announcement', 'titleColor', value)} />
                            <ColorField label="高亮颜色" value={config.announcement.highlightColor} onChange={(value) => setNested('announcement', 'highlightColor', value)} />
                            <ColorField label="正文颜色" value={config.announcement.supportColor} onChange={(value) => setNested('announcement', 'supportColor', value)} />
                            <ColorField label="正文高亮颜色" value={config.announcement.supportHighlightColor} onChange={(value) => setNested('announcement', 'supportHighlightColor', value)} />
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <TextAreaField label="正文" value={config.announcement.support} rows={4} onChange={(value) => setNested('announcement', 'support', value)} />
                            <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>提示：用 **文字** 包裹的内容会以「正文高亮颜色」显示，例如：**we do not store any photos**</Text>
                        </div>
                    </SectionCard>
                    <SectionCard title="图片">
                        <div style={FIELD_GRID_STYLE}>
                            <ImageUrlField label="主图" value={config.announcement.imageUrl} aspectRatio="3 / 4" uploadMeta={uploadMeta('home', 'announcement', 'main-image')} onChange={(value) => setNested('announcement', 'imageUrl', value)} />
                            <ImageUrlField label="主图背景" value={config.announcement.mediaBackgroundImageUrl} uploadMeta={uploadMeta('home', 'announcement', 'media-background')} onChange={(value) => setNested('announcement', 'mediaBackgroundImageUrl', value)} />
                        </div>
                    </SectionCard>
                </>
            ),
        },
    ];

    const topTabItems = [
        {
            key: 'home',
            label: '首页',
            children: <Tabs items={homeTabItems} />,
        },
        {
            key: 'about',
            label: 'About',
            children: (
                <>
                    <SectionCard title="About 页面文案">
                        <div style={FIELD_GRID_STYLE}>
                            <TextField label="表单标题" value={config.about.title} onChange={(value) => setNested('about', 'title', value)} />
                            <TextField label="主文案前半" value={config.about.headlinePrefix} onChange={(value) => setNested('about', 'headlinePrefix', value)} />
                            <TextField label="主文案高亮" value={config.about.headlineHighlight} onChange={(value) => setNested('about', 'headlineHighlight', value)} />
                            <TextField label="主文案后半" value={config.about.headlineSuffix} onChange={(value) => setNested('about', 'headlineSuffix', value)} />
                            <TextField label="副文案" value={config.about.subheadline} onChange={(value) => setNested('about', 'subheadline', value)} />
                            <TextField label="输入框提示" value={config.about.placeholder} onChange={(value) => setNested('about', 'placeholder', value)} />
                            <TextField label="邮箱说明" value={config.about.emailLabel} onChange={(value) => setNested('about', 'emailLabel', value)} />
                            <TextField label="邮箱" value={config.about.email} onChange={(value) => setNested('about', 'email', value)} />
                        </div>
                    </SectionCard>
                    <SectionCard title="About 页面颜色和图片">
                        <div style={FIELD_GRID_STYLE}>
                            <ColorField label="背景色" value={config.about.backgroundColor} onChange={(value) => setNested('about', 'backgroundColor', value)} />
                            <ColorField label="强调色" value={config.about.accentColor} onChange={(value) => setNested('about', 'accentColor', value)} />
                            <ColorField label="文字颜色" value={config.about.textColor} onChange={(value) => setNested('about', 'textColor', value)} />
                            <ColorField label="次级文字颜色" value={config.about.mutedTextColor} onChange={(value) => setNested('about', 'mutedTextColor', value)} />
                            <ColorField label="输入框背景" value={config.about.inputBackgroundColor} onChange={(value) => setNested('about', 'inputBackgroundColor', value)} />
                            <ColorField label="输入框描边" value={config.about.inputBorderColor} onChange={(value) => setNested('about', 'inputBorderColor', value)} />
                            <ColorField label="禁用按钮颜色" value={config.about.disabledButtonColor} onChange={(value) => setNested('about', 'disabledButtonColor', value)} />
                            <ImageUrlField label="背景图" value={config.about.backgroundImageUrl} uploadMeta={uploadMeta('about', 'about', 'background')} onChange={(value) => setNested('about', 'backgroundImageUrl', value)} />
                            <ImageUrlField label="右侧插画" value={config.about.illustrationUrl} uploadMeta={uploadMeta('about', 'about', 'illustration')} onChange={(value) => setNested('about', 'illustrationUrl', value)} />
                            <ImageUrlField label="装饰图" value={config.about.decorationImageUrl} uploadMeta={uploadMeta('about', 'about', 'decoration')} onChange={(value) => setNested('about', 'decorationImageUrl', value)} />
                            <ImageUrlField label="标题图标" value={config.about.heartIconUrl} aspectRatio="1 / 1" uploadMeta={uploadMeta('about', 'about', 'heart-icon')} onChange={(value) => setNested('about', 'heartIconUrl', value)} />
                        </div>
                    </SectionCard>
                </>
            ),
        },
        {
            key: 'poke',
            label: 'Poke',
            children: (
                <>
                    <TextLinesEditor title="顶部标题" lines={config.poke.headingLines} onChange={(lines) => setNested('poke', 'headingLines', lines)} />
                    <PokeParticipantsEditor items={config.poke.participants} onChange={(participants) => setNested('poke', 'participants', participants)} />
                    <SectionCard title="Poke 页面文案">
                        <div style={FIELD_GRID_STYLE}>
                            <TextField label="感谢文案" value={config.poke.thanksText} onChange={(value) => setNested('poke', 'thanksText', value)} />
                            <TextField label="底部鸣谢文字" value={config.poke.specialThanksText} onChange={(value) => setNested('poke', 'specialThanksText', value)} />
                        </div>
                    </SectionCard>
                    <SectionCard title="Poke 页面颜色和图片">
                        <div style={FIELD_GRID_STYLE}>
                            <ColorField label="页面背景色" value={config.poke.backgroundColor} onChange={(value) => setNested('poke', 'backgroundColor', value)} />
                            <ColorField label="顶部渐变起始" value={config.poke.gradientStartColor} onChange={(value) => setNested('poke', 'gradientStartColor', value)} />
                            <ColorField label="顶部渐变结束" value={config.poke.gradientEndColor} onChange={(value) => setNested('poke', 'gradientEndColor', value)} />
                            <ColorField label="顶部标题颜色" value={config.poke.headingColor} onChange={(value) => setNested('poke', 'headingColor', value)} />
                            <ColorField label="表头颜色" value={config.poke.tableHeaderColor} onChange={(value) => setNested('poke', 'tableHeaderColor', value)} />
                            <ColorField label="表格文字颜色" value={config.poke.tableTextColor} onChange={(value) => setNested('poke', 'tableTextColor', value)} />
                            <ColorField label="表格线颜色" value={config.poke.tableBorderColor} onChange={(value) => setNested('poke', 'tableBorderColor', value)} />
                            <ColorField label="感谢文字颜色" value={config.poke.thanksTextColor} onChange={(value) => setNested('poke', 'thanksTextColor', value)} />
                            <ImageUrlField label="灯笼图" value={config.poke.lanternImageUrl} uploadMeta={uploadMeta('poke', 'poke', 'lantern')} onChange={(value) => setNested('poke', 'lanternImageUrl', value)} />
                            <ImageUrlField label="小红书图标" value={config.poke.xhsIconUrl} aspectRatio="1 / 1" uploadMeta={uploadMeta('poke', 'poke', 'xhs-icon')} onChange={(value) => setNested('poke', 'xhsIconUrl', value)} />
                        </div>
                    </SectionCard>
                </>
            ),
        },
        {
            key: 'login',
            label: 'Login',
            children: (
                <>
                    <SectionCard title="登录页品牌和背景素材">
                        <div style={FIELD_GRID_STYLE}>
                            <ImageUrlField label="Logo" value={config.login.logoImageUrl} aspectRatio="146 / 32" uploadMeta={uploadMeta('login', 'login', 'logo')} onChange={(value) => setNested('login', 'logoImageUrl', value)} />
                            <ImageUrlField label="标题装饰图" value={config.login.titleAccentImageUrl} aspectRatio="274 / 62" uploadMeta={uploadMeta('login', 'login', 'title-accent')} onChange={(value) => setNested('login', 'titleAccentImageUrl', value)} />
                            <ImageUrlField label="移动端拼贴图" value={config.login.mobileCollageImageUrl} aspectRatio="390 / 420" uploadMeta={uploadMeta('login', 'login', 'mobile-collage')} onChange={(value) => setNested('login', 'mobileCollageImageUrl', value)} />
                            <ImageUrlField label="桌面端拼贴图" value={config.login.desktopCollageImageUrl} aspectRatio="760 / 900" uploadMeta={uploadMeta('login', 'login', 'desktop-collage')} onChange={(value) => setNested('login', 'desktopCollageImageUrl', value)} />
                        </div>
                    </SectionCard>
                    <SectionCard title="登录方式图标">
                        <div style={FIELD_GRID_STYLE}>
                            <ImageUrlField label="Google 图标" value={config.login.googleIconUrl} aspectRatio="1 / 1" uploadMeta={uploadMeta('login', 'providers', 'google-icon')} onChange={(value) => setNested('login', 'googleIconUrl', value)} />
                            <ImageUrlField label="Discord 图标" value={config.login.discordIconUrl} aspectRatio="1 / 1" uploadMeta={uploadMeta('login', 'providers', 'discord-icon')} onChange={(value) => setNested('login', 'discordIconUrl', value)} />
                            <ImageUrlField label="X 图标" value={config.login.xIconUrl} aspectRatio="1 / 1" uploadMeta={uploadMeta('login', 'providers', 'x-icon')} onChange={(value) => setNested('login', 'xIconUrl', value)} />
                            <ImageUrlField label="Apple 图标" value={config.login.appleIconUrl} aspectRatio="1 / 1" uploadMeta={uploadMeta('login', 'providers', 'apple-icon')} onChange={(value) => setNested('login', 'appleIconUrl', value)} />
                        </div>
                    </SectionCard>
                </>
            ),
        },
        {
            key: 'footer',
            label: 'Footer',
            children: (
                <>
                    <SectionCard title="Footer 文案和颜色">
                        <div style={FIELD_GRID_STYLE}>
                            <TextField label="标题" value={config.footer.title} onChange={(value) => setNested('footer', 'title', value)} />
                            <TextField label="按钮文字" value={config.footer.ctaLabel} onChange={(value) => setNested('footer', 'ctaLabel', value)} />
                            <TextField label="版权信息" value={config.footer.copyrightText} onChange={(value) => setNested('footer', 'copyrightText', value)} />
                            <TextField label="备案信息" value={config.footer.recordText} onChange={(value) => setNested('footer', 'recordText', value)} />
                            <ColorField label="背景色" value={config.footer.backgroundColor} onChange={(value) => setNested('footer', 'backgroundColor', value)} />
                            <ColorField label="标题颜色" value={config.footer.titleColor} onChange={(value) => setNested('footer', 'titleColor', value)} />
                            <ColorField label="按钮背景色" value={config.footer.ctaBackgroundColor} onChange={(value) => setNested('footer', 'ctaBackgroundColor', value)} />
                            <ColorField label="按钮文字色" value={config.footer.ctaTextColor} onChange={(value) => setNested('footer', 'ctaTextColor', value)} />
                            <ColorField label="底部信息颜色" value={config.footer.metaColor} onChange={(value) => setNested('footer', 'metaColor', value)} />
                        </div>
                    </SectionCard>
                    <SectionCard title="Footer 图片">
                        <div style={FIELD_GRID_STYLE}>
                            <ImageUrlField label="背景图" value={config.footer.backgroundImageUrl} uploadMeta={uploadMeta('footer', 'footer', 'background')} onChange={(value) => setNested('footer', 'backgroundImageUrl', value)} />
                            <ImageUrlField label="按钮图标" value={config.footer.ctaIconUrl} aspectRatio="1 / 1" uploadMeta={uploadMeta('footer', 'footer', 'cta-icon')} onChange={(value) => setNested('footer', 'ctaIconUrl', value)} />
                            <ImageUrlField label="底部拼贴图" value={config.footer.collageImageUrl} uploadMeta={uploadMeta('footer', 'footer', 'collage')} onChange={(value) => setNested('footer', 'collageImageUrl', value)} />
                        </div>
                    </SectionCard>
                </>
            ),
        },
        {
            key: 'theme',
            label: '全局样式',
            children: (
                <SectionCard title="全局颜色">
                    <div style={FIELD_GRID_STYLE}>
                        <ColorField label="主色" value={config.theme.primaryColor} onChange={(value) => setNested('theme', 'primaryColor', value)} />
                        <ColorField label="文字颜色" value={config.theme.textColor} onChange={(value) => setNested('theme', 'textColor', value)} />
                        <ColorField label="次级文字颜色" value={config.theme.mutedTextColor} onChange={(value) => setNested('theme', 'mutedTextColor', value)} />
                        <ColorField label="Hero 背景色" value={config.theme.heroBackgroundColor} onChange={(value) => setNested('theme', 'heroBackgroundColor', value)} />
                        <ColorField label="素材框渐变起始" value={config.theme.mediaShellStart} onChange={(value) => setNested('theme', 'mediaShellStart', value)} />
                        <ColorField label="素材框渐变结束" value={config.theme.mediaShellEnd} onChange={(value) => setNested('theme', 'mediaShellEnd', value)} />
                        <ColorField label="卡片渐变起始" value={config.theme.cardBackgroundStart} onChange={(value) => setNested('theme', 'cardBackgroundStart', value)} />
                        <ColorField label="卡片渐变结束" value={config.theme.cardBackgroundEnd} onChange={(value) => setNested('theme', 'cardBackgroundEnd', value)} />
                        <ColorField label="按钮渐变起始" value={config.theme.ctaGradientStart} onChange={(value) => setNested('theme', 'ctaGradientStart', value)} />
                        <ColorField label="按钮渐变结束" value={config.theme.ctaGradientEnd} onChange={(value) => setNested('theme', 'ctaGradientEnd', value)} />
                        <ColorField label="按钮焦点色" value={config.theme.ctaFocusColor} onChange={(value) => setNested('theme', 'ctaFocusColor', value)} />
                    </div>
                </SectionCard>
            ),
        },
    ];

    if (loading) {
        return <Spin />;
    }

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>{isCreate ? '新建官网素材' : '编辑官网素材'}</Title>
                    <Text type="secondary">配置官网首页、About、Poke 和 Footer 的文案、颜色、背景图和图片素材。</Text>
                </div>
                <Space>
                    <Button onClick={confirmLeave}>返回</Button>
                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>保存</Button>
                </Space>
            </div>

            <Form form={form} layout="vertical">
                <Card size="small" style={{ marginBottom: 12 }}>
                    <Space style={{ display: 'flex' }} align="start">
                        <Form.Item name="name" label="配置名称" rules={[{ required: true, message: '请输入配置名称' }]} style={{ flex: 1, marginBottom: 0 }}>
                            <Input placeholder="如：春节活动主题" />
                        </Form.Item>
                        <Form.Item name="status" label="状态" initialValue="draft" style={{ width: 160, marginBottom: 0 }}>
                            <Select>
                                <Option value="draft">草稿</Option>
                                <Option value="active">启用</Option>
                                <Option value="archived">归档</Option>
                            </Select>
                        </Form.Item>
                    </Space>
                </Card>
            </Form>

            <Tabs items={topTabItems} destroyInactiveTabPane={false} />
        </div>
    );
}
