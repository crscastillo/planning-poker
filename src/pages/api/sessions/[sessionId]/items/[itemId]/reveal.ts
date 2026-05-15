import type { NextApiRequest, NextApiResponse } from 'next';
import { sessionStore } from '@/lib/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { sessionId, itemId } = req.query;

  if (typeof sessionId !== 'string' || typeof itemId !== 'string') {
    return res.status(400).json({ error: 'Invalid session or item ID' });
  }

  if (req.method === 'POST') {
    const success = sessionStore.revealVotes(sessionId, itemId);

    if (!success) {
      return res.status(404).json({ error: 'Session or item not found' });
    }

    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
