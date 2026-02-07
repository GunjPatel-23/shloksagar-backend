import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function checkTables() {
    console.log('--- Checking Tables via raw SQL ---');
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Query information_schema
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `);

        console.log('Tables in public schema:', res.rows.map(r => r.table_name));

    } catch (err: any) {
        console.error('❌ SQL Error:', err.message);
    } finally {
        await client.end();
    }
}

checkTables();
