import { MediaStorage } from '@media/storage';
import { prisma } from '@repo/database';

export const storage = new MediaStorage({
    r2: {
        accountId: process.env.R2_ACCOUNT_ID!,
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        bucketName: process.env.R2_BUCKET_NAME!,
        publicDomain: process.env.R2_PUBLIC_DOMAIN!,
    },
    prisma,
});
