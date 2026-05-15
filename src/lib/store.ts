import { supabase } from './supabase';

const BUCKET_NAME = 'sessions';

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

export const sessionStore = {
  async createSession(id: string, name: string, createdBy?: string): Promise<Session> {
    const now = Date.now();
    const expiresAt = now + 4 * 60 * 60 * 1000; // 4 hours
    
    const session: Session & { users: User[] } = {
      id,
      name,
      createdAt: now,
      expiresAt,
      items: [],
      currentItemId: null,
      createdBy,
      users: [],
    };

    // Store as JSON file in Supabase Storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`${id}.json`, JSON.stringify(session), {
        contentType: 'application/json',
        upsert: false,
      });

    if (error) {
      console.error('Supabase Storage error creating session:', error);
      throw new Error(`Failed to create planning session: ${error.message}`);
    }

    return session;
  },

  async getSession(id: string): Promise<(Session & { users: User[] }) | undefined> {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(`${id}.json`);

    if (error || !data) {
      return undefined;
    }

    const text = await data.text();
    const session = JSON.parse(text) as Session & { users: User[] };
    
    // Check if session has expired
    if (session.expiresAt < Date.now()) {
      // Delete expired session
      await supabase.storage.from(BUCKET_NAME).remove([`${id}.json`]);
      return undefined;
    }

    // Ensure users array exists
    if (!session.users) {
      session.users = [];
    }

    return session;
  },

  async updateSession(session: Session & { users?: User[] }): Promise<void> {
    const sessionWithUsers = {
      ...session,
      users: session.users || [],
    };

    // Use upload with upsert to update existing file
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`${session.id}.json`, JSON.stringify(sessionWithUsers), {
        contentType: 'application/json',
        upsert: true,
      });

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

  async removeUser(userId: string, sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;

    // Remove user from users array
    session.users = session.users.filter(u => u.id !== userId);

    // Remove all votes from this user across all items
    session.items.forEach(item => {
      item.votes = item.votes.filter(v => v.userId !== userId);
    });

    await this.updateSession(session);
    return true;
  },

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([`${sessionId}.json`]);

      if (error) {
        console.error('Error deleting session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  },
};
