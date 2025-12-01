import { z } from 'zod/v4'

// Supported version control systems
export const VersionControlSystemSchema = z.enum([
  'GITHUB',
  'GITLAB',
  'BITBUCKET',
])
export type VersionControlSystem = z.infer<typeof VersionControlSystemSchema>

// Platform-specific repository types
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
  [key: string]: unknown
}
export type BitbucketRepository = {
  id: number
  name: string
  updatedAt: string
  [key: string]: unknown
}

// Supported languages (shared constant)
export const SUPPORTED_LANGUAGES = [
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
] as const

// Search filters Zod schema with validation
export const SearchFiltersSchema = z.object({
  targetedSystem: VersionControlSystemSchema.default('GITHUB'),
  language: z
    .string()
    .transform(val => val.toLowerCase())
    .refine(
      val =>
        SUPPORTED_LANGUAGES.includes(
          val as (typeof SUPPORTED_LANGUAGES)[number],
        ),
      {
        message: `Unsupported language. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`,
      },
    ),
  createdAfter: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
    .refine(val => !isNaN(Date.parse(val)), 'Invalid date')
    .refine(val => new Date(val) <= new Date(), 'Date cannot be in the future'),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export type SearchFilters = z.infer<typeof SearchFiltersSchema>

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
