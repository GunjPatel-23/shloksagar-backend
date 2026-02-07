import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from './supabase.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

interface Admin {
    id: string;
    name: string;
    email: string;
    is_active: boolean;
    created_at: Date;
    last_login: Date | null;
}

interface AdminAuthResponse {
    token: string;
    admin: Admin;
}

export class AdminAuthService {
    // Login admin
    async loginAdmin(email: string, password: string): Promise<AdminAuthResponse> {
        const { data: admins } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('is_active', true)
            .limit(1);

        const admin = admins?.[0];
        if (!admin) {
            throw new Error('Invalid credentials');
        }

        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        // Update last login
        await supabase
            .from('admins')
            .update({ last_login: new Date().toISOString() })
            .eq('id', admin.id);

        // Generate JWT token
        const token = jwt.sign(
            {
                adminId: admin.id,
                email: admin.email,
                type: 'admin'
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return {
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                is_active: admin.is_active,
                created_at: admin.created_at,
                last_login: new Date(),
            },
        };
    }

    // Create new admin (only by existing admin)
    async createAdmin(
        name: string,
        email: string,
        password: string,
        createdByAdminId: string
    ): Promise<Admin> {
        // Check if email already exists
        const { data: existing } = await supabase
            .from('admins')
            .select('id')
            .eq('email', email.toLowerCase())
            .limit(1);

        if (existing && existing.length > 0) {
            throw new Error('Admin with this email already exists');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Create admin
        const { data: newAdmin, error } = await supabase
            .from('admins')
            .insert({
                name,
                email: email.toLowerCase(),
                password_hash: passwordHash,
                created_by: createdByAdminId
            })
            .select('id, name, email, is_active, created_at, last_login')
            .single();

        if (error) {
            throw new Error('Failed to create admin: ' + error.message);
        }

        return newAdmin;
    }

    // Get all admins (for admin management)
    async getAllAdmins(): Promise<Admin[]> {
        const { data } = await supabase
            .from('admins')
            .select('id, name, email, is_active, created_at, last_login')
            .order('created_at', { ascending: false });

        return data || [];
    }

    // Verify admin token
    verifyAdminToken(token: string): { adminId: string; email: string } {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            if (decoded.type !== 'admin') {
                throw new Error('Invalid token type');
            }
            return {
                adminId: decoded.adminId,
                email: decoded.email
            };
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    // Update password
    async updatePassword(adminId: string, newPassword: string): Promise<void> {
        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await supabase
            .from('admins')
            .update({
                password_hash: passwordHash,
                updated_at: new Date().toISOString()
            })
            .eq('id', adminId);
    }

    // Deactivate admin
    async deactivateAdmin(adminId: string): Promise<void> {
        await supabase
            .from('admins')
            .update({
                is_active: false,
                updated_at: new Date().toISOString()
            })
            .eq('id', adminId);
    }

    // Activate admin
    async activateAdmin(adminId: string): Promise<void> {
        await supabase
            .from('admins')
            .update({
                is_active: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', adminId);
    }
}

export const adminAuthService = new AdminAuthService();
