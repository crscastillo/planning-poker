# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Create Supabase Project
Visit [supabase.com](https://supabase.com) → New Project

### 2. Run SQL Setup
In Supabase SQL Editor, paste and run `supabase-setup.sql`

### 3. Get API Keys
Project Settings → API → Copy:
- Project URL
- anon public key

### 4. Configure App
Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Run
```bash
npm install
npm run dev
```

Visit http://localhost:3000 🎉

## 📊 View Your Data

Supabase Dashboard → Table Editor → sessions

You'll see all sessions stored as JSON objects!

## 🔄 Enable Auto-Cleanup (Optional)

Database → Extensions → Enable `pg_cron`

Then run in SQL Editor:
```sql
SELECT cron.schedule(
  'delete-expired-sessions',
  '*/15 * * * *',
  $$ SELECT delete_expired_sessions(); $$
);
```

## 🚢 Deploy to Vercel

```bash
vercel
```

Add environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

For detailed instructions, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
