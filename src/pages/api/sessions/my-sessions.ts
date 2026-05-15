import type { NextApiRequest, NextApiResponse } from 'next';
import { sessionStore } from '@/lib/store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionIds } = req.body;

  if (!sessionIds || !Array.isArray(sessionIds)) {
    return res.status(400).json({ error: 'Session IDs array is required' });
  }

  try {
    const sessions = [];
    
    for (const sessionId of sessionIds) {
      const session = await sessionStore.getSession(sessionId);
      if (session) {
        sessions.push({
          id: session.id,
          name: session.name,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          itemCount: session.items.length,
          userCount: session.users.length,
        });
      }
    }

    return res.status(200).json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
}
