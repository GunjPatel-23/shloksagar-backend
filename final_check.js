
const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
require('dotenv').config();

async function checkAll() {
    let output = '--- PRODUCTION READINESS CHECK ---\n';

    // 1. Supabase via Client
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    try {
        output += 'Testing Supabase Client Connection...\n';
        const { data, error } = await supabase.from('categories').select('*').limit(1);
        if (error) {
            output += `❌ Supabase Connection Failed: ${error.message}\n`;
        } else {
            output += '✅ Supabase Client: Connected\n';

            const tablesToCheck = ['categories', 'festivals', 'gita_sandesh', 'quotes', 'wallpapers', 'videos', 'devotional_content', 'analytics_events'];
            output += 'Verifying tables...\n';
            for (const table of tablesToCheck) {
                const { error: tError } = await supabase.from(table).select('*').limit(1);
                if (tError) {
                    output += `❌ Table Missing or Error: ${table} (${tError.message})\n`;
                } else {
                    output += `✅ Table Found: ${table}\n`;
                }
            }
        }
    } catch (err) {
        output += `❌ Supabase Error: ${err.message}\n`;
    }

    // 2. Cloudinary
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {
        const result = await cloudinary.api.ping();
        if (result.status === 'ok') {
            output += '✅ Cloudinary: Connected\n';
        } else {
            output += `❌ Cloudinary: Ping failed ${JSON.stringify(result)}\n`;
        }
    } catch (err) {
        output += `❌ Cloudinary Error: ${err.message}\n`;
    }

    output += '---------------------------------\n';
    fs.writeFileSync('check_result.txt', output);
    console.log('Test finished. Check check_result.txt');
}

checkAll();
