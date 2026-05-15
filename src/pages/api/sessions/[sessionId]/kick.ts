import type { NextApiRequest, NextApiResponse } from 'next';
import { sessionStore } from '@/lib/store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { sessionId } = req.query;

  if (typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  if (req.method === 'POST') {
    const { userId, creatorId } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!creatorId || typeof creatorId !== 'string') {
      return res.status(400).json({ error: 'Creator ID is required' });
    }

    const session = await sessionStore.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    // Verify that the requester is the session creator
    if (session.createdBy !== creatorId) {
      return res.status(403).json({ error: 'Only the session creator can remove participants' });
    }

    // Prevent creator from kicking themselves
    if (userId === creatorId) {
      return res.status(400).json({ error: 'Cannot remove yourself from the session' });
    }

    try {
      const success = await sessionStore.removeUser(userId, sessionId);
      if (!success) {
        return res.status(500).json({ error: 'Failed to remove user' });
      }
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to remove user' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
