// routes/admin.routes.ts
import { Router } from 'express'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { requireAdmin } from '~/middlewares/admins.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
import {
  getOverviewDashboardController,
  getRevenueByDateController,
  getTopStudentsController,
  getAllInstructorsController,
  createInstructorController,
  deleteInstructorController,
  assignClassController,
  getAvailableClassesController,
  getAllClassesController,
  createClassController,
  changeClassInstructorController,
  deleteClassController,
  getAllPreRecordedCoursesController,
  getPreRecordedCourseByIdController,
  createPreRecordedCourseController,
  updatePreRecordedCourseController,
  deletePreRecordedCourseController,
  getCloudinarySignatureController,
  getAllGuestUsersController,
  deleteGuestUserController,
  getGuestUserEnrollmentsController
} from '~/controllers/admin.controllers'

const adminRouter = Router()

// Tất cả routes đều cần admin authentication
adminRouter.use(accessTokenValidator, requireAdmin)

// Dashboard overview
adminRouter.get('/overview-dashboard', wrapRequestHandler(getOverviewDashboardController))

// Revenue by date range
adminRouter.get('/revenue-by-date', wrapRequestHandler(getRevenueByDateController))

// Top students
adminRouter.get('/top-students', wrapRequestHandler(getTopStudentsController))

// Instructor management routes
adminRouter.get('/instructors', wrapRequestHandler(getAllInstructorsController))
adminRouter.post('/instructors', wrapRequestHandler(createInstructorController))
adminRouter.delete('/instructors/:instructorId', wrapRequestHandler(deleteInstructorController))
adminRouter.post('/assign-class', wrapRequestHandler(assignClassController))
adminRouter.get('/available-classes', wrapRequestHandler(getAvailableClassesController))

// Class management routes
adminRouter.get('/classes', wrapRequestHandler(getAllClassesController))
adminRouter.post('/classes', wrapRequestHandler(createClassController))
adminRouter.put('/classes/:classId/instructor', wrapRequestHandler(changeClassInstructorController))
adminRouter.delete('/classes/:classId', wrapRequestHandler(deleteClassController))

// Pre-recorded Course management routes
adminRouter.get('/courses/pre-recorded', wrapRequestHandler(getAllPreRecordedCoursesController))
adminRouter.get('/courses/pre-recorded/:courseId', wrapRequestHandler(getPreRecordedCourseByIdController))
adminRouter.post('/courses/pre-recorded', wrapRequestHandler(createPreRecordedCourseController))
adminRouter.put('/courses/pre-recorded/:courseId', wrapRequestHandler(updatePreRecordedCourseController))
adminRouter.delete('/courses/pre-recorded/:courseId', wrapRequestHandler(deletePreRecordedCourseController))

// Cloudinary signature for image upload
adminRouter.get('/cloudinary-signature', wrapRequestHandler(getCloudinarySignatureController))

// Lấy tất cả người dùng có role là "guest"
adminRouter.get('/users', wrapRequestHandler(getAllGuestUsersController))

// Xem người dùng đã đăng ký khoá gì
adminRouter.get('/users/:userId/enrollments', wrapRequestHandler(getGuestUserEnrollmentsController))

// Xoá người dùng
adminRouter.delete('/users/:userId', wrapRequestHandler(deleteGuestUserController))

export default adminRouter
