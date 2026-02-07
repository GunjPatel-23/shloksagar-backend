import slugify from 'slugify';

export const generateSlug = (text: string): string => {
    return slugify(text, {
        lower: true,
        strict: true,
        locale: 'en', // default
        trim: true
    });
};

export const SEOLangKeys = {
    HINDI: 'hi',
    GUJARATI: 'gu',
    ENGLISH: 'en',
};

// Map internal content types to SEO-friendly URL segments
export const ContentTypeMap = {
    BHAJAN: 'bhajan',
    AARTI: 'aarti',
    CHALISA: 'chalisa',
    STOTRA: 'stotra',
    MANTRA: 'mantra',
    GITA_SHLOK: 'gita-shlok',
};

export const createCanonicalPath = (lang: string, category: string, slug: string) => {
    // Logic to help frontend construct canonicals if verified by backend
    return `/${lang}/${category}/${slug}`;
};
