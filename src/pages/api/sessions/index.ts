import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { sessionStore } from '@/lib/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { name, createdBy } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Session name is required' });
    }

    const sessionId = uuidv4();
    const session = sessionStore.createSession(sessionId, name, createdBy);

    return res.status(201).json(session);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
