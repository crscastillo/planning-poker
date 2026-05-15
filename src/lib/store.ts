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
}

export interface User {
  id: string;
  name: string;
  sessionId: string;
}

// In-memory storage
const sessions = new Map<string, Session>();
const users = new Map<string, User>();

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(sessionId);
      // Clean up users in this session
      for (const [userId, user] of users.entries()) {
        if (user.sessionId === sessionId) {
          users.delete(userId);
        }
      }
    }
  }
}, 5 * 60 * 1000);

export const sessionStore = {
  createSession(id: string, name: string): Session {
    const now = Date.now();
    const session: Session = {
      id,
      name,
      createdAt: now,
      expiresAt: now + 4 * 60 * 60 * 1000, // 4 hours
      items: [],
      currentItemId: null,
    };
    sessions.set(id, session);
    return session;
  },

  getSession(id: string): Session | undefined {
    const session = sessions.get(id);
    if (session && session.expiresAt > Date.now()) {
      return session;
    }
    if (session) {
      sessions.delete(id);
    }
    return undefined;
  },

  updateSession(session: Session): void {
    sessions.set(session.id, session);
  },

  addItem(sessionId: string, item: Item): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    session.items.push(item);
    this.updateSession(session);
    return true;
  },

  setCurrentItem(sessionId: string, itemId: string | null): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    session.currentItemId = itemId;
    this.updateSession(session);
    return true;
  },

  addVote(sessionId: string, itemId: string, vote: Vote): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    
    const item = session.items.find(i => i.id === itemId);
    if (!item) return false;

    // Remove existing vote from this user
    item.votes = item.votes.filter(v => v.userId !== vote.userId);
    item.votes.push(vote);
    
    this.updateSession(session);
    return true;
  },

  revealVotes(sessionId: string, itemId: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    
    const item = session.items.find(i => i.id === itemId);
    if (!item) return false;

    item.revealed = true;
    this.updateSession(session);
    return true;
  },

  resetVotes(sessionId: string, itemId: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    
    const item = session.items.find(i => i.id === itemId);
    if (!item) return false;

    item.votes = [];
    item.revealed = false;
    item.finalEstimate = undefined;
    this.updateSession(session);
    return true;
  },

  setFinalEstimate(sessionId: string, itemId: string, estimate: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    
    const item = session.items.find(i => i.id === itemId);
    if (!item) return false;

    item.finalEstimate = estimate;
    this.updateSession(session);
    return true;
  },

  addUser(user: User): void {
    users.set(user.id, user);
  },

  getUser(id: string): User | undefined {
    return users.get(id);
  },

  getUsersBySession(sessionId: string): User[] {
    return Array.from(users.values()).filter(u => u.sessionId === sessionId);
  },
};
