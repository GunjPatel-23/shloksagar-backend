import { Request, Response } from 'express';
import { supabase, Tables } from '../services/supabase.service';

export const publicController = {
    // Get all categories
    async getCategories(req: Request, res: Response) {
        try {
            const { data, error } = await supabase
                .from(Tables.CATEGORIES)
                .select('*')
                .eq('visible', true)
                .order('name_en', { ascending: true });

            if (error) throw error;
            res.json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // Get specific category content (list) with filters
    async getCategoryContent(req: Request, res: Response) {
        try {
            const { slug } = req.params;
            const { type, language, page = 1, limit = 20 } = req.query;

            // First get category ID
            const { data: category, error: catError } = await supabase
                .from(Tables.CATEGORIES)
                .select('*')
                .eq('slug', slug)
                .single();

            if (catError || !category) return res.status(404).json({ success: false, message: 'Category not found' });

            // Fetch content
            let query = supabase
                .from(Tables.CONTENT)
                .select('*', { count: 'exact' })
                .eq('category_id', category.id)
                .eq('status', 'published') // Only published content
                .order('created_at', { ascending: false });

            if (type) query = query.eq('content_type', type);
            // note: devotional_content stores language-specific columns (title_en/content_en). Do not filter by 'language' here.

            // Pagination
            const from = (Number(page) - 1) * Number(limit);
            const to = from + Number(limit) - 1;

            const { data, error, count } = await query.range(from, to);

            if (error) throw error;

            res.json({
                success: true,
                category,
                data,
                pagination: { page: Number(page), limit: Number(limit), total: count }
            });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // Get single content detail
    async getContentDetail(req: Request, res: Response) {
        try {
            const { contentSlug } = req.params;

            const { data, error } = await supabase
                .from(Tables.CONTENT)
                .select('*')
                .eq('slug', contentSlug)
                .eq('status', 'published')
                .single();

            if (error) return res.status(404).json({ success: false, message: 'Content not found' });

            res.json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // Daily content (Gita Sandesh)
    async getGitaSandesh(req: Request, res: Response) {
        try {
            // Optional: Filter by date or just get latest
            const { data, error } = await supabase
                .from(Tables.GITA_SANDESH)
                .select('*')
                .order('date', { ascending: false })
                .limit(1);

            if (error) throw error;
            res.json({ success: true, data: data ? data[0] : null });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // Daily Quotes
    async getQuotes(req: Request, res: Response) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const from = (Number(page) - 1) * Number(limit);
            const to = from + Number(limit) - 1;

            const { data, error, count } = await supabase
                .from(Tables.QUOTES)
                .select('*', { count: 'exact' })
                .order('date', { ascending: false })
                .range(from, to);

            if (error) throw error;
            res.json({ success: true, data, pagination: { total: count } });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // Festivals
    async getFestivals(req: Request, res: Response) {
        try {
            const { data, error } = await supabase
                .from(Tables.FESTIVALS)
                .select('*')
                .eq('active', true)
                .order('start_date', { ascending: true }); // Upcoming first? Or logical order

            if (error) throw error;
            res.json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // Wallpapers
    async getWallpapers(req: Request, res: Response) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const from = (Number(page) - 1) * Number(limit);
            const to = from + Number(limit) - 1;

            const { data, error, count } = await supabase
                .from(Tables.WALLPAPERS)
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            res.json({ success: true, data, pagination: { total: count } });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // Sitemap Data
    async getSitemapData(req: Request, res: Response) {
        try {
            const { data: categories } = await supabase.from(Tables.CATEGORIES).select('slug, created_at');
            const { data: content } = await supabase.from(Tables.CONTENT)
                .select('slug, created_at, category_id')
                .eq('status', 'published');

            res.json({ success: true, categories, content });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
};
