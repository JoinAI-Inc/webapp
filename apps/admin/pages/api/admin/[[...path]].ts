import type { NextApiRequest, NextApiResponse } from 'next';
import adminRouter from '../../../src/routes/admin';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '50mb',
        },
        externalResolver: true,
    },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const path = req.query.path;
    const routePath = Array.isArray(path) ? `/${path.join('/')}` : '/';
    const queryIndex = req.url?.indexOf('?') ?? -1;
    const query = queryIndex >= 0 ? req.url?.slice(queryIndex) : '';

    req.url = `${routePath}${query || ''}`;

    return new Promise<void>((resolve, reject) => {
        res.once('finish', resolve);
        res.once('error', reject);
        adminRouter(req as any, res as any, (error: unknown) => {
            if (error) {
                reject(error);
                return;
            }
            if (!res.writableEnded) {
                res.status(404).json({ error: 'Not found' });
            }
            resolve();
        });
    });
}
