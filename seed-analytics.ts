import { supabase } from './src/services/supabase.service';

async function seedAnalyticsData() {
    console.log('🌱 Seeding analytics data...\n');

    try {
        // Generate site visits for last 7 days
        const visits = [];
        const pageViews = [];
        const contentInterests = [];
        const languagePrefs = [];

        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const date = new Date();
            date.setDate(date.getDate() - dayOffset);
            date.setHours(10, 0, 0, 0);

            const visitsPerDay = 15 + Math.floor(Math.random() * 20); // 15-35 visits

            for (let i = 0; i < visitsPerDay; i++) {
                const sessionId = `session_${dayOffset}_${i}_${Date.now()}`;
                const visitTime = new Date(date.getTime() + Math.random() * 12 * 60 * 60 * 1000);

                visits.push({
                    session_id: sessionId,
                    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                    created_at: visitTime.toISOString()
                });

                // Add page views for this session
                const pagesPerSession = 2 + Math.floor(Math.random() * 5);
                const paths = ['/bhajans', '/aarti', '/chalisa', '/stotra', '/quotes', '/wallpapers', '/videos'];
                const titles = ['Bhajans', 'Aarti', 'Chalisa', 'Stotra', 'Quotes', 'Wallpapers', 'Videos'];

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
                const contentTypes = ['bhajan', 'aarti', 'chalisa', 'stotra', 'quote', 'wallpaper', 'video'];
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
        }

        // Insert data in batches
        console.log(`Inserting ${visits.length} site visits...`);
        const { error: visitsError } = await supabase.from('site_visits').insert(visits);
        if (visitsError) throw new Error(`Site visits error: ${visitsError.message}`);
        console.log('✓ Site visits inserted');

        console.log(`Inserting ${pageViews.length} page views...`);
        const { error: pageViewsError } = await supabase.from('page_views').insert(pageViews);
        if (pageViewsError) throw new Error(`Page views error: ${pageViewsError.message}`);
        console.log('✓ Page views inserted');

        console.log(`Inserting ${contentInterests.length} content interests...`);
        const { error: contentError } = await supabase.from('content_type_interest').insert(contentInterests);
        if (contentError) throw new Error(`Content interest error: ${contentError.message}`);
        console.log('✓ Content interests inserted');

        console.log(`Inserting ${languagePrefs.length} language preferences...`);
        const { error: langError } = await supabase.from('language_preference').insert(languagePrefs);
        if (langError) throw new Error(`Language preferences error: ${langError.message}`);
        console.log('✓ Language preferences inserted');

        console.log('\n✅ Analytics data seeded successfully!');
        console.log(`\n📊 Summary:`);
        console.log(`   - ${visits.length} site visits`);
        console.log(`   - ${pageViews.length} page views`);
        console.log(`   - ${contentInterests.length} content interests`);
        console.log(`   - ${languagePrefs.length} language preferences`);

    } catch (error: any) {
        console.error('❌ Error seeding data:', error.message);
        console.error(error);
        process.exit(1);
    }
}

seedAnalyticsData();
