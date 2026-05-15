import type { NextApiRequest, NextApiResponse } from 'next';
import { sessionStore } from '@/lib/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { sessionId } = req.query;

  if (typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  if (req.method === 'GET') {
    const session = sessionStore.getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    const users = sessionStore.getUsersBySession(sessionId);

    return res.status(200).json({ ...session, users });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
