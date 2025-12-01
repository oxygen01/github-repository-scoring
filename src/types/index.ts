// Supported version control systems
export type VersionControlSystem = 'GITHUB' | 'GITLAB' | 'BITBUCKET'

// Platform-agnostic repository type
export type GitHubRepository = {
  id: number
  name: string
  stargazersCount: number
  forksCount: number
  updatedAt: string
}
export type GitLabRepository = {
  id: number
  name: string
  updatedAt: string
  [key: string]: any
}
export type BitbucketRepository = {
  id: number
  name: string
  updatedAt: string
  [key: string]: any
}

// Application-specific search filters (platform-agnostic)
export interface SearchFilters {
  targetedSystem: VersionControlSystem
  language: string // Required: Programming language filter
  createdAfter: string // Required: Creation date filter in ISO8601 format (YYYY-MM-DD)
  limit?: number // Optional: Number of results (1-100, default 30)
}

// Simplified response type for API output
export interface ScoredRepository {
  id: number
  name: string
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
