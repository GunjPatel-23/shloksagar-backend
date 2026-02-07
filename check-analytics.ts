import { supabase } from './src/services/supabase.service';

async function checkAnalyticsData() {
    console.log('🔍 Checking analytics data in database...\n');

    try {
        // Check site visits
        const { data: visits, error: visitsError } = await supabase
            .from('site_visits')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (visitsError) throw visitsError;
        console.log(`📊 Site Visits (${visits?.length || 0} shown):`);
        visits?.forEach(v => {
            console.log(`   - Session: ${v.session_id.substring(0, 20)}... at ${v.created_at}`);
        });

        // Check total counts
        const { count: totalVisits } = await supabase
            .from('site_visits')
            .select('*', { count: 'exact', head: true });

        const { count: totalPageViews } = await supabase
            .from('page_views')
            .select('*', { count: 'exact', head: true });

        console.log(`\n📈 Total Counts:`);
        console.log(`   - Site Visits: ${totalVisits}`);
        console.log(`   - Page Views: ${totalPageViews}`);

        // Test the RPC function
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        const endDate = new Date();

        console.log(`\n🔧 Testing RPC function with dates:`);
        console.log(`   Start: ${startDate.toISOString()}`);
        console.log(`   End: ${endDate.toISOString()}`);

        const { data: rpcData, error: rpcError } = await supabase.rpc('get_site_visits_stats', {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
        });

        if (rpcError) {
            console.error('❌ RPC Error:', rpcError);
        } else {
            console.log(`\n✅ RPC Function returned ${rpcData?.length || 0} days of data:`);
            rpcData?.forEach((day: any) => {
                console.log(`   - ${day.date}: ${day.unique_visits} visits, ${day.total_page_views} views`);
            });
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }
}

checkAnalyticsData();
