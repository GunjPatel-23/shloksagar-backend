import { supabase } from '../services/supabase.service';
import fs from 'fs';
import path from 'path';

const migrations = [
    '000_init_schema.sql',
    '001_analytics.sql',
    '002_ads_monetization.sql',
    '002_admin_users.sql'
];

async function runAllMigrations() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   ShlokSagar Database Migration Runner    ║');
    console.log('╚════════════════════════════════════════════╝\n');

    let success = true;

    for (const migrationFile of migrations) {
        console.log(`\n📄 Running: ${migrationFile}`);
        console.log('─'.repeat(50));

        try {
            const sqlPath = path.join(__dirname, '../../migrations', migrationFile);
            const sql = fs.readFileSync(sqlPath, 'utf8');

            // For Supabase, we need to execute the SQL directly
            // Since we can't use .query(), we'll output the SQL for manual execution
            console.log(`\n⚠️  Please run this SQL in Supabase SQL Editor:\n`);
            console.log('─'.repeat(50));
            console.log(sql);
            console.log('─'.repeat(50));
            console.log(`\n✅ SQL for ${migrationFile} is ready above`);

        } catch (error: any) {
            console.error(`❌ Error reading ${migrationFile}:`, error.message);
            success = false;
        }
    }

    if (success) {
        console.log('\n\n╔════════════════════════════════════════════╗');
        console.log('║         Migration Instructions             ║');
        console.log('╚════════════════════════════════════════════╝');
        console.log('\n1. Go to Supabase Dashboard → SQL Editor');
        console.log('2. Create a new query');
        console.log('3. Copy and paste ALL the SQL shown above');
        console.log('4. Click "Run" to execute');
        console.log('\nAlternatively, copy each migration separately and run them in order.\n');
    } else {
        console.log('\n❌ Some migrations could not be loaded.');
    }
}

runAllMigrations();
