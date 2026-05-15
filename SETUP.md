# Developer Setup Guide

This guide contains technical details for setting up, developing, and deploying the Planning Poker application.

## 📋 Prerequisites

- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- **Supabase** account (free tier works fine)
- **Vercel** account for deployment (optional)

## 🛠️ Tech Stack

- **Framework**: Next.js 14.2.3 (Pages Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4.3
- **Storage**: Supabase Storage (JSON objects)
- **Analytics**: Vercel Analytics
- **Deployment**: Vercel
- **Theme**: Custom dark/light mode with system preference detection

## 🏗️ Architecture

### Storage Strategy

The application uses **Supabase Storage** for persistence instead of a traditional database:

- Sessions are stored as JSON files in a Supabase Storage bucket named `sessions`
- Each session file: `{sessionId}.json`
- Session includes: metadata, items, votes, and participants
- JSON structure:
  ```json
  {
    "id": "session-uuid",
    "name": "Sprint 23 Planning",
    "createdAt": 1234567890,
    "expiresAt": 1234581490,
    "createdBy": "user-uuid",
    "items": [...],
    "currentItemId": "item-uuid",
    "users": [...]
  }
  ```

### Real-time Updates

- **Polling-based**: Clients fetch session data every 2 seconds
- No WebSockets or real-time database features
- Simple and reliable for small to medium teams

### Session Lifecycle

1. **Creation**: Session created with 4-hour TTL
2. **Active**: Clients poll for updates every 2 seconds
3. **Expiration**: Session automatically deleted when TTL expires
4. **Cleanup**: Expired sessions removed on access attempt

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/crscastillo/planning-poker.git
cd planning-poker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase Storage

Follow the detailed instructions in [SUPABASE_STORAGE_SETUP.md](SUPABASE_STORAGE_SETUP.md)

**Quick steps:**
1. Create a Supabase project
2. Create a bucket named `sessions`
3. Set the bucket to **public**
4. Configure RLS policies (see setup doc)

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from your Supabase project settings.

### 5. Test Your Setup

Start the development server:

```bash
npm run dev
```

Visit http://localhost:3000/api/test-supabase to verify your Supabase connection.

## 💻 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Project Structure

```
planning-poker/
├── src/
│   ├── components/          # React components
│   │   ├── ThemeToggle.tsx  # Dark/light mode toggle
│   ├── contexts/            # React contexts
│   │   └── ThemeContext.tsx # Theme state management
│   ├── lib/                 # Utilities and services
│   │   ├── store.ts         # Supabase storage operations
│   │   └── supabase.ts      # Supabase client setup
│   ├── pages/               # Next.js pages
│   │   ├── api/             # API routes
│   │   │   └── sessions/    # Session management endpoints
│   │   ├── session/         # Session page
│   │   ├── _app.tsx         # App wrapper
│   │   ├── _document.tsx    # HTML document
│   │   └── index.tsx        # Home page
│   └── styles/
│       └── globals.css      # Global styles
├── .env.local               # Environment variables (not in git)
├── tailwind.config.js       # Tailwind configuration
└── next.config.js           # Next.js configuration
```

### Key Files

- **`src/lib/store.ts`** - All Supabase Storage operations
- **`src/pages/session/[sessionId].tsx`** - Main voting interface
- **`src/contexts/ThemeContext.tsx`** - Theme management
- **`src/pages/api/sessions/`** - All API endpoints

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sessions` | POST | Create new session |
| `/api/sessions/[id]` | GET | Get session data |
| `/api/sessions/[id]/join` | POST | Join session |
| `/api/sessions/[id]/items` | POST | Add item to session |
| `/api/sessions/[id]/current` | POST | Set current item |
| `/api/sessions/[id]/items/[itemId]/vote` | POST | Submit vote |
| `/api/sessions/[id]/items/[itemId]/reveal` | POST | Reveal votes |
| `/api/sessions/[id]/items/[itemId]/reset` | POST | Reset votes |
| `/api/sessions/[id]/items/[itemId]/estimate` | POST | Set final estimate |
| `/api/sessions/[id]/kick` | POST | Remove participant |
| `/api/sessions/[id]/delete` | DELETE | Delete session |
| `/api/sessions/my-sessions` | POST | Get user's sessions |

## 🚢 Deployment

### Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables**:
   - In Vercel dashboard → Settings → Environment Variables
   - Add `NEXT_PUBLIC_SUPABASE_URL`
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Deploy**:
   - Vercel will automatically deploy on every push to main
   - Production URL: `https://your-app.vercel.app`

### Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Environment Variables for Production

Make sure to set these in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🎨 Customization

### Change Estimation Values

Edit `FIBONACCI_VALUES` in `src/pages/session/[sessionId].tsx`:

```typescript
const FIBONACCI_VALUES = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '?'];
```

### Session Expiry Time

Edit the expiry duration in `src/lib/store.ts`:

```typescript
const expiresAt = now + 4 * 60 * 60 * 1000; // 4 hours
```

### Polling Interval

Edit the interval in `src/pages/session/[sessionId].tsx`:

```typescript
const interval = setInterval(fetchSession, 2000); // 2 seconds
```

### Theme Colors

Edit Tailwind config in `tailwind.config.js` or update theme colors in components.

## 🔧 Troubleshooting

### Supabase Storage Issues

- **403 Forbidden**: Check that your bucket is set to public
- **404 Not Found**: Verify bucket name is `sessions`
- **CORS errors**: Ensure your Supabase project allows your domain

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Hydration Errors

- Usually caused by server/client mismatch
- Check that theme initialization happens client-side only
- Ensure `mounted` state is used correctly in components

## 📊 Analytics

Vercel Analytics is enabled by default. View analytics in your Vercel dashboard under the Analytics tab.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔐 Security Notes

- Session IDs are UUIDs (not guessable)
- Supabase Storage uses RLS policies
- No sensitive data stored in sessions
- Sessions auto-expire after 4 hours
- Client-side only (no user authentication)

## ⚡ Performance

- Lightweight: ~85KB initial JS bundle
- Fast page loads with Next.js optimization
- Efficient polling (only when session active)
- Mobile-optimized with responsive design

## 🐛 Known Limitations

- Sessions expire after 4 hours (by design)
- Polling-based updates (2-second delay)
- No real-time WebSocket connections
- Maximum ~50 participants per session recommended
- localStorage used for session tracking (clears on browser cache clear)

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
