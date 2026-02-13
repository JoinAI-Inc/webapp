# Cloudflare R2 多媒体存储 SDK 设计方案

> 基于调研结果：Cloudflare R2 性价比最高（零流量费用，S3 API 兼容）  
> 设计为 Turbo monorepo 中可直接集成的 TypeScript SDK 包

## 一、架构设计

### 1.1 整体架构

```mermaid
graph TB
    App[应用服务] -->|导入| SDK[@media/storage SDK]
    SDK --> R2Client[R2 Client]
    SDK --> DBClient[Prisma Client]
    SDK --> ImageProcessor[图片处理]
    
    R2Client --> R2[Cloudflare R2]
    DBClient --> DB[(PostgreSQL)]
    ImageProcessor --> Sharp[Sharp库]
    
    R2 -->|CDN| CDN[全球边缘节点]
    CDN -->|访问| Client[客户端]
```

**设计理念**：
- SDK 作为 Turbo monorepo 中的内部包（`packages/storage`）
- 应用代码直接导入使用，无需独立服务
- 共享数据库连接和配置
- 类型安全的 TypeScript API

### 1.2 技术栈

| 组件 | 技术选型 | 理由 |
|------|---------|------|
| **开发语言** | TypeScript | 类型安全，开发体验好 |
| **包管理** | pnpm workspace | Turbo monorepo 标准 |
| **对象存储** | Cloudflare R2 | 零流量费用，S3兼容 |
| **数据库** | PostgreSQL + Prisma | 共享现有数据库 |
| **文件验证** | file-type | 安全检测真实类型 |
| **图片处理** | sharp | 高性能图片压缩/缩略图 |
| **文件上传** | multipart-parser | 支持浏览器直传 |

## 二、核心功能设计

### 2.1 SDK 使用示例

```typescript
import { MediaStorage } from '@media/storage';

// 初始化 SDK
const storage = new MediaStorage({
  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: 'media-storage',
    publicDomain: 'https://cdn.example.com'
  },
  prisma: prismaClient, // 共享 Prisma 实例
  upload: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedImageTypes: ['jpg', 'jpeg', 'png', 'webp'],
    allowedVideoTypes: ['mp4', 'mov', 'webm']
  }
});

// 上传文件
const result = await storage.upload({
  file: fileBuffer,
  fileName: 'example.jpg',
  appId: 'my-app',
  tags: ['product', 'thumbnail'],
  metadata: { productId: '123' }
});

// 查询文件
const files = await storage.query({
  appId: 'my-app',
  fileType: 'image',
  page: 1,
  pageSize: 20
});

// 删除文件
await storage.delete(fileId, { permanent: false });
```

### 2.2 上传流程

```mermaid
sequenceDiagram
    应用代码->>SDK: upload(file, options)
    SDK->>文件验证: 检查类型/大小
    文件验证->>SDK: 通过
    SDK->>R2 Client: putObject()
    R2 Client->>R2: 上传原文件
    R2->>R2 Client: 返回URL
    
    alt 是图片
        SDK->>Sharp: 生成缩略图
        Sharp->>SDK: 返回缩略图 Buffer
        SDK->>R2 Client: putObject(thumbnail)
        R2 Client->>R2: 上传缩略图
        R2->>R2 Client: 返回缩略图URL
    end
    
    SDK->>Prisma: 保存元数据
    Prisma->>DB: INSERT
    DB->>Prisma: 确认
    SDK->>应用代码: 返回文件信息
```

### 2.3 查询方法

```typescript
// 按条件查询
const result = await storage.query({
  appId: 'my-app',
  fileType?: 'image' | 'video',
  tags?: string[],
  page: 1,
  pageSize: 20,
  startDate?: Date,
  endDate?: Date
});

// 批量查询
const files = await storage.getByIds(['id1', 'id2', 'id3']);

// 获取单个文件
const file = await storage.getById('file-id');
```

### 2.4 删除方法

```typescript
// 软删除（默认）
await storage.delete(fileId);

// 硬删除
await storage.delete(fileId, { permanent: true });

// 批量删除
await storage.bulkDelete(['id1', 'id2'], { permanent: false });
```

## 三、数据库设计

### 3.1 核心表结构

