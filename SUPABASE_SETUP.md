# Supabase Setup Guide

This guide will walk you through setting up Supabase for the Planning Poker app.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in your project details:
   - **Name**: planning-poker (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose the closest region to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (takes ~2 minutes)

## Step 2: Create the Database Table

1. In your Supabase dashboard, go to the **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy and paste the contents of `supabase-setup.sql` from this repository
4. Click "Run" or press `Cmd/Ctrl + Enter`
5. You should see "Success. No rows returned"

## Step 3: Get Your API Keys

1. Go to **Project Settings** (gear icon in left sidebar)
2. Click on **API** in the settings menu
3. You'll find two important values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (a long JWT token)

## Step 4: Configure Environment Variables

1. Open the `.env.local` file in the root of your project
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the file

## Step 5: Install Dependencies and Run

```bash
# Install the new Supabase dependency
npm install

# Start the development server
npm run dev
```

## Verify It's Working

1. Open http://localhost:3000
2. Create a new planning session
3. In Supabase dashboard, go to **Table Editor** → **sessions**
4. You should see your session stored as a JSON object!

## Database Structure

The `sessions` table has the following structure:

- **id** (TEXT): Primary key, session UUID
- **data** (JSONB): Complete session data including:
  - Session info (name, createdBy, etc.)
  - All items with votes
  - All users in the session
- **expires_at** (TIMESTAMPTZ): Automatic expiration timestamp (4 hours)
- **created_at** (TIMESTAMPTZ): When the session was created

## Automatic Cleanup

Sessions are automatically filtered out when expired. To set up automatic deletion:

### Option 1: Using pg_cron (Recommended)

1. In Supabase dashboard, go to **Database** → **Extensions**
2. Enable the **pg_cron** extension
3. Go to **SQL Editor** and run:

```sql
SELECT cron.schedule(
  'delete-expired-sessions',
  '*/15 * * * *', -- Every 15 minutes
  $$ SELECT delete_expired_sessions(); $$
);
```

### Option 2: Manual Cleanup

Run this query periodically in the SQL Editor:

```sql
SELECT delete_expired_sessions();
```

## Security Notes

- The current setup uses Row Level Security (RLS) with a permissive policy for simplicity
- For production use, consider implementing more restrictive policies
- The anon key is safe to use in client-side code
- Never expose your service_role key in client code

## Troubleshooting

### Error: "relation sessions does not exist"
- Make sure you ran the SQL setup script from `supabase-setup.sql`

### Error: "Invalid API key"
- Check that your environment variables are correct
- Restart your dev server after changing `.env.local`

### Sessions not appearing in database
- Check browser console for errors
- Verify your API keys are correctly set
- Make sure the table was created successfully

## Migration from In-Memory Storage

The new Supabase implementation maintains the same API structure as the in-memory version, so no changes are needed in the frontend. The key differences:

- **Persistence**: Sessions survive server restarts
- **Scalability**: Can handle multiple server instances
- **TTL**: Sessions still expire after 4 hours as before
- **Real-time potential**: Can be extended to use Supabase real-time subscriptions instead of polling

## Next Steps (Optional)

### Add Real-time Updates

Replace polling with Supabase real-time subscriptions:

```typescript
const subscription = supabase
  .channel('session-changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'sessions',
    filter: `id=eq.${sessionId}`
  }, (payload) => {
    // Update UI with new data
  })
  .subscribe();
```

This would eliminate the need for polling every 2 seconds!
