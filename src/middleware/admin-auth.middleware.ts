import { Request, Response, NextFunction } from 'express';
import { adminAuthService } from '../services/admin-auth.service';

export const authenticateAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No admin token provided' });
        }

        const token = authHeader.substring(7);
        const { adminId, email } = adminAuthService.verifyAdminToken(token);

        // Attach admin info to request
        (req as any).adminId = adminId;
        (req as any).email = email;

        next();
    } catch (error: any) {
        return res.status(401).json({ error: 'Invalid or expired admin token' });
    }
};
