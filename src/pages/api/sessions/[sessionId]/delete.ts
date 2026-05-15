import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

const BUCKET_NAME = 'sessions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.query;

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    // Delete the session JSON file from storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([`${sessionId}.json`]);

    if (error) {
      console.error('Error deleting session:', error);
      return res.status(500).json({ error: 'Failed to delete session' });
    }

    return res.status(200).json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    return res.status(500).json({ error: 'Failed to delete session' });
  }
}
