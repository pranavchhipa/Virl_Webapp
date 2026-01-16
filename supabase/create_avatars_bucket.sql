# Avatar Storage Bucket Setup

## Option 1: Via Supabase Dashboard (RECOMMENDED - No SQL needed!)

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Set:
   - **Name**: `avatars`
   - **Public bucket**: ✅ ON
4. Click **Create bucket**

**That's it!** The profile upload code will work now.

---

## Option 2: Via SQL (if you prefer)

If the UI method doesn't work, run this simplified SQL:

```sql
-- This only creates the bucket, no policy changes needed
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
```

The bucket will inherit default policies which allow authenticated users to upload.

---

## Testing Auto-Workspace Creation

**Don't delete your user!** Instead:

### Method 1: Delete workspace_members entry (easier)
1. Go to **Table Editor** → `workspace_members`
2. Find the row with your user_id
3. Delete it
4. Refresh your app - you should see a new workspace created

### Method 2: Test with a new Google account
- Use a different Google account
- Or use Chrome Incognito with another account
