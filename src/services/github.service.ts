import { Octokit } from 'octokit'

import { SearchFilters, Repository, ApiError, GithubRepository } from '../types'
import { getConfig } from '../config/app.config'

const cleanApiError = (error: unknown): ApiError => {
  if (error && typeof error === 'object' && 'status' in error) {
    const apiError = error as { status: number; message?: string }

    switch (apiError.status) {
      case 403:
        return {
          message: 'GitHub API rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          status: 429,
        }
      case 422:
        return {
          message: 'Invalid search query. Please check your filters.',
          code: 'INVALID_QUERY',
          status: 400,
        }
      default:
        return {
          message: 'GitHub API error occurred.',
          code: 'API_ERROR',
          status: apiError.status,
        }
    }
  }

  return {
    message: 'An unexpected error occurred while searching repositories.',
    code: 'UNKNOWN_ERROR',
    status: 500,
  }
}

/**
 * GitHubService - Singleton service for interacting with GitHub API
 *
 * We use the module-level singleton pattern because:
 * - ES modules are cached by Node.js, ensuring single instantiation
 * - Cleaner than traditional singleton patterns with static methods
 * - Easy to test by mocking the exported instance
 * - No complex initialization logic needed
 * - Follows modern Node.js/TypeScript best practices
 *
 * ## Usage Example:
 * ```typescript
 * import { githubService } from '../services/github.service'
 *
 * // Use the singleton instance directly
 * const repositories = await githubService.searchRepositories(filters)
 * ```
 *
 * ## Rate Limiting:
 * - Search API endpoints have more restrictive limits than regular REST endpoints
 *
 * @see https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
 */
class GitHubService {
  private octokit: Octokit

  constructor() {
    const config = getConfig()

    // Initialize Octokit with optional authentication for higher rate limits
    // If no token is provided, requests will be unauthenticated (lower rate limits)
    this.octokit = new Octokit({
      auth: config.github.token,
      request: {
        timeout: config.github.timeout,
      },
    })
  }

  async searchRepositories(filters: SearchFilters): Promise<Repository[]> {
    try {
      const query = `language:${filters.language} created:>=${filters.createdAfter} stars:>0 fork:false`

      const response = await this.octokit.rest.search.repos({
        q: query,
        sort: 'stars', // Always sort by stars for consistent popularity ranking
        order: 'desc', // Always descending (highest stars first)
        per_page: filters.limit || 100, // GitHub API max is 100
      })

      // Map GitHub API response to our GithubRepo type
      return response.data.items.map(
        (item: GithubRepository): Repository => ({
          id: item.id,
          name: item.name,
          full_name: item.full_name,
          html_url: item.html_url,
          stargazers_count: item.stargazers_count,
          forks_count: item.forks_count,
          updated_at: item.updated_at,
          language: item.language,
          created_at: item.created_at,
        }),
      )
    } catch (error) {
      throw cleanApiError(error)
    }
  }
}

export const githubService = new GitHubService()

export const SUPPORTED_LANGUAGES: string[] = [
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
]
