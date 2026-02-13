import { nanoid } from 'nanoid';

/**
 * 生成存储路径
 * 格式: /{app_id}/{file_type}/{year}/{month}/{uuid}.{ext}
 */
export function generateStoragePath(
    appId: string,
    fileType: 'image' | 'video',
    extension: string
): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uuid = nanoid();

    return `${appId}/${fileType}/${year}/${month}/${uuid}.${extension}`;
}

/**
 * 生成缩略图路径
 * 格式: /{app_id}/{file_type}/{year}/{month}/{uuid}_thumb.{ext}
 */
export function generateThumbnailPath(originalPath: string): string {
    const ext = originalPath.split('.').pop();
    const pathWithoutExt = originalPath.substring(0, originalPath.lastIndexOf('.'));
    return `${pathWithoutExt}_thumb.${ext}`;
}

/**
 * 从文件名提取扩展名
 */
export function getFileExtension(fileName: string): string {
    const match = fileName.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : '';
}

/**
 * 生成公开访问 URL
 */
export function generatePublicUrl(publicDomain: string, storageKey: string): string {
    return `${publicDomain.replace(/\/$/, '')}/${storageKey}`;
}
