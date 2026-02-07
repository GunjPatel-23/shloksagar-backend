
const { Client } = require('pg');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function test() {
    console.log('Testing query...');
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected');
        const res = await client.query('SELECT current_database(), current_user');
        console.log('✅ Result:', res.rows[0]);
    } catch (err) {
        console.error('❌ Failed:', err);
    } finally {
        await client.end();
    }
}

test();
