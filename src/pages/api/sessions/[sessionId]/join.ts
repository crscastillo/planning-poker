import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { sessionStore, User } from '@/lib/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { sessionId } = req.query;

  if (typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  if (req.method === 'POST') {
    const { name } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'User name is required' });
    }

    const session = sessionStore.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    const userId = uuidv4();
    const user: User = {
      id: userId,
      name,
      sessionId,
    };

    sessionStore.addUser(user);

    return res.status(200).json({ user, session });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
