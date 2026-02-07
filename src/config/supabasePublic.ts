import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Public Supabase client with ANON key for read operations
export const supabasePublic = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});
