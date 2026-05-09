import { BaseGenerator } from './base-generator.js';
import { storage } from '../storage.js';

export interface TemplateSlotInput {
    slotType: string;     // PERSON | OOTD | DECORATION
    refId: string;        // 对应模板 slot 的 refId
    imageSource: string;  // base64 data URL 或 https URL
}

export interface TemplateGeneratePayload {
    userId: string;
    templateId: string;
    templateName: string;
    templateImageUrl?: string;   // 模板原图 URL（第1张参考图）
    descriptor: any;             // 模板的完整 descriptor JSON 对象
    slots: TemplateSlotInput[];
}

/**
 * 根据 descriptor 和用户填充的 slot，构建 Gemini 的自然语言 prompt。
 *
 * 图片顺序约定：
 *   第 1 张图（如果有 templateImageUrl）= 模板原图
 *   第 2 张起 = 用户上传的 slot 参考图（与 slots 数组顺序一致）
 */
function buildPromptFromDescriptor(
    descriptor: any,
    slots: TemplateSlotInput[],
    hasTemplateImage: boolean
): string {
    const desc = typeof descriptor === 'string' ? JSON.parse(descriptor) : descriptor;

    const imageName: string = desc.image_name || '模板图';
    const resolution: string = desc.resolution || '';
    const theme: string = desc.global_config?.theme || '';

    // 建立 refId → slot 的映射，方便后续按 subject/prop 匹配
    const slotMap = new Map<string, { slot: TemplateSlotInput; imgIdx: number }>();
    let imgIdx = hasTemplateImage ? 2 : 1;   // 第1张是模板原图（如果有）
    for (const slot of slots) {
        slotMap.set(slot.refId, { slot, imgIdx });
        imgIdx++;
    }

    const lines: string[] = [];

    // ─── 总体说明 ────────────────────────────────────────────────────────────
    if (hasTemplateImage) {
        lines.push(`请以第1张图"${imageName}"为模板原图进行精准合成，保留原图的整体构图、场景布局、光影、色彩风格和氛围。`);
    } else {
        lines.push(`请根据以下描述进行图像合成，模板主题：${theme || imageName}。`);
    }
    if (resolution) {
        lines.push(`输出分辨率比例：${resolution}。`);
    }
    if (theme) {
        lines.push(`风格定位：${theme}。`);
    }

    lines.push('');

    // ─── 人物替换（PERSON / OOTD 槽位）─────────────────────────────────────
    const subjects: any[] = desc.subjects || [];
    for (const subject of subjects) {
        const subjectId: string = subject.subject_id;
        const label: string = subject.label || subjectId;

        const personSlot = slotMap.get(subjectId);
        const ootdRefId = `${subjectId}_ootd`;
        const ootdSlot = slotMap.get(ootdRefId);

        if (personSlot) {
            const refNo = personSlot.imgIdx;
            lines.push(`【人物替换 - ${label}】`);
            if (hasTemplateImage) {
                lines.push(
                    `将第1张图中 subject_id="${subjectId}"（${label}）的人物外貌替换为第${refNo}张参考图中的人物。` +
                    `保持原图中该人物的动作姿势、表情、肢体方向与第1张图保持完全一致，` +
                    `仅替换面貌/肤色（需注意面部、颈部、手部等裸露肤色要与替换人物一致）。` +
                    `其他内容（背景、装饰、其他人物）保持不变。`
                );
            } else {
                lines.push(
                    `使用第${refNo}张参考图中的人物作为${label}。` +
                    `人物动作姿势：${subject.pose || '自然站姿'}；表情：${subject.expression || '自然'}。`
                );
            }
        }

        if (ootdSlot) {
            const refNo = ootdSlot.imgIdx;
            lines.push(
                `【穿搭替换 - ${label}】将${label}的服装替换为第${refNo}张参考图中的穿搭款式，` +
                `保持服装与人物比例和光影一致，其他不变。`
            );
        }
    }

    // ─── 道具 / 装饰替换（DECORATION）───────────────────────────────────────
    const props: any[] = desc.interactive_props || [];
    for (const prop of props) {
        const propId: string = prop.prop_id;
        const propLabel: string = prop.object || propId;
        const propSlot = slotMap.get(propId);

        if (propSlot) {
            const refNo = propSlot.imgIdx;
            const posNote: string = prop.position_note || '';
            lines.push(
                `【道具替换 - ${propLabel}】将原图中的"${propLabel}"替换为第${refNo}张参考图中的素材，` +
                `保持位置${posNote ? `（${posNote}）` : ''}、光影及比例不变。`
            );
        }
    }

    // ─── 兜底：未匹配到 descriptor 的 slot ──────────────────────────────────
    for (const slot of slots) {
        const key = slot.refId;
        // 如果该 slot 已经在上述逻辑中处理过，跳过
        const isHandled = subjects.some(
            (s) => s.subject_id === key || `${s.subject_id}_ootd` === key
        ) || props.some((p) => p.prop_id === key);

        if (!isHandled) {
            const refNo = slotMap.get(key)?.imgIdx;
            if (refNo !== undefined) {
                lines.push(
                    `将原图中 refId="${key}" 对应的元素替换为第${refNo}张参考图中的内容，保持整体风格和光影一致。`
                );
            }
        }
    }

    lines.push('');
    lines.push('最终输出应为高质量、无缝合成的完整图像，不要出现明显的接缝或光影不一致。');

    return lines.join('\n');
}