```sql
-- 媒体资源表
CREATE TABLE media_files (
    id VARCHAR(36) PRIMARY KEY,              -- UUID
    app_id VARCHAR(50) NOT NULL,             -- 业务应用标识
    file_name VARCHAR(255) NOT NULL,         -- 原始文件名
    file_type VARCHAR(20) NOT NULL,          -- image/video
    mime_type VARCHAR(50) NOT NULL,          -- image/jpeg, video/mp4
    file_size BIGINT NOT NULL,               -- 字节数
    width INTEGER,                           -- 宽度（图片/视频）
    height INTEGER,                          -- 高度
    duration INTEGER,                        -- 时长（视频，秒）
    
    -- R2存储信息
    storage_key VARCHAR(500) NOT NULL,       -- R2对象键
    storage_url TEXT NOT NULL,               -- 访问URL
    thumbnail_url TEXT,                      -- 缩略图URL（图片）
    
    -- 业务信息
    tags JSONB,                              -- 标签数组
    metadata JSONB,                          -- 扩展元数据
    
    -- 状态管理
    status VARCHAR(20) DEFAULT 'active',     -- active/deleted
    deleted_at TIMESTAMP,                    -- 软删除时间
    
    -- 审计字段
    created_by VARCHAR(50),                  -- 创建用户
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- 索引
    INDEX idx_app_id (app_id),
    INDEX idx_file_type (file_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

### 3.2 存储路径规则

```
/{app_id}/{file_type}/{year}/{month}/{uuid}.{ext}

