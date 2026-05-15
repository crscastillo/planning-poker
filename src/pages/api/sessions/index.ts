import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { sessionStore } from '@/lib/store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { name, createdBy } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Session name is required' });
    }

    const sessionId = uuidv4();
    try {
      const session = await sessionStore.createSession(sessionId, name, createdBy);
      return res.status(201).json(session);
    } catch (error) {
      console.error('Error creating session:', error);
      return res.status(500).json({ 
        error: 'Failed to create session',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
