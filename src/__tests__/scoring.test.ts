import {
  calculateLinearScore,
  GithubRepoScoreInput,
} from '../services/scoring.service'

describe('calculateLinearScore', () => {
  const createTestRepo = (
    stars: number,
    forks: number,
    daysAgo: number,
  ): GithubRepoScoreInput => {
    const updatedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
    return {
      stargazers_count: stars,
      forks_count: forks,
      updated_at: updatedAt.toISOString(),
    }
  }

  it('should return high score for highly popular recently updated repo', () => {
    const repo = createTestRepo(5000, 1000, 1) // yesterday
    const score = calculateLinearScore(repo)

    expect(score).toEqual(10)
  })

  it('should return high score for popular but old repo (realistic age penalty)', () => {
    const repo = createTestRepo(5000, 1000, 730) // 2 years ago
    const score = calculateLinearScore(repo)

    expect(score).toEqual(8)
  })

  it('should give fresh repos advantage over older repos with same stars/forks', () => {
    const freshRepo = createTestRepo(30, 5, 5) // 5 days ago
    const oldRepo = createTestRepo(30, 5, 200) // 200 days ago

    const freshScore = calculateLinearScore(freshRepo)
    const oldScore = calculateLinearScore(oldRepo)

    expect(freshScore).toBeGreaterThan(oldScore)
  })

  it('should return 0 for repos with no stars or forks regardless of recency', () => {
    const recentZeroRepo = createTestRepo(0, 0, 1) // yesterday
    const oldZeroRepo = createTestRepo(0, 0, 365) // 1 year ago

    const recentScore = calculateLinearScore(recentZeroRepo)
    const oldScore = calculateLinearScore(oldZeroRepo)

    expect(oldScore).toBe(0)
    expect(recentScore).toBe(0)
  })

  it('should match manual calculation for known input values', () => {
    const repo = createTestRepo(100, 20, 10) // 10 days ago
    const score = calculateLinearScore(repo)

    const expectedScore = 0.2

    expect(score).toEqual(expectedScore)
  })

  describe('Edge cases', () => {
    it('should cap scores at 10', () => {
      // Create an extremely popular repo
      const repo = createTestRepo(50000, 25000, 1) // yesterday
      const score = calculateLinearScore(repo)

      expect(score).toEqual(10)
    })

    it('should handle very old dates', () => {
      const repo = createTestRepo(1000, 100, 3650) // 10 years ago
      const score = calculateLinearScore(repo)

      expect(score).toEqual(1.37)
    })
  })

  describe('Recency bonus tiers', () => {
    const baseStars = 100
    const baseForks = 20

    it('should apply correct recency bonuses for different time periods', () => {
      const recent = calculateLinearScore(
        createTestRepo(baseStars, baseForks, 15),
      )
      const medium = calculateLinearScore(
        createTestRepo(baseStars, baseForks, 60),
      )
      const older = calculateLinearScore(
        createTestRepo(baseStars, baseForks, 120),
      )
      const ancient = calculateLinearScore(
        createTestRepo(baseStars, baseForks, 365),
      )
      expect(recent).toBeGreaterThanOrEqual(medium)
      expect(medium).toBeGreaterThanOrEqual(older)
      expect(older).toBeGreaterThanOrEqual(ancient)
    })
  })
})
