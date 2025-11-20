import { Router } from 'express'
import { getScoredRepositories } from '../controllers/repositories.controller'

const router = Router()

router.get('/score', (req, res) => getScoredRepositories(req, res))

export { router as repositoriesRouter }
