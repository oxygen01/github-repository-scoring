import express, { Request, Response } from 'express'
import { repositoriesRouter } from './routes/repositories.routes'
import { getConfig } from './config/app.config'
import cors from 'cors'
import { SCORING_FORMULA } from './controllers/repositories.controller'

const app = express()
const config = getConfig()

// Middleware
app.use(express.json())

// CORS middleware
app.use(
  cors({
    origin: config.cors.origin,
    allowedHeaders: config.cors.headers.split(', '),
    methods: config.cors.methods.split(', '),
  }),
)

// API routes
app.use(`/api/${config.api.version}/repositories`, repositoriesRouter)

// Root endpoint
app.get('/', (req: Request, res: Response): void => {
  res.json({
    name: 'GitHub Repository Scoring API',
    version: config.api.version,
    description:
      'API for scoring GitHub repositories based on popularity metrics',
    endpoints: {
      score: `/api/${config.api.version}/repositories/score`,
      health: '/health',
    },
    documentation: {
      search_parameters: {
        language: 'REQUIRED: Programming language (e.g., javascript, python)',
        createdAfter: 'REQUIRED: Date in ISO8601 format (YYYY-MM-DD)',
        limit: 'OPTIONAL: Number of results (1-100, default 30)',
      },
      scoring_algorithm: {
        description: 'Linear scoring with realistic time decay',
        formula: SCORING_FORMULA,
        time_decay:
          'Popular repos (1000+): max -20%, Medium (100-999): max -50%, Small (<100): max -70%',
      },
    },
  })
})

// Global health check endpoint
app.get('/health', (_req: Request, res: Response): void => {
  res.json({
    status: 'OK',
    service: 'github-repository-scoring',
    version: config.api.version,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// 404 handler
app.use('*', (_req: Request, res: Response): void => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
      status: 404,
    },
  })
})

// Global error handler middleware
app.use(
  (
    err: Error,
    _req: Request,
    res: Response,
    _next: express.NextFunction,
  ): void => {
    console.error('Unhandled error:', err)
    if (res.headersSent) {
      // If headers are already sent, delegate to the default Express error handler
      return
    }
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        status: 500,
      },
    })
  },
)

app.listen(config.port, (): void => {
  console.info(`🚀 Server is running on port ${config.port}`)
  console.info(
    `API Documentation available at: http://localhost:${config.port}`,
  )
  console.info(
    `Example API call: http://localhost:${config.port}/api/${config.api.version}/repositories/score?language=javascript&createdAfter=2023-01-01&limit=10`,
  )
})
