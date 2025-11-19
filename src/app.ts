import express, { Request, Response } from 'express'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

app.get('/', (req: Request, res: Response): void => {
  res.json({ message: 'Hello World!' })
})

// Health check endpoint
app.get('/health', (req: Request, res: Response): void => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.listen(PORT, (): void => {
  console.info(`Server is running on port ${PORT}`)
})
