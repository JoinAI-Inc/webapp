# @media/storage

Cloudflare R2 多媒体存储 SDK - 为 Turbo Monorepo 设计的 TypeScript SDK

## 功能特性

- 📤 **文件上传**: 支持图片和视频上传到 Cloudflare R2
- 🖼️ **自动缩略图**: 图片自动生成缩略图
- 🔍 **灵活查询**: 多条件查询和分页支持
- 🗑️ **软删除**: 支持软删除和硬删除
- 🏷️ **标签管理**: 支持文件标签和元数据
- 📊 **多应用隔离**: 通过 appId 实现多业务隔离
- 🔒 **类型安全**: 完整的 TypeScript 类型定义

## 安装

```bash
# 在应用的 package.json 中添加
{
  "dependencies": {
    "@media/storage": "workspace:*"
  }
}
```

## 快速开始

### 1. 初始化 SDK

```typescript
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
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedImageTypes: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    allowedVideoTypes: ['mp4', 'mov', 'webm']
  },
  thumbnail: {
    width: 300,
    quality: 80
  }
});
```

### 2. 上传文件

```typescript
const result = await mediaStorage.upload({
  file: fileBuffer,
  fileName: 'example.jpg',
  appId: 'my-app',
  tags: ['product', 'thumbnail'],
  metadata: { productId: '123' }
});

console.log(result.url); // 公开访问 URL
```

### 3. 查询文件

```typescript
const files = await mediaStorage.query({
  appId: 'my-app',
  fileType: 'image',
  page: 1,
  pageSize: 20
});
```

### 4. 删除文件

```typescript
// 软删除
await mediaStorage.delete(fileId);

// 硬删除
await mediaStorage.delete(fileId, { permanent: true });
```

## 环境变量

```bash
# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=media-storage
R2_PUBLIC_DOMAIN=https://cdn.example.com
```

## API 文档

详见设计方案文档。

## License

MIT
