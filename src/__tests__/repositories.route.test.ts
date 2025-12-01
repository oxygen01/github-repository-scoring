import request from 'supertest'
import express from 'express'
import { repositoriesRouter } from '../routes/repositories.routes'
import { GitHubRepository, ApiError } from '../types'

// Mock the cache service
jest.mock('../services/cache.service', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    has: jest.fn(),
    del: jest.fn(),
    flush: jest.fn(),
  },
}))

// Mock the GitHub service
jest.mock('../services/github.service', () => ({
  githubService: {
    searchRepositories: jest.fn(),
  },
  SUPPORTED_LANGUAGES: [
    'javascript',
    'typescript',
    'python',
    'java',
    'go',
    'rust',
    'c++',
    'c#',
    'php',
    'ruby',
    'swift',
    'kotlin',
  ],
}))

import { githubService } from '../services/github.service'
import { cacheService } from '../services/cache.service'

describe('Repositories Route - /score', () => {
  let app: express.Application
  const mockGithubService = githubService as jest.Mocked<typeof githubService>
  const mockCacheService = cacheService as jest.Mocked<typeof cacheService>

  beforeEach(() => {
    // Create fresh Express app for each test
    app = express()
    app.use(express.json())
    app.use('/api/v1/repositories', repositoriesRouter)

    // Reset all mocks
    jest.clearAllMocks()

    // By default, disable cache (cache miss) for all tests
    mockCacheService.get.mockReturnValue(undefined)
    mockCacheService.set.mockReturnValue(true)
  })

  // Test data factories
  const createMockRepo = (
    overrides: Partial<GitHubRepository> = {},
  ): GitHubRepository => ({
    id: 12345,
    name: 'test-repo',
    stargazersCount: 100,
    forksCount: 20,
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  })

  const createMockRepos = (): GitHubRepository[] => [
    createMockRepo({
      id: 1,
      name: 'popular-repo',
      stargazersCount: 5000,
      forksCount: 1000,
      updatedAt: '2024-01-01T00:00:00Z', // Recent
    }),
    createMockRepo({
      id: 2,
      name: 'medium-repo',
      stargazersCount: 500,
      forksCount: 100,
      updatedAt: '2023-06-01T00:00:00Z', // Older
    }),
    createMockRepo({
      id: 3,
      name: 'small-repo',
      stargazersCount: 50,
      forksCount: 10,
      updatedAt: '2024-01-15T00:00:00Z', // Recent but small
    }),
  ]

  describe('Happy Path', () => {
    it('should return scored repositories for valid request', async () => {
      const mockRepos = createMockRepos()
      mockGithubService.searchRepositories.mockResolvedValue(mockRepos)

      const response = await request(app)
        .get('/api/v1/repositories/score')
        .query({
          language: 'javascript',
          createdAfter: '2023-01-01',
          limit: 10,
        })

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        totalCount: 3,
        popularityScoreMax: 10,
        formula: '(stars + forks * 2) * timeFactor / 7000 * 10',
        repositories: expect.any(Array),
      })

      const repos = response.body.repositories
      expect(repos).toHaveLength(3)
      expect(repos[0]).toHaveProperty('popularityScore')
      expect(repos[0].popularityScore).toBeGreaterThan(repos[1].popularityScore)
      expect(repos[1].popularityScore).toBeGreaterThan(repos[2].popularityScore)

      expect(mockGithubService.searchRepositories).toHaveBeenCalledWith({
        language: 'javascript',
        createdAfter: '2023-01-01',
        limit: 10,
        targetedSystem: 'GITHUB',
      })
    })

    it('should work with minimal required parameters', async () => {
      const mockRepos = [createMockRepo()]
      mockGithubService.searchRepositories.mockResolvedValue(mockRepos)

      const response = await request(app)
        .get('/api/v1/repositories/score')
        .query({
          language: 'python',
          createdAfter: '2023-01-01',
        })

      expect(response.status).toBe(200)
      expect(response.body.repositories).toHaveLength(1)

      // Verify the service is called with undefined limit
      // Note: The GitHub service internally defaults this to per_page: 100
      // when calling the GitHub API (see github.service.ts:86)
      expect(mockGithubService.searchRepositories).toHaveBeenCalledWith({
        language: 'python',
        createdAfter: '2023-01-01',
        limit: undefined,
        targetedSystem: 'GITHUB',
      })
      // Verify the cache key also uses 100 as the default
      expect(mockCacheService.get).toHaveBeenCalledWith(
        'repos:score:python:2023-01-01:100:GITHUB',
      )
    })
  })

  describe('Validation Errors', () => {
    it('should return 400 when language parameter is missing', async () => {
      const response = await request(app)
        .get('/api/v1/repositories/score')
        .query({
          createdAfter: '2023-01-01',
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toMatchObject({
        message: 'language parameter is required.',
        code: 'INVALID_PARAMETERS',
        status: 400,
      })
    })

    it('should return 400 when createdAfter parameter is missing', async () => {
      const response = await request(app)
        .get('/api/v1/repositories/score')
        .query({
          language: 'javascript',
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toMatchObject({
        message: 'createdAfter parameter is required.',
        code: 'INVALID_PARAMETERS',
        status: 400,
      })
    })

    it('should return 400 for unsupported language', async () => {
      const response = await request(app)
        .get('/api/v1/repositories/score')
        .query({
          language: 'cobol',
          createdAfter: '2023-01-01',
        })

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain(
        "Unsupported language 'cobol'",
      )
      expect(response.body.error.code).toBe('INVALID_PARAMETERS')
    })

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .get('/api/v1/repositories/score')
        .query({
          language: 'javascript',
          createdAfter: 'invalid-date',
        })

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain(
        'Invalid createdAfter date format',
      )
      expect(response.body.error.code).toBe('INVALID_PARAMETERS')
    })

    it('should return 400 for future date', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const futureDateString = futureDate.toISOString().split('T')[0]

      const response = await request(app)
        .get('/api/v1/repositories/score')
        .query({
          language: 'javascript',
          createdAfter: futureDateString,
        })

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain(
        'createdAfter date cannot be in the future',
      )
      expect(response.body.error.code).toBe('INVALID_PARAMETERS')
    })

    it('should return 400 for invalid limit values', async () => {
      const response1 = await request(app)
        .get('/api/v1/repositories/score')
        .query({
          language: 'javascript',
          createdAfter: '2023-01-01',
          limit: 0,
        })

      expect(response1.status).toBe(400)
      expect(response1.body.error.message).toContain('Invalid limit parameter')

      const response2 = await request(app)
        .get('/api/v1/repositories/score')
        .query({
          language: 'javascript',
          createdAfter: '2023-01-01',
          limit: 101,
        })

      expect(response2.status).toBe(400)
      expect(response2.body.error.message).toContain('Invalid limit parameter')
    })
  })

  describe('GitHub API Errors', () => {
    it('should handle GitHub rate limit error', async () => {
      const rateLimitError: ApiError = {
        message: 'GitHub API rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        status: 429,
      }
      mockGithubService.searchRepositories.mockRejectedValue(rateLimitError)

      const response = await request(app)
        .get('/api/v1/repositories/score')
        .query({
          language: 'javascript',
          createdAfter: '2023-01-01',
        })

      expect(response.status).toBe(429)
      expect(response.body.error).toMatchObject(rateLimitError)
    })

    it('should handle GitHub invalid query error', async () => {
      const invalidQueryError: ApiError = {
        message: 'Invalid search query. Please check your filters.',
        code: 'INVALID_QUERY',
        status: 400,
      }
      mockGithubService.searchRepositories.mockRejectedValue(invalidQueryError)

      const response = await request(app)
        .get('/api/v1/repositories/score')
        .query({
          language: 'javascript',
          createdAfter: '2023-01-01',
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toMatchObject(invalidQueryError)
    })

    it('should handle unexpected GitHub API errors', async () => {
      const unexpectedError = new Error('Network timeout')
      mockGithubService.searchRepositories.mockRejectedValue(unexpectedError)

      const response = await request(app)
        .get('/api/v1/repositories/score')
        .query({
          language: 'javascript',
          createdAfter: '2023-01-01',
        })

      expect(response.status).toBe(500)
      expect(response.body.error).toMatchObject({
        message: 'An unexpected error occurred while searching repositories.',
        code: 'INTERNAL_SERVER_ERROR',
        status: 500,
      })
    })
  })

  describe('Integration Test', () => {
    it('should properly integrate scoring and sorting with realistic data', async () => {
      mockGithubService.searchRepositories.mockResolvedValue(createMockRepos())

      const response = await request(app)
        .get('/api/v1/repositories/score')
        .query({
          language: 'typescript',
          createdAfter: '2022-01-01',
          limit: 10,
        })

      expect(response.status).toBe(200)
      const repos = response.body.repositories

      // Verify response metadata
      expect(response.body.totalCount).toBe(3)

      repos.forEach((repo: GitHubRepository & { popularityScore: number }) => {
        expect(repo).toHaveProperty('id')
        expect(repo).toHaveProperty('name')
        expect(repo).toHaveProperty('popularityScore')
        expect(typeof repo.popularityScore).toBe('number')
        expect(repo.popularityScore).toBeGreaterThanOrEqual(0)
        expect(repo.popularityScore).toBeLessThanOrEqual(10)
      })
    })
  })

  describe('Cache Behavior', () => {
    it('should return cached result when available', async () => {
      const mockRepos = createMockRepos()
      const cachedResponse = {
        totalCount: 3,
        popularityScoreMax: 10,
        formula: '(stars + forks * 2) * timeFactor / 7000 * 10',
        repositories: mockRepos.map(repo => ({
          ...repo,
          popularityScore: 8.5,
        })),
      }

      // Mock cache hit
      mockCacheService.get.mockReturnValue(cachedResponse)

      const response = await request(app)
        .get('/api/v1/repositories/score')
        .query({
          language: 'javascript',
          createdAfter: '2023-01-01',
          limit: 10,
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(cachedResponse)

      // Verify cache was checked with correct key
      expect(mockCacheService.get).toHaveBeenCalledWith(
        'repos:score:javascript:2023-01-01:10:GITHUB',
      )

      // Verify GitHub API was NOT called (cache hit)
      expect(mockGithubService.searchRepositories).not.toHaveBeenCalled()

      // Verify cache was NOT set again (already cached)
      expect(mockCacheService.set).not.toHaveBeenCalled()
    })

    it('should fetch from API and cache result on cache miss', async () => {
      const mockRepos = createMockRepos()
      mockGithubService.searchRepositories.mockResolvedValue(mockRepos)

      // Cache miss (already set in beforeEach)
      mockCacheService.get.mockReturnValue(undefined)

      const response = await request(app)
        .get('/api/v1/repositories/score')
        .query({
          language: 'python',
          createdAfter: '2023-06-01',
          limit: 50,
        })

      expect(response.status).toBe(200)

      // Verify cache was checked
      expect(mockCacheService.get).toHaveBeenCalledWith(
        'repos:score:python:2023-06-01:50:GITHUB',
      )

      // Verify GitHub API was called (cache miss)
      expect(mockGithubService.searchRepositories).toHaveBeenCalledWith({
        language: 'python',
        createdAfter: '2023-06-01',
        limit: 50,
        targetedSystem: 'GITHUB',
      })

      // Verify result was stored in cache
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'repos:score:python:2023-06-01:50:GITHUB',
        expect.objectContaining({
          totalCount: 3,
          popularityScoreMax: 10,
          formula: '(stars + forks * 2) * timeFactor / 7000 * 10',
          repositories: expect.any(Array),
        }),
      )
    })

    it('should use default limit in cache key when limit is not provided', async () => {
      const mockRepos = [createMockRepo()]
      mockGithubService.searchRepositories.mockResolvedValue(mockRepos)

      const response = await request(app)
        .get('/api/v1/repositories/score')
        .query({
          language: 'go',
          createdAfter: '2023-01-01',
          // No limit parameter
        })

      expect(response.status).toBe(200)

      // Verify cache key uses default limit of 100
      expect(mockCacheService.get).toHaveBeenCalledWith(
        'repos:score:go:2023-01-01:100:GITHUB',
      )

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'repos:score:go:2023-01-01:100:GITHUB',
        expect.any(Object),
      )
    })
  })
})
