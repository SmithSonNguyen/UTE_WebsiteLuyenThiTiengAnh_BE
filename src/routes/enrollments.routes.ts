// routes/enrollments.ts (Updated)
import express from 'express'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { getMySchedule, getTodaySchedule } from '~/controllers/enrollments.controllers' // Adjust path

const enrollmentsRouter = express.Router()
export default enrollmentsRouter
// GET /api/enrollments/my-schedule - Lấy lịch học của user hiện tại
enrollmentsRouter.get('/my-schedule', accessTokenValidator, getMySchedule)
// GET /api/enrollments/today-schedule - Lấy lịch học hôm nay của user hiện tại
enrollmentsRouter.get('/today-schedule', accessTokenValidator, getTodaySchedule)
