import { supabase } from './supabase.service';
import slugify from 'slugify';

// Content types
export type ContentType = 'bhajan' | 'aarti' | 'chalisa' | 'stotra';
export type Language = 'hindi' | 'gujarati' | 'english';

interface DevotionalContent {
    id?: string;
    title_en?: string;
    title_hi?: string;
    title_gu?: string;
    content_en?: string;
    content_hi?: string;
    content_gu?: string;
    category_id?: string;
    content_type: ContentType;
    slug: string;
    meta_title?: string;
    meta_description?: string;
    status?: 'draft' | 'published';
}

// Generate slug from title
export function generateSlug(title: string): string {
    // Primary slug generation using slugify
    const s = slugify(title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
    if (s && s.length > 0) return s;

    // Fallback: try to strip non-ASCII characters and slugify again
    try {
        const ascii = title.normalize ? title.normalize('NFKD').replace(/[^\x00-\x7F]/g, '') : title.replace(/[^\x00-\x7F]/g, '');
        const s2 = slugify(ascii, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
        if (s2 && s2.length > 0) return s2;
    } catch (e) {
        // ignore and fallthrough
    }

    // Last-resort fallback: timestamp-based slug to ensure uniqueness
    return `auto-${Date.now().toString(36)}`;
}

/**
 * Clean and map frontend fields to database schema
 * Removes fields that don't exist in DB and maps legacy field names
 */
function cleanDataForTable(data: any, table: string): any {
    const cleaned = { ...data };

    // Table-specific mappings FIRST (before removing fields)
    if (table === 'categories') {
        // Map: name → name_en, description → description_en
        if ('name' in cleaned && !cleaned.name_en) {
            cleaned.name_en = cleaned.name;
            delete cleaned.name;
        }
        if ('description' in cleaned && !cleaned.description_en) {
            cleaned.description_en = cleaned.description;
            delete cleaned.description;
        }
    }

    if (table === 'devotional_content') {
        // Map: title → title_en, content → content_en, category → category_id
        if ('title' in cleaned && !cleaned.title_en) {
            cleaned.title_en = cleaned.title;
            delete cleaned.title;
        }
        if ('content' in cleaned && !cleaned.content_en) {
            cleaned.content_en = cleaned.content;
            delete cleaned.content;
        }
        if ('category' in cleaned && !cleaned.category_id) {
            cleaned.category_id = cleaned.category;
            delete cleaned.category;
        }
        // Map: type → content_type (CRITICAL: do this before removing 'type')
        if ('type' in cleaned && !cleaned.content_type) {
            cleaned.content_type = cleaned.type;
            delete cleaned.type;
        }
    }

    if (table === 'gita_shlok') {
        // Map: meaning → meaning_en
        if ('meaning' in cleaned && !cleaned.meaning_en) {
            cleaned.meaning_en = cleaned.meaning;
            delete cleaned.meaning;
        }
    }

    if (table === 'quotes') {
        // Map: content → content_en, text → content_en
        if ('content' in cleaned && !cleaned.content_en) {
            cleaned.content_en = cleaned.content;
            delete cleaned.content;
        }
        if ('text' in cleaned && !cleaned.content_en) {
            cleaned.content_en = cleaned.text;
            delete cleaned.text;
        }
        // Keep image_url and video_url as-is (now supported in DB)
    }

    if (table === 'gita_sandesh') {
        // Map: content/text → content_en
        if ('content' in cleaned && !cleaned.content_en) {
            cleaned.content_en = cleaned.content;
            delete cleaned.content;
        }
        if ('text' in cleaned && !cleaned.content_en) {
            cleaned.content_en = cleaned.text;
            delete cleaned.text;
        }

        // If shlok/meaning provided, combine into content_en if not already present
        if (('shlok' in cleaned && cleaned.shlok) || ('meaning' in cleaned && cleaned.meaning)) {
            const shlok = cleaned.shlok || '';
            const meaning = cleaned.meaning || '';
            if (!cleaned.content_en) {
                cleaned.content_en = shlok + (shlok && meaning ? '\n\n' : '') + meaning;
            }
            delete cleaned.shlok;
            delete cleaned.meaning;
        }

        // New metadata fields: adhyay name/number and shlok name
        if ('adhyay_name' in cleaned && !cleaned.adhyay_name) {
            // if property exists but empty, leave as-is
        }
        if ('adhyayName' in cleaned && !cleaned.adhyay_name) {
            cleaned.adhyay_name = cleaned.adhyayName;
            delete cleaned.adhyayName;
        }
        if ('adhyay_number' in cleaned && !cleaned.adhyay_number) {
            // keep numeric
        }
        if ('adhyayNumber' in cleaned && !cleaned.adhyay_number) {
            cleaned.adhyay_number = Number(cleaned.adhyayNumber);
            delete cleaned.adhyayNumber;
        }
        if ('shlok_name' in cleaned && !cleaned.shlok_name) {
            // keep
        }
        if ('shlokName' in cleaned && !cleaned.shlok_name) {
            cleaned.shlok_name = cleaned.shlokName;
            delete cleaned.shlokName;
        }
    }

    if (table === 'videos') {
        // Map: title → title_en, description → description_en
        if ('title' in cleaned && !cleaned.title_en) {
            cleaned.title_en = cleaned.title;
            delete cleaned.title;
        }
        if ('description' in cleaned && !cleaned.description_en) {
            cleaned.description_en = cleaned.description;
            delete cleaned.description;
        }
    }

    // Global field mappings
    if ('meta_desc' in cleaned && !cleaned.meta_description) {
        cleaned.meta_description = cleaned.meta_desc;
        delete cleaned.meta_desc;
    }

    // Remove invalid fields AFTER all mappings are done
    const invalidFields = ['language', 'categoryName', 'type'];
    invalidFields.forEach(field => {
        if (field in cleaned) delete cleaned[field];
    });

    return cleaned;
}

// ═══════════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════

export async function getAllCategories(includeHidden = false) {
    let query = supabase
        .from('categories')
        .select('*');

    // Only filter by visible if not including hidden
    if (!includeHidden) {
        query = query.eq('visible', true);
    }

    const { data: categories, error } = await query.order('order', { ascending: true });

    if (error) throw error;

    // Count devotional content items for each category
    const categoriesWithCount = await Promise.all(
        (categories || []).map(async (category) => {
            const { count, error: countError } = await supabase
                .from('devotional_content')
                .select('id', { count: 'exact', head: true })
                .eq('category_id', category.id)
                .eq('status', 'published');

            return {
                ...category,
                item_count: countError ? 0 : (count || 0)
            };
        })
    );

    return categoriesWithCount;
}

export async function getCategoryBySlug(slug: string) {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) throw error;
    return data;
}

export async function createCategory(category: any) {
    console.log('🔵 createCategory called with:', category);

    // Clean and map fields
    const categoryData = cleanDataForTable(category, 'categories');

    // Generate slug if not provided
    if (!categoryData.slug) {
        const nameForSlug = categoryData.name_en || categoryData.name_hi || categoryData.name_gu;
        if (nameForSlug) {
            categoryData.slug = generateSlug(nameForSlug);
            console.log('🔄 Generated slug:', categoryData.slug);
        } else {
            throw new Error('Category must have at least one name field');
        }
    }

    console.log('📤 Inserting category data:', categoryData);

    const { data, error } = await supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single();

    if (error) {
        console.error('❌ Supabase insert error:', error);
        throw error;
    }

    console.log('✅ Category created successfully:', data);
    return data;
}

export async function updateCategory(id: string, updates: any) {
    // Clean and map fields
    const updateData = cleanDataForTable(updates, 'categories');

    const { data, error } = await supabase
        .from('categories')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ═══════════════════════════════════════════════════════════════════
// DEVOTIONAL CONTENT (Bhajan, Aarti, Chalisa, Stotra)
// ═══════════════════════════════════════════════════════════════════

export async function getAllDevotionalContent(
    contentType?: ContentType,
    categoryId?: string,
    status: 'draft' | 'published' = 'published'
) {
    let query = supabase
        .from('devotional_content')
        .select('*, category:categories(*)');

    if (contentType) {
        query = query.eq('content_type', contentType);
    }

    if (categoryId) {
        query = query.eq('category_id', categoryId);
    }

    query = query.eq('status', status).order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data;
}

export async function getDevotionalContentBySlug(slug: string) {
    const { data, error } = await supabase
        .from('devotional_content')
        .select('*, category:categories(*)')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

    if (error) throw error;
    return data;
}

export async function createDevotionalContent(content: DevotionalContent) {
    console.log('🔵 createDevotionalContent called with:', content);

    // Clean and map fields
    const contentData = cleanDataForTable(content, 'devotional_content');

    // Generate slug if not provided
    if (!contentData.slug && contentData.title_en) {
        contentData.slug = generateSlug(contentData.title_en);
    }

    // Ensure slug uniqueness: if slug already exists, append a counter
    if (contentData.slug) {
        const baseSlug = contentData.slug;
        // Fetch existing slugs that start with baseSlug
        const { data: existing, error: fetchErr } = await supabase
            .from('devotional_content')
            .select('slug')
            .ilike('slug', `${baseSlug}%`);

        if (fetchErr) {
            console.error('❌ Error checking existing slugs:', fetchErr);
            throw fetchErr;
        }

        const slugs = (existing || []).map((r: any) => r.slug);
        if (slugs.includes(baseSlug)) {
            // Find highest numeric suffix
            let max = 0;
            const re = new RegExp(`^${baseSlug}-(\\d+)$`);
            slugs.forEach((s: string) => {
                const m = s.match(re);
                if (m && m[1]) {
                    const v = parseInt(m[1], 10);
                    if (!isNaN(v) && v > max) max = v;
                }
            });
            contentData.slug = `${baseSlug}-${max + 1}`;
        }
    }

    console.log('📤 Inserting devotional content:', contentData);

    const { data, error } = await supabase
        .from('devotional_content')
        .insert(contentData)
        .select()
        .single();

    if (error) {
        // If we still hit unique constraint (race), surface clearer error
        console.error('❌ Supabase insert error:', error);
        if (error.code === '23505' || (error.details && /unique constraint/i.test(error.details))) {
            throw new Error('Slug already exists. Please try a different title or edit the slug.');
        }
        throw error;
    }

    console.log('✅ Devotional content created successfully');
    return data;
}

export async function updateDevotionalContent(id: string, updates: Partial<DevotionalContent>) {
    // Clean and map fields
    const updateData = cleanDataForTable(updates, 'devotional_content');

    const { data, error } = await supabase
        .from('devotional_content')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteDevotionalContent(id: string) {
    const { error } = await supabase
        .from('devotional_content')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ═══════════════════════════════════════════════════════════════════
// BHAGAVAD GITA SHLOK
// ═══════════════════════════════════════════════════════════════════

export async function getAllGitaShlok(chapter?: number) {
    let query = supabase
        .from('gita_shlok')
        .select('*')
        .order('chapter', { ascending: true })
        .order('verse', { ascending: true });

    if (chapter) {
        query = query.eq('chapter', chapter);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
}

export async function getGitaShlokBySlug(slug: string) {
    const { data, error } = await supabase
        .from('gita_shlok')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) throw error;
    return data;
}

export async function getGitaShlokByChapterVerse(chapter: number, verse: number) {
    const { data, error } = await supabase
        .from('gita_shlok')
        .select('*')
        .eq('chapter', chapter)
        .eq('verse', verse)
        .single();

    if (error) throw error;
    return data;
}

export async function createGitaShlok(shlok: any) {
    const shlokData = cleanDataForTable(shlok, 'gita_shlok');

    if (!shlokData.slug) {
        shlokData.slug = `chapter-${shlokData.chapter}-verse-${shlokData.verse}`;
    }

    const { data, error } = await supabase
        .from('gita_shlok')
        .insert(shlokData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateGitaShlok(id: string, updates: any) {
    const updateData = cleanDataForTable(updates, 'gita_shlok');

    const { data, error } = await supabase
        .from('gita_shlok')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ═══════════════════════════════════════════════════════════════════
// QUOTES
// ═══════════════════════════════════════════════════════════════════

export async function getTodayQuote() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('date', today)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore not found
    return data;
}

export async function getAllQuotes(limit = 30) {
    const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}

export async function createQuote(quote: any) {
    const quoteData = cleanDataForTable(quote, 'quotes');

    const { data, error } = await supabase
        .from('quotes')
        .insert(quoteData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateQuote(id: string, updates: any) {
    const updateData = cleanDataForTable(updates, 'quotes');

    const { data, error } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteQuote(id: string) {
    const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ═══════════════════════════════════════════════════════════════════
// GITA SANDESH
// ═══════════════════════════════════════════════════════════════════

export async function getTodayGitaSandesh() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from('gita_sandesh')
        .select('*')
        .eq('date', today)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore not found
    return data;
}

export async function getAllGitaSandesh(limit = 30) {
    const { data, error } = await supabase
        .from('gita_sandesh')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}

export async function createGitaSandesh(sandesh: any) {
    const sandeshData = cleanDataForTable(sandesh, 'gita_sandesh');

    const { data, error } = await supabase
        .from('gita_sandesh')
        .insert(sandeshData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateGitaSandesh(id: string, updates: any) {
    const updateData = cleanDataForTable(updates, 'gita_sandesh');

    const { data, error } = await supabase
        .from('gita_sandesh')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ═══════════════════════════════════════════════════════════════════
// WALLPAPERS
// ═══════════════════════════════════════════════════════════════════

export async function getAllWallpapers(tags?: string[]) {
    let query = supabase
        .from('wallpapers')
        .select('*')
        .order('created_at', { ascending: false });

    if (tags && tags.length > 0) {
        query = query.overlaps('tags', tags);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
}

export async function getWallpaperById(id: string) {
    const { data, error } = await supabase
        .from('wallpapers')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

export async function createWallpaper(wallpaper: any) {
    const wallpaperData = cleanDataForTable(wallpaper, 'wallpapers');

    const { data, error } = await supabase
        .from('wallpapers')
        .insert(wallpaperData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteWallpaper(id: string) {
    const { error } = await supabase
        .from('wallpapers')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function updateWallpaper(id: string, updates: any) {
    const updateData = cleanDataForTable(updates, 'wallpapers');

    const { data, error } = await supabase
        .from('wallpapers')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ═══════════════════════════════════════════════════════════════════
// VIDEOS
// ═══════════════════════════════════════════════════════════════════

export async function getAllVideos() {
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function getVideoById(id: string) {
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

export async function createVideo(video: any) {
    const videoData = cleanDataForTable(video, 'videos');

    const { data, error } = await supabase
        .from('videos')
        .insert(videoData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateVideo(id: string, updates: any) {
    const updateData = cleanDataForTable(updates, 'videos');

    const { data, error } = await supabase
        .from('videos')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteVideo(id: string) {
    const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
