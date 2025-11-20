import {
  calculateLinearScore,
  GithubRepoScoreInput,
} from '../services/scoring.service'

const validateDate = (dateStr: string): boolean => {
  const date = new Date(dateStr)
  return !isNaN(date.getTime())
}
export function calculateScoreExponential(repo: GithubRepoScoreInput): number {
  const stars = repo.stargazers_count ?? 0
  const forks = repo.forks_count ?? 0

  // Popularity measure
  const popularity = stars * 2 + forks
  if (!validateDate(repo.updated_at)) {
    throw new Error('Invalid date format for updated_at')
  }
  // Days since last update
  const daysSinceUpdate =
    (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24)

  // Exponential decay factor (λ = 0.05)
  const lambda = 0.05
  const decay = Math.exp(-lambda * daysSinceUpdate)

  // Weighted popularity combined with decay
  const rawScore = popularity * decay

  // Estimated upper bound for very large repos
  const maxPossible = 110000 // (50000*2 + 10000)

  // Normalize 0–10
  const normalized = (rawScore / maxPossible) * 10

  return Number(Math.min(10, normalized).toFixed(2))
}

export function calculateScoreHackerNewsRanking(
  repo: GithubRepoScoreInput,
): number {
  const stars = repo.stargazers_count ?? 0
  const forks = repo.forks_count ?? 0

  // HN-style popularity
  const popularity = stars + forks * 0.5

  if (!validateDate(repo.updated_at)) {
    throw new Error('Invalid date format for updated_at')
  }
  // Hours since update
  const hoursSinceUpdate =
    (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60)

  // HN decay factor
  const rawScore = popularity / Math.pow(hoursSinceUpdate + 2, 1.5)

  // Normalize raw score to 0–10
  const maxPossible = 500 // tuned upper bound for typical HN formula output
  const normalized = (rawScore / maxPossible) * 10

  return Number(Math.min(10, normalized).toFixed(2))
}

function generateFakeRepos(count: number): GithubRepoScoreInput[] {
  const repos = []
  for (let i = 0; i < count; i++) {
    repos.push({
      stargazers_count: Math.floor(Math.random() * 50000),
      forks_count: Math.floor(Math.random() * 10000),
      updated_at: new Date(
        Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 2000,
      ).toISOString(),
    })
  }
  return repos
}

function benchmark(label: string, fn: () => void): void {
  const start = process.hrtime.bigint()
  fn()
  const end = process.hrtime.bigint()
  const ms = Number(end - start) / 1_000_000
  console.info(`${label}: ${ms.toFixed(2)} ms`)
}

const repos = generateFakeRepos(1000000) // 1M repos

benchmark('Exponential algorithm', () => {
  for (const repo of repos) calculateScoreExponential(repo)
})

benchmark('Linear algorithm', () => {
  for (const repo of repos) calculateLinearScore(repo)
})

benchmark('Hacker News ranking', () => {
  for (const repo of repos) calculateScoreHackerNewsRanking(repo)
})
