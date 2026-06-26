// src/routes/livekit.route.ts
import { Router } from 'express'
import { generateLiveKitToken } from '~/controllers/livekit.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'

const router = Router()

router.post('/token', accessTokenValidator, generateLiveKitToken)

export default router
