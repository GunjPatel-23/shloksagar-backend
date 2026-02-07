import { Router, Request, Response } from 'express';
import { adminAuthService } from '../services/admin-auth.service';
import { authenticateAdmin } from '../middleware/admin-auth.middleware';

const router = Router();

// Admin login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const result = await adminAuthService.loginAdmin(email, password);
        res.json(result);
    } catch (error: any) {
        console.error('Admin login error:', error);
        res.status(401).json({ error: error.message || 'Login failed' });
    }
});

// Create new admin (requires admin authentication)
router.post('/create', authenticateAdmin, async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        const createdBy = (req as any).adminId;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const admin = await adminAuthService.createAdmin(name, email, password, createdBy);
        res.status(201).json(admin);
    } catch (error: any) {
        console.error('Create admin error:', error);
        res.status(400).json({ error: error.message || 'Failed to create admin' });
    }
});

// Get all admins (requires admin authentication)
router.get('/', authenticateAdmin, async (req: Request, res: Response) => {
    try {
        const admins = await adminAuthService.getAllAdmins();
        res.json(admins);
    } catch (error: any) {
        console.error('Get admins error:', error);
        res.status(500).json({ error: 'Failed to fetch admins' });
    }
});

// Update password (requires admin authentication)
router.put('/password', authenticateAdmin, async (req: Request, res: Response) => {
    try {
        const { newPassword } = req.body;
        const adminId = (req as any).adminId;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        await adminAuthService.updatePassword(adminId, newPassword);
        res.json({ message: 'Password updated successfully' });
    } catch (error: any) {
        console.error('Update password error:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// Deactivate admin (requires admin authentication)
router.put('/:id/deactivate', authenticateAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await adminAuthService.deactivateAdmin(String(id));
        res.json({ message: 'Admin deactivated successfully' });
    } catch (error: any) {
        console.error('Deactivate admin error:', error);
        res.status(500).json({ error: 'Failed to deactivate admin' });
    }
});

// Activate admin (requires admin authentication)
router.put('/:id/activate', authenticateAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await adminAuthService.activateAdmin(String(id));
        res.json({ message: 'Admin activated successfully' });
    } catch (error: any) {
        console.error('Activate admin error:', error);
        res.status(500).json({ error: 'Failed to activate admin' });
    }
});

// Verify admin token (for frontend to check if logged in)
router.get('/verify', authenticateAdmin, async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).adminId;
        const email = (req as any).email;
        res.json({ valid: true, adminId, email });
    } catch (error: any) {
        res.status(401).json({ valid: false });
    }
});

export default router;
