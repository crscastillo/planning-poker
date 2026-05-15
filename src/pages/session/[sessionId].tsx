import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import type { Session, Item, User } from '@/lib/store';
import ThemeToggle from '@/components/ThemeToggle';

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
  const [isCreator, setIsCreator] = useState(false);

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
    
    // Force another fetch after 1 second to ensure we have fresh data
    // This helps with storage consistency after user joins
    const timeout = setTimeout(() => {
      fetchSession();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [sessionId, fetchSession]);

  useEffect(() => {
    // Check if user is the creator
    if (!session) return;
    const creatorId = localStorage.getItem(`session_creator_${sessionId}`);
    if (creatorId && session.createdBy === creatorId) {
      setIsCreator(true);
    }
  }, [session, sessionId]);

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
      const creatorId = localStorage.getItem(`session_creator_${sessionId}`);
      
      const response = await fetch(`/api/sessions/${sessionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newItemTitle, 
          description: newItemDescription,
          creatorId
        }),
      });

      if (response.ok) {
        setNewItemTitle('');
        setNewItemDescription('');
        await fetchSession();
      } else if (response.status === 403) {
        alert('Only the session creator can add items');
      } else {
        alert('Failed to add item');
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

  const deleteSession = async () => {
    if (!sessionId || !isCreator) return;

    const confirmed = confirm(
      'Are you sure you want to delete this session? This action cannot be undone and all data will be permanently erased.'
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Session deleted successfully');
        router.push('/');
      } else {
        alert('Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session');
    }
  };

  const getCurrentItem = (): Item | undefined => {
    return session?.items.find(item => item.id === session.currentItemId);
  };

  const currentItem = getCurrentItem();
  const userVote = currentItem?.votes.find(v => v.userId === currentUser?.id);

  // Calculate suggested estimate based on votes (mode - most common vote)
  const getSuggestedEstimate = (item: Item): string | null => {
    if (!item.revealed || item.votes.length === 0) return null;
    
    // Filter out '?' votes for calculation
    const numericVotes = item.votes
      .filter(v => v.value && v.value !== '?')
      .map(v => v.value!);
    
    if (numericVotes.length === 0) return null;

    // Find mode (most common vote)
    const voteCounts = new Map<string, number>();
    numericVotes.forEach(vote => {
      voteCounts.set(vote, (voteCounts.get(vote) || 0) + 1);
    });

    let maxCount = 0;
    let mode = '';
    voteCounts.forEach((count, value) => {
      if (count > maxCount) {
        maxCount = count;
        mode = value;
      }
    });

    return mode;
  };

  const suggestedEstimate = currentItem ? getSuggestedEstimate(currentItem) : null;

  // Format expiry time
  const getExpiryTime = (): string => {
    if (!session) return '';
    const expiryDate = new Date(session.expiresAt);
    return expiryDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 dark:text-red-400 mb-4">{error}</div>
          <button
            onClick={() => router.push('/')}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
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
        <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400">Planning Pocket</h1>
              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle />
                <button
                  onClick={() => router.push('/')}
                  className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1 transition p-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Home
                </button>
              </div>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center p-3 sm:p-4 min-h-[calc(100vh-64px)]">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {session?.name}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">Enter your name to join</p>

            <form onSubmit={handleJoinSession} className="space-y-4">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Name
                </label>
                <input
                  id="userName"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition min-h-[44px]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 min-h-[48px]"
              >
                Join Session
              </button>
            </form>
          </div>
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
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400">Planning Pocket</h1>
              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle />
                <button
                  onClick={() => router.push('/')}
                  className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1 transition p-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Home
                </button>
              </div>
            </div>
          </div>
        </header>
        {/* Session Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{session?.name}</h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Welcome, {currentUser?.name}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={copyInviteLink}
                  className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap min-h-[44px]"
                >
                  <span className="hidden sm:inline">Copy Invite Link</span>
                  <span className="sm:hidden">Invite</span>
                </button>
                {isCreator && (
                  <button
                    onClick={deleteSession}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1 sm:gap-2 min-h-[44px]"
                    title="Delete session"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="hidden sm:inline">Delete Session</span>
                    <span className="sm:hidden">Delete</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Session Info Banner */}
        <div className="bg-purple-50 dark:bg-gray-700 border-b border-purple-200 dark:border-gray-600">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Planning session expires at <span className="font-semibold text-purple-700 dark:text-purple-300">{getExpiryTime()}</span></span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Column - Items List */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Items</h2>
                
                {isCreator && (
                  <form onSubmit={handleAddItem} className="mb-4 sm:mb-6 space-y-3">
                    <input
                      type="text"
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                      placeholder="Item title"
                      className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none min-h-[44px]"
                    />
                    <textarea
                      value={newItemDescription}
                      onChange={(e) => setNewItemDescription(e.target.value)}
                      placeholder="Description (optional)"
                      rows={2}
                      className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                    <button
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white px-4 py-3 rounded-md text-sm font-medium transition min-h-[44px]"
                    >
                      Add Item
                    </button>
                  </form>
                )}

                {!isCreator && session?.items.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 mb-6">
                    Waiting for session creator to add items...
                  </p>
                )}

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {session?.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => isCreator && handleSetCurrentItem(item.id)}
                      className={`p-3 rounded-lg transition ${
                        isCreator ? 'cursor-pointer' : 'cursor-default'
                      } ${
                        session.currentItemId === item.id
                          ? 'bg-purple-100 dark:bg-purple-900 border-2 border-purple-500 dark:border-purple-400'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{item.title}</h3>
                          {item.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                          )}
                        </div>
                        {item.finalEstimate && (
                          <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-semibold rounded">
                            {item.finalEstimate}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {session?.items.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No items yet. Add one to start!
                    </p>
                  )}
                </div>
              </div>

              {/* Participants */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mt-4 sm:mt-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Participants ({session?.users.length || 0})
                </h2>
                <div className="space-y-2">
                  {session?.users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-500 dark:bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{user.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Voting Area */}
            <div className="lg:col-span-2">
              {currentItem ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {currentItem.title}
                    </h2>
                    {currentItem.description && (
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{currentItem.description}</p>
                    )}
                  </div>

                  {/* Voting Cards */}
                  {!currentItem.revealed && (
                    <div className="mb-6 sm:mb-8">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4">
                        Choose your estimate
                      </h3>
                      <div className="grid grid-cols-5 sm:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                        {FIBONACCI_VALUES.map((value) => (
                          <button
                            key={value}
                            onClick={() => handleVote(currentItem.id, value)}
                            className={`aspect-[3/4] rounded-lg sm:rounded-xl border-2 font-bold text-xl sm:text-2xl transition-all transform active:scale-95 sm:hover:scale-105 min-h-[60px] ${
                              userVote?.value === value
                                ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                            }`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Voting Status */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
                        Votes ({currentItem.votes.length}/{session?.users.length || 0})
                      </h3>
                      {isCreator && (
                        <div className="flex gap-2">
                          {!currentItem.revealed && currentItem.votes.length > 0 && (
                            <button
                              onClick={() => handleRevealVotes(currentItem.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition min-h-[44px] flex-1 sm:flex-initial"
                            >
                              Reveal Votes
                            </button>
                          )}
                          {currentItem.revealed && (
                            <button
                              onClick={() => handleResetVotes(currentItem.id)}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition min-h-[44px] flex-1 sm:flex-initial"
                            >
                              Reset Votes
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {currentItem.votes.map((vote) => (
                        <div
                          key={vote.userId}
                          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                              {vote.userName}
                            </span>
                            {currentItem.revealed && vote.value ? (
                              <span className="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm font-bold rounded">
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
                    <div className="bg-purple-50 dark:bg-gray-700 rounded-lg p-6 border border-purple-200 dark:border-gray-600">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Results</h3>
                        {suggestedEstimate && (
                          <div className="text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Suggested: </span>
                            <span className="px-3 py-1 bg-purple-600 dark:bg-purple-500 text-white font-bold rounded-lg">
                              {suggestedEstimate}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-5 gap-2 mb-4">
                        {FIBONACCI_VALUES.map((value) => {
                          const count = currentItem.votes.filter(v => v.value === value).length;
                          const percentage = (count / currentItem.votes.length) * 100;
                          
                          return count > 0 ? (
                            <div key={value} className="text-center">
                              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{value}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{count} vote{count !== 1 ? 's' : ''}</div>
                              <div className="mt-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                <div 
                                  className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          ) : null;
                        })}
                      </div>

                      {!currentItem.finalEstimate && isCreator && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Set Final Estimate
                          </label>
                          <div className="grid grid-cols-5 sm:flex gap-2">
                            {FIBONACCI_VALUES.map((value) => (
                              <button
                                key={value}
                                onClick={() => handleSetEstimate(currentItem.id, value)}
                                className="px-3 sm:px-4 py-2 bg-white dark:bg-gray-600 border-2 border-purple-300 dark:border-purple-500 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-600 hover:text-white dark:hover:bg-purple-500 font-semibold transition min-h-[44px]"
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentItem.finalEstimate && (
                        <div className="text-center">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Final Estimate</div>
                          <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                            {currentItem.finalEstimate}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 sm:p-12 text-center">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
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
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    No item selected
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Add an item and select it to start voting
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <footer className="mt-8 text-center pb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Developed by <span className="font-semibold text-purple-600 dark:text-purple-400">Carlos Castillo</span>
          </p>
        </footer>
      </main>
    </>
  );
}
