# Supabase Storage Setup

This app uses **Supabase Storage** (object storage) to store session data as JSON files, not database tables.

## Setup Steps

### 1. Create a Storage Bucket

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/ytehnycwqbduzuacrpel
2. Navigate to **Storage** in the left sidebar
3. Click **New Bucket**
4. Set the bucket name: `sessions`
5. Make it **Public** (so anonymous users can read/write sessions)
6. Click **Create Bucket**

### 2. Set Bucket Policies

After creating the bucket, click on the `sessions` bucket and go to **Policies**.

Add these policies:

#### Allow Public Upload (Create)
```sql
CREATE POLICY "Allow public upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'sessions');
```

#### Allow Public Download (Read)
```sql
CREATE POLICY "Allow public download"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'sessions');
```

#### Allow Public Update
```sql
CREATE POLICY "Allow public update"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'sessions');
```

#### Allow Public Delete
```sql
CREATE POLICY "Allow public delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'sessions');
```

### 3. Environment Variables

Make sure your `.env.local` has:

```
NEXT_PUBLIC_SUPABASE_URL=https://ytehnycwqbduzuacrpel.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. How It Works

- Each session is stored as a JSON file: `{sessionId}.json`
- Sessions expire after 4 hours
- Expired sessions are automatically deleted when accessed
- All data is stored as plain JSON objects in the bucket

### 5. Test It

Run `npm run dev` and try creating a session. You can view the JSON files in your Supabase Storage bucket.

## Cleanup

To clean up old sessions manually, go to Storage → sessions bucket and delete old `.json` files.

Automatic cleanup happens when sessions are accessed after expiration.
