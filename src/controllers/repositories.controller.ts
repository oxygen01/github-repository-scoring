import { Request, Response } from 'express'
import { githubService, SUPPORTED_LANGUAGES } from '../services/github.service'
import { getScore } from '../services/scoring.service'
import { cacheService } from '../services/cache.service'
import {
  SearchFilters,
  SearchRepositoriesApiResponse,
  ApiError,
  Repository,
} from '../types'
import { isValidDate } from '../utils/date'
import { cleanInt } from '../utils/helpers'

export const POPULARITY_SCORE_MAX = 10
export const SCORING_FORMULA = '(stars + forks * 2) * timeFactor / 7000 * 10'

const parseSearchFilters = (
  query: Record<string, unknown>,
): Partial<SearchFilters> => {
  return {
    targetedSystem: query.targetedSystem
      ? (String(query.targetedSystem) as 'GITHUB' | 'GITLAB' | 'BITBUCKET')
      : 'GITHUB',
    language: query.language ? String(query.language) : undefined,
    createdAfter: query.createdAfter ? String(query.createdAfter) : undefined,
    limit: query.limit ? cleanInt(query.limit) : undefined,
  }
}
const validateFilters = (
  filters: Partial<SearchFilters>,
): { error?: string; validFilters?: SearchFilters } => {
  const { language, createdAfter, limit, targetedSystem } = filters

  if (!language) {
    return { error: 'language parameter is required.' }
  }

  if (!SUPPORTED_LANGUAGES.includes(language.toLowerCase())) {
    return {
      error: `Unsupported language '${language}'. Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`,
    }
  }

  if (!createdAfter) {
    return { error: 'createdAfter parameter is required.' }
  }

  if (!isValidDate(createdAfter)) {
    return {
      error:
        'Invalid createdAfter date format. Use ISO8601 format (YYYY-MM-DD).',
    }
  }

  const createdDate = new Date(createdAfter)
  const now = new Date()
  if (createdDate > now) {
    return { error: 'createdAfter date cannot be in the future.' }
  }

  if (limit !== undefined) {
    if (limit < 1 || limit > 100) {
      return {
        error: 'Invalid limit parameter. Must be a number between 1 and 100.',
      }
    }
  }

  return {
    validFilters: {
      targetedSystem: targetedSystem || 'GITHUB',
      language,
      createdAfter,
      limit,
    },
  }
}

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
    // Parse query parameters
    const parsedFilters = parseSearchFilters(req.query)

    // Validate filters
    const validation = validateFilters(parsedFilters)
    if (validation.error) {
      res.status(400).json({
        error: {
          message: validation.error,
          code: 'INVALID_PARAMETERS',
          status: 400,
        },
      })
      return
    }

    const filters = validation.validFilters as SearchFilters

    // Create cache key from filters
    const cacheKey = `repos:score:${filters.language}:${filters.createdAfter}:${filters.limit || 100}:${filters.targetedSystem}`

    // Check cache first
    const cached = cacheService.get<SearchRepositoriesApiResponse>(cacheKey)
    if (cached) {
      res.json(cached)
      return
    }
    // Cache miss - fetch from GitHub API
    let repositories: Array<Repository> = []
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
      ...repo,
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
