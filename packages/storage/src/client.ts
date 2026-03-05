import { PrismaClient } from '@prisma/client';
import { R2Client } from './r2/client.js';
import { FileValidator } from './validators/file.js';
import { ImageProcessor } from './processors/image.js';
import { VideoProcessor } from './processors/video.js';
import { generateStoragePath, generateThumbnailPath } from './r2/utils.js';
import {
    MediaStorageConfig,
    UploadOptions,
    UploadResult,
    QueryOptions,
    QueryResult,
    DeleteOptions,
    DeleteResult,
} from './types/index.js';

export class MediaStorage {
    private r2Client: R2Client;
    private prisma: PrismaClient;
    private fileValidator: FileValidator;
    private imageProcessor: ImageProcessor;
    private videoProcessor: VideoProcessor;

    constructor(config: MediaStorageConfig) {
        // 初始化 R2 客户端
        this.r2Client = new R2Client(
            config.r2.accountId,
            config.r2.accessKeyId,
            config.r2.secretAccessKey,
            config.r2.bucketName,
            config.r2.publicDomain
        );

        // 共享 Prisma 客户端
        this.prisma = config.prisma;

        // 初始化验证器和处理器
        this.fileValidator = new FileValidator(
            config.upload?.allowedImageTypes,
            config.upload?.allowedVideoTypes,
            config.upload?.maxFileSize
        );

        this.imageProcessor = new ImageProcessor(
            config.thumbnail?.width,
            config.thumbnail?.quality
        );

        this.videoProcessor = new VideoProcessor();
    }

    /**
     * 上传文件
     */
    async upload(options: UploadOptions): Promise<UploadResult> {
        const { file, fileName, appId, tags, metadata, createdBy, userId, generationType, promptData } = options;

        // 1. 验证文件
        const fileMetadata = await this.fileValidator.validate(file, fileName);
        const fileType = this.fileValidator.isImage(fileMetadata.mimeType) ? 'image' : 'video';

        // 2. 生成存储路径
        const storageKey = generateStoragePath(appId, fileType, fileMetadata.extension);

        // 3. 上传原文件到 R2
        const storageUrl = await this.r2Client.uploadFile(
            storageKey,
            file,
            fileMetadata.mimeType
        );

        // 4. 处理图片（生成缩略图）
        let thumbnailUrl: string | undefined;
        let width: number | undefined;
        let height: number | undefined;

        if (fileType === 'image') {
            // 获取图片尺寸
            const dimensions = await this.imageProcessor.getImageDimensions(file);
            width = dimensions.width;
            height = dimensions.height;

            // 生成缩略图
            const thumbnailBuffer = await this.imageProcessor.generateThumbnail(file);
            const thumbnailKey = generateThumbnailPath(storageKey);
            thumbnailUrl = await this.r2Client.uploadFile(
                thumbnailKey,
                thumbnailBuffer,
                'image/jpeg'
            );
        }

        // 5. 校验用户是否存在以避免外键冲突
        let validUserId = undefined;
        if (userId) {
            const userExists = await this.prisma.user.findUnique({ where: { id: userId } });
            if (userExists) {
                validUserId = userId;
            }
        }

        // 6. 保存元数据到数据库
        const mediaFile = await this.prisma.mediaFile.create({
            data: {
                appId,
                fileName,
                fileType,
                mimeType: fileMetadata.mimeType,
                fileSize: file.length,
                width,
                height,
                storageKey,
                storageUrl,
                thumbnailUrl,
                tags: tags || [],
                metadata: metadata || {},
                createdBy,
                userId: validUserId, // ✅ 仅使用实际存在的 userId
                generationType, // ✅ BACC generationType
                promptData, // ✅ BACC promptData
            },
        });

        // 6. 返回结果
        return {
            id: mediaFile.id,
            fileName: mediaFile.fileName,
            fileType: mediaFile.fileType as 'image' | 'video',
            mimeType: mediaFile.mimeType,
            fileSize: Number(mediaFile.fileSize),
            width: mediaFile.width || undefined,
            height: mediaFile.height || undefined,
            duration: mediaFile.duration || undefined,
            url: mediaFile.storageUrl,
            thumbnailUrl: mediaFile.thumbnailUrl || undefined,
            storageKey: mediaFile.storageKey,
            createdAt: mediaFile.createdAt,
        };
    }

    /**
     * 查询文件
     */
    async query(options: QueryOptions): Promise<QueryResult> {
        const { appId, fileType, tags, page = 1, pageSize = 20, startDate, endDate } = options;

        // 构建查询条件
        const where: any = {
            appId,
            status: 'active',
        };

        if (fileType) {
            where.fileType = fileType;
        }

        if (tags && tags.length > 0) {
            where.tags = {
                array_contains: tags,
            };
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }

        // 查询总数
        const total = await this.prisma.mediaFile.count({ where });

        // 分页查询
        const items = await this.prisma.mediaFile.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        return {
            items: items.map(item => this.mapToUploadResult(item)),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    /**
     * 根据 ID 获取文件
     */
    async getById(id: string): Promise<UploadResult | null> {
        const file = await this.prisma.mediaFile.findUnique({
            where: { id, status: 'active' },
        });

        return file ? this.mapToUploadResult(file) : null;
    }

    /**
     * 批量获取文件
     */
    async getByIds(ids: string[]): Promise<UploadResult[]> {
        const files = await this.prisma.mediaFile.findMany({
            where: {
                id: { in: ids },
                status: 'active',
            },
        });

        return files.map(file => this.mapToUploadResult(file));
    }

    /**
     * 删除文件
     */
    async delete(id: string, options: DeleteOptions = {}): Promise<DeleteResult> {
        const { permanent = false } = options;

        const file = await this.prisma.mediaFile.findUnique({ where: { id } });
        if (!file) {
            return {
                success: false,
                message: '文件不存在',
            };
        }

        if (permanent) {
            // 硬删除：从 R2 和数据库中删除
            await this.r2Client.deleteFile(file.storageKey);
            if (file.thumbnailUrl) {
                const thumbnailKey = generateThumbnailPath(file.storageKey);
                await this.r2Client.deleteFile(thumbnailKey);
            }
            await this.prisma.mediaFile.delete({ where: { id } });

            return {
                success: true,
                message: '文件已永久删除',
            };
        } else {
            // 软删除：仅标记状态
            const updatedFile = await this.prisma.mediaFile.update({
                where: { id },
                data: {
                    status: 'deleted',
                    deletedAt: new Date(),
                },
            });

            return {
                success: true,
                deletedAt: updatedFile.deletedAt || undefined,
                message: '文件已软删除',
            };
        }
    }

    /**
     * 批量删除
     */
    async bulkDelete(ids: string[], options: DeleteOptions = {}): Promise<DeleteResult[]> {
        return Promise.all(ids.map(id => this.delete(id, options)));
    }

    /**
     * 映射数据库记录到返回结果
     */
    private mapToUploadResult(file: any): UploadResult {
        return {
            id: file.id,
            fileName: file.fileName,
            fileType: file.fileType as 'image' | 'video',
            mimeType: file.mimeType,
            fileSize: Number(file.fileSize),
            width: file.width || undefined,
            height: file.height || undefined,
            duration: file.duration || undefined,
            url: file.storageUrl,
            thumbnailUrl: file.thumbnailUrl || undefined,
            storageKey: file.storageKey,
            createdAt: file.createdAt,
        };
    }
}
