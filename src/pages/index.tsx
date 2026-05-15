import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ThemeToggle from '@/components/ThemeToggle';

interface SessionSummary {
  id: string;
  name: string;
  createdAt: number;
  expiresAt: number;
  itemCount: number;
  userCount: number;
}

export default function Home() {
  const [sessionName, setSessionName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mySessions, setMySessions] = useState<SessionSummary[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadMySessions();
  }, []);

  const loadMySessions = async () => {
    setLoadingSessions(true);
    try {
      // Get all session IDs from localStorage
      const sessionIds: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('session_creator_')) {
          const sessionId = key.replace('session_creator_', '');
          sessionIds.push(sessionId);
        }
      }

      if (sessionIds.length === 0) {
        setMySessions([]);
        setLoadingSessions(false);
        return;
      }

      // Fetch session data
      const response = await fetch('/api/sessions/my-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionIds }),
      });

      if (response.ok) {
        const data = await response.json();
        setMySessions(data.sessions);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim() || !creatorName.trim()) return;

    setLoading(true);
    try {
      // Generate a temporary creator ID
      const creatorId = crypto.randomUUID();
      
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sessionName, createdBy: creatorId }),
      });

      if (response.ok) {
        const session = await response.json();
        // Store creator ID in localStorage
        localStorage.setItem(`session_creator_${session.id}`, creatorId);
        
        // Automatically join the session as creator
        const joinResponse = await fetch(`/api/sessions/${session.id}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: creatorName, userId: creatorId }),
        });

        if (joinResponse.ok) {
          const data = await joinResponse.json();
          // Store user info in localStorage
          localStorage.setItem(`user_${session.id}`, JSON.stringify(data.user));
          // Add small delay to ensure Supabase storage is updated
          await new Promise(resolve => setTimeout(resolve, 500));
          router.push(`/session/${session.id}`);
        } else {
          alert('Failed to join session');
        }
      } else {
        alert('Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Planning Poker</title>
        <meta name="description" content="Agile planning poker for distributed teams" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400">Planning Pocket</h1>
              <ThemeToggle />
            </div>
          </div>
        </header>
        
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Planning Poker
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Estimate your stories with your team
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* My Active Sessions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">My Active Sessions</h3>
              
              {loadingSessions ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
              ) : mySessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p>No active sessions</p>
                  <p className="text-sm mt-1">Create one to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mySessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => router.push(`/session/${session.id}`)}
                      className="w-full text-left p-3 sm:p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-gray-600 transition min-h-[60px]"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">{session.name}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                          {new Date(session.expiresAt).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{session.itemCount} items</span>
                        <span>•</span>
                        <span>{session.userCount} users</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Create New Session */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Create New Session</h3>
              
              <form onSubmit={handleCreateSession} className="space-y-4">
                <div>
                  <label htmlFor="creatorName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Name
                  </label>
                  <input
                    id="creatorName"
                    type="text"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition min-h-[44px]"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="sessionName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Session Name
                  </label>
                  <input
                    id="sessionName"
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="Sprint 24 Planning"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition min-h-[44px]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                >
                  {loading ? 'Creating...' : 'Create Session'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Sessions expire after 4 hours
                </p>
              </div>
            </div>
          </div>

          <footer className="mt-8 sm:mt-12 text-center pb-4">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Developed by <span className="font-semibold text-purple-600 dark:text-purple-400">Carlos Castillo</span>
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}
