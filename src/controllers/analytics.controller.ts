import { Request, Response } from 'express';
import { supabase, Tables } from '../services/supabase.service';

export const analyticsController = {
    // Public: Track Event
    async trackEvent(req: Request, res: Response) {
        try {
            const { event_type, path, category_id, content_id, metadata } = req.body;
            const userAgent = req.headers['user-agent'];
            const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

            // Basic anonymization hash for session_id (IP + Date)
            const dateStr = new Date().toISOString().split('T')[0];
            const session_id = Buffer.from(`${ip}-${dateStr}`).toString('base64');

            const { error } = await supabase
                .from(Tables.ANALYTICS)
                .insert({
                    event_type: event_type || 'page_view',
                    path,
                    category_id,
                    content_id,
                    session_id,
                    metadata: { ...metadata, userAgent }
                });

            if (error) {
                console.error('Analytics Insert Error', error);
                // Don't block the client, just log
            }

            // Always return success quickly
            res.status(200).json({ success: true });
        } catch (err) {
            console.error('Analytics Error', err);
            res.status(200).json({ success: true }); // Swallow errors
        }
    },

    // Admin: Get Stats
    async getStats(req: Request, res: Response) {
        try {
            const { period = '30d' } = req.query;
            let days = 30;
            if (period === '7d') days = 7;
            if (period === '1d') days = 1;

            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            // Using RPCs defined in migration
            const [dailyStats, topContent] = await Promise.all([
                supabase.rpc('get_daily_stats', {
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString()
                }),
                supabase.rpc('get_top_content', {
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    limit_count: 10
                })
            ]);

            if (dailyStats.error) throw dailyStats.error;
            if (topContent.error) throw topContent.error;

            res.json({
                success: true,
                data: {
                    daily: dailyStats.data,
                    topPages: topContent.data
                }
            });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
};
