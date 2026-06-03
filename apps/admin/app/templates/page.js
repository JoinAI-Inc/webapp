'use client'

import React, { useState, useEffect, useMemo } from 'react';
import {
    Table, Button, Modal, Form, Input, InputNumber, Select, Tag, message,
    Space, Image, Tabs, Popconfirm, Card, Tooltip, Badge, Collapse, Upload
} from 'antd';
import {
    PlusOutlined, DeleteOutlined, EditOutlined,
    PlusCircleOutlined, TagsOutlined, LoadingOutlined, UploadOutlined
} from '@ant-design/icons';
import {
    getTemplates, createTemplate, updateTemplate, deleteTemplate,
    getTags, createTag, deleteTag,
    getAssets, createAsset, updateAsset, deleteAsset, getFeatures,
    getGenerationConfigOptions,
    getPromptPolicies, createPromptPolicy, updatePromptPolicy,
    uploadAdminImage,
} from '../../lib/api';

const { Option } = Select;
const { TextArea } = Input;

const SLOT_TYPE_COLORS = { PERSON: 'blue', OOTD: 'purple', DECORATION: 'green' };
const STATUS_COLORS = { DRAFT: 'default', PUBLISHED: 'green', ARCHIVED: 'volcano' };

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

const TagManager = ({ tags, onRefresh }) => {
    const [newTagName, setNewTagName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!newTagName.trim()) return;
        setLoading(true);
        try {
            await createTag({ name: newTagName.trim() });
            message.success('标签已创建');
            setNewTagName('');
            onRefresh();
        } catch (e) {
            message.error(e.response?.data?.error || '创建失败');
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        try {
            await deleteTag(id);
            message.success('标签已删除');
            onRefresh();
        } catch (e) {
            message.error(e.response?.data?.error || '删除失败');
        }
    };

    return (
        <div>
            <Space style={{ marginBottom: 16 }}>
                <Input
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                    placeholder="新标签名称"
                    onPressEnter={handleCreate}
                    style={{ width: 200 }}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} loading={loading}>创建</Button>
            </Space>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {tags.map(tag => (
                    <Tag key={tag.id} closable onClose={() => handleDelete(tag.id)} style={{ fontSize: 14, padding: '4px 8px' }}>
                        {tag.name}
                    </Tag>
                ))}
            </div>
        </div>
    );
};

