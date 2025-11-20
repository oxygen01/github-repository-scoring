import { Application } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { AppConfig } from '../config/app.config'

/**
 * Apply security hardening for Express API
 */
export const applySecurityMiddleware = (
  app: Application,
  config: AppConfig,
): void => {
  // Helmet (baseline security) includes:
  // 	•	X-Content-Type-Options: nosniff
  // 	•	X-XSS-Protection
  // 	•	X-Frame-Options: DENY
  // 	•	Referrer-Policy: no-referrer
  // 	•	Permissions-Policy
  // 	•	Strict-Transport-Security (HSTS)
  // 	•	and others
  // Does not include CSP/frameguard by default.
  app.use(helmet())
  // CSP blocks malicious inline scripts, which are the cause of >95% of XSS attacks.
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
      },
    }),
  )
  // Prevents:
  // 	•	clickjacking
  // 	•	iframe attacks
  app.use(helmet.frameguard({ action: 'deny' }))

  // CORS middleware
  app.use(
    cors({
      origin: config.cors.origin.split(',').map(s => s.trim()),
      allowedHeaders: config.cors.headers.split(',').map(s => s.trim()),
      methods: config.cors.methods.split(',').map(s => s.trim()),
    }),
  )
}
