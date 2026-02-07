export interface Category {
    id: string;
    slug: string;
    name: string;
    image_url?: string;
    description?: string;
    visible: boolean;
    created_at: string;
}

export interface DevotionalContent {
    id: string;
    category_id: string;
    slug: string;
    type: 'bhajan' | 'aarti' | 'chalisa' | 'stotra' | 'path' | 'gita_shlok';
    language: 'hindi' | 'gujarati' | 'english';
    title: string;
    content: string;
    meta_title?: string;
    meta_desc?: string;
    status: 'draft' | 'published';
    created_at: string;
    updated_at: string;
}

export interface Festival {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    image_url?: string;
    video_url?: string;
    description?: string;
    active: boolean;
    created_at: string;
}

// Replaces DailyUpdate
export interface GitaSandesh {
    id: string;
    shlok: string;
    meaning: string;
    image_url?: string;
    video_url?: string;
    date: string; // YYYY-MM-DD
    created_at: string;
}

export interface Quote {
    id: string;
    text: string;
    image_url?: string;
    video_url?: string;
    date: string; // YYYY-MM-DD
    created_at: string;
}

export interface Wallpaper {
    id: string;
    name: string;
    image_url: string;
    tags?: string[];
    created_at: string;
}

export interface Video {
    id: string;
    title: string;
    video_url: string;
    thumbnail_url?: string;
    created_at: string;
}
