import { PrismaClient } from '@prisma/client';

// ==================== 配置类型 ====================

export interface MediaStorageConfig {
    r2: {
        accountId: string;
        accessKeyId: string;
        secretAccessKey: string;
        bucketName: string;
        publicDomain: string;
    };
    prisma: PrismaClient;
    upload?: {
        maxFileSize?: number;           // 默认 100MB
        maxFilesPerRequest?: number;    // 默认 10
        allowedImageTypes?: string[];   // 默认 ['jpg', 'jpeg', 'png', 'webp']
        allowedVideoTypes?: string[];   // 默认 ['mp4', 'mov', 'webm']
    };
    thumbnail?: {
        width?: number;                 // 默认 300
        quality?: number;               // 默认 80
    };
}

// ==================== 上传类型 ====================

export interface UploadOptions {
    file: Buffer;                     // 文件二进制数据
    fileName: string;                 // 原始文件名
    appId: string;                    // 业务应用标识
    tags?: string[];                  // 标签
    metadata?: Record<string, any>;   // 扩展元数据
    createdBy?: string;               // 创建用户
    userId?: string;                  // BACC 用户ID
    generationType?: string;          // BACC 生成类型
    promptData?: Record<string, any>; // BACC 提示词数据
    templateId?: string;              // BACC 模板生成关联模板ID
}

export interface UploadResult {
    id: string;
    fileName: string;
    fileType: 'image' | 'video';
    mimeType: string;
    fileSize: number;
    width?: number;
    height?: number;
    duration?: number;
    url: string;
    thumbnailUrl?: string;
    storageKey: string;
    createdAt: Date;
}

export type BatchUploadResult = UploadResult[];

// ==================== 查询类型 ====================

export interface QueryOptions {
    appId: string;
    fileType?: 'image' | 'video';
    tags?: string[];
    page?: number;                    // 默认 1
    pageSize?: number;                // 默认 20
    startDate?: Date;
    endDate?: Date;
}

export interface QueryResult {
    items: UploadResult[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// ==================== 删除类型 ====================

export interface DeleteOptions {
    permanent?: boolean;              // 默认 false (软删除)
}

export interface DeleteResult {
    success: boolean;
    deletedAt?: Date;                 // 软删除时间
    message: string;
}

// ==================== 内部类型 ====================

export interface FileMetadata {
    mimeType: string;
    extension: string;
    width?: number;
    height?: number;
    duration?: number;
}

export interface StorageInfo {
    key: string;
    url: string;
    thumbnailKey?: string;
    thumbnailUrl?: string;
}
