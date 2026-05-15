import { supabase, SessionData, ItemData, VoteData, UserData } from './supabase';

export interface Vote {
  userId: string;
  userName: string;
  value: string | null;
  timestamp: number;
}

export interface Item {
  id: string;
  title: string;
  description?: string;
  votes: Vote[];
  revealed: boolean;
  finalEstimate?: string;
}

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  expiresAt: number;
  items: Item[];
  currentItemId: string | null;
  createdBy?: string;
}

export interface User {
  id: string;
  name: string;
  sessionId: string;
}

// Helper function to clean up expired sessions on read
async function cleanupExpiredSessions() {
  try {
    const now = new Date().toISOString();
    await supabase
      .from('sessions')
      .delete()
      .lt('expires_at', now);
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
}

export const sessionStore = {
  async createSession(id: string, name: string, createdBy?: string): Promise<Session> {
    const now = Date.now();
    const expiresAt = now + 4 * 60 * 60 * 1000; // 4 hours
    
    const session: Session = {
      id,
      name,
      createdAt: now,
      expiresAt,
      items: [],
      currentItemId: null,
      createdBy,
    };

    const sessionData: SessionData = {
      ...session,
      users: [],
    };

    const { error } = await supabase
      .from('sessions')
      .insert({
        id,
        data: sessionData as any,
        expires_at: new Date(expiresAt).toISOString(),
      });

    if (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }

    return session;
  },

  async getSession(id: string): Promise<(Session & { users: User[] }) | undefined> {
    // Clean up expired sessions
    await cleanupExpiredSessions();

    const { data, error } = await supabase
      .from('sessions')
      .select('data')
      .eq('id', id)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return undefined;
    }

    const sessionData = data.data as any as SessionData;
    return sessionData as Session & { users: User[] };
  },

  async updateSession(session: Session & { users?: User[] }): Promise<void> {
    const sessionData: SessionData = {
      ...session,
      users: session.users || [],
    };

    const { error } = await supabase
      .from('sessions')
      .update({
        data: sessionData as any,
      })
      .eq('id', session.id);

    if (error) {
      console.error('Error updating session:', error);
      throw new Error('Failed to update session');
    }
  },

  async addItem(sessionId: string, item: Item): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;
    
    session.items.push(item);
    await this.updateSession(session);
    return true;
  },

  async setCurrentItem(sessionId: string, itemId: string | null): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;
    
    session.currentItemId = itemId;
    await this.updateSession(session);
    return true;
  },

  async addVote(sessionId: string, itemId: string, vote: Vote): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;
    
    const item = session.items.find(i => i.id === itemId);
    if (!item) return false;

    // Remove existing vote from this user
    item.votes = item.votes.filter(v => v.userId !== vote.userId);
    item.votes.push(vote);
    
    await this.updateSession(session);
    return true;
  },

  async revealVotes(sessionId: string, itemId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;
    
    const item = session.items.find(i => i.id === itemId);
    if (!item) return false;

    item.revealed = true;
    await this.updateSession(session);
    return true;
  },

  async resetVotes(sessionId: string, itemId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;
    
    const item = session.items.find(i => i.id === itemId);
    if (!item) return false;

    item.votes = [];
    item.revealed = false;
    item.finalEstimate = undefined;
    await this.updateSession(session);
    return true;
  },

  async setFinalEstimate(sessionId: string, itemId: string, estimate: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;
    
    const item = session.items.find(i => i.id === itemId);
    if (!item) return false;

    item.finalEstimate = estimate;
    await this.updateSession(session);
    return true;
  },

  async addUser(user: User): Promise<void> {
    const session = await this.getSession(user.sessionId);
    if (!session) throw new Error('Session not found');

    // Check if user already exists
    const existingUser = session.users.find(u => u.id === user.id);
    if (!existingUser) {
      session.users.push(user);
      await this.updateSession(session);
    }
  },

  async getUser(id: string, sessionId: string): Promise<User | undefined> {
    const session = await this.getSession(sessionId);
    if (!session) return undefined;
    
    return session.users.find(u => u.id === id);
  },

  async getUsersBySession(sessionId: string): Promise<User[]> {
    const session = await this.getSession(sessionId);
    if (!session) return [];
    
    return session.users;
  },
};
