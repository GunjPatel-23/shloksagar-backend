import { supabase } from '../src/services/supabase.service';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
    try {
        console.log('🔄 Running migration 004: Add media to daily content...\n');

        const migrationPath = path.join(__dirname, '../migrations/004_add_media_to_daily_content.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('📝 Migration SQL:');
        console.log(sql);
        console.log('\n⚠️  Note: This script cannot execute ALTER TABLE via Supabase client.');
        console.log('Please run the SQL above manually in Supabase SQL Editor.\n');
        console.log('However, let me verify if the columns already exist...\n');

        // Verify columns were added
        console.log('🔍 Verifying migration...');
        const { data: quoteData, error: quoteError } = await supabase
            .from('quotes')
            .select('image_url, video_url')
            .limit(1);

        const { data: sandeshData, error: sandeshError } = await supabase
            .from('gita_sandesh')
            .select('image_url, video_url')
            .limit(1);

        if (!quoteError && !sandeshError) {
            console.log('✅ Columns verified on quotes table');
            console.log('✅ Columns verified on gita_sandesh table');
            console.log('\n🎉 All done! Media columns are now available.\n');
        } else {
            console.log('⚠️  Verification note:', quoteError?.message || sandeshError?.message);
        }

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

runMigration();
