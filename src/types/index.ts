import { Endpoints } from '@octokit/types'

type SearchRepositoriesResponse =
  Endpoints['GET /search/repositories']['response']['data']

export type GithubRepository = SearchRepositoriesResponse['items'][number]

export type Repository = {
  id: GithubRepository['id']
  name: GithubRepository['name']
  full_name: GithubRepository['full_name']
  html_url: GithubRepository['html_url']
  stargazers_count: GithubRepository['stargazers_count']
  forks_count: GithubRepository['forks_count']
  updated_at: GithubRepository['updated_at']
  language: GithubRepository['language']
  created_at: GithubRepository['created_at']
}

type SearchRepositoriesParameters =
  Endpoints['GET /search/repositories']['parameters']

// Application-specific search filters that map to GitHub API parameters
export interface SearchFilters {
  language: string // Required: Programming language filter
  createdAfter: string // Required: Creation date filter in ISO8601 format (YYYY-MM-DD)
  limit?: SearchRepositoriesParameters['per_page'] // Optional: Number of results (1-100, default 30)
}

export interface ScoredRepository extends Repository {
  popularity_score: number
}

export interface SearchRepositoriesApiResponse {
  total_count: number
  popularity_score_max: number
  formula: string
  repositories: ScoredRepository[]
}

export interface ApiError {
  message: string
  code: string
  status: number
}
