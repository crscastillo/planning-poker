import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          data: SessionData;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          data: SessionData;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          data?: SessionData;
          expires_at?: string;
          created_at?: string;
        };
      };
    };
  };
}

export interface SessionData {
  id: string;
  name: string;
  createdAt: number;
  expiresAt: number;
  items: ItemData[];
  currentItemId: string | null;
  createdBy?: string;
  users: UserData[];
}

export interface ItemData {
  id: string;
  title: string;
  description?: string;
  votes: VoteData[];
  revealed: boolean;
  finalEstimate?: string;
}

export interface VoteData {
  userId: string;
  userName: string;
  value: string | null;
  timestamp: number;
}

export interface UserData {
  id: string;
  name: string;
  sessionId: string;
}
