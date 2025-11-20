import { cleanInt } from '../utils/helpers'
import dotenv from 'dotenv'

dotenv.config()

export interface AppConfig {
  port: number
  api: {
    version: string
  }
  github: {
    baseUrl: string
    timeout: number
    token?: string
  }
  cors: {
    origin: string
    methods: string
    headers: string
  }
}

export const defaultConfig: AppConfig = {
  port: cleanInt(process.env.PORT) || 3000,
  api: {
    version: process.env.API_VERSION || 'v1',
  },
  github: {
    baseUrl: process.env.GITHUB_API_URL || 'https://api.github.com',
    timeout: cleanInt(process.env.GITHUB_API_TIMEOUT) || 10000,
    token: process.env.GITHUB_TOKEN,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: process.env.CORS_METHODS || 'GET,OPTIONS',
    headers:
      process.env.CORS_HEADERS || 'Origin,X-Requested-With,Content-Type,Accept',
  },
}

export function getConfig(): AppConfig {
  return defaultConfig
}
