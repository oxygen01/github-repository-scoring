import { Endpoints } from '@octokit/types'

type SearchRepositoriesResponse =
  Endpoints['GET /search/repositories']['response']['data']

export type GithubRepository = SearchRepositoriesResponse['items'][number]

export type Repository = {
  id: GithubRepository['id']
  name: GithubRepository['name']
  fullName: GithubRepository['full_name']
  htmlUrl: string
  stargazersCount: GithubRepository['stargazers_count']
  forksCount: GithubRepository['forks_count']
  updatedAt: GithubRepository['updated_at']
  language: GithubRepository['language']
  createdAt: GithubRepository['created_at']
}

type SearchRepositoriesParameters =
  Endpoints['GET /search/repositories']['parameters']

// Application-specific search filters that map to GitHub API parameters
export interface SearchFilters {
  targetedSystem: 'GITHUB' | 'GITLAB' | 'BITBUCKET'
  language: string // Required: Programming language filter
  createdAfter: string // Required: Creation date filter in ISO8601 format (YYYY-MM-DD)
  limit?: SearchRepositoriesParameters['per_page'] // Optional: Number of results (1-100, default 30)
}

export interface ScoredRepository extends Repository {
  popularityScore: number
}

export interface SearchRepositoriesApiResponse {
  totalCount: number
  popularityScoreMax: number
  formula: string
  repositories: ScoredRepository[]
}

export interface ApiError {
  message: string
  code: string
  status: number
}
