import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.middleware';
import { adminController } from '../controllers/admin.controller';
import * as contentService from '../services/content.service';
import * as analyticsService from '../services/analytics.service';
import * as adsService from '../services/ads.service';
import * as contactService from '../services/contact.service';

const router = Router();

// Protect all admin routes
router.use(requireAdmin);

// ═══════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════

router.get('/analytics/dashboard', async (req, res) => {
    try {
        console.log('📊 Analytics dashboard request received');

        const filter = req.query.filter as string || '7d';
        const customStart = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const customEnd = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

        const analytics = await analyticsService.getDashboardAnalytics(filter, customStart, customEnd);

        // Format for frontend
        const daily = analytics.visitsOverTime?.map((day: any) => ({
            date: day.date,
            visitors: Number(day.unique_visits) || 0,
            views: Number(day.total_page_views) || 0
        })) || [];

        const topPages = analytics.topPages?.map((page: any) => ({
            path: page.path,
            title: page.page_title || page.path,
            views: Number(page.view_count) || 0,
            unique_visitors: Number(page.unique_visitors) || 0
        })) || [];

        const videoPlays = analytics.videoPlaysOverTime?.map((day: any) => ({
            date: day.date,
            plays: Number(day.total_plays) || 0,
            uniqueViewers: Number(day.unique_viewers) || 0,
            avgDuration: Number(day.avg_duration_seconds) || 0
        })) || [];

        const topVideos = analytics.topVideos?.map((video: any) => ({
            videoId: video.video_id,
            playCount: Number(video.play_count) || 0,
            uniqueViewers: Number(video.unique_viewers) || 0,
            avgDuration: Number(video.avg_duration) || 0,
            completionRate: Number(video.completion_rate) || 0
        })) || [];

        const hourlyTraffic = analytics.hourlyTraffic?.map((hour: any) => ({
            hour: Number(hour.hour),
            views: Number(hour.visit_count) || 0
        })) || [];

        const deviceStats = analytics.deviceStats?.map((device: any) => ({
            name: device.device_type,
            views: Number(device.count) || 0
        })) || [];

        res.json({
            success: true,
            data: {
                // Overview stats
                totalViews: analytics.totalPageViews || 0,
                totalVisitors: analytics.totalVisits || 0,
                totalVideoPlays: analytics.totalVideoPlays || 0,

                // Time series data
                daily,
                videoPlays,

                // Top content
                topPages,
                topVideos,

                // Distribution data
                hourlyTraffic,
                deviceStats,
                categoryInterest: analytics.categoryInterest || [],
                contentTypes: analytics.contentTypes || [],
                languages: analytics.languages || []
            }
        });
    } catch (error: any) {
        console.error('❌ Analytics Dashboard Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.stack
        });
    }
});

// ═══════════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════

