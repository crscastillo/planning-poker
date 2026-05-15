# Planning Poker

A simple, real-time planning poker application built with Next.js and deployed on Vercel.

## Features

- 🎯 Create planning poker sessions
- 📝 Add items to estimate
- 🔗 Share session links with your team
- 🎴 Vote using Fibonacci cards (0, 1, 2, 3, 5, 8, 13, 21, 34, ?)
- 👥 See who has voted in real-time
- 🎭 Reveal votes simultaneously
- ⏱️ Sessions automatically expire after 4 hours
- 💾 In-memory storage (no database required)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd planning-poker
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Create a Session**: Enter a session name on the home page
2. **Share the Link**: Copy the session URL and share it with your team
3. **Join**: Each participant enters their name to join
4. **Add Items**: Create items/stories that need to be estimated
5. **Select an Item**: Click on an item to make it active for voting
6. **Vote**: Each participant selects their estimate using the Fibonacci cards
7. **Reveal**: Once everyone has voted, click "Reveal Votes" to see all estimates
8. **Set Final Estimate**: Choose the final estimate for the item
9. **Repeat**: Move to the next item and continue

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/planning-poker)

Or manually:

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to deploy your application

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Storage**: In-memory (Map-based)
- **Deployment**: Vercel

## Architecture

The application uses a simple in-memory storage system:

- Sessions are stored in a Map with automatic cleanup of expired sessions
- Polling (every 2 seconds) is used to sync state across clients
- No external database or WebSocket server required
- Perfect for small teams and temporary sessions

## Limitations

- Sessions expire after 4 hours
- Polling-based updates (2-second intervals)
- Requires Supabase setup for persistence

## Future Enhancements

- WebSocket/Supabase Realtime for instant updates
- Timer for voting rounds
- Export results to CSV/JSON
- Custom card values
- Session password protection
- Historical session analytics

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
