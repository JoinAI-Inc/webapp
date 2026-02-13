import sharp from 'sharp';

const DEFAULT_THUMBNAIL_WIDTH = 300;
const DEFAULT_THUMBNAIL_QUALITY = 80;

export class ImageProcessor {
    private thumbnailWidth: number;
    private thumbnailQuality: number;

    constructor(thumbnailWidth?: number, thumbnailQuality?: number) {
        this.thumbnailWidth = thumbnailWidth || DEFAULT_THUMBNAIL_WIDTH;
        this.thumbnailQuality = thumbnailQuality || DEFAULT_THUMBNAIL_QUALITY;
    }

    /**
     * 生成缩略图
     */
    async generateThumbnail(buffer: Buffer): Promise<Buffer> {
        return sharp(buffer)
            .resize(this.thumbnailWidth, null, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .jpeg({ quality: this.thumbnailQuality })
            .toBuffer();
    }

    /**
     * 获取图片尺寸
     */
    async getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
        const metadata = await sharp(buffer).metadata();
        return {
            width: metadata.width || 0,
            height: metadata.height || 0,
        };
    }
}
