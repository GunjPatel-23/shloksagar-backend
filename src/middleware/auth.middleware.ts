import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { verifyToken, getUserById } from '../services/auth.service';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
            };
        }
    }
}

// Admin API key middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    console.log('🔐 Admin auth check:', {
        path: req.path,
        method: req.method,
        hasAdminKey: !!req.headers['x-admin-key'],
        adminKeyValue: req.headers['x-admin-key']
    });

    const apiKey = req.headers['x-admin-key'];

    if (!apiKey || apiKey !== env.ADMIN_API_KEY) {
        console.error('❌ Admin auth failed - Invalid or missing key');
        return res.status(403).json({ success: false, message: 'Forbidden: Invalid Admin Key' });
    }

    console.log('✅ Admin auth passed');
    next();
};

// User authentication middleware (for downloads)
export async function requireUserAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized - Invalid or expired token' });
    }

    // Verify user exists
    const user = await getUserById(decoded.userId);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized - User not found' });
    }

    req.user = decoded;
    next();
}

// Optional user auth (attach user if present, but don't require)
export async function optionalUserAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (decoded) {
            req.user = decoded;
        }
    }

    next();
}

