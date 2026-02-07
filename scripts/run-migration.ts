import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function migrate() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL is missing in .env');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase in many environments
    });

    console.log('Starting migration process...');
    try {
        await client.connect();
        console.log('✅ Connected to Cloud Supabase');

        const migrationsDir = path.join(__dirname, '../migrations');
        console.log('Migrations directory:', migrationsDir);

        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
        console.log('Files to run:', files);

        for (const file of files) {
            const sqlPath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(sqlPath, 'utf8');

            console.log(`Running migration: ${file}...`);
            await client.query(sql);
            console.log(`✅ ${file} applied.`);
        }

    } catch (err: any) {
        console.error('❌ Migration failed:', err.message);
        console.error(err);
    } finally {
        await client.end();
        console.log('Migration process finished.');
    }
}

migrate().then(() => console.log('Migrate finished promise resolved')).catch(e => console.error('Promise rejected', e));
