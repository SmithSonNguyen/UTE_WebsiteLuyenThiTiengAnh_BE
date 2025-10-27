import { Router } from 'express'
import {
  getClassStudentsController,
  getAttendanceByDateController,
  saveAttendanceController,
  getAttendanceHistoryController,
  getClassAttendanceOverviewController
} from '~/controllers/attendance.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { requireInstructor } from '~/middlewares/instructors.middlewares'

const attendanceRouter = Router()

// Middleware: phải đăng nhập
attendanceRouter.use(accessTokenValidator)

/**
 * Description: Get list of students in a class
 * Path: /attendance/class/:classId/students
 * Method: GET
 * Params: classId
 */
attendanceRouter.get('/class/:classId/students', requireInstructor, getClassStudentsController)

/**
 * Description: Get attendance by class and date
 * Path: /attendance/class/:classId
 * Method: GET
 * Params: classId
 * Query: date (YYYY-MM-DD)
 */
attendanceRouter.get('/class/:classId', requireInstructor, getAttendanceByDateController)

/**
 * Description: Save attendance for a class session
 * Path: /attendance/class/:classId
 * Method: POST
 * Params: classId
 * Body: {
 *   date: string,
 *   students: Array<{
 *     studentId: string,
 *     isPresent: boolean,
 *     note?: string
 *   }>
 * }
 */
attendanceRouter.post('/class/:classId', requireInstructor, saveAttendanceController)

/**
 * Description: Get attendance history for a class
 * Path: /attendance/class/:classId/history
 * Method: GET
 * Params: classId
 * Query: fromDate?, toDate? (YYYY-MM-DD)
 */
attendanceRouter.get('/class/:classId/history', requireInstructor, getAttendanceHistoryController)

/**
 * Description: Get attendance overview/statistics for a class
 * Path: /attendance/class/:classId/overview
 * Method: GET
 * Params: classId
 */
attendanceRouter.get('/class/:classId/overview', requireInstructor, getClassAttendanceOverviewController)

export default attendanceRouter
