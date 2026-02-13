import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export class R2Client {
    private client: S3Client;
    private bucketName: string;
    private publicDomain: string;

    constructor(
        accountId: string,
        accessKeyId: string,
        secretAccessKey: string,
        bucketName: string,
        publicDomain: string
    ) {
        this.bucketName = bucketName;
        this.publicDomain = publicDomain;

        // 配置 S3 客户端连接到 Cloudflare R2
        this.client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }

    /**
     * 上传文件到 R2
     */
    async uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
            CacheControl: 'public, max-age=31536000, immutable',
        });

        await this.client.send(command);

        return this.getPublicUrl(key);
    }

    /**
     * 删除文件
     */
    async deleteFile(key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        await this.client.send(command);
    }

    /**
     * 获取公开访问 URL
     */
    private getPublicUrl(key: string): string {
        return `${this.publicDomain.replace(/\/$/, '')}/${key}`;
    }
}
