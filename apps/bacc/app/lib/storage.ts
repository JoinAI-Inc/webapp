import { MediaStorage } from '@media/storage';
import { prisma } from '@repo/database';

if (!process.env.R2_ACCOUNT_ID) throw new Error('R2_ACCOUNT_ID not configured');
if (!process.env.R2_ACCESS_KEY_ID) throw new Error('R2_ACCESS_KEY_ID not configured');
if (!process.env.R2_SECRET_ACCESS_KEY) throw new Error('R2_SECRET_ACCESS_KEY not configured');
if (!process.env.R2_BUCKET_NAME) throw new Error('R2_BUCKET_NAME not configured');
if (!process.env.R2_PUBLIC_DOMAIN) throw new Error('R2_PUBLIC_DOMAIN not configured');

export const storage = new MediaStorage({
    r2: {
        accountId: process.env.R2_ACCOUNT_ID,
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        bucketName: process.env.R2_BUCKET_NAME,
        publicDomain: process.env.R2_PUBLIC_DOMAIN
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
