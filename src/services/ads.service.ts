import { supabase } from './supabase.service';

interface Ad {
    id: string;
    advertiser_name: string;
    image_url: string;
    redirect_url: string;
    total_impressions: number;
    used_impressions: number;
    remaining_impressions: number;
    status: 'active' | 'paused' | 'completed';
}

// Get weighted ad for display (uses database function)
export async function getWeightedAd(): Promise<Ad | null> {
    const { data, error } = await supabase.rpc('get_weighted_ad');

    if (error || !data || data.length === 0) {
        return null;
    }

    return data[0];
}

// Track ad impression
export async function trackAdImpression(
    adId: string,
    sessionId: string,
    pagePath: string
): Promise<void> {
    // Insert impression record
    await supabase.from('ad_impressions').insert({
        ad_id: adId,
        session_id: sessionId,
        page_path: pagePath
    });

    // Increment used_impressions counter
    await supabase.rpc('increment_ad_impression', { ad_uuid: adId });
}

// Track ad click
export async function trackAdClick(
    adId: string,
    sessionId: string,
    pagePath: string
): Promise<void> {
    await supabase.from('ad_clicks').insert({
        ad_id: adId,
        session_id: sessionId,
        page_path: pagePath
    });
}

// Get all ad packages
export async function getAdPackages() {
    const { data, error } = await supabase
        .from('ad_packages')
        .select('*')
        .order('impressions', { ascending: true });

    if (error) throw error;
    return data;
}

// Create new ad
export async function createAd(
    advertiserName: string,
    imageUrl: string,
    redirectUrl: string,
    packageId: string
) {
    // Get package details
    const { data: pkg, error: pkgError } = await supabase
        .from('ad_packages')
        .select('impressions')
        .eq('id', packageId)
        .single();

    if (pkgError || !pkg) throw new Error('Invalid package');

    const { data, error } = await supabase
        .from('ads')
        .insert({
            advertiser_name: advertiserName,
            image_url: imageUrl,
            redirect_url: redirectUrl,
            package_id: packageId,
            total_impressions: pkg.impressions,
            used_impressions: 0,
            status: 'active'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Get all ads (admin view)
export async function getAllAds() {
    const { data, error } = await supabase
        .from('ads')
        .select(`
            *,
            package:ad_packages(name, impressions, price_inr)
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(ad => ({
        ...ad,
        remaining_impressions: ad.total_impressions - ad.used_impressions
    }));
}

// Get ad by ID
export async function getAdById(adId: string) {
    const { data, error } = await supabase
        .from('ads')
        .select(`
            *,
            package:ad_packages(name, impressions, price_inr)
        `)
        .eq('id', adId)
        .single();

    if (error) throw error;

    return {
        ...data,
        remaining_impressions: data.total_impressions - data.used_impressions
    };
}

// Update ad status (pause/resume)
export async function updateAdStatus(adId: string, status: 'active' | 'paused') {
    const { data, error } = await supabase
        .from('ads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', adId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Get ad performance stats
export async function getAdPerformance(startDate: Date, endDate: Date) {
    const { data, error } = await supabase.rpc('get_ad_performance', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
    });

    if (error) throw error;
    return data;
}

// Get impressions over time for a specific ad
export async function getAdImpressionsOverTime(
    adId: string,
    startDate: Date,
    endDate: Date
) {
    const { data, error } = await supabase
        .from('ad_impressions')
        .select('created_at')
        .eq('ad_id', adId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const grouped = data.reduce((acc: any, impression: any) => {
        const date = impression.created_at.split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
}

// Get pages where ad appeared
export async function getAdPageDistribution(
    adId: string,
    startDate: Date,
    endDate: Date
) {
    const { data, error } = await supabase
        .from('ad_impressions')
        .select('page_path')
        .eq('ad_id', adId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

    if (error) throw error;

    // Group by page
    const grouped = data.reduce((acc: any, impression: any) => {
        const page = impression.page_path || 'unknown';
        acc[page] = (acc[page] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(grouped)
        .map(([page, count]) => ({ page, count }))
        .sort((a: any, b: any) => b.count - a.count);
}

// Get total ad impressions delivered (for dashboard)
export async function getTotalAdImpressions(startDate: Date, endDate: Date): Promise<number> {
    const { count, error } = await supabase
        .from('ad_impressions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

    if (error) throw error;
    return count || 0;
}

// Get active ads count
export async function getActiveAdsCount(): Promise<number> {
    const { count, error } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .filter('impressions_used', 'lt', 'impressions_total');

    if (error) throw error;
    return count || 0;
}

// Delete ad (admin only, soft delete by marking completed)
export async function deleteAd(adId: string) {
    const { error } = await supabase
        .from('ads')
        .update({ status: 'completed' })
        .eq('id', adId);

    if (error) throw error;
}
