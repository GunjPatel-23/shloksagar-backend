import { Router } from 'express';
import { supabaseAdmin } from '../config/supabaseAdmin';
import { cloudinary } from '../config/cloudinary';
import multer from 'multer';
import { Readable } from 'stream';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/categories', async (req, res) => {
    try {
        const { name_en, name_hi, name_gu, description_en, slug, visible, order } = req.body;

        const { data, error } = await supabaseAdmin
            .from('categories')
            .insert({
                name_en,
                name_hi,
                name_gu,
                description_en,
                slug,
                visible,
                order,
            })
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabaseAdmin
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/upload/image', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const stream = Readable.from(req.file.buffer);

        const uploadResult = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'shloksagar',
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            stream.pipe(uploadStream);
        });

        res.json({
            success: true,
            data: {
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
            },
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/upload/video', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const stream = Readable.from(req.file.buffer);

        const uploadResult = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'shloksagar/videos',
                    resource_type: 'video',
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            stream.pipe(uploadStream);
        });

        res.json({
            success: true,
            data: {
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                thumbnail: uploadResult.eager?.[0]?.secure_url || uploadResult.secure_url,
            },
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/wallpapers', async (req, res) => {
    try {
        const { name, image_url, tags } = req.body;

        const { data, error } = await supabaseAdmin
            .from('wallpapers')
            .insert({
                name,
                image_url,
                tags,
            })
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/videos', async (req, res) => {
    try {
        const { title_en, title_hi, title_gu, video_url, thumbnail_url, description_en } = req.body;

        const { data, error } = await supabaseAdmin
            .from('videos')
            .insert({
                title_en,
                title_hi,
                title_gu,
                video_url,
                thumbnail_url,
                description_en,
            })
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/devotional-content', async (req, res) => {
    try {
        const { title_en, content_en, category_id, content_type, slug, status } = req.body;

        const { data, error } = await supabaseAdmin
            .from('devotional_content')
            .insert({
                title_en,
                content_en,
                category_id,
                content_type,
                slug,
                status,
            })
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