router.get('/categories', async (req, res) => {
    try {
        // Include hidden categories only if ?all=true is passed
        const includeHidden = req.query.all === 'true';
        const categories = await contentService.getAllCategories(includeHidden);
        res.json({ success: true, data: categories });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/categories', async (req, res) => {
    try {
        process.stdout.write('\n📝 POST /categories received\n');
        process.stdout.write('📝 Body: ' + JSON.stringify(req.body, null, 2) + '\n');
        const category = await contentService.createCategory(req.body);
        process.stdout.write('✅ Category created successfully\n');
        res.json({ success: true, data: category });
    } catch (error: any) {
        process.stdout.write('❌ Category creation failed: ' + error.message + '\n');
        res.status(500).json({ error: error.message });
    }
});

router.put('/categories/:id', async (req, res) => {
    try {
        const category = await contentService.updateCategory(req.params.id, req.body);
        res.json({ success: true, data: category });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════════
// DEVOTIONAL CONTENT
// ═══════════════════════════════════════════════════════════════════

router.get('/content', adminController.getAllContent.bind(adminController));

router.post('/content', adminController.createContent.bind(adminController));

router.put('/content/:id', adminController.updateContent.bind(adminController));

router.delete('/content/:id', adminController.deleteContent.bind(adminController));

// ═══════════════════════════════════════════════════════════════════
// GITA SHLOK
// ═══════════════════════════════════════════════════════════════════

router.get('/gita-shlok', async (req, res) => {
    try {
        const { chapter } = req.query;
        const shloks = await contentService.getAllGitaShlok(
            chapter ? parseInt(chapter as string) : undefined
        );
        res.json({ success: true, data: shloks });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/gita-shlok', async (req, res) => {
    try {
        const shlok = await contentService.createGitaShlok(req.body);
        res.json({ success: true, data: shlok });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/gita-shlok/:id', async (req, res) => {
    try {
        const shlok = await contentService.updateGitaShlok(req.params.id, req.body);
        res.json({ success: true, data: shlok });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════════
// QUOTES
// ═══════════════════════════════════════════════════════════════════

router.get('/quotes', async (req, res) => {
    try {
        const quotes = await contentService.getAllQuotes(100);
        res.json({ success: true, data: quotes });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/quotes', async (req, res) => {
    try {
        const quote = await contentService.createQuote(req.body);
        res.json({ success: true, data: quote });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/quotes/:id', async (req, res) => {
    try {
        const quote = await contentService.updateQuote(req.params.id, req.body);
        res.json({ success: true, data: quote });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/quotes/:id', async (req, res) => {
    try {
        await contentService.deleteQuote(req.params.id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════════
// GITA SANDESH
// ═══════════════════════════════════════════════════════════════════

router.get('/gita-sandesh', async (req, res) => {
    try {
        const sandesh = await contentService.getAllGitaSandesh(100);
        res.json({ success: true, data: sandesh });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/gita-sandesh', async (req, res) => {
    try {
        const sandesh = await contentService.createGitaSandesh(req.body);
        res.json({ success: true, data: sandesh });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/gita-sandesh/:id', async (req, res) => {
    try {
        const sandesh = await contentService.updateGitaSandesh(req.params.id, req.body);
        res.json({ success: true, data: sandesh });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/gita-sandesh/:id', adminController.deleteGitaSandesh.bind(adminController));

// ═══════════════════════════════════════════════════════════════════
// WALLPAPERS
// ═══════════════════════════════════════════════════════════════════

router.get('/wallpapers', async (req, res) => {
    try {
        const wallpapers = await contentService.getAllWallpapers();
        res.json({ success: true, data: wallpapers });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/wallpapers', async (req, res) => {
    try {
        const wallpaper = await contentService.createWallpaper(req.body);
        res.json({ success: true, data: wallpaper });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/wallpapers/:id', async (req, res) => {
    try {
        await contentService.deleteWallpaper(req.params.id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════════
// VIDEOS
// ═══════════════════════════════════════════════════════════════════

router.get('/videos', async (req, res) => {
    try {
        const videos = await contentService.getAllVideos();
        res.json({ success: true, data: videos });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/videos', async (req, res) => {
    try {
        const video = await contentService.createVideo(req.body);
        res.json({ success: true, data: video });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/videos/:id', async (req, res) => {
    try {
        const video = await contentService.updateVideo(req.params.id, req.body);
        res.json({ success: true, data: video });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/videos/:id', async (req, res) => {
    try {
        await contentService.deleteVideo(req.params.id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════════
// ADS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

router.get('/ads/packages', async (req, res) => {
    try {
        const packages = await adsService.getAdPackages();
        res.json({ success: true, data: packages });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/ads', async (req, res) => {
    try {
        const ads = await adsService.getAllAds();
        res.json({ success: true, data: ads });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/ads/:id', async (req, res) => {
    try {
        const ad = await adsService.getAdById(req.params.id);
        res.json({ success: true, data: ad });
    } catch (error: any) {
        res.status(404).json({ error: 'Ad not found' });
    }
});

router.post('/ads', async (req, res) => {
    try {
        const { advertiserName, imageUrl, redirectUrl, packageId } = req.body;
        const ad = await adsService.createAd(advertiserName, imageUrl, redirectUrl, packageId);
        res.json({ success: true, data: ad });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/ads/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const ad = await adsService.updateAdStatus(req.params.id, status);
        res.json({ success: true, data: ad });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/ads/:id/performance', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date();
        start.setDate(start.getDate() - 30); // Default 30 days
        const end = endDate ? new Date(endDate as string) : new Date();

        const [impressionsOverTime, pageDistribution] = await Promise.all([
            adsService.getAdImpressionsOverTime(req.params.id, start, end),
            adsService.getAdPageDistribution(req.params.id, start, end)
        ]);

        res.json({
            success: true,
            data: {
                impressionsOverTime,
                pageDistribution
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/ads/performance/overview', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date();
        start.setDate(start.getDate() - 30);
        const end = endDate ? new Date(endDate as string) : new Date();

        const performance = await adsService.getAdPerformance(start, end);
        res.json({ success: true, data: performance });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/videos/:id', adminController.deleteVideo);

// Media
router.get('/media/signature', adminController.getCloudinarySignature);

// ═══════════════════════════════════════════════════════════════════
// CONTACT MESSAGES
// ═══════════════════════════════════════════════════════════════════

router.get('/contact-messages', async (req, res) => {
    try {
        const messages = await contactService.getAllContactMessages();
        res.json({ success: true, data: messages });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/contact-messages/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        const adminId = (req as any).adminId;

        const message = await contactService.updateContactMessageStatus(
            id,
            status,
            adminId,
            adminNotes
        );

        res.json({ success: true, data: message });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
