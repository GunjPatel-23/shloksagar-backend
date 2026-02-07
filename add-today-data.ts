import { supabase } from './src/services/supabase.service';

async function addTodayData() {
    console.log('📅 Adding today\'s analytics data...\n');

    try {
        const visits = [];
        const pageViews = [];
        const contentInterests = [];
        const languagePrefs = [];

        const today = new Date();
        const visitsToday = 25 + Math.floor(Math.random() * 15); // 25-40 visits today

        for (let i = 0; i < visitsToday; i++) {
            const sessionId = `session_today_${i}_${Date.now()}`;
            const hourOffset = Math.floor(Math.random() * (new Date().getHours() + 1));
            const visitTime = new Date(today);
            visitTime.setHours(hourOffset, Math.floor(Math.random() * 60), 0, 0);

            visits.push({
                session_id: sessionId,
                user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                created_at: visitTime.toISOString()
            });

            // Add page views
            const pagesPerSession = 2 + Math.floor(Math.random() * 5);
            const paths = ['/bhajans', '/aarti', '/chalisa', '/stotra', '/quotes', '/wallpapers', '/videos', '/gita-sandesh'];
            const titles = ['Bhajans', 'Aarti', 'Chalisa', 'Stotra', 'Quotes', 'Wallpapers', 'Videos', 'Gita Sandesh'];

            for (let j = 0; j < pagesPerSession; j++) {
                const pathIndex = Math.floor(Math.random() * paths.length);
                const pageTime = new Date(visitTime.getTime() + j * 2 * 60 * 1000);

                pageViews.push({
                    session_id: sessionId,
                    path: paths[pathIndex],
                    page_title: titles[pathIndex],
                    created_at: pageTime.toISOString()
                });
            }

            // Add content type interest
            const contentTypes = ['bhajan', 'aarti', 'chalisa', 'stotra', 'quote', 'wallpaper', 'video', 'gita_sandesh'];
            const typeIndex = Math.floor(Math.random() * contentTypes.length);
            contentInterests.push({
                session_id: sessionId,
                content_type: contentTypes[typeIndex],
                created_at: visitTime.toISOString()
            });

            // Add language preference
            const languages = ['hindi', 'gujarati', 'english'];
            const langIndex = Math.floor(Math.random() * languages.length);
            languagePrefs.push({
                session_id: sessionId,
                language: languages[langIndex],
                created_at: visitTime.toISOString()
            });
        }

        // Insert data
        await supabase.from('site_visits').insert(visits);
        await supabase.from('page_views').insert(pageViews);
        await supabase.from('content_type_interest').insert(contentInterests);
        await supabase.from('language_preference').insert(languagePrefs);

        console.log('✅ Today\'s data added successfully!');
        console.log(`   - ${visits.length} visits`);
        console.log(`   - ${pageViews.length} page views`);

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

addTodayData();
