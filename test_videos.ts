import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

console.log('🔗 Supabase URL:', supabaseUrl);
console.log('🔑 Using service key:', supabaseKey ? 'Yes' : 'No');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVideos() {
    console.log('\n📹 Testing videos table...\n');

    try {
        // Get all videos
        const { data, error, count } = await supabase
            .from('videos')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching videos:', error);
            return;
        }

        console.log('✅ Videos count:', count);
        console.log('📦 Videos data:', JSON.stringify(data, null, 2));

        if (data && data.length > 0) {
            console.log('\n📋 Video titles:');
            data.forEach((video, index) => {
                console.log(`${index + 1}. ${video.title_en || video.title_hi || video.title_gu || 'No title'}`);
                console.log(`   URL: ${video.video_url}`);
                console.log(`   Created: ${video.created_at}`);
            });
        } else {
            console.log('\n⚠️ No videos found in the database!');
        }
    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

testVideos().then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
});