示例：
/my-app/image/2026/02/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
/my-app/video/2026/02/b2c3d4e5-f6a7-8901-bcde-f12345678901.mp4
```

## 四、SDK 类型定义

### 4.1 配置类型

```typescript
interface MediaStorageConfig {
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
```

### 4.2 上传类型

```typescript
interface UploadOptions {
  file: Buffer;                     // 文件二进制数据
  fileName: string;                 // 原始文件名
  appId: string;                    // 业务应用标识
  tags?: string[];                  // 标签
  metadata?: Record<string, any>;   // 扩展元数据
  createdBy?: string;               // 创建用户
}

interface UploadResult {
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

// 批量上传
type BatchUploadResult = UploadResult[];
```

### 4.3 查询类型

```typescript
interface QueryOptions {
  appId: string;
  fileType?: 'image' | 'video';
  tags?: string[];
  page?: number;                    // 默认 1
  pageSize?: number;                // 默认 20
  startDate?: Date;
  endDate?: Date;
}

interface QueryResult {
  items: UploadResult[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

### 4.4 删除类型

```typescript
interface DeleteOptions {
  permanent?: boolean;              // 默认 false (软删除)
}

interface DeleteResult {
  success: boolean;
  deletedAt?: Date;                 // 软删除时间
  message: string;
}
```

## 五、包结构设计

### 5.1 目录结构

```
packages/storage/
├── src/
│   ├── index.ts              # SDK 主入口
│   ├── client.ts             # MediaStorage 类
│   ├── r2/
│   │   ├── client.ts         # R2 客户端封装
│   │   └── utils.ts          # 路径生成等工具
│   ├── db/
│   │   ├── schema.prisma     # Prisma Schema
│   │   └── migrations/       # 数据库迁移
│   ├── processors/
│   │   ├── image.ts          # 图片处理（缩略图）
│   │   └── video.ts          # 视频处理（预留）
│   ├── validators/
│   │   └── file.ts           # 文件验证
│   └── types/
│       └── index.ts          # TypeScript 类型定义
├── package.json
├── tsconfig.json
└── README.md
```

### 5.2 package.json

```json
{
  "name": "@media/storage",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.600.0",
    "@prisma/client": "^5.19.0",
    "file-type": "^18.7.0",
    "nanoid": "^5.0.7",
    "sharp": "^0.33.4"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "prisma": "^5.19.0",
    "typescript": "^5.5.0"
  }
}
```

## 六、配置管理

### 6.1 环境变量（应用层）

```bash
# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=media-storage
R2_PUBLIC_DOMAIN=https://cdn.example.com

# 数据库（共享现有配置）
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### 6.2 SDK 初始化（应用代码）

```typescript
// app/lib/storage.ts
import { MediaStorage } from '@media/storage';
import { prisma } from '@/lib/prisma';

export const mediaStorage = new MediaStorage({
  r2: {
    accountId: process.env.R2_ACCOUNT_ID!,
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    bucketName: process.env.R2_BUCKET_NAME!,
    publicDomain: process.env.R2_PUBLIC_DOMAIN!
  },
  prisma,
  upload: {
    maxFileSize: 100 * 1024 * 1024,
    allowedImageTypes: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    allowedVideoTypes: ['mp4', 'mov', 'webm']
  },
  thumbnail: {
    width: 300,
    quality: 80
  }
});
```

## 七、安全设计

### 7.1 应用层鉴权

由应用层负责身份验证和授权，SDK 只负责存储逻辑：

```typescript
// Next.js API Route 示例
export async function POST(req: Request) {
  // 1. 应用层鉴权
  const session = await getServerSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // 2. 调用 SDK
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const buffer = Buffer.from(await file.arrayBuffer());
  
  const result = await mediaStorage.upload({
    file: buffer,
    fileName: file.name,
    appId: 'my-app',
    createdBy: session.user.id
  });
  
  return Response.json(result);
}
```

### 7.2 文件安全

```typescript
// 文件类型验证（防止伪造扩展名）
const fileTypeFromBuffer = await FileType.fromBuffer(buffer);
if (!ALLOWED_TYPES.includes(fileTypeFromBuffer.mime)) {
  throw new Error('不支持的文件类型');
}

// 文件大小验证
if (file.size > MAX_FILE_SIZE) {
  throw new Error('文件过大');
}

// 病毒扫描（可选，集成 ClamAV）
await scanFile(file.buffer);
```

## 八、性能优化

### 8.1 上传优化

```typescript
// 并发上传多个文件
const files = [file1, file2, file3];
const results = await Promise.all(
  files.map(file => 
    mediaStorage.upload({
      file,
      fileName: file.name,
      appId: 'my-app'
    })
  )
);

// 大文件分片上传（预留接口）
const result = await mediaStorage.uploadLarge({
  file: largeFileBuffer,
  fileName: 'large-video.mp4',
  appId: 'my-app',
  chunkSize: 10 * 1024 * 1024  // 10MB 分片
});
```

### 8.2 缓存策略

```typescript
// SDK 内部缓存策略
- R2 对象设置: Cache-Control: public, max-age=31536000, immutable
- 数据库查询结果可在应用层缓存（使用 Redis 等）

// 应用层缓存示例
import { cache } from 'react';

export const getMediaFiles = cache(async (appId: string) => {
  return await mediaStorage.query({ appId, pageSize: 100 });
});
```

### 8.3 CDN 加速

- Cloudflare R2 自带全球 CDN
- 自动选择最近节点
- 边缘缓存
- 可配合 Cloudflare Workers 实现图片动态处理

## 九、SDK 集成指南

### 9.1 安装依赖

```bash
# 在 Turbo monorepo 根目录
pnpm install

# packages/storage 会自动作为内部依赖
```

### 9.2 Turbo 配置

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "@media/storage#build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

### 9.3 应用集成

```typescript
// apps/web/package.json
{
  "dependencies": {
    "@media/storage": "workspace:*"
  }
}

// apps/web/app/api/upload/route.ts
import { mediaStorage } from '@/lib/storage';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  
  const result = await mediaStorage.upload({
    file: Buffer.from(await file.arrayBuffer()),
    fileName: file.name,
    appId: 'web-app'
  });
  
  return Response.json(result);
}
```

### 9.4 数据库迁移

```bash
# 在 packages/storage 中
cd packages/storage
pnpm prisma migrate dev --name init_media_storage

# 或在应用中执行
pnpm --filter @media/storage prisma migrate deploy
```

## 十、成本估算

### 10.1 Cloudflare R2 成本

假设每月存储 500GB，20TB 流量：

- **存储费用**：500GB × $0.015 = **$7.5**
- **流量费用**：**$0**（免费）
- **API 请求**：约 **$2**（100万次写入 + 1000万次读取）
- **总计**：**$9.5/月**

### 10.2 对比传统方案

| 方案 | 月成本 | 说明 |
|------|--------|------|
| **Cloudflare R2** | **$9.5** | SDK 集成，零流量费 |
| AWS S3 | ~$300 | 20TB 流量费 |
| 阿里云 OSS | ~$200 | 流量+存储 |

**使用 R2 + SDK 方案成本降低 97%** 🎉

## 十一、后续扩展

### Phase 1：核心功能（当前）
- ✅ 基础上传/查询/删除 API
- ✅ 图片自动缩略图
- ✅ 多业务隔离（appId）
- ✅ TypeScript 类型安全

### Phase 2：高级功能
- 🔄 视频转码支持
- 🔄 大文件分片上传
- 🔄 图片水印功能
- 🔄 批量操作优化

### Phase 3：增值功能
- 📅 使用统计和分析
- 📅 AI 内容审核集成
- 📅 CDN 日志分析
- 📅 存储成本优化建议

---

**设计时间**：2026年2月  
**版本**：v2.0（SDK 方案）
