import { Router } from 'express'
import { explainQuestionController } from '~/controllers/ai.controllers'

const aiRouter = Router()

// POST /ai/explain  – không yêu cầu auth, vì kết quả thi có thể xem public
aiRouter.post('/explain', explainQuestionController)

export default aiRouter
