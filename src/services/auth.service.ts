import { supabase } from './supabase.service';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import * as admin from 'firebase-admin';
import { env } from '../config/env';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (process.env.FIREBASE_PROJECT_ID && privateKey && process.env.FIREBASE_CLIENT_EMAIL) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: privateKey,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            }),
        });
    } else {
        console.warn('[Firebase] Admin SDK not initialized - missing credentials');
    }
}

interface User {
    id: string;
    email?: string;
    phone?: string;
    name?: string;
    google_id?: string;
    profile_picture?: string;
    auth_method: 'google' | 'phone' | 'email_otp';
}

// JWT secret - should be in .env in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '30d'; // 30 days

// Generate 6-digit OTP
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash password (not used as per spec - no passwords)
function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Create or update user from Google OAuth
export async function createOrUpdateGoogleUser(
    email: string,
    name: string,
    googleId: string
): Promise<User> {
    const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (existingUser) {
        // Update google_id if not set
        if (!existingUser.google_id) {
            const { data: updated } = await supabase
                .from('users')
                .update({
                    google_id: googleId,
                    name,
                    last_login: new Date().toISOString()
                })
                .eq('id', existingUser.id)
                .select()
                .single();
            return updated;
        }

        // Update last login
        await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', existingUser.id);

        return existingUser;
    }

    // Create new user
    const { data: newUser, error } = await supabase
        .from('users')
        .insert({
            email,
            name,
            google_id: googleId,
            auth_method: 'google',
            last_login: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;
    return newUser;
}

// Send OTP via email using Brevo
export async function sendOTPEmail(email: string): Promise<boolean> {
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 min expiry

    // Store OTP in database
    const { error } = await supabase
        .from('otp_codes')
        .insert({
            email,
            code: otp,
            expires_at: expiresAt.toISOString(),
            used: false
        });

    if (error) throw error;

    // Send email via Brevo API
    if (process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL) {
        try {
            await axios.post(
                'https://api.brevo.com/v3/smtp/email',
                {
                    sender: {
                        name: process.env.BREVO_SENDER_NAME || 'ShlokSagar',
                        email: process.env.BREVO_SENDER_EMAIL
                    },
                    to: [{ email }],
                    subject: 'Your ShlokSagar Login Code',
                    htmlContent: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #FF6B35;">ShlokSagar Login</h2>
                            <p>Your login code is:</p>
                            <h1 style="background: #f5f5f5; padding: 20px; text-align: center; letter-spacing: 8px; font-size: 32px; color: #333;">${otp}</h1>
                            <p style="color: #666;">This code will expire in 10 minutes.</p>
                            <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
                        </div>
                    `
                },
                {
                    headers: {
                        'api-key': process.env.BREVO_API_KEY,
                        'Content-Type': 'application/json',
                        'accept': 'application/json'
                    }
                }
            );
            console.log(`[OTP] Email sent to: ${email} via Brevo`);
        } catch (emailError: any) {
            console.error('[OTP] Brevo error:', emailError.response?.data || emailError.message);
            // Fallback: log to console in development
            if (env.NODE_ENV === 'development') {
                console.log(`[OTP] Development Mode - Email: ${email}, Code: ${otp}`);
            }
        }
    } else {
        // No Brevo configured - log to console (development only)
        console.log(`[OTP] No email service configured - Email: ${email}, Code: ${otp}`);
    }

    return true;
}

// Verify OTP and create/login user
export async function verifyOTPAndLogin(email: string, code: string, name?: string): Promise<User | null> {
    // Find valid OTP
    const { data: otpRecord } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!otpRecord) {
        return null; // Invalid or expired OTP
    }

    // Mark OTP as used
    await supabase
        .from('otp_codes')
        .update({ used: true })
        .eq('id', otpRecord.id);

    // Find or create user
    const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (existingUser) {
        // Update last login and name if provided
        await supabase
            .from('users')
            .update({
                last_login: new Date().toISOString(),
                ...(name && { name }) // Update name if provided
            })
            .eq('id', existingUser.id);
        return existingUser;
    }

    // Create new user
    const { data: newUser, error } = await supabase
        .from('users')
        .insert({
            email,
            name: name || null,
            auth_method: 'email_otp',
            last_login: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;
    return newUser;
}

// Generate JWT token using jsonwebtoken library
export function generateToken(user: User): string {
    const payload = {
        userId: user.id,
        email: user.email,
        authMethod: user.auth_method
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

// Verify JWT token
export function verifyToken(token: string): { userId: string; email: string } | null {
    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        return { userId: payload.userId, email: payload.email };
    } catch (error) {
        return null; // Invalid or expired token
    }
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
    const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    return data;
}

// ══════════════════════════════════════════════════════════════
// FIREBASE AUTHENTICATION
// ══════════════════════════════════════════════════════════════

// Verify Firebase ID token and extract user info
export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        throw new Error('Invalid Firebase token');
    }
}

// Create or update user from Firebase Google Sign-In
export async function createOrUpdateFirebaseGoogleUser(
    idToken: string
): Promise<User> {
    const decodedToken = await verifyFirebaseToken(idToken);

    const email = decodedToken.email!;
    const name = decodedToken.name || '';
    const googleId = decodedToken.uid;
    const profilePicture = decodedToken.picture;

    const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (existingUser) {
        // Update google_id and profile picture if not set
        const { data: updated } = await supabase
            .from('users')
            .update({
                google_id: googleId,
                name,
                profile_picture: profilePicture,
                last_login: new Date().toISOString()
            })
            .eq('id', existingUser.id)
            .select()
            .single();
        return updated;
    }

    // Create new user
    const { data: newUser, error } = await supabase
        .from('users')
        .insert({
            email,
            name,
            google_id: googleId,
            profile_picture: profilePicture,
            auth_method: 'google',
            last_login: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;
    return newUser;
}

// Create or update user from Firebase Phone Authentication
export async function createOrUpdateFirebasePhoneUser(
    idToken: string,
    name: string
): Promise<User> {
    const decodedToken = await verifyFirebaseToken(idToken);

    const phoneNumber = decodedToken.phone_number!;
    const uid = decodedToken.uid;

    const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phoneNumber)
        .single();

    if (existingUser) {
        // Update last login
        const { data: updated } = await supabase
            .from('users')
            .update({
                name: name || existingUser.name,
                last_login: new Date().toISOString()
            })
            .eq('id', existingUser.id)
            .select()
            .single();
        return updated;
    }

    // Create new user
    const { data: newUser, error } = await supabase
        .from('users')
        .insert({
            phone: phoneNumber,
            name,
            auth_method: 'phone',
            last_login: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;
    return newUser;
}

