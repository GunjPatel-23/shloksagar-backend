import { supabase } from '../src/services/supabase.service';

async function testConnection() {
    console.log('Testing Supabase Connection...');
    try {
        const { data, error } = await supabase.from('categories').select('*').limit(1);

        if (error) {
            console.error('❌ Connection Failed:', error.message);
            // It might fail if table doesn't exist, which confirms connection at least
        } else {
            console.log('✅ Connection Successful!');
            console.log('Data:', data);
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err);
    }
}

testConnection();
