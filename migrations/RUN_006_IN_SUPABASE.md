# Run Migration 006: Enhanced Analytics

## Steps to Apply This Migration

1. **Open Supabase SQL Editor**
   - Go to your Supabase Dashboard
   - Navigate to SQL Editor

2. **Copy the SQL from 006_enhanced_analytics.sql**
   - Open `006_enhanced_analytics.sql` in this folder
   - Copy ALL the content

3. **Paste and Execute**
   - Paste into Supabase SQL Editor
   - Click "Run" or press Ctrl+Enter

4. **Verify Success**
   - Check that you see success messages
   - Verify new table exists: `video_play_events`
   - Verify new functions exist in Database > Functions

## What This Migration Does

✅ Creates `video_play_events` table for tracking video plays  
✅ Adds function `get_video_play_stats()` for video analytics  
✅ Adds function `get_top_videos()` for most played videos  
✅ Adds function `get_hourly_traffic()` for traffic by hour  
✅ Adds function `get_user_agent_stats()` for device detection  
✅ Updates `get_top_pages()` to include page titles and unique visitors

## After Running Migration

Your analytics dashboard will now track:
- Video plays over time
- Top videos by play count
- Hourly traffic distribution (0-23 hours)
- Device breakdown (Mobile/Desktop/Tablet)
- Enhanced page views with unique visitor counts