/**
 * Template Generator
 * 根据模板 descriptor + 用户上传 slot 图片调用 Gemini 生成图像
 */
export class TemplateGenerator extends BaseGenerator {
    async generate(payload: TemplateGeneratePayload): Promise<{
        imageUrl: string;
        thumbnailUrl?: string;
        fileId: string;
    }> {
        const { userId, templateId, templateName, templateImageUrl, descriptor, slots } = payload;

        if (!descriptor) {
            throw new Error('Template descriptor is required');
        }
        if (!slots || slots.length === 0) {
            throw new Error('At least one slot image is required');
        }

        console.log(`[TemplateGenerator] Generating for template "${templateName}" (${templateId}), userId=${userId}, slots=${slots.length}`);

        // ── 构建图片列表（顺序决定 prompt 中的 "第N张图"） ──────────────────
        const imageParts: any[] = [];

        // 第1张：模板原图
        if (templateImageUrl) {
            try {
                const { base64Data, mimeType } = await this.getBase64FromSource(templateImageUrl);
                imageParts.push({ inline_data: { mime_type: mimeType, data: base64Data } });
                console.log(`[TemplateGenerator] Template image loaded (img #1)`);
            } catch (e: any) {
                console.warn(`[TemplateGenerator] Failed to load template image: ${e.message}`);
            }
        }

        // 第2张起：用户上传的 slot 图（按 slots 顺序）
        for (const slot of slots) {
            const { base64Data, mimeType } = await this.getBase64FromSource(slot.imageSource);
            imageParts.push({ inline_data: { mime_type: mimeType, data: base64Data } });
        }

        // ── 构建 prompt ─────────────────────────────────────────────────────
        const hasTemplateImage = !!templateImageUrl && imageParts.length > slots.length;
        const promptText = buildPromptFromDescriptor(descriptor, slots, hasTemplateImage);

        console.log(`[TemplateGenerator] Prompt (${promptText.length} chars):\n${promptText.substring(0, 500)}...`);

        const models = this.getModels('NANO_BANANA_PORTRAIT_SINGLE_MODELS');

        const { base64Image, mimeType } = await this.callGeminiAPI(models, (modelId) => {
            const body: any = {
                contents: [
                    {
                        parts: [
                            { text: promptText },
                            ...imageParts,
                        ],
                    },
                ],
            };

            if (modelId.includes('image') || modelId.includes('preview')) {
                body.generationConfig = { response_modalities: ['IMAGE'] };
            }

            return body;
        });

        // ── 上传结果到 R2 ───────────────────────────────────────────────────
        const imageBuffer = Buffer.from(base64Image, 'base64');
        const uploadResult = await storage.upload({
            file: imageBuffer,
            fileName: `template-${templateId}-${Date.now()}.png`,
            appId: 'bacc',
            tags: ['template', 'generated'],
            metadata: { templateId, templateName },
            createdBy: userId,
            userId,
            generationType: 'template',
            promptData: { templateId, templateName, slots },
            templateId,
        });

        console.log(`[TemplateGenerator] Upload complete: ${uploadResult.url}`);

        return {
            imageUrl: uploadResult.url,
            thumbnailUrl: uploadResult.thumbnailUrl,
            fileId: uploadResult.id,
        };
    }

    private async getBase64FromSource(src: string): Promise<{ base64Data: string; mimeType: string }> {
        if (src.startsWith('data:image/')) {
            const mimeType = src.substring(5, src.indexOf(';')) || 'image/png';
            const base64Data = src.split(',')[1];
            if (!base64Data) throw new Error('Invalid base64 image');
            return { base64Data, mimeType };
        }
        if (src.startsWith('http://') || src.startsWith('https://')) {
            const resp = await fetch(src);
            if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.statusText}`);
            const mimeType = resp.headers.get('content-type')?.split(';')[0] || 'image/png';
            const buf = await resp.arrayBuffer();
            return { base64Data: Buffer.from(buf).toString('base64'), mimeType };
        }
        throw new Error('imageSource must be a data URL or HTTPS URL');
    }
}
