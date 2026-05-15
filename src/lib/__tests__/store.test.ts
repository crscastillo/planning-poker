// Mock Supabase before importing store
jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
      })),
    },
  },
}))

import { sessionStore } from '@/lib/store'
import type { Session, Item, User, Vote } from '@/lib/store'
import { supabase } from '@/lib/supabase'

// Helper to create mock blob with text() method
const createMockBlob = (data: string) => ({
  text: async () => data,
})

describe('sessionStore', () => {
  const mockSessionId = 'test-session-id'
  const mockSession: Session & { users: User[] } = {
    id: mockSessionId,
    name: 'Test Session',
    createdAt: Date.now(),
    expiresAt: Date.now() + 4 * 60 * 60 * 1000,
    items: [],
    currentItemId: null,
    createdBy: 'creator-id',
    users: [],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createSession', () => {
    it('creates a new session successfully', async () => {
      const mockUpload = jest.fn().mockResolvedValue({ error: null })
      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
      })

      const session = await sessionStore.createSession(
        mockSessionId,
        'Test Session',
        'creator-id'
      )

      expect(session).toMatchObject({
        id: mockSessionId,
        name: 'Test Session',
        createdBy: 'creator-id',
        items: [],
        currentItemId: null,
        users: [],
      })
      expect(session.createdAt).toBeDefined()
      expect(session.expiresAt).toBeGreaterThan(session.createdAt)
      expect(mockUpload).toHaveBeenCalled()
    })

    it('throws error when upload fails', async () => {
      const mockUpload = jest.fn().mockResolvedValue({ 
        error: { message: 'Upload failed' } 
      })
      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
      })

      await expect(
        sessionStore.createSession(mockSessionId, 'Test Session')
      ).rejects.toThrow('Failed to create planning session')
    })
  })

  describe('getSession', () => {
    it('retrieves existing session', async () => {
      const sessionData = JSON.stringify(mockSession)
      // Create a proper mock Blob with text() method
      const mockBlob = {
        text: async () => sessionData,
      }
      const mockDownload = jest.fn().mockResolvedValue({ 
        data: mockBlob,
        error: null 
      })
      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        download: mockDownload,
      })

      const session = await sessionStore.getSession(mockSessionId)

      expect(session).toMatchObject({
        id: mockSessionId,
        name: 'Test Session',
      })
      expect(mockDownload).toHaveBeenCalledWith(`${mockSessionId}.json`)
    })

    it('returns undefined for non-existent session', async () => {
      const mockDownload = jest.fn().mockResolvedValue({ 
        data: null,
        error: { message: 'Not found' }
      })
      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        download: mockDownload,
      })

      const session = await sessionStore.getSession('non-existent')

      expect(session).toBeUndefined()
    })

    it('deletes and returns undefined for expired session', async () => {
      const expiredSession = {
        ...mockSession,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      }
      const sessionData = JSON.stringify(expiredSession)
      const mockBlob = createMockBlob(sessionData)
      const mockDownload = jest.fn().mockResolvedValue({ 
        data: mockBlob,
        error: null 
      })
      const mockRemove = jest.fn().mockResolvedValue({ error: null })
      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        download: mockDownload,
        remove: mockRemove,
      })

      const session = await sessionStore.getSession(mockSessionId)

      expect(session).toBeUndefined()
      expect(mockRemove).toHaveBeenCalledWith([`${mockSessionId}.json`])
    })
  })

  describe('addItem', () => {
    it('adds item to session', async () => {
      const sessionData = JSON.stringify(mockSession)
      const mockBlob = createMockBlob(sessionData)
      const mockDownload = jest.fn().mockResolvedValue({ 
        data: mockBlob,
        error: null 
      })
      const mockUpload = jest.fn().mockResolvedValue({ error: null })
      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        download: mockDownload,
        upload: mockUpload,
      })

      const newItem: Item = {
        id: 'item-1',
        title: 'Test Item',
        votes: [],
        revealed: false,
      }

      const success = await sessionStore.addItem(mockSessionId, newItem)

      expect(success).toBe(true)
      expect(mockUpload).toHaveBeenCalled()
    })

    it('returns false for non-existent session', async () => {
      const mockDownload = jest.fn().mockResolvedValue({ 
        data: null,
        error: { message: 'Not found' }
      })
      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        download: mockDownload,
      })

      const newItem: Item = {
        id: 'item-1',
        title: 'Test Item',
        votes: [],
        revealed: false,
      }

      const success = await sessionStore.addItem('non-existent', newItem)

      expect(success).toBe(false)
    })
  })

  describe('addVote', () => {
    it('adds vote to item', async () => {
      const sessionWithItem = {
        ...mockSession,
        items: [
          {
            id: 'item-1',
            title: 'Test Item',
            votes: [],
            revealed: false,
          },
        ],
      }
      const sessionData = JSON.stringify(sessionWithItem)
      const mockBlob = createMockBlob(sessionData)
      const mockDownload = jest.fn().mockResolvedValue({ 
        data: mockBlob,
        error: null 
      })
      const mockUpload = jest.fn().mockResolvedValue({ error: null })
      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        download: mockDownload,
        upload: mockUpload,
      })

      const vote: Vote = {
        userId: 'user-1',
        userName: 'Test User',
        value: '5',
        timestamp: Date.now(),
      }

      const success = await sessionStore.addVote(mockSessionId, 'item-1', vote)

      expect(success).toBe(true)
    })

    it('replaces existing vote from same user', async () => {
      const sessionWithItem = {
        ...mockSession,
        items: [
          {
            id: 'item-1',
            title: 'Test Item',
            votes: [
              {
                userId: 'user-1',
                userName: 'Test User',
                value: '3',
                timestamp: Date.now() - 1000,
              },
            ],
            revealed: false,
          },
        ],
      }
      const sessionData = JSON.stringify(sessionWithItem)
      const mockBlob = createMockBlob(sessionData)
      const mockDownload = jest.fn().mockResolvedValue({ 
        data: mockBlob,
        error: null 
      })
      const mockUpload = jest.fn().mockResolvedValue({ error: null })
      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        download: mockDownload,
        upload: mockUpload,
      })

      const newVote: Vote = {
        userId: 'user-1',
        userName: 'Test User',
        value: '5',
        timestamp: Date.now(),
      }

      const success = await sessionStore.addVote(mockSessionId, 'item-1', newVote)

      expect(success).toBe(true)
    })
  })

  describe('removeUser', () => {
    it('removes user and their votes', async () => {
      const sessionWithUserAndVotes = {
        ...mockSession,
        users: [
          { id: 'user-1', name: 'User 1', sessionId: mockSessionId },
          { id: 'user-2', name: 'User 2', sessionId: mockSessionId },
        ],
        items: [
          {
            id: 'item-1',
            title: 'Test Item',
            votes: [
              { userId: 'user-1', userName: 'User 1', value: '5', timestamp: Date.now() },
              { userId: 'user-2', userName: 'User 2', value: '8', timestamp: Date.now() },
            ],
            revealed: false,
          },
        ],
      }
      const sessionData = JSON.stringify(sessionWithUserAndVotes)
      const mockBlob = createMockBlob(sessionData)
      const mockDownload = jest.fn().mockResolvedValue({ 
        data: mockBlob,
        error: null 
      })
      const mockUpload = jest.fn().mockResolvedValue({ error: null })
      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        download: mockDownload,
        upload: mockUpload,
      })

      const success = await sessionStore.removeUser('user-1', mockSessionId)

      expect(success).toBe(true)
      expect(mockUpload).toHaveBeenCalled()
    })

    it('returns false for non-existent session', async () => {
      const mockDownload = jest.fn().mockResolvedValue({ 
        data: null,
        error: { message: 'Not found' }
      })
      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        download: mockDownload,
      })

      const success = await sessionStore.removeUser('user-1', 'non-existent')

      expect(success).toBe(false)
    })
  })

  describe('deleteSession', () => {
    it('deletes session successfully', async () => {
      const mockRemove = jest.fn().mockResolvedValue({ error: null })
      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        remove: mockRemove,
      })

      const success = await sessionStore.deleteSession(mockSessionId)

      expect(success).toBe(true)
      expect(mockRemove).toHaveBeenCalledWith([`${mockSessionId}.json`])
    })

    it('returns false when delete fails', async () => {
      const mockRemove = jest.fn().mockResolvedValue({ 
        error: { message: 'Delete failed' }
      })
      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        remove: mockRemove,
      })

      const success = await sessionStore.deleteSession(mockSessionId)

      expect(success).toBe(false)
    })
  })

  describe('revealVotes', () => {
    it('reveals votes for an item', async () => {
      const sessionWithItem = {
        ...mockSession,
        items: [
          {
            id: 'item-1',
            title: 'Test Item',
            votes: [
              { userId: 'user-1', userName: 'User 1', value: '5', timestamp: Date.now() },
            ],
            revealed: false,
          },
        ],
      }
      const sessionData = JSON.stringify(sessionWithItem)
      const mockBlob = createMockBlob(sessionData)
      const mockDownload = jest.fn().mockResolvedValue({ 
        data: mockBlob,
        error: null 
      })
      const mockUpload = jest.fn().mockResolvedValue({ error: null })
      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        download: mockDownload,
        upload: mockUpload,
      })

      const success = await sessionStore.revealVotes(mockSessionId, 'item-1')

      expect(success).toBe(true)
    })
  })

  describe('resetVotes', () => {
    it('resets votes and final estimate for an item', async () => {
      const sessionWithItem = {
        ...mockSession,
        items: [
          {
            id: 'item-1',
            title: 'Test Item',
            votes: [
              { userId: 'user-1', userName: 'User 1', value: '5', timestamp: Date.now() },
            ],
            revealed: true,
            finalEstimate: '5',
          },
        ],
      }
      const sessionData = JSON.stringify(sessionWithItem)
      const mockBlob = createMockBlob(sessionData)
      const mockDownload = jest.fn().mockResolvedValue({ 
        data: mockBlob,
        error: null 
      })
      const mockUpload = jest.fn().mockResolvedValue({ error: null })
      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        download: mockDownload,
        upload: mockUpload,
      })

      const success = await sessionStore.resetVotes(mockSessionId, 'item-1')

      expect(success).toBe(true)
    })
  })

  describe('setFinalEstimate', () => {
    it('sets final estimate for an item', async () => {
      const sessionWithItem = {
        ...mockSession,
        items: [
          {
            id: 'item-1',
            title: 'Test Item',
            votes: [],
            revealed: true,
          },
        ],
      }
      const sessionData = JSON.stringify(sessionWithItem)
      const mockBlob = createMockBlob(sessionData)
      const mockDownload = jest.fn().mockResolvedValue({ 
        data: mockBlob,
        error: null 
      })
      const mockUpload = jest.fn().mockResolvedValue({ error: null })
      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        download: mockDownload,
        upload: mockUpload,
      })

      const success = await sessionStore.setFinalEstimate(mockSessionId, 'item-1', '8')

      expect(success).toBe(true)
    })
  })
})
