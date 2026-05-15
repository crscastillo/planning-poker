import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { sessionStore, Item } from '@/lib/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { sessionId } = req.query;

  if (typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  if (req.method === 'POST') {
    const { title, description } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Item title is required' });
    }

    const item: Item = {
      id: uuidv4(),
      title,
      description,
      votes: [],
      revealed: false,
    };

    const success = sessionStore.addItem(sessionId, item);

    if (!success) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    return res.status(201).json(item);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
