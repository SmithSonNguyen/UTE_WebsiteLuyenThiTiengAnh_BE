// routes/enrollments.ts (Updated)
import express from 'express'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { getMySchedule } from '~/controllers/enrollments.controllers' // Adjust path

const enrollmentsRouter = express.Router()
export default enrollmentsRouter
// GET /api/enrollments/my-schedule - Lấy lịch học của user hiện tại
enrollmentsRouter.get('/my-schedule', accessTokenValidator, getMySchedule)
