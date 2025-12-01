import { Repository } from '../types'

export type RepoScoreInput = Pick<
  Repository,
  'stargazersCount' | 'forksCount' | 'updatedAt'
>

/**
 * Calculate popularity score for GitHub repositories (0-10 scale).
 *
 * ## How it works:
 * 1. **Base score** = stars + (forks × 2)
 * 2. **Age penalty** = reduce score if repository is old
 * 3. **Final score** = base score × age factor ÷ 7000 × 10
 *
 * ## Age penalties by popularity:
 * - **Popular repos** (1000+ score): Small penalty (max -20%)
 * - **Medium repos** (100-999 score): Medium penalty (max -50%)
 * - **Small repos** (under 100): Big penalty (max -70%)
 *
 * ## Examples:
 * - React (5000 stars, 1000 forks, new): **Score = 10**
 * - React (5000 stars, 1000 forks, 2 years old): **Score = 8**
 * - Small project (30 stars, 5 forks, new): **Score = 0.06**
 *
 * @returns Score from 0 to 10
 */
const calculateScore = (popularity: number, updatedAt: string): number => {
  const daysSinceUpdate =
    (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  const yearsSinceUpdate = daysSinceUpdate / 365

  // Apply age penalty based on popularity level
  let timeFactor = 1 // Start with full score

  if (popularity >= 1000) {
    // Popular repos get small penalty (10% per year, max 20%)
    timeFactor = Math.max(0.8, 1 - yearsSinceUpdate * 0.1)
  } else if (popularity >= 100) {
    // Medium repos get medium penalty (15% per year, max 50%)
    timeFactor = Math.max(0.5, 1 - yearsSinceUpdate * 0.15)
  } else {
    // Small repos get big penalty (20% per year, max 70%)
    timeFactor = Math.max(0.3, 1 - yearsSinceUpdate * 0.2)
  }

  // Apply age penalty to base score
  const rawScore = popularity * timeFactor
  // Convert to 0-10 scale (7000 = maximum popular repo)
  const maxPossible = 7000
  const normalized = (rawScore / maxPossible) * 10

  // Make sure score is not above 10 and round to 2 decimal places
  return Number(Math.min(10, normalized).toFixed(2))
}

export const getScore = (
  repo: RepoScoreInput,
  source: 'GITHUB' | 'GITLAB' | 'BITBUCKET',
): number => {
  switch (source) {
    case 'GITHUB':
      return calculateGitHubScore(repo)
    case 'GITLAB':
      return calculategitlabScore(repo)
    case 'BITBUCKET':
      // Placeholder for Bitbucket scoring logic
      return calculateBitbucketScore(repo)
    default:
      return 0
  }
}

const calculategitlabScore = (_repo: RepoScoreInput): number => {
  // todo implement Gitlab scoring logic
  return 0
}

const calculateBitbucketScore = (_repo: RepoScoreInput): number => {
  // todo implement Bitbucket scoring logic
  return 0
}

export const calculateGitHubScore = (repo: RepoScoreInput): number => {
  const stars = repo.stargazersCount ?? 0
  const forks = repo.forksCount ?? 0

  // Calculate base score (forks count double because they show more engagement)
  const popularity = stars + forks * 2

  return calculateScore(popularity, repo.updatedAt)
}
