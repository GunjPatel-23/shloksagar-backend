import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load .env from backend-shloksagar directory
const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

const envSchema = z.object({
    PORT: z.string().default('3000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1), // Admin only
    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    ADMIN_API_KEY: z.string().min(1), // Simple admin auth for now
    FRONTEND_URL: z.string().url().default('https://shloksagar.in'),
    ADMIN_URL: z.string().url().default('https://admin.shloksagar.in'),
    // Email & Auth (optional in development)
    SENDGRID_API_KEY: z.string().optional(),
    SENDGRID_FROM_EMAIL: z.string().email().optional(),
    JWT_SECRET: z.string().min(32).optional(),
    // Google OAuth (optional)
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CALLBACK_URL: z.string().url().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Invalid environment variables', _env.error.format());
    throw new Error('Invalid environment variables');
}

export const env = _env.data;

export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