const AssetManager = ({ assets, features, onRefresh }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [payloadText, setPayloadText] = useState('');
    const [payloadError, setPayloadError] = useState('');
    const [form] = Form.useForm();

    const openCreate = () => {
        setEditing(null); setPayloadText('{}'); setPayloadError('');
        form.resetFields(); setModalOpen(true);
    };

    const openEdit = (asset) => {
        setEditing(asset);
        setPayloadText(asset.payload ? JSON.stringify(asset.payload, null, 2) : '{}');
        setPayloadError('');
        form.setFieldsValue({ 
            name: asset.name, assetType: asset.assetType, 
            thumbnailUrl: asset.thumbnailUrl, status: asset.status, 
            requiredFeatureKey: asset.requiredFeatureKey 
        });
        setModalOpen(true);
    };

    const handlePayloadChange = (val) => {
        setPayloadText(val);
        try { JSON.parse(val); setPayloadError(''); } catch (e) { setPayloadError('JSON 格式有误：' + e.message); }
    };

    const handleSubmit = async () => {
        let values;
        try { values = await form.validateFields(); } catch { return; }
        let payload = null;
        if (payloadText.trim()) {
            try { payload = JSON.parse(payloadText); } catch (e) { message.error('Payload JSON 有误'); return; }
        }
        
        const data = { ...values, payload };
        setLoading(true);
        try {
            if (editing) { await updateAsset(editing.id, data); message.success('已更新'); }
            else { await createAsset(data); message.success('已创建'); }
            setModalOpen(false);
            onRefresh();
        } catch (e) {
            message.error(e.response?.data?.error || '保存失败');
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        try { await deleteAsset(id); message.success('已删除'); onRefresh(); }
        catch (e) { message.error('删除失败'); }
    };

    const columns = [
        {
            title: '缩略图', dataIndex: 'thumbnailUrl', key: 'thumb', width: 80,
            render: url => <Image src={url} width={50} height={50} style={{ objectFit: 'cover', borderRadius: 4 }} fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect fill='%23f0f0f0' width='50' height='50'/%3E%3C/svg%3E"/>
        },
        { title: '名称', dataIndex: 'name', key: 'name' },
        { title: '类型', dataIndex: 'assetType', key: 'type', render: t => <Tag color={t === 'OOTD' ? 'purple' : 'green'}>{t}</Tag> },
        { title: '状态', dataIndex: 'status', key: 'status' },
        { 
            title: '特权要求', dataIndex: 'requiredFeatureKey', key: 'feat', 
            render: k => k ? <Tag color="gold">{k}</Tag> : <Tag>免费</Tag> 
        },
        {
            title: '操作', key: 'action', width: 140,
            render: (_, r) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
                    <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0 }}>Asset Management</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建素材</Button>
            </div>
            <Table columns={columns} dataSource={assets} rowKey="id" pagination={{ pageSize: 15 }} />

            <Modal title={editing ? '编辑素材' : '新建素材'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleSubmit} confirmLoading={loading} destroyOnClose>
                <Form form={form} layout="vertical">
                    <Space style={{ display: 'flex' }}>
                        <Form.Item name="name" label="素材名称" rules={[{ required: true }]} style={{ flex: 1 }}><Input/></Form.Item>
                        <Form.Item name="assetType" label="类型" initialValue="OOTD" rules={[{ required: true }]}>
                            <Select style={{ width: 120 }}><Option value="OOTD">OOTD 穿搭</Option><Option value="DECORATION">装饰</Option></Select>
                        </Form.Item>
                    </Space>
                    <Form.Item name="thumbnailUrl" label="缩略图 URL" rules={[{ required: true }]}><Input/></Form.Item>
                    <Space style={{ display: 'flex' }}>
                        <Form.Item name="requiredFeatureKey" label="鉴权 FeatureKey (留空即免费)" style={{ flex: 1 }}>
                            <Select allowClear placeholder="选择所需订阅特权">
                                {features.map(f => <Option key={f.featureKey} value={f.featureKey}>{f.name} ({f.featureKey})</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item name="status" label="状态" initialValue="active">
                            <Select style={{ width: 100 }}><Option value="active">Active</Option><Option value="disabled">Disabled</Option></Select>
                        </Form.Item>
                    </Space>
                    <Form.Item validateStatus={payloadError ? 'error' : ''} help={payloadError || '发给 AI 的生图 JSON'} label="生图 Payload (可选)">
                        <TextArea value={payloadText} onChange={e => handlePayloadChange(e.target.value)} rows={6} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

const TemplateImageUploadField = ({ form }) => {
    const [uploading, setUploading] = useState(false);
    const imageUrl = Form.useWatch('imageUrl', form);

    const customRequest = async ({ file, onSuccess, onError }) => {
        setUploading(true);
        try {
            const dataUrl = await fileToDataUrl(file);
            const result = await uploadAdminImage({
                file: dataUrl,
                fileName: file.name,
                context: 'template',
                page: 'global',
                section: 'template',
                field: 'image',
            });
            form.setFieldsValue({ imageUrl: result.url, imageId: result.id });
            message.success('模板图已上传到 R2');
            onSuccess?.(result);
        } catch (error) {
            message.error(error.response?.data?.error || error.message || '上传失败');
            onError?.(error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Space align="start" style={{ width: '100%' }}>
            <div style={{ width: 120, aspectRatio: '3 / 4', border: '1px solid #eee', borderRadius: 6, overflow: 'hidden', background: '#fafafa' }}>
                {imageUrl ? (
                    <Image src={imageUrl} width="100%" height="100%" preview={false} style={{ objectFit: 'cover' }} />
                ) : null}
            </div>
            <Space direction="vertical" style={{ flex: 1, minWidth: 0 }}>
                <Upload accept="image/*" showUploadList={false} customRequest={customRequest} disabled={uploading}>
                    <Button icon={uploading ? <LoadingOutlined /> : <UploadOutlined />} loading={uploading}>
                        {uploading ? '上传中...' : '上传模板图'}
                    </Button>
                </Upload>
                <Form.Item name="imageUrl" noStyle rules={[{ required: true, message: '请上传模板图' }]}>
                    <Input readOnly placeholder="上传后自动生成 R2 图片地址" />
                </Form.Item>
            </Space>
        </Space>
    );
};

// ─── 提示词策略管理 ────────────────────────────────────────────────────────────
const PROMPT_POLICY_GROUPS = [
    {
        key: 'context',
        label: '模板上下文',
        fields: [
            { name: 'templateContextInstruction', label: '模板 JSON 上下文', help: '可用占位：{{templateJson}}' },
        ],
    },
    {
        key: 'slots',
        label: '槽位总规则',
        fields: [
            { name: 'slotContextInstruction', label: '槽位 JSON 上下文', help: '可用占位：{{slotsJson}} {{personSlotsJson}} {{ootdSlotsJson}} {{decorationSlotsJson}}' },
        ],
    },
    {
        key: 'person',
        label: 'PERSON 人物替换',
        fields: [
            { name: 'personInstruction', label: 'PERSON 指令', help: '仅当存在 PERSON slot 时输出。可用占位：{{templateJson}} {{personSlotsJson}} {{slotsJson}}' },
        ],
    },
    {
        key: 'ootd',
        label: 'OOTD 穿搭替换',
        fields: [
            { name: 'ootdInstruction', label: 'OOTD 指令', help: '仅当存在 OOTD slot 时输出。可用占位：{{templateJson}} {{ootdSlotsJson}} {{slotsJson}}' },
        ],
    },
    {
        key: 'decoration',
        label: 'DECORATION 装饰/道具替换',
        fields: [
            { name: 'decorationInstruction', label: 'DECORATION 指令', help: '仅当存在 DECORATION slot 时输出。可用占位：{{templateJson}} {{decorationSlotsJson}} {{slotsJson}}' },
        ],
    },
    {
        key: 'final',
        label: '最终检查',
        fields: [
            { name: 'finalCheckInstruction', label: '最终检查' },
        ],
    },
];
const PROMPT_POLICY_FIELDS = PROMPT_POLICY_GROUPS.flatMap(group => group.fields);

const PROMPT_POLICY_DEFAULTS = {
    templateContextInstruction: '请以第1张图为模板原图进行精准合成。模板 JSON 如下：\n{{templateJson}}',
    slotContextInstruction: '用户提供的替换槽位和参考图顺序如下。每个 imageNo 对应输入图片序号：\n{{slotsJson}}',
    personInstruction: '请处理 PERSON 人物替换。只处理以下 PERSON slots；如果没有对应目标，不要自行新增替换：\n{{personSlotsJson}}',
    ootdInstruction: '请处理 OOTD 穿搭替换。只处理以下 OOTD slots；穿搭只能作用于模板中对应人物的原服装区域，不要串到其他人物或背景：\n{{ootdSlotsJson}}',
    decorationInstruction: '请处理 DECORATION 装饰/道具替换。只处理以下 DECORATION slots；保持模板中的位置、比例、透视和光影合理：\n{{decorationSlotsJson}}',
    finalCheckInstruction: '最终检查：已提供的 PERSON、OOTD、DECORATION 槽位都必须在最终图中可见且替换完成；每个 OOTD 只能作用于对应人物的原服装区域，不得串到其他人物，不得覆盖背景或非人物区域。最终输出应为高质量、无缝合成的完整图像，不要出现明显接缝、错位或光影不一致。',
};

const renderPromptTemplate = (template, values) => (
    template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => values[key] ?? '')
);

const getPolicyFieldValue = (config, fieldName) => {
    if (config?.[fieldName]) return config[fieldName];
    return '';
};

const buildPromptPolicyConfig = (values) => {
    const config = {};
    PROMPT_POLICY_FIELDS.forEach(f => {
        const val = values[f.name]?.trim();
        if (val) config[f.name] = val;
    });
    return config;
};

const buildSlotPromptContext = (slots = []) => (
    slots.map((slot, index) => ({
        slotType: slot.slotType,
        refId: slot.refId,
        imageNo: index + 2,
        imageRef: `第${index + 2}张参考图`,
        assetPayload: slot.assetPayload || null,
    }))
);

const buildPromptPreview = (config = {}, descriptor, slots = []) => {
    const getText = (name) => config[name] || PROMPT_POLICY_DEFAULTS[name];
    const templateJson = JSON.stringify(descriptor, null, 2);
    const slotContext = buildSlotPromptContext(slots);
    const variables = {
        templateJson,
        slotsJson: JSON.stringify(slotContext, null, 2),
        personSlotsJson: JSON.stringify(slotContext.filter(s => s.slotType === 'PERSON'), null, 2),
        ootdSlotsJson: JSON.stringify(slotContext.filter(s => s.slotType === 'OOTD'), null, 2),
        decorationSlotsJson: JSON.stringify(slotContext.filter(s => s.slotType === 'DECORATION'), null, 2),
    };

    const lines = [];
    const templateContextInstruction = getText('templateContextInstruction');
    const slotContextInstruction = getText('slotContextInstruction');
    const personInstruction = getText('personInstruction');
    const ootdInstruction = getText('ootdInstruction');
    const decorationInstruction = getText('decorationInstruction');
    const finalCheckInstruction = getText('finalCheckInstruction');

    if (templateContextInstruction) lines.push(renderPromptTemplate(templateContextInstruction, variables));
    if (slotContextInstruction) lines.push(renderPromptTemplate(slotContextInstruction, variables));
    if (slotContext.some(s => s.slotType === 'PERSON') && personInstruction) lines.push(renderPromptTemplate(personInstruction, variables));
    if (slotContext.some(s => s.slotType === 'OOTD') && ootdInstruction) lines.push(renderPromptTemplate(ootdInstruction, variables));
    if (slotContext.some(s => s.slotType === 'DECORATION') && decorationInstruction) lines.push(renderPromptTemplate(decorationInstruction, variables));
    if (finalCheckInstruction) lines.push(renderPromptTemplate(finalCheckInstruction, variables));

    return lines.join('\n');
};

const SAMPLE_PROMPT_DESCRIPTOR = {
    image_name: 'spring-look-template.jpg',
    resolution: '2:3',
    global_config: { theme: '春日写真' },
    subjects: [{ subject_id: 'person_01', label: '主人物' }],
    interactive_props: [{ prop_id: 'bouquet_01', object: '手捧花', position_note: '双手前方' }],
};
const SAMPLE_PROMPT_SLOTS = [
    { slotType: 'PERSON', refId: 'person_01' },
    { slotType: 'OOTD', refId: 'person_01_ootd' },
    { slotType: 'DECORATION', refId: 'bouquet_01' },
];

const resolvePromptPolicyConfig = (promptPolicies = [], key, version) => {
    const candidates = promptPolicies.filter(p => p.key === key);
    if (version) {
        const exact = candidates.find(p => Number(p.version) === Number(version));
        if (exact) return exact.config || {};
    }
    const active = candidates.find(p => p.status === 'active');
    return (active || candidates[0])?.config || {};
};

const GenerationConfigManager = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [previewText, setPreviewText] = useState(buildPromptPreview({}, SAMPLE_PROMPT_DESCRIPTOR, SAMPLE_PROMPT_SLOTS));
    const [form] = Form.useForm();

    const loadItems = async () => {
        setLoading(true);
        try { setItems(await getPromptPolicies()); } catch (e) { message.error('加载提示词策略失败'); }
        setLoading(false);
    };
    useEffect(() => { loadItems(); }, []);

    const openCreate = () => {
        setEditing(null);
        form.resetFields();
        form.setFieldsValue({ status: 'draft', version: 1 });
        setPreviewText(buildPromptPreview({}, SAMPLE_PROMPT_DESCRIPTOR, SAMPLE_PROMPT_SLOTS));
        setModalOpen(true);
    };
    const openEdit = (item) => {
        setEditing(item);
        const cfg = item.config || {};
        const formValues = { key: item.key, version: item.version, name: item.name, status: item.status };
        PROMPT_POLICY_FIELDS.forEach(f => { formValues[f.name] = getPolicyFieldValue(cfg, f.name); });
        form.setFieldsValue(formValues);
        setPreviewText(buildPromptPreview(buildPromptPolicyConfig(formValues), SAMPLE_PROMPT_DESCRIPTOR, SAMPLE_PROMPT_SLOTS));
        setModalOpen(true);
    };
    const handleSubmit = async () => {
        let values;
        try { values = await form.validateFields(); } catch { return; }
        const config = buildPromptPolicyConfig(values);
        PROMPT_POLICY_FIELDS.forEach(f => { delete values[f.name]; });
        const data = { ...values, config };
        try {
            if (editing) await updatePromptPolicy(editing.id, data);
            else await createPromptPolicy(data);
            message.success('已保存'); setModalOpen(false); loadItems();
        } catch (e) { message.error(e.response?.data?.error || '保存失败'); }
    };

    const columns = [
        { title: '标识', dataIndex: 'key', key: 'key' },
        { title: '版本', dataIndex: 'version', key: 'version' },
        { title: '名称', dataIndex: 'name', key: 'name' },
        { title: '状态', dataIndex: 'status', key: 'status', render: s => <Tag color={s === 'active' ? 'green' : s === 'draft' ? 'blue' : 'default'}>{s}</Tag> },
        { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', render: v => v ? new Date(v).toLocaleString() : '-' },
        { title: '操作', key: 'action', width: 100, render: (_, r) => <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button> },
    ];

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>提示词策略</h3>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建提示词策略</Button>
            </div>
            <Table columns={columns} dataSource={items} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />
            <Modal title={editing ? '编辑提示词策略' : '新建提示词策略'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleSubmit} width={960} destroyOnClose>
                <Form
                    form={form}
                    layout="vertical"
                    onValuesChange={(_, values) => setPreviewText(buildPromptPreview(buildPromptPolicyConfig(values), SAMPLE_PROMPT_DESCRIPTOR, SAMPLE_PROMPT_SLOTS))}
                >
                    <Space style={{ display: 'flex' }}>
                        <Form.Item name="key" label="标识 Key" rules={[{ required: true }]} style={{ flex: 2 }}><Input placeholder="如 template-default" /></Form.Item>
                        <Form.Item name="version" label="版本号" rules={[{ required: true }]} style={{ flex: 1 }}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
                        <Form.Item name="name" label="策略名称" rules={[{ required: true }]} style={{ flex: 2 }}><Input placeholder="如 默认模板提示词" /></Form.Item>
                        <Form.Item name="status" label="状态" style={{ flex: 1 }}>
                            <Select><Option value="draft">草稿</Option><Option value="active">启用</Option><Option value="archived">归档</Option></Select>
                        </Form.Item>
                    </Space>
                    <Collapse defaultActiveKey={['prompts', 'preview']} style={{ marginBottom: 16 }} items={[
                        {
                            key: 'prompts',
                            label: '提示词配置',
                            children: (
                                <>
                                    {PROMPT_POLICY_GROUPS.map(group => (
                                        <Card key={group.key} size="small" title={group.label} style={{ marginBottom: 12 }}>
                                            {group.fields.map(f => (
                                                <Form.Item key={f.name} name={f.name} label={f.label} help={f.help}>
                                                    <TextArea rows={3} placeholder={PROMPT_POLICY_DEFAULTS[f.name]} style={{ fontFamily: 'monospace', fontSize: 12 }} />
                                                </Form.Item>
                                            ))}
                                        </Card>
                                    ))}
                                </>
                            ),
                        },
                        {
                            key: 'preview',
                            label: '配置预览',
                            children: (
                                <TextArea
                                    value={previewText}
                                    readOnly
                                    rows={16}
                                    style={{ fontFamily: 'monospace', fontSize: 12, background: '#fafafa' }}
                                />
                            ),
                        },
                    ]} />
                </Form>
            </Modal>
        </div>
    );
};

const SlotEditor = ({ slots, assets, onChange }) => {
    const addSlot = () => onChange([...slots, { slotType: 'PERSON', refId: '', label: '', sortOrder: slots.length }]);
    const removeSlot = (idx) => onChange(slots.filter((_, i) => i !== idx));
    const updateSlot = (idx, field, val) => {
        const next = [...slots];
        next[idx] = { ...next[idx], [field]: val };
        onChange(next);
    };

    return (
        <div>
            {slots.map((slot, idx) => (
                <Card
                    key={idx} size="small" style={{ marginBottom: 8 }}
                    extra={<Button danger size="small" icon={<DeleteOutlined />} onClick={() => removeSlot(idx)} />}
                >
                    <Space wrap>
                        <Select value={slot.slotType} onChange={v => { updateSlot(idx, 'slotType', v); updateSlot(idx, 'assetIds', []); }} style={{ width: 130 }}>
                            <Option value="PERSON">🧑 人物替换</Option>
                            <Option value="OOTD">👗 穿搭替换</Option>
                            <Option value="DECORATION">🎨 装饰替换</Option>
                        </Select>
                        <Input value={slot.refId} onChange={e => updateSlot(idx, 'refId', e.target.value)} placeholder="refId（如 person_01）" style={{ width: 160 }} />
                        <Input value={slot.label} onChange={e => updateSlot(idx, 'label', e.target.value)} placeholder="显示名称" style={{ width: 120 }} />
                        
                        {(slot.slotType === 'OOTD' || slot.slotType === 'DECORATION') && (
                            <Select
                                mode="multiple"
                                style={{ minWidth: 200 }}
                                placeholder={`选择${slot.slotType === 'OOTD' ? '穿搭' : '装饰'}素材`}
                                value={slot.assetIds || []}
                                onChange={v => updateSlot(idx, 'assetIds', v)}
                                optionLabelProp="label"
                            >
                                {assets.filter(a => a.assetType === slot.slotType).map(a => (
                                    <Option key={a.id} value={a.id} label={a.name}>
                                        <Space><Image src={a.thumbnailUrl} height={20} fallback="data:..." preview={false}/> {a.name} ({a.requiredFeatureKey ? '👑 订阅' : '免费'})</Space>
                                    </Option>
                                ))}
                            </Select>
                        )}
                    </Space>
                </Card>
            ))}
            <Button icon={<PlusCircleOutlined />} onClick={addSlot} block type="dashed">添加槽位</Button>
        </div>
    );
};

const TemplateList = () => {
    const [templates, setTemplates] = useState([]);
    const [tags, setTags] = useState([]);
    const [assets, setAssets] = useState([]);
    const [features, setFeatures] = useState([]);
    const [generationOptions, setGenerationOptions] = useState({ promptPolicies: [] });
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [slots, setSlots] = useState([]);
    const [descriptorText, setDescriptorText] = useState('');
    const [descriptorError, setDescriptorError] = useState('');
    const [activeTab, setActiveTab] = useState('templates');
    const [form] = Form.useForm();
    const watchedPromptPolicyKey = Form.useWatch('promptPolicyKey', form);
    const watchedPromptPolicyVersion = Form.useWatch('promptPolicyVersion', form);

    const templatePromptPreview = useMemo(() => {
        if (!descriptorText.trim()) return '';
        try {
            const descriptor = JSON.parse(descriptorText);
            const policyKey = watchedPromptPolicyKey || 'template-default';
            const config = resolvePromptPolicyConfig(generationOptions.promptPolicies || [], policyKey, watchedPromptPolicyVersion);
            return buildPromptPreview(config, descriptor, slots);
        } catch (e) {
            return 'Descriptor JSON 格式有误，无法预览 prompt。';
        }
    }, [descriptorText, generationOptions.promptPolicies, slots, watchedPromptPolicyKey, watchedPromptPolicyVersion]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [tplRes, tagRes, assetsRes, featsRes, generationOptionsRes] = await Promise.all([
                getTemplates({ pageSize: 100 }), 
                getTags(), 
                getAssets(), 
                getFeatures(),
                getGenerationConfigOptions()
            ]);
            setTemplates(tplRes.data || []);
            setTags(tagRes);
            setAssets(assetsRes);
            setFeatures(featsRes || []);
            setGenerationOptions(generationOptionsRes || { promptPolicies: [] });
        } catch (e) {
            message.error('加载失败');
        }
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

    const openCreate = () => {
        setEditing(null); setSlots([]); setDescriptorText(''); setDescriptorError('');
        form.resetFields(); setModalOpen(true);
    };

    const openEdit = (tpl) => {
        setEditing(tpl); 
        // 提取现有的 slots 以及他们关联的 assetIds
        setSlots((tpl.slots || []).map(s => ({
            ...s,
            assetIds: s.assets?.map(a => a.asset?.id || a.assetId) || []
        })));
        setDescriptorText(JSON.stringify(tpl.descriptor, null, 2)); setDescriptorError('');
        form.setFieldsValue({
            name: tpl.name,
            imageId: tpl.imageId || undefined,
            imageUrl: tpl.imageUrl,
            status: tpl.status,
            tagIds: tpl.tags?.map(tt => tt.tagId || tt.tag?.id) || [],
            generationFeatureKey: tpl.generationFeatureKey || undefined,
            promptPolicyKey: tpl.promptPolicyKey || undefined,
            promptPolicyVersion: tpl.promptPolicyVersion || undefined,
        });
        setModalOpen(true);
    };

    const handleDescriptorChange = (val) => {
        setDescriptorText(val);
        try { JSON.parse(val); setDescriptorError(''); } catch (e) { setDescriptorError('JSON 格式有误：' + e.message); }
    };

    const extractSlotsFromDescriptor = () => {
        let parsed;
        try { parsed = JSON.parse(descriptorText); } catch { message.error('JSON 格式有误，无法提取'); return; }
        const extracted = [];
        // subjects → PERSON + OOTD
        (parsed.subjects || []).forEach(s => {
            extracted.push({
                slotType: 'PERSON',
                refId: s.subject_id || '',
                label: s.label || s.subject_id || '',
                sortOrder: extracted.length,
            });
            extracted.push({
                slotType: 'OOTD',
                refId: (s.subject_id || '') + '_ootd',
                label: (s.label || s.subject_id || '') + ' 穿搭',
                sortOrder: extracted.length,
            });
        });
        // interactive_props → DECORATION
        (parsed.interactive_props || []).forEach(p => {
            extracted.push({
                slotType: 'DECORATION',
                refId: p.prop_id || '',
                label: p.object || p.prop_id || '',
                sortOrder: extracted.length,
            });
        });
        if (extracted.length === 0) { message.warning('未在 JSON 中找到可提取的槽位'); return; }
        setSlots(extracted);
        message.success(`已提取 ${extracted.length} 个槽位`);
    };

    const handleSubmit = async () => {
        let values;
        try { values = await form.validateFields(); } catch { return; }
        if (!descriptorText.trim()) { message.error('请填写 JSON Descriptor'); return; }
        let descriptor;
        try { descriptor = JSON.parse(descriptorText); } catch (e) { message.error('JSON 格式有误，请修正后再提交'); return; }
        const payload = { 
            ...values, 
            descriptor, 
            slots: slots.map((s, i) => ({ ...s, sortOrder: i })) 
        };
        try {
            if (editing) { await updateTemplate(editing.id, payload); message.success('模板已更新'); }
            else { await createTemplate(payload); message.success('模板已创建'); }
            setModalOpen(false); fetchAll();
        } catch (e) {
            message.error(e.response?.data?.error || '操作失败');
        }
    };

    const handleDelete = async (id) => {
        try { await deleteTemplate(id); message.success('已删除'); fetchAll(); }
        catch (e) { message.error(e.response?.data?.error || '删除失败'); }
    };

    const columns = [
        {
            title: '预览', dataIndex: 'imageUrl', key: 'image', width: 80,
            render: url => url ? (
                <Image src={url} width={60} height={60} style={{ objectFit: 'cover', borderRadius: 4 }}
                    fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect fill='%23f0f0f0' width='60' height='60'/%3E%3C/svg%3E" />
            ) : <div style={{ width: 60, height: 60, background: '#f0f0f0', borderRadius: 4 }} />,
        },
        {
            title: '名称 / 主题', key: 'name',
            render: (_, r) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{r.name}</div>
                    {r.theme && <div style={{ fontSize: 12, color: '#8c8c8c' }}>{r.theme}</div>}
                    {r.resolution && <Tag style={{ marginTop: 4, fontSize: 11 }}>{r.resolution}</Tag>}
                </div>
            ),
        },
        { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: s => <Tag color={STATUS_COLORS[s]}>{s}</Tag> },
        { title: '标签', key: 'tags', render: (_, r) => (r.tags || []).map(tt => <Tag key={tt.tagId || tt.tag?.id}>{tt.tag?.name || tt.tagId}</Tag>) },
        {
            title: '槽位', key: 'slots',
            render: (_, r) => (
                <Space wrap>
                    {(r.slots || []).map(s => (
                        <Tooltip key={s.id} title={`${s.refId} - ${s.label}`}>
                            <Tag color={SLOT_TYPE_COLORS[s.slotType]}>{s.slotType}</Tag>
                        </Tooltip>
                    ))}
                </Space>
            ),
        },
        { title: '收藏', dataIndex: 'favoriteCount', key: 'fav', width: 70, render: n => <Badge count={n} showZero style={{ backgroundColor: '#faad14' }} /> },
        {
            title: '操作', key: 'action', width: 140,
            render: (_, r) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
                    <Popconfirm title="确认删除此模板？" onConfirm={() => handleDelete(r.id)} okText="删除" cancelText="取消" okButtonProps={{ danger: true }}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const tabItems = [
        {
            key: 'templates',
            label: '模板管理',
            children: (
                <div>
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0 }}>Template Management</h2>
                        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建模板</Button>
                    </div>
                    <Table columns={columns} dataSource={templates} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />
                </div>
            )
        },
        {
            key: 'tags',
            label: <span><TagsOutlined /> 标签管理</span>,
            children: (
                <div>
                    <div style={{ marginBottom: 16 }}><h2>Tag Management</h2></div>
                    <TagManager tags={tags} onRefresh={fetchAll} />
                </div>
            )
        },
        {
            key: 'assets',
            label: <span>👑 素材管理</span>,
            children: (
                <div>
                    <AssetManager assets={assets} features={features} onRefresh={fetchAll} />
                </div>
            )
        },
        {
            key: 'generation-config',
            label: <span>⚙️ 提示词策略</span>,
            children: <GenerationConfigManager />
        }
    ];

    return (
        <div>
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
            <Modal
                title={editing ? `编辑模板：${editing.name}` : '新建模板'}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={handleSubmit}
                okText={editing ? '保存' : '创建'}
                width={760}
                destroyOnClose
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="name" label="模板名称" rules={[{ required: true, message: '请输入名称' }]}><Input placeholder="如：春节创意模板" /></Form.Item>
                    <Form.Item name="imageId" hidden><Input /></Form.Item>
                    <Form.Item label="模板图" required>
                        <TemplateImageUploadField form={form} />
                    </Form.Item>
                    <Form.Item name="status" label="状态" initialValue="DRAFT">
                        <Select>
                            <Option value="DRAFT">草稿（仅管理员可见）</Option>
                            <Option value="PUBLISHED">已发布</Option>
                            <Option value="ARCHIVED">已归档</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="tagIds" label="标签">
                        <Select mode="multiple" placeholder="选择标签">
                            {tags.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                        </Select>
                    </Form.Item>
                    <Card size="small" title="生成配置" style={{ marginBottom: 16 }}>
                        <Form.Item name="generationFeatureKey" label="扣费 FeatureKey" rules={[{ required: true, message: '请选择扣费 FeatureKey' }]} help="必填。生成服务只读取模板配置，不接受前端传入 featureKey">
                            <Select allowClear placeholder="选择生成消耗的次数功能">
                                {features.filter(f => f.chargingType === 'COUNT').map(f => (
                                    <Option key={f.featureKey} value={f.featureKey}>{f.name} ({f.featureKey})</Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Space style={{ display: 'flex' }} align="start">
                            <Form.Item name="promptPolicyKey" label="提示词策略" initialValue="template-default" style={{ flex: 1 }} help="对应旧 buildPromptFromDescriptor 固定文案">
                                <Select allowClear placeholder="选择提示词策略">
                                    {Array.from(new Map((generationOptions.promptPolicies || []).map(p => [p.key, p])).values()).map(p => (
                                        <Option key={p.key} value={p.key}>{p.name} ({p.key})</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item name="promptPolicyVersion" label="提示词版本" initialValue={1} style={{ width: 160 }}>
                                <Input type="number" min="1" placeholder="留空=最新 active" />
                            </Form.Item>
                        </Space>
                    </Card>
                    <Form.Item
                        label="JSON Descriptor"
                        validateStatus={descriptorError ? 'error' : ''}
                        help={descriptorError || '从图片分析生成的 JSON 描述文件'}
                        required
                    >
                        <TextArea
                            value={descriptorText}
                            onChange={e => handleDescriptorChange(e.target.value)}
                            rows={10}
                            style={{ fontFamily: 'monospace', fontSize: 12 }}
                            placeholder={`{\n  "image_name": "xxx.jpg",\n  "resolution": "2:3",\n  "global_config": { "theme": "..." },\n  "subjects": [...],\n  "interactive_props": [...]\n}`}
                        />
                    </Form.Item>
                    <Form.Item
                        label={
                            <Space>
                                <span>替换槽位配置</span>
                                <Button
                                    size="small"
                                    type="dashed"
                                    disabled={!descriptorText.trim() || !!descriptorError}
                                    onClick={extractSlotsFromDescriptor}
                                >
                                    ✨ 从 JSON 提取
                                </Button>
                            </Space>
                        }
                        help="配置哪些元素可以被替换"
                    >
                        <SlotEditor slots={slots} assets={assets} onChange={setSlots} />
                    </Form.Item>
                    <Form.Item label="完整 Prompt 预览" help="由当前提示词策略、Descriptor 和槽位配置实时生成；不会保存到模板。">
                        <TextArea
                            value={templatePromptPreview}
                            readOnly
                            rows={16}
                            style={{ fontFamily: 'monospace', fontSize: 12, background: '#fafafa' }}
                            placeholder="填写 Descriptor 并选择提示词策略后显示完整 prompt"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TemplateList;
