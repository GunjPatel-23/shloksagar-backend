
import { supabase } from './src/services/supabase.service';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary manually to be sure, although service might handle it
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function checkConnections() {
    console.log('--- Checking Connections ---');

    // 1. Check Supabase
    try {
        console.log('Testing Supabase Connection...');
        const { data, error } = await supabase.from('categories').select('count').limit(1);
        if (error) {
            console.error('❌ Supabase Connection Failed:', error.message);
        } else {
            console.log('✅ Supabase Connection Successful!');
        }
    } catch (err) {
        console.error('❌ Supabase Error:', err);
    }

    // 2. Check Cloudinary
    try {
        console.log('Testing Cloudinary Connection...');
        const result = await cloudinary.api.ping();
        if (result.status === 'ok') {
            console.log('✅ Cloudinary Connection Successful!');
        } else {
            console.error('❌ Cloudinary Ping Failed:', result);
        }
    } catch (err: any) {
        console.error('❌ Cloudinary Error:', err.message || err);
    }

    process.exit(0);
}

checkConnections();
