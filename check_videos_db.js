const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://emnqrpoqvauvbhmimwzt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbnFycG9xdmF1dmJobWltd3p0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyOTk5NSwiZXhwIjoyMDg1NzA1OTk1fQ.MC1HhI2dGQN1LM3TdtOhVNYU-grd8lsebV4M_B2Dpkw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVideos() {
    console.log('\n🔍 Checking videos table in Supabase...\n');

    const { data, error, count } = await supabase
        .from('videos')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log('📊 Total videos in database:', count);

    if (data && data.length > 0) {
        console.log('\n📹 Videos found:\n');
        data.forEach((video, i) => {
            console.log(`${i + 1}. ID: ${video.id}`);
            console.log(`   Title (EN): ${video.title_en || '(empty)'}`);
            console.log(`   Title (HI): ${video.title_hi || '(empty)'}`);
            console.log(`   Title (GU): ${video.title_gu || '(empty)'}`);
            console.log(`   Video URL: ${video.video_url || '(empty)'}`);
            console.log(`   Created: ${video.created_at}`);
            console.log('');
        });
    } else {
        console.log('\n⚠️  NO VIDEOS FOUND IN DATABASE!\n');
        console.log('This means:');
        console.log('1. Videos were not successfully saved from admin panel');
        console.log('2. Or the table is empty');
        console.log('\nPlease try adding a video again in the admin panel.');
    }
}

checkVideos().then(() => {
    console.log('✅ Check complete\n');
    process.exit(0);
}).catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
