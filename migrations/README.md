# Database Migrations

## Latest Migration: 005_add_gita_sandesh_fields.sql

This migration adds metadata fields to the `gita_sandesh` table:
- `adhyay_name` (TEXT) - Chapter name
- `adhyay_number` (INTEGER) - Chapter number  
- `shlok_name` (TEXT) - Shlok/verse name
- Index on `adhyay_number` for faster queries

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `migrations/005_add_gita_sandesh_fields.sql`
4. Copy the SQL content
5. Paste into the SQL Editor
6. Click **Run** to execute

### Option 2: Using Supabase CLI

If you have Supabase CLI configured:

```bash
cd backend-shloksagar
supabase db push
```

### Option 3: Direct Database Connection

If you have PostgreSQL client access:

```bash
psql -h <your-supabase-host> -U postgres -d postgres -f migrations/005_add_gita_sandesh_fields.sql
```

## Verify Migration

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'gita_sandesh' 
  AND column_name IN ('adhyay_name', 'adhyay_number', 'shlok_name');
```

## After Migration

1. **Restart Backend Server**: Stop and restart your backend to clear any schema cache
2. **Test Admin UI**: Create a new Gita Sandesh entry with the new fields
3. **Test Public UI**: Verify the content displays correctly

## Migration Order

All migrations should be applied in numerical order:
1. `000_init_schema.sql` - Initial schema
2. `001_analytics.sql` - Analytics tables
3. `004_add_media_to_daily_content.sql` - Media fields for daily content
4. `005_add_gita_sandesh_fields.sql` - **NEW** Gita Sandesh metadata fields
