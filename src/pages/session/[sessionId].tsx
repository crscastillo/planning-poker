import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import type { Session, Item, User } from '@/lib/store';

const FIBONACCI_VALUES = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '?'];

export default function SessionPage() {
  const router = useRouter();
  const { sessionId } = router.query;

  const [session, setSession] = useState<Session & { users: User[] } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [joined, setJoined] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSession = useCallback(async () => {
    if (!sessionId || typeof sessionId !== 'string') return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data);
        setError('');
      } else {
        setError('Session not found or expired');
      }
    } catch (err) {
      console.error('Error fetching session:', err);
      setError('Failed to fetch session');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    // Check if user is already in localStorage
    const storedUser = localStorage.getItem(`user_${sessionId}`);
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setJoined(true);
    }

    fetchSession();
  }, [sessionId, fetchSession]);

  useEffect(() => {
    // Poll for updates every 2 seconds
    if (!joined) return;

    const interval = setInterval(fetchSession, 2000);
    return () => clearInterval(interval);
  }, [joined, fetchSession]);

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !sessionId) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        setJoined(true);
        localStorage.setItem(`user_${sessionId}`, JSON.stringify(data.user));
      }
    } catch (err) {
      console.error('Error joining session:', err);
      alert('Failed to join session');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !sessionId) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newItemTitle, 
          description: newItemDescription 
        }),
      });

      if (response.ok) {
        setNewItemTitle('');
        setNewItemDescription('');
        await fetchSession();
      }
    } catch (err) {
      console.error('Error adding item:', err);
      alert('Failed to add item');
    }
  };

  const handleSetCurrentItem = async (itemId: string | null) => {
    if (!sessionId) return;

    try {
      await fetch(`/api/sessions/${sessionId}/current`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentItemId: itemId }),
      });
      await fetchSession();
    } catch (err) {
      console.error('Error setting current item:', err);
    }
  };

  const handleVote = async (itemId: string, value: string) => {
    if (!currentUser || !sessionId) return;

    setSelectedVote(value);

    try {
      await fetch(`/api/sessions/${sessionId}/items/${itemId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          value,
        }),
      });
      await fetchSession();
    } catch (err) {
      console.error('Error voting:', err);
      alert('Failed to submit vote');
    }
  };

  const handleRevealVotes = async (itemId: string) => {
    if (!sessionId) return;

    try {
      await fetch(`/api/sessions/${sessionId}/items/${itemId}/reveal`, {
        method: 'POST',
      });
      await fetchSession();
    } catch (err) {
      console.error('Error revealing votes:', err);
    }
  };

  const handleResetVotes = async (itemId: string) => {
    if (!sessionId) return;

    setSelectedVote(null);

    try {
      await fetch(`/api/sessions/${sessionId}/items/${itemId}/reset`, {
        method: 'POST',
      });
      await fetchSession();
    } catch (err) {
      console.error('Error resetting votes:', err);
    }
  };

  const handleSetEstimate = async (itemId: string, estimate: string) => {
    if (!sessionId) return;

    try {
      await fetch(`/api/sessions/${sessionId}/items/${itemId}/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimate }),
      });
      await fetchSession();
    } catch (err) {
      console.error('Error setting estimate:', err);
    }
  };

  const copyInviteLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Invite link copied to clipboard!');
  };

  const getCurrentItem = (): Item | undefined => {
    return session?.items.find(item => item.id === session.currentItemId);
  };

  const currentItem = getCurrentItem();
  const userVote = currentItem?.votes.find(v => v.userId === currentUser?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">{error}</div>
          <button
            onClick={() => router.push('/')}
            className="text-purple-600 hover:text-purple-700"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  if (!joined) {
    return (
      <>
        <Head>
          <title>Join Session - Planning Poker</title>
        </Head>
        <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {session?.name}
            </h1>
            <p className="text-gray-600 mb-6">Enter your name to join</p>

            <form onSubmit={handleJoinSession} className="space-y-4">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  id="userName"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                Join Session
              </button>
            </form>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{session?.name} - Planning Poker</title>
      </Head>
      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{session?.name}</h1>
                <p className="text-sm text-gray-500">
                  Welcome, {currentUser?.name}
                </p>
              </div>
              <button
                onClick={copyInviteLink}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Copy Invite Link
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Items List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Items</h2>
                
                <form onSubmit={handleAddItem} className="mb-6 space-y-3">
                  <input
                    type="text"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder="Item title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                  <textarea
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
                  >
                    Add Item
                  </button>
                </form>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {session?.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSetCurrentItem(item.id)}
                      className={`p-3 rounded-lg cursor-pointer transition ${
                        session.currentItemId === item.id
                          ? 'bg-purple-100 border-2 border-purple-500'
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 text-sm">{item.title}</h3>
                          {item.description && (
                            <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                          )}
                        </div>
                        {item.finalEstimate && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                            {item.finalEstimate}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {session?.items.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No items yet. Add one to start!
                    </p>
                  )}
                </div>
              </div>

              {/* Participants */}
              <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Participants ({session?.users.length || 0})
                </h2>
                <div className="space-y-2">
                  {session?.users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-700">{user.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Voting Area */}
            <div className="lg:col-span-2">
              {currentItem ? (
                <div className="bg-white rounded-lg shadow-md p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentItem.title}
                    </h2>
                    {currentItem.description && (
                      <p className="text-gray-600">{currentItem.description}</p>
                    )}
                  </div>

                  {/* Voting Cards */}
                  {!currentItem.revealed && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Choose your estimate
                      </h3>
                      <div className="grid grid-cols-5 gap-4">
                        {FIBONACCI_VALUES.map((value) => (
                          <button
                            key={value}
                            onClick={() => handleVote(currentItem.id, value)}
                            className={`aspect-[3/4] rounded-xl border-2 font-bold text-2xl transition-all transform hover:scale-105 ${
                              userVote?.value === value
                                ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                            }`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Voting Status */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Votes ({currentItem.votes.length}/{session?.users.length || 0})
                      </h3>
                      <div className="space-x-2">
                        {!currentItem.revealed && currentItem.votes.length > 0 && (
                          <button
                            onClick={() => handleRevealVotes(currentItem.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                          >
                            Reveal Votes
                          </button>
                        )}
                        {currentItem.revealed && (
                          <button
                            onClick={() => handleResetVotes(currentItem.id)}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                          >
                            Reset Votes
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {currentItem.votes.map((vote) => (
                        <div
                          key={vote.userId}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 truncate">
                              {vote.userName}
                            </span>
                            {currentItem.revealed && vote.value ? (
                              <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-sm font-bold rounded">
                                {vote.value}
                              </span>
                            ) : (
                              <span className="ml-2 text-green-500">✓</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Results */}
                  {currentItem.revealed && currentItem.votes.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Results</h3>
                      
                      <div className="grid grid-cols-5 gap-2 mb-4">
                        {FIBONACCI_VALUES.map((value) => {
                          const count = currentItem.votes.filter(v => v.value === value).length;
                          const percentage = (count / currentItem.votes.length) * 100;
                          
                          return count > 0 ? (
                            <div key={value} className="text-center">
                              <div className="text-2xl font-bold text-purple-600">{value}</div>
                              <div className="text-sm text-gray-600">{count} vote{count !== 1 ? 's' : ''}</div>
                              <div className="mt-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-purple-600 h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          ) : null;
                        })}
                      </div>

                      {!currentItem.finalEstimate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Set Final Estimate
                          </label>
                          <div className="flex gap-2">
                            {FIBONACCI_VALUES.map((value) => (
                              <button
                                key={value}
                                onClick={() => handleSetEstimate(currentItem.id, value)}
                                className="px-4 py-2 bg-white border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-600 hover:text-white font-semibold transition"
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentItem.finalEstimate && (
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-1">Final Estimate</div>
                          <div className="text-4xl font-bold text-green-600">
                            {currentItem.finalEstimate}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg
                      className="mx-auto h-24 w-24"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No item selected
                  </h3>
                  <p className="text-gray-500">
                    Add an item and select it to start voting
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
