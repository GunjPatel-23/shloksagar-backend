import fs from 'fs';
import path from 'path';

const migrations = [
    '000_init_schema.sql',
    '001_analytics.sql',
    '002_ads_monetization.sql',
    '002_admin_users.sql'
];

function consolidateMigrations() {
    console.log('Creating consolidated migration file...\n');

    let consolidatedSQL = '';
    consolidatedSQL += '-- ═══════════════════════════════════════════════════════════════════\n';
    consolidatedSQL += '-- ShlokSagar Complete Database Schema\n';
    consolidatedSQL += '-- Run this entire script in Supabase SQL Editor\n';
    consolidatedSQL += '-- ═══════════════════════════════════════════════════════════════════\n\n';

    for (const migrationFile of migrations) {
        console.log(`📄 Adding: ${migrationFile}`);

        const sqlPath = path.join(__dirname, '../../migrations', migrationFile);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        consolidatedSQL += `\n-- ═══════════════════════════════════════════════════════════════════\n`;
        consolidatedSQL += `-- Migration: ${migrationFile}\n`;
        consolidatedSQL += `-- ═══════════════════════════════════════════════════════════════════\n\n`;
        consolidatedSQL += sql;
        consolidatedSQL += '\n\n';
    }

    // Write to file
    const outputPath = path.join(__dirname, '../../migrations/COMPLETE_SCHEMA.sql');
    fs.writeFileSync(outputPath, consolidatedSQL, 'utf8');

    console.log('\n✅ Consolidated migration file created!');
    console.log(`📁 Location: migrations/COMPLETE_SCHEMA.sql\n`);
    console.log('─'.repeat(60));
    console.log('Next Steps:');
    console.log('─'.repeat(60));
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Create a new query');
    console.log('3. Copy the contents of migrations/COMPLETE_SCHEMA.sql');
    console.log('4. Paste and click "Run"');
    console.log('─'.repeat(60));
}

consolidateMigrations();
