import { Request, Response } from 'express'
import { githubService } from '../services/github.service'
import { getScore } from '../services/scoring.service'
import { cacheService } from '../services/cache.service'
import {
  SearchFiltersSchema,
  SearchRepositoriesApiResponse,
  ApiError,
  GitHubRepository,
  GitLabRepository,
  BitbucketRepository,
} from '../types'

export const POPULARITY_SCORE_MAX = 10
export const SCORING_FORMULA = '(stars + forks * 2) * timeFactor / 7000 * 10'

const handleError = (error: unknown, res: Response): void => {
  console.error('Repository search error:', error)

  // Check if it's a known API error
  if (error && typeof error === 'object' && 'status' in error) {
    const apiError = error as ApiError
    res.status(apiError.status).json({ error: apiError })
    return
  }

  // Default error response
  res.status(500).json({
    error: {
      message: 'An unexpected error occurred while searching repositories.',
      code: 'INTERNAL_SERVER_ERROR',
      status: 500,
    },
  })
}
export const getScoredRepositories = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Validate query parameters with Zod
    const result = SearchFiltersSchema.safeParse(req.query)
    if (!result.success) {
      const firstError = result.error.issues[0]
      res.status(400).json({
        error: {
          message: `${firstError.path.join('.')}: ${firstError.message}`,
          code: 'INVALID_PARAMETERS',
          status: 400,
        },
      })
      return
    }

    const filters = result.data

    // Create cache key from filters
    const cacheKey = `repos:score:${filters.language}:${filters.createdAfter}:${filters.limit || 100}:${filters.targetedSystem}`

    // Check cache first
    const cached = cacheService.get<SearchRepositoriesApiResponse>(cacheKey)
    if (cached) {
      res.json(cached)
      return
    }
    // Cache miss - fetch from GitHub API
    let repositories: Array<
      GitHubRepository | GitLabRepository | BitbucketRepository
    > = []
    switch (filters.targetedSystem) {
      case 'GITHUB':
        repositories = await githubService.searchRepositories(filters)
        break
      case 'GITLAB':
        // Future implementation for GitLab  todo
        repositories = []
        break
      case 'BITBUCKET':
        // Future implementation for Bitbucket  todo
        repositories = []
        break
      default:
        repositories = await githubService.searchRepositories(filters)
    }

    const scoredRepositories = repositories.map(repo => ({
      id: repo.id,
      name: repo.name,
      popularityScore: getScore(repo, filters.targetedSystem),
    }))

    scoredRepositories.sort((a, b) => b.popularityScore - a.popularityScore)

    const response: SearchRepositoriesApiResponse = {
      totalCount: scoredRepositories.length,
      popularityScoreMax: POPULARITY_SCORE_MAX, // Since the simple scoring max is 10
      formula: SCORING_FORMULA,
      repositories: scoredRepositories,
    }

    // Store in cache
    cacheService.set(cacheKey, response)

    res.json(response)
  } catch (error) {
    handleError(error, res)
  }
}
