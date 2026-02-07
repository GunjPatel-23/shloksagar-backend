import { supabase } from '../services/supabase.service';
import fs from 'fs';
import path from 'path';

async function runMigration() {
    try {
        console.log('Running admin users migration...\n');

        const sqlPath = path.join(__dirname, '../../migrations/002_admin_users.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split SQL by semicolons and run each statement
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            console.log('Executing:', statement.substring(0, 100) + '...');
            const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

            if (error) {
                // Try direct query if rpc fails
                const { error: directError } = await (supabase as any).from('_').query(statement);
                if (directError) {
                    console.error('Error:', error.message || directError.message);
                }
            }
        }

        console.log('\n✅ Migration completed!\n');
    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        console.log('\nPlease run this SQL manually in Supabase SQL Editor:\n');
        console.log('─'.repeat(60));
        const sqlPath = path.join(__dirname, '../../migrations/002_admin_users.sql');
        console.log(fs.readFileSync(sqlPath, 'utf8'));
        console.log('─'.repeat(60));
    }
}

runMigration();
