
const { Client } = require('pg');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function test() {
    console.log('Testing pooler connection...');
    const url = 'postgresql://postgres.emnqrpoqvauvbhmimwzt:GDPatel%242310@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require';
    const client = new Client({
        connectionString: url,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected via Pooler!');
        const res = await client.query('SELECT current_database(), current_user');
        console.log('✅ Result:', res.rows[0]);
    } catch (err) {
        console.error('❌ Failed:', err);
    } finally {
        await client.end();
    }
}

test();
