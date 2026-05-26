import { BaseGenerator } from './base-generator.js';
import { storage } from '../storage.js';
import sharp from 'sharp';

const INPUT_IMAGE_MAX_DIMENSION = parseInt(process.env.TEMPLATE_INPUT_IMAGE_MAX_DIMENSION || '1536', 10);
const INPUT_IMAGE_JPEG_QUALITY = parseInt(process.env.TEMPLATE_INPUT_IMAGE_JPEG_QUALITY || '82', 10);

export interface TemplateSlotInput {
    slotType: string;     // PERSON | OOTD | DECORATION
    refId: string;        // 对应模板 slot 的 refId
    imageSource: string;  // base64 data URL 或 https URL
    assetPayload?: any;
}

export interface TemplateGeneratePayload {
    userId: string;
    templateId: string;
    templateName: string;
    templateImageUrl?: string;   // 模板原图 URL（第1张参考图）
    descriptor: any;             // 模板的完整 descriptor JSON 对象
    slots: TemplateSlotInput[];
}

function getPayloadImageSource(payload: unknown): string | undefined {
    if (typeof payload === 'string') {
        return payload.trim() || undefined;
    }
    if (!payload || typeof payload !== 'object') {
        return undefined;
    }

    const data = payload as Record<string, unknown>;
    const candidates = [
        data.imageSource,
        data.imageUrl,
        data.url,
        data.sourceUrl,
    ];

    return candidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim();
}

