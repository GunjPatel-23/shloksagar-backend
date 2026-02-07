import bcrypt from 'bcrypt';
import { supabase } from '../services/supabase.service';
import 'dotenv/config';

const SALT_ROUNDS = 10;

async function createFirstAdmin() {
    try {
        console.log('Creating first admin user...\n');

        const name = 'Gunj Patel';
        const email = 'gpatel04231@gmail.com';
        const password = 'GDPatel$2310';

        // Check if admin already exists
        const { data: existing } = await supabase
            .from('admins')
            .select('id')
            .eq('email', email.toLowerCase())
            .limit(1);

        if (existing && existing.length > 0) {
            console.log('❌ Admin with this email already exists!');
            console.log('Email:', email);
            process.exit(1);
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Create admin (created_by is NULL for first admin)
        const { data: admin, error } = await supabase
            .from('admins')
            .insert({
                name,
                email: email.toLowerCase(),
                password_hash: passwordHash,
                created_by: null
            })
            .select('id, name, email, created_at')
            .single();

        if (error || !admin) {
            throw new Error(error?.message || 'Failed to create admin');
        }

        console.log('✅ First admin created successfully!\n');
        console.log('Admin Details:');
        console.log('─────────────────────────────');
        console.log('ID:', admin.id);
        console.log('Name:', admin.name);
        console.log('Email:', admin.email);
        console.log('Created:', admin.created_at);
        console.log('─────────────────────────────\n');
        console.log('Login credentials:');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('\n⚠️  Please change your password after first login!\n');

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error creating admin:', error.message);
        process.exit(1);
    }
}

createFirstAdmin();
