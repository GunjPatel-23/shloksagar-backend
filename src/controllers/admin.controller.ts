import { Request, Response } from 'express';
import { supabase, Tables } from '../services/supabase.service';
import { generateSlug } from '../utils/seo.utils';
import { cloudinaryService } from '../services/cloudinary.service';
import { env } from '../config/env';
import * as contentService from '../services/content.service';

export const adminController = {
    // Normalize admin UI type values -> DB `content_type`
    _normalizeType(value?: any) {
        if (!value) return value;
        if (typeof value !== 'string') return value;
        if (value.toLowerCase() === 'bhajans') return 'bhajan';
        return value.toLowerCase();
    },
    // --- Categories ---
    async createCategory(req: Request, res: Response) {
        try {
            const { name } = req.body;
            if (!name || !name.trim()) return res.status(400).json({ success: false, error: 'name is required' });

            const data = await contentService.createCategory(req.body);
            res.status(201).json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async getCategories(req: Request, res: Response) {
        try {
            const { data, error } = await supabase
                .from(Tables.CATEGORIES)
                .select('*')
                .order('name_en');

            if (error) throw error;
            res.status(200).json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async updateCategory(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, image_url, description, visible } = req.body;

            const updates: any = { description, visible };
            if (name) {
                updates.name = name;
                updates.slug = generateSlug(name);
            }
            if (image_url) updates.image_url = image_url;

            const { data, error } = await supabase
                .from(Tables.CATEGORIES)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            res.json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async deleteCategory(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { error } = await supabase.from(Tables.CATEGORIES).delete().eq('id', id);
            if (error) throw error;
            res.json({ success: true, message: 'Deleted' });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // --- Text Content ---
    async getAllContent(req: Request, res: Response) {
        try {
            const { type, page = 1, limit = 20, search } = req.query;
            let query = supabase
                .from(Tables.CONTENT)
                .select('*, category:categories(name_en)', { count: 'exact' })
                .order('created_at', { ascending: false });

            const qType = (type && String(type).toLowerCase() === 'bhajans') ? 'bhajan' : type;
            if (qType) query = query.eq('content_type', qType);
            if (search) query = query.ilike('title_en', `%${search}%`);

            const from = (Number(page) - 1) * Number(limit);
            const to = from + Number(limit) - 1;

            const { data, error, count } = await query.range(from, to);

            if (error) throw error;
            res.json({ success: true, data, pagination: { total: count } });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async createContent(req: Request, res: Response) {
        try {
            let { type, title, slug } = req.body;
            type = (type && String(type).toLowerCase() === 'bhajans') ? 'bhajan' : type;
            if (!type) return res.status(400).json({ success: false, error: 'type (content_type) is required' });
            if (!slug && !title) return res.status(400).json({ success: false, error: 'title or slug is required' });

            // normalize request to match DB enums
            req.body.type = type;
            const data = await contentService.createDevotionalContent(req.body as any);
            res.status(201).json({ success: true, data });
        } catch (err: any) {
            // surface validation-like errors as 400 when appropriate
            const msg = err?.message || String(err);
            if (/required|missing/i.test(msg)) return res.status(400).json({ success: false, error: msg });
            res.status(500).json({ success: false, error: msg });
        }
    },

    async updateContent(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updates = req.body;
            if ('type' in updates) {
                updates.type = (updates.type && String(updates.type).toLowerCase() === 'bhajans') ? 'bhajan' : updates.type;
                if (!updates.type) return res.status(400).json({ success: false, error: 'type cannot be empty' });
            }

            const data = await contentService.updateDevotionalContent(String(id), updates as any);
            res.json({ success: true, data });
        } catch (err: any) {
            const msg = err?.message || String(err);
            if (/required|missing/i.test(msg)) return res.status(400).json({ success: false, error: msg });
            res.status(500).json({ success: false, error: msg });
        }
    },

    async deleteContent(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { error } = await supabase.from(Tables.CONTENT).delete().eq('id', id);
            if (error) throw error;
            res.json({ success: true, message: 'Deleted successfully' });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // --- Festivals ---
    async getFestivals(req: Request, res: Response) {
        try {
            const { data, error } = await supabase
                .from(Tables.FESTIVALS)
                .select('*')
                .order('start_date', { ascending: true });

            if (error) throw error;
            res.status(200).json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async createFestival(req: Request, res: Response) {
        try {
            const { name, start_date, end_date, image_url, video_url, description, active } = req.body;

            const { data, error } = await supabase
                .from(Tables.FESTIVALS)
                .insert({
                    name, start_date, end_date, image_url, video_url, description, active,
                    created_at: new Date()
                })
                .select()
                .single();

            if (error) throw error;
            res.status(201).json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async updateFestival(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, start_date, end_date, image_url, video_url, description, active } = req.body;

            const { data, error } = await supabase
                .from(Tables.FESTIVALS)
                .update({
                    name, start_date, end_date, image_url, video_url, description, active
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            res.json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async deleteFestival(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { error } = await supabase.from(Tables.FESTIVALS).delete().eq('id', id);
            if (error) throw error;
            res.json({ success: true, message: 'Deleted' });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // --- Gita Sandesh ---
    async getGitaSandesh(req: Request, res: Response) {
        try {
            const { data, error } = await supabase
                .from(Tables.GITA_SANDESH)
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            res.status(200).json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async createGitaSandesh(req: Request, res: Response) {
        try {
            const { date } = req.body;
            if (!date) return res.status(400).json({ success: false, error: 'date is required' });

            const data = await contentService.createGitaSandesh(req.body);
            res.status(201).json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async updateGitaSandesh(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const data = await contentService.updateGitaSandesh(String(id), updates);
            res.json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async deleteGitaSandesh(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { error } = await supabase.from(Tables.GITA_SANDESH).delete().eq('id', id);
            if (error) throw error;
            res.json({ success: true, message: 'Deleted' });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // --- Quotes ---
    async getQuotes(req: Request, res: Response) {
        try {
            const { data, error } = await supabase
                .from(Tables.QUOTES)
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            res.status(200).json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async createQuote(req: Request, res: Response) {
        try {
            const { date } = req.body;
            if (!date) return res.status(400).json({ success: false, error: 'date is required' });

            const data = await contentService.createQuote(req.body);
            res.status(201).json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async updateQuote(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const data = await contentService.updateQuote(String(id), updates);
            res.json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async deleteQuote(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { error } = await supabase.from(Tables.QUOTES).delete().eq('id', id);
            if (error) throw error;
            res.json({ success: true, message: 'Deleted' });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // --- Wallpapers ---
    async getWallpapers(req: Request, res: Response) {
        try {
            const { data, error } = await supabase
                .from(Tables.WALLPAPERS)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            res.status(200).json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async createWallpaper(req: Request, res: Response) {
        try {
            const { name, image_url } = req.body;
            if (!name || !image_url) return res.status(400).json({ success: false, error: 'name and image_url are required' });

            const data = await contentService.createWallpaper(req.body);
            res.status(201).json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async updateWallpaper(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const data = await contentService.updateWallpaper(String(id), updates);
            res.json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async deleteWallpaper(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { error } = await supabase.from(Tables.WALLPAPERS).delete().eq('id', id);
            if (error) throw error;
            res.json({ success: true, message: 'Deleted' });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // --- Videos ---
    async getVideos(req: Request, res: Response) {
        try {
            const { data, error } = await supabase
                .from(Tables.VIDEOS)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            res.status(200).json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async createVideo(req: Request, res: Response) {
        try {
            const { video_url } = req.body;
            if (!video_url) return res.status(400).json({ success: false, error: 'video_url is required' });

            const data = await contentService.createVideo(req.body);
            res.status(201).json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async updateVideo(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const data = await contentService.updateVideo(String(id), updates);
            res.json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async deleteVideo(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { error } = await supabase.from(Tables.VIDEOS).delete().eq('id', id);
            if (error) throw error;
            res.json({ success: true, message: 'Deleted' });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // --- Other ---
    async getCloudinarySignature(req: Request, res: Response) {
        try {
            console.log('📸 Cloudinary signature request received');
            const timestamp = Math.round((new Date()).getTime() / 1000);
            const folder = 'shloksagar';

            console.log('🔐 Generating signature for folder:', folder);
            const signature = cloudinaryService.getSignature({
                timestamp,
                folder,
            });

            console.log('✅ Signature generated successfully');
            res.json({
                success: true,
                data: {
                    signature,
                    timestamp,
                    folder,
                    cloudName: env.CLOUDINARY_CLOUD_NAME,
                    apiKey: env.CLOUDINARY_API_KEY
                }
            });
        } catch (err: any) {
            console.error('❌ Cloudinary signature error:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
};
