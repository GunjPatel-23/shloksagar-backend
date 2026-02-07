# Backend Implementation Plan

## 1. Database Schema Alignment (Supabase Tables)
The backend must support the exact data models used by the Admin Frontend.

### `categories`
- `id` (uuid)
- `name` (text) - used as primary display name
- `slug` (text)
- `image` (text)
- `created_at` (timestamptz)

### `devotional_content` (Text Content)
- `id` (uuid)
- `title` (text)
- `slug` (text)
- `content` (text)
- `category_id` (uuid) - foreign key
- `language` (text) - 'hindi', 'gujarati', 'english'
- `type` (text) - 'bhajan', 'aarti', 'chalisa', 'stotra'
- `meta_title` (text)
- `meta_desc` (text)
- `status` (text) - 'draft', 'published'
- `created_at` (timestamptz)

### `festivals`
- `id` (uuid)
- `name` (text)
- `start_date` (date)
- `end_date` (date)
- `image_url` (text)
- `video_url` (text)
- `description` (text)
- `active` (boolean)
- `created_at` (timestamptz)

### `gita_sandesh`
- `id` (uuid)
- `shlok` (text)
- `meaning` (text)
- `image_url` (text)
- `video_url` (text)
- `date` (date)
- `created_at` (timestamptz)

### `quotes`
- `id` (uuid)
- `text` (text)
- `image_url` (text)
- `video_url` (text)
- `date` (date)
- `created_at` (timestamptz)

### `wallpapers`
- `id` (uuid)
- `name` (text)
- `image_url` (text)
- `tags` (text[])
- `created_at` (timestamptz)

### `videos`
- `id` (uuid)
- `title` (text)
- `video_url` (text)
- `thumbnail_url` (text)
- `created_at` (timestamptz)

## 2. Code Changes

### `src/services/supabase.service.ts`
- Export new table names constant.

### `src/types/index.ts`
- Update interfaces to match the new schema exactly.

### `src/controllers/admin.controller.ts`
- Add CRUD methods for all new resources.

### `src/controllers/public.controller.ts`
- Add read-only methods for all resources.
- Ensure `getCategoryContent` supports language filtering.

### `src/routes/*`
- Update routes.
