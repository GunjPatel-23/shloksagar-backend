import { Router } from 'express';
import * as contentService from '../services/content.service';
import * as analyticsService from '../services/analytics.service';
import * as adsService from '../services/ads.service';
import * as authService from '../services/auth.service';
import * as contactService from '../services/contact.service';
import { requireUserAuth, optionalUserAuth } from '../middleware/auth.middleware';

const router = Router();

// ═══════════════════════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════

// Email OTP - Send
router.post('/auth/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        await authService.sendOTPEmail(email);
        res.json({ success: true, message: 'OTP sent to email' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Email OTP - Verify
router.post('/auth/verify-otp', async (req, res) => {
    try {
        const { email, code, name } = req.body;
        const user = await authService.verifyOTPAndLogin(email, code, name);

        if (!user) {
            return res.status(401).json({ error: 'Invalid or expired OTP' });
        }

        const token = authService.generateToken(user);
        res.json({ success: true, token, user });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Firebase Google Sign-In
router.post('/auth/firebase/google', async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ error: 'Firebase ID token is required' });
        }

        const user = await authService.createOrUpdateFirebaseGoogleUser(idToken);
        const token = authService.generateToken(user);

        res.json({ success: true, token, user });
    } catch (error: any) {
        res.status(401).json({ error: error.message || 'Firebase authentication failed' });
    }
});

// Firebase Phone Sign-In
router.post('/auth/firebase/phone', async (req, res) => {
    try {
        const { idToken, name } = req.body;

        if (!idToken) {
            return res.status(400).json({ error: 'Firebase ID token is required' });
        }

        const user = await authService.createOrUpdateFirebasePhoneUser(idToken, name || '');
        const token = authService.generateToken(user);

        res.json({ success: true, token, user });
    } catch (error: any) {
        res.status(401).json({ error: error.message || 'Firebase authentication failed' });
    }
});

// Legacy Google OAuth (kept for backward compatibility - can be removed later)
router.post('/auth/google', async (req, res) => {
    try {
        const { email, name, googleId } = req.body;
        const user = await authService.createOrUpdateGoogleUser(email, name, googleId);
        const token = authService.generateToken(user);
        res.json({ success: true, token, user });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════

router.get('/categories', async (req, res) => {
    try {
        const categories = await contentService.getAllCategories();
        res.json({ success: true, data: categories });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/categories/:slug', async (req, res) => {
    try {
        const category = await contentService.getCategoryBySlug(req.params.slug);
        res.json({ success: true, data: category });
    } catch (error: any) {
        res.status(404).json({ error: 'Category not found' });
    }
});

// ═══════════════════════════════════════════════════════════════════
// DEVOTIONAL CONTENT (Bhajan, Aarti, Chalisa, Stotra)
// ═══════════════════════════════════════════════════════════════════

router.get('/content/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { categoryId } = req.query;

        const content = await contentService.getAllDevotionalContent(
            type as any,
            categoryId as string
        );

        res.json({ success: true, data: content });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/content/:type/:slug', async (req, res) => {
    try {
        const content = await contentService.getDevotionalContentBySlug(req.params.slug);

        // Track content view
        const sessionId = req.headers['x-session-id'] as string;
        if (sessionId) {
            await analyticsService.trackPageView(
                sessionId,
                req.path,
                content.title_en || content.title_hi
            );
            await analyticsService.trackContentTypeInterest(sessionId, content.content_type);
            if (content.category_id) {
                await analyticsService.trackCategoryInterest(sessionId, content.category_id);
            }
        }

        res.json({ success: true, data: content });
    } catch (error: any) {
        res.status(404).json({ error: 'Content not found' });
    }
});

// ═══════════════════════════════════════════════════════════════════
// BHAGAVAD GITA SHLOK
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

router.get('/gita-shlok/:slug', async (req, res) => {
    try {
        const shlok = await contentService.getGitaShlokBySlug(req.params.slug);

        // Track view
        const sessionId = req.headers['x-session-id'] as string;
        if (sessionId) {
            await analyticsService.trackPageView(sessionId, req.path, 'Bhagavad Gita Shlok');
            await analyticsService.trackContentTypeInterest(sessionId, 'gita_shlok');
        }

        res.json({ success: true, data: shlok });
    } catch (error: any) {
        res.status(404).json({ error: 'Shlok not found' });
    }
});

router.get('/gita-shlok/chapter/:chapter/verse/:verse', async (req, res) => {
    try {
        const chapter = parseInt(req.params.chapter);
        const verse = parseInt(req.params.verse);
        const shlok = await contentService.getGitaShlokByChapterVerse(chapter, verse);
        res.json({ success: true, data: shlok });
    } catch (error: any) {
        res.status(404).json({ error: 'Shlok not found' });
    }
});

// ═══════════════════════════════════════════════════════════════════
// DAILY CONTENT (Quotes & Gita Sandesh)
// ═══════════════════════════════════════════════════════════════════

router.get('/quotes/today', async (req, res) => {
    try {
        const quote = await contentService.getTodayQuote();
        res.json({ success: true, data: quote });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/quotes', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
        const quotes = await contentService.getAllQuotes(limit);
        res.json({ success: true, data: quotes });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/gita-sandesh/today', async (req, res) => {
    try {
        const sandesh = await contentService.getTodayGitaSandesh();
        res.json({ success: true, data: sandesh });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/gita-sandesh', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
        const sandesh = await contentService.getAllGitaSandesh(limit);
        res.json({ success: true, data: sandesh });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════════
// WALLPAPERS
// ═══════════════════════════════════════════════════════════════════

router.get('/wallpapers', async (req, res) => {
    try {
        const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;
        const wallpapers = await contentService.getAllWallpapers(tags);
        res.json({ success: true, data: wallpapers });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/wallpapers/:id/download', requireUserAuth, async (req, res) => {
    try {
        const wallpaperId = req.params.id as string;
        const wallpaper = await contentService.getWallpaperById(wallpaperId);

        // Track download
        const sessionId = (req.headers['x-session-id'] as string) || '';
        await analyticsService.trackDownload(
            req.user!.userId,
            sessionId,
            'wallpaper',
            wallpaperId
        );

        res.json({ success: true, downloadUrl: wallpaper.image_url });
    } catch (error: any) {
        res.status(404).json({ error: 'Wallpaper not found' });
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

router.get('/videos/:id/download', requireUserAuth, async (req, res) => {
    try {
        const videoId = req.params.id as string;
        const video = await contentService.getVideoById(videoId);

        // Track download
        const sessionId = (req.headers['x-session-id'] as string) || '';
        await analyticsService.trackDownload(
            req.user!.userId,
            sessionId,
            'video',
            videoId
        );

        res.json({ success: true, downloadUrl: video.video_url });
    } catch (error: any) {
        res.status(404).json({ error: 'Video not found' });
    }
});

// ═══════════════════════════════════════════════════════════════════
// ADS
// ═══════════════════════════════════════════════════════════════════

router.get('/ads/get', async (req, res) => {
    try {
        const ad = await adsService.getWeightedAd();
        res.json({ success: true, data: ad });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/ads/impression', async (req, res) => {
    try {
        const { adId, sessionId, pagePath } = req.body;
        await adsService.trackAdImpression(adId, sessionId, pagePath);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/ads/click', async (req, res) => {
    try {
        const { adId, sessionId, pagePath } = req.body;
        await adsService.trackAdClick(adId, sessionId, pagePath);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════════
// ANALYTICS TRACKING
// ═══════════════════════════════════════════════════════════════════

router.post('/analytics/visit', async (req, res) => {
    try {
        const { sessionId, userAgent, ip } = req.body;
        await analyticsService.trackSiteVisit(sessionId, userAgent, ip);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/analytics/pageview', async (req, res) => {
    try {
        const { sessionId, path, pageTitle, referrer } = req.body;
        await analyticsService.trackPageView(sessionId, path, pageTitle, referrer);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/analytics/language', async (req, res) => {
    try {
        const { sessionId, language } = req.body;
        await analyticsService.trackLanguagePreference(sessionId, language);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════════
// SEO: SITEMAP & ROBOTS
// ═══════════════════════════════════════════════════════════════════

router.get('/sitemap.xml', async (req, res) => {
    try {
        const baseUrl = process.env.FRONTEND_URL || 'https://shloksagar.com';

        // Fetch all content for sitemap
        const [categories, devotionalContent, gitaShloks, quotes, wallpapers, videos] = await Promise.all([
            contentService.getAllCategories(),
            contentService.getAllDevotionalContent(),
            contentService.getAllGitaShlok(),
            contentService.getAllQuotes(),
            contentService.getAllWallpapers([]),
            contentService.getAllVideos()
        ]);

        // Generate sitemap XML
        let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
        sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Homepage
        sitemap += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

        // Static pages
        const staticPages = ['categories', 'quotes', 'gita-sandesh', 'gita-shlok', 'wallpapers', 'videos', 'festivals', 'about'];
        staticPages.forEach(page => {
            sitemap += `  <url>\n    <loc>${baseUrl}/${page}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        });

        // Categories
        categories.forEach((cat: any) => {
            sitemap += `  <url>\n    <loc>${baseUrl}/categories/${cat.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
        });

        // Devotional content
        devotionalContent.forEach((content: any) => {
            const typeMap: any = { bhajan: 'bhajans', aarti: 'aarti', chalisa: 'chalisa', stotra: 'stotra' };
            const path = typeMap[content.type] || content.type;
            sitemap += `  <url>\n    <loc>${baseUrl}/${path}/${content.slug}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
        });

        // Gita Shloks
        gitaShloks.forEach((shlok: any) => {
            sitemap += `  <url>\n    <loc>${baseUrl}/gita-shlok/${shlok.slug}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
        });

        sitemap += '</urlset>';

        res.header('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (error: any) {
        res.status(500).send('Error generating sitemap');
    }
});

router.get('/robots.txt', (req, res) => {
    const baseUrl = process.env.FRONTEND_URL || 'https://shloksagar.com';
    const robots = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/api/sitemap.xml\n`;
    res.header('Content-Type', 'text/plain');
    res.send(robots);
});

// ═══════════════════════════════════════════════════════════════════
// CONTACT FORM
// ═══════════════════════════════════════════════════════════════════

router.post('/contact', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email, and message are required' });
        }

        const contactMessage = await contactService.createContactMessage({
            name,
            email,
            phone,
            message
        });

        res.json({
            success: true,
            message: 'Thank you for contacting us! We will get back to you soon.',
            data: contactMessage
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

