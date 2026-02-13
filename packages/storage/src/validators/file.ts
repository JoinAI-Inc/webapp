import { fileTypeFromBuffer } from 'file-type';
import { FileMetadata } from '../types';

const DEFAULT_ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const DEFAULT_ALLOWED_VIDEO_TYPES = ['mp4', 'mov', 'webm'];
const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export class FileValidator {
    private allowedImageTypes: string[];
    private allowedVideoTypes: string[];
    private maxFileSize: number;

    constructor(
        allowedImageTypes?: string[],
        allowedVideoTypes?: string[],
        maxFileSize?: number
    ) {
        this.allowedImageTypes = allowedImageTypes || DEFAULT_ALLOWED_IMAGE_TYPES;
        this.allowedVideoTypes = allowedVideoTypes || DEFAULT_ALLOWED_VIDEO_TYPES;
        this.maxFileSize = maxFileSize || DEFAULT_MAX_FILE_SIZE;
    }

    /**
     * 验证文件并提取元数据
     */
    async validate(buffer: Buffer, fileName: string): Promise<FileMetadata> {
        // 验证文件大小
        if (buffer.length > this.maxFileSize) {
            throw new Error(`文件大小超过限制 (最大 ${this.maxFileSize / 1024 / 1024}MB)`);
        }

        // 检测真实文件类型
        const fileType = await fileTypeFromBuffer(buffer);
        if (!fileType) {
            throw new Error('无法识别文件类型');
        }

        const { mime, ext } = fileType;
        const mainType = mime.split('/')[0];

        // 验证文件类型
        if (mainType === 'image') {
            if (!this.allowedImageTypes.includes(ext)) {
                throw new Error(`不支持的图片格式: ${ext}`);
            }
        } else if (mainType === 'video') {
            if (!this.allowedVideoTypes.includes(ext)) {
                throw new Error(`不支持的视频格式: ${ext}`);
            }
        } else {
            throw new Error('仅支持图片和视频文件');
        }

        return {
            mimeType: mime,
            extension: ext,
        };
    }

    /**
     * 判断是否为图片
     */
    isImage(mimeType: string): boolean {
        return mimeType.startsWith('image/');
    }

    /**
     * 判断是否为视频
     */
    isVideo(mimeType: string): boolean {
        return mimeType.startsWith('video/');
    }
}
