import { Router } from 'express';
import { supabasePublic } from '../config/supabasePublic';

const router = Router();

router.get('/categories', async (req, res) => {
    try {
        const { data, error } = await supabasePublic
            .from('categories')
            .select('*')
            .eq('visible', true)
            .order('order', { ascending: true });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/devotional-content', async (req, res) => {
    try {
        const { type, category_id } = req.query;

        let query = supabasePublic
            .from('devotional_content')
            .select('*')
            .eq('status', 'published');

        if (type) {
            query = query.eq('content_type', type);
        }

        if (category_id) {
            query = query.eq('category_id', category_id);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/gita-shlok', async (req, res) => {
    try {
        const { chapter, verse } = req.query;

        let query = supabasePublic.from('gita_shlok').select('*');

        if (chapter) {
            query = query.eq('chapter', Number(chapter));
        }

        if (verse) {
            query = query.eq('verse', Number(verse));
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/daily/gita-sandesh', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabasePublic
            .from('gita_sandesh')
            .select('*')
            .eq('date', today)
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/daily/quote', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabasePublic
            .from('quotes')
            .select('*')
            .eq('date', today)
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/wallpapers', async (req, res) => {
    try {
        const { data, error } = await supabasePublic
            .from('wallpapers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/videos', async (req, res) => {
    try {
        const { data, error } = await supabasePublic
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/festivals', async (req, res) => {
    try {
        const { data, error } = await supabasePublic
            .from('festivals')
            .select('*')
            .eq('active', true)
            .order('start_date', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