function normalizeRefId(value: unknown): string {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function matchesSubjectOotdRef(refId: string, subjectId: string): boolean {
    const ref = normalizeRefId(refId);
    const subject = normalizeRefId(subjectId);
    if (!ref || !subject) return false;

    return [
        subject,
        `${subject}_ootd`,
        `${subject}-ootd`,
        `${subject}_outfit`,
        `${subject}-outfit`,
        `${subject}_clothing`,
        `${subject}-clothing`,
    ].includes(ref);
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
    const indexedSlots: Array<{ slot: TemplateSlotInput; imgIdx: number }> = [];
    const slotMap = new Map<string, { slot: TemplateSlotInput; imgIdx: number }>();
    let imgIdx = hasTemplateImage ? 2 : 1;   // 第1张是模板原图（如果有）
    for (const slot of slots) {
        const entry = { slot, imgIdx };
        indexedSlots.push(entry);
        slotMap.set(slot.refId, entry);
        imgIdx++;
    }
    const findSubjectSlot = (subjectId: string, slotType: string) => {
        if (slotType === 'OOTD') {
            return indexedSlots.find(({ slot }) => slot.slotType === 'OOTD' && matchesSubjectOotdRef(slot.refId, subjectId));
        }
        return indexedSlots.find(({ slot }) => slot.slotType === slotType && slot.refId === subjectId);
    };

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
    lines.push('本次是多槽位合成任务，必须同时完成以下所有替换，不能只替换人物或只完成其中一部分：');
    for (const slot of slots) {
        const refNo = slotMap.get(slot.refId)?.imgIdx;
        if (refNo !== undefined) {
            lines.push(`- 第${refNo}张参考图用于 slotType="${slot.slotType}"、refId="${slot.refId}" 的目标元素替换。`);
        }
    }
    if (hasTemplateImage) {
        lines.push('第1张模板图只提供构图、姿势、场景、光影和目标元素位置；上面列出的 PERSON/OOTD/DECORATION 槽位都必须覆盖模板中的对应元素。');
        lines.push('“保持不变”只适用于未被槽位指定替换的背景和非目标元素，不适用于本次指定替换的服装、道具或装饰。');
        lines.push('特别注意：OOTD 穿搭替换必须按 subject_id 一一对应，只能发生在第1张模板图中对应人物原本衣服覆盖的区域内，不能把参考穿搭作为新增物体贴到背景、空白区域、其他人物身上或人物轮廓外。');
    }

    lines.push('');

    // ─── 人物替换（PERSON / OOTD 槽位）─────────────────────────────────────
    const subjects: any[] = desc.subjects || [];
    const handledRefIds = new Set<string>();
    const subjectOotdBindings: string[] = [];
    for (const subject of subjects) {
        const subjectId: string = subject.subject_id;
        const label: string = subject.label || subjectId;
        const ootdSlot = findSubjectSlot(subjectId, 'OOTD');
        if (ootdSlot) {
            subjectOotdBindings.push(`- subject_id="${subjectId}"（${label}）的穿搭只使用第${ootdSlot.imgIdx}张参考图，且只替换该人物原服装区域。`);
        }
    }
    if (subjectOotdBindings.length > 0) {
        lines.push('【多人物穿搭绑定关系】');
        lines.push(...subjectOotdBindings);
        lines.push('如果画面中有多个人物，每个人物的 OOTD 只能应用到自己对应 subject_id 的身体/衣服区域，不能应用到其他人物，也不能跨人物混用。');
        lines.push('');
    }

    for (const subject of subjects) {
        const subjectId: string = subject.subject_id;
        const label: string = subject.label || subjectId;

        const personSlot = findSubjectSlot(subjectId, 'PERSON');
        const ootdSlot = findSubjectSlot(subjectId, 'OOTD');

        if (personSlot) {
            handledRefIds.add(personSlot.slot.refId);
            const refNo = personSlot.imgIdx;
            lines.push(`【人物替换 - ${label}】`);
            if (hasTemplateImage) {
                lines.push(
                    `将第1张图中 subject_id="${subjectId}"（${label}）的人物外貌替换为第${refNo}张参考图中的人物。` +
                    `保持原图中该人物的动作姿势、表情、肢体方向与第1张图保持完全一致，` +
                    `仅替换面貌/肤色（需注意面部、颈部、手部等裸露肤色要与替换人物一致）。` +
                    `未被其他槽位指定替换的背景和非目标元素保持不变。`
                );
            } else {
                lines.push(
                    `使用第${refNo}张参考图中的人物作为${label}。` +
                    `人物动作姿势：${subject.pose || '自然站姿'}；表情：${subject.expression || '自然'}。`
                );
            }
        }

        if (ootdSlot) {
            handledRefIds.add(ootdSlot.slot.refId);
            const refNo = ootdSlot.imgIdx;
            lines.push(
                `【穿搭替换 - ${label} / subject_id="${subjectId}"】必须将第1张图中 subject_id="${subjectId}"（${label}）身上的原服装替换为第${refNo}张参考图中的穿搭款式。` +
                `保留第1张图的人物姿势、身体比例和光影方向，但服装的颜色、纹理、款式、领口、袖型和整体视觉特征应来自第${refNo}张参考图。` +
                `替换范围必须严格限制在第1张图中该 subject_id 人物原本衣服的区域、边界和可见轮廓内，保持该人物身体外轮廓、肩宽、手臂位置、手部遮挡、道具遮挡和背景边界不变。` +
                `不要影响其他 subject_id 的人物外貌、服装或轮廓；不要让第${refNo}张参考图中的衣服、裙摆、袖子、配饰或背景元素出现在该人物身体轮廓之外，也不要在模板非人物区域新增穿搭内容。` +
                `不要保留第1张图中的原服装，也不要把第${refNo}张参考图只当作风格参考。`
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
            handledRefIds.add(propSlot.slot.refId);
            const refNo = propSlot.imgIdx;
            const posNote: string = prop.position_note || '';
            lines.push(
                `【道具/装饰替换 - ${propLabel}】必须将第1张图中的"${propLabel}"替换为第${refNo}张参考图中的素材外观。` +
                `保持目标道具的位置${posNote ? `（${posNote}）` : ''}、数量、持握关系、透视、光影和比例合理，` +
                `但道具/装饰本身的颜色、形状、材质和视觉特征应来自第${refNo}张参考图。` +
                `不要保留第1张图中的原"${propLabel}"外观。`
            );
        }
    }

    // ─── 兜底：未匹配到 descriptor 的 slot ──────────────────────────────────
    for (const slot of slots) {
        const key = slot.refId;
        // 如果该 slot 已经在上述逻辑中处理过，跳过
        const isHandled = handledRefIds.has(key) || props.some((p) => p.prop_id === key);

        if (!isHandled) {
            const refNo = slotMap.get(key)?.imgIdx;
            if (refNo !== undefined) {
                lines.push(
                    `【未匹配槽位替换】必须将原图中 refId="${key}" 对应的元素替换为第${refNo}张参考图中的内容，保持整体风格和光影一致。`
                );
            }
        }
    }

    lines.push('');
    lines.push('最终检查：人物、穿搭、道具/装饰三个类型的已提供槽位都必须在最终图中可见且已替换完成；每个 OOTD 必须只作用于其对应 subject_id 的原服装区域，不得串到其他人物，不得超出该人物原服装区域，不得覆盖背景或非人物区域。最终输出应为高质量、无缝合成的完整图像，不要出现明显的接缝或光影不一致。');

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
            const imageSource = typeof slot.imageSource === 'string' && slot.imageSource.trim().length > 0
                ? slot.imageSource.trim()
                : getPayloadImageSource(slot.assetPayload);
            if (!imageSource) {
                throw new Error(`Slot "${slot.refId || 'unknown'}" is missing imageSource`);
            }
            const { base64Data, mimeType } = await this.getBase64FromSource(imageSource);
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
        if (typeof src !== 'string' || src.trim().length === 0) {
            throw new Error('imageSource is required');
        }

        if (src.startsWith('data:image/')) {
            const mimeType = src.substring(5, src.indexOf(';')) || 'image/png';
            const base64Data = src.split(',')[1];
            if (!base64Data) throw new Error('Invalid base64 image');
            return this.prepareImageForModel(Buffer.from(base64Data, 'base64'), mimeType);
        }
        if (src.startsWith('http://') || src.startsWith('https://')) {
            const resp = await fetch(src);
            if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.statusText}`);
            const mimeType = resp.headers.get('content-type')?.split(';')[0] || 'image/png';
            const buf = await resp.arrayBuffer();
            return this.prepareImageForModel(Buffer.from(buf), mimeType);
        }
        throw new Error('imageSource must be a data URL or HTTPS URL');
    }

    private async prepareImageForModel(buffer: Buffer, originalMimeType: string): Promise<{ base64Data: string; mimeType: string }> {
        try {
            const inputBytes = buffer.byteLength;
            const output = await sharp(buffer, { failOn: 'none' })
                .rotate()
                .resize({
                    width: INPUT_IMAGE_MAX_DIMENSION,
                    height: INPUT_IMAGE_MAX_DIMENSION,
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                .flatten({ background: { r: 255, g: 255, b: 255 } })
                .jpeg({ quality: INPUT_IMAGE_JPEG_QUALITY, mozjpeg: true })
                .toBuffer();

            console.log(
                `[TemplateGenerator] Prepared image ${originalMimeType} ${Math.round(inputBytes / 1024)}KB -> image/jpeg ${Math.round(output.byteLength / 1024)}KB`
            );

            return {
                base64Data: output.toString('base64'),
                mimeType: 'image/jpeg',
            };
        } catch (error: any) {
            console.warn(`[TemplateGenerator] Failed to optimize image, using original: ${error.message}`);
            return {
                base64Data: buffer.toString('base64'),
                mimeType: originalMimeType || 'image/png',
            };
        }
    }
}
