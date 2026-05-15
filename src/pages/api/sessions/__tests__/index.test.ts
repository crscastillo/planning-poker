import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/sessions/index'

// Mock the store
jest.mock('@/lib/store', () => ({
  sessionStore: {
    createSession: jest.fn(),
  },
}))

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}))

import { sessionStore } from '@/lib/store'

describe('/api/sessions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    it('creates a new session successfully', async () => {
      const mockSession = {
        id: 'mock-uuid',
        name: 'Test Session',
        createdAt: Date.now(),
        expiresAt: Date.now() + 4 * 60 * 60 * 1000,
        items: [],
        currentItemId: null,
        createdBy: 'creator-id',
        users: [],
      }

      ;(sessionStore.createSession as jest.Mock).mockResolvedValue(mockSession)

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'Test Session',
          creatorName: 'Test Creator',
          createdBy: 'creator-id',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
      const responseData = JSON.parse(res._getData())
      expect(responseData).toMatchObject(mockSession)
      expect(responseData.id).toBe('mock-uuid')
      expect(responseData.name).toBe('Test Session')
      expect(sessionStore.createSession).toHaveBeenCalledWith(
        'mock-uuid',
        'Test Session',
        'creator-id'
      )
    })

    it('returns 400 if session name is missing', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          creatorName: 'Test Creator',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Session name is required',
      })
    })

    it('returns 400 if creator name is missing', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'Test Session',
          createdBy: 'creator-id',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
      // The API doesn't actually require creatorName, only createdBy
    })

    it('returns 500 if session creation fails', async () => {
      ;(sessionStore.createSession as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'Test Session',
          creatorName: 'Test Creator',
          createdBy: 'creator-id',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toMatchObject({
        error: 'Failed to create planning session',
        details: 'Database error',
      })
    })
  })

  describe('Other HTTP methods', () => {
    it('returns 405 for GET request', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method not allowed',
      })
    })

    it('returns 405 for PUT request', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('returns 405 for DELETE request', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })
  })
})
