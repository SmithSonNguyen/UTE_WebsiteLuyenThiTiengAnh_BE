// controllers/admin.controllers.ts
import { Request, Response } from 'express'
import { adminService } from '~/services/admin.services'
import HTTP_STATUS from '~/constants/httpStatus'
import { ADMIN_MESSAGES } from '~/constants/messages'

/**
 * GET /admin/overview-dashboard
 */
export const getOverviewDashboardController = async (req: Request, res: Response) => {
  const result = await adminService.getOverviewDashboard()

  return res.status(HTTP_STATUS.OK).json({
    message: ADMIN_MESSAGES.GET_OVERVIEW_DASHBOARD_SUCCESS,
    data: result
  })
}

/**
 * GET /admin/revenue-by-date
 * Query params: startDate, endDate
 */
export const getRevenueByDateController = async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query

  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const end = endDate ? new Date(endDate as string) : new Date()

  const result = await adminService.getRevenueByDateRange(start, end)

  return res.status(HTTP_STATUS.OK).json({
    message: 'Lấy doanh thu theo ngày thành công',
    data: result
  })
}

/**
 * GET /admin/top-students
 * Query params: limit (default: 10)
 */
export const getTopStudentsController = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10

  const result = await adminService.getTopStudents(limit)

  return res.status(HTTP_STATUS.OK).json({
    message: 'Lấy top students thành công',
    data: result
  })
}

export const getAllInstructorsController = async (req: Request, res: Response) => {
  const instructors = await adminService.getAllInstructors()

  return res.status(HTTP_STATUS.OK).json({
    message: ADMIN_MESSAGES.GET_INSTRUCTORS_SUCCESS || 'Get instructors success',
    data: instructors
  })
}

export const createInstructorController = async (req: Request, res: Response) => {
  const instructorData = req.body

  const newInstructor = await adminService.createInstructor(instructorData)

  return res.status(HTTP_STATUS.CREATED).json({
    message: ADMIN_MESSAGES.CREATE_INSTRUCTOR_SUCCESS || 'Create instructor success',
    data: newInstructor
  })
}

export const deleteInstructorController = async (req: Request, res: Response) => {
  const { instructorId } = req.params

  const result = await adminService.deleteInstructor(instructorId)

  return res.status(HTTP_STATUS.OK).json({
    message: ADMIN_MESSAGES.DELETE_INSTRUCTOR_SUCCESS || 'Delete instructor success',
    data: result
  })
}

export const assignClassController = async (req: Request, res: Response) => {
  const { instructorId, classId } = req.body

  const result = await adminService.assignClassToInstructor(instructorId, classId)

  return res.status(HTTP_STATUS.OK).json({
    message: ADMIN_MESSAGES.ASSIGN_CLASS_SUCCESS || 'Assign class success',
    data: result
  })
}

export const getAvailableClassesController = async (req: Request, res: Response) => {
  const classes = await adminService.getAvailableClasses()

  return res.status(HTTP_STATUS.OK).json({
    message: 'Get available classes success',
    data: classes
  })
}

// CLASSES API CONTROLLERS
export const getAllClassesController = async (req: Request, res: Response) => {
  const { status, courseId, instructorId } = req.query

  const filters: any = {}
  if (status) filters.status = status
  if (courseId) filters.courseId = courseId
  if (instructorId) filters.instructorId = instructorId

  const classes = await adminService.getAllClasses(filters)

  return res.status(HTTP_STATUS.OK).json({
    message: 'Lấy danh sách lớp học thành công',
    data: classes
  })
}

/**
 * PUT /admin/classes/:classId/instructor
 * Body: { instructorId: string }
 */
export const changeClassInstructorController = async (req: Request, res: Response) => {
  const { classId } = req.params
  const { instructorId } = req.body

  if (!instructorId) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'InstructorId is required'
    })
  }

  const result = await adminService.changeClassInstructor(classId, instructorId)

  return res.status(HTTP_STATUS.OK).json({
    message: 'Thay đổi giảng viên thành công',
    data: result
  })
}

/**
 * DELETE /admin/classes/:classId
 */
export const deleteClassController = async (req: Request, res: Response) => {
  const { classId } = req.params

  const result = await adminService.deleteClass(classId)

  return res.status(HTTP_STATUS.OK).json({
    message: result.message,
    data: result.deletedClass
  })
}

/**
 * POST /admin/classes
 * Body: class data
 */
export const createClassController = async (req: Request, res: Response) => {
  const classData = req.body

  // Validate required fields
  const requiredFields = ['courseId', 'classId', 'instructorId', 'schedule', 'capacity']
  const missingFields = requiredFields.filter((field) => !classData[field])

  if (missingFields.length > 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: `Missing required fields: ${missingFields.join(', ')}`
    })
  }

  const newClass = await adminService.createClass(classData)

  return res.status(HTTP_STATUS.CREATED).json({
    message: 'Tạo lớp học thành công',
    data: newClass
  })
}

export const getAllPreRecordedCoursesController = async (req: Request, res: Response) => {
  const courses = await adminService.getAllPreRecordedCourses()

  return res.status(HTTP_STATUS.OK).json({
    message: 'Get pre-recorded courses success',
    data: courses
  })
}

export const getPreRecordedCourseByIdController = async (req: Request, res: Response) => {
  const { courseId } = req.params
  const course = await adminService.getPreRecordedCourseById(courseId)

  return res.status(HTTP_STATUS.OK).json({
    message: 'Get course success',
    data: course
  })
}

export const createPreRecordedCourseController = async (req: Request, res: Response) => {
  const courseData = req.body
  const newCourse = await adminService.createPreRecordedCourse(courseData)

  return res.status(HTTP_STATUS.CREATED).json({
    message: 'Create course success',
    data: newCourse
  })
}

export const updatePreRecordedCourseController = async (req: Request, res: Response) => {
  const { courseId } = req.params
  const updateData = req.body
  const updatedCourse = await adminService.updatePreRecordedCourse(courseId, updateData)

  return res.status(HTTP_STATUS.OK).json({
    message: 'Update course success',
    data: updatedCourse
  })
}

export const deletePreRecordedCourseController = async (req: Request, res: Response) => {
  const { courseId } = req.params
  const result = await adminService.deletePreRecordedCourse(courseId)

  return res.status(HTTP_STATUS.OK).json({
    message: 'Delete course success',
    data: result
  })
}

export const getCloudinarySignatureController = async (req: Request, res: Response) => {
  const signature = await adminService.generateUploadSignature()

  return res.status(HTTP_STATUS.OK).json({
    message: 'Get signature success',
    data: signature
  })
}

/**
 * GET /guest/users
 * Lấy tất cả người dùng có role là "guest"
 */
export const getAllGuestUsersController = async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = req.query

  const result = await adminService.getAllGuestUsers(Number(page), Number(limit))

  return res.status(HTTP_STATUS.OK).json({
    message: ADMIN_MESSAGES.GET_ALL_GUEST_USERS_SUCCESS,
    data: result
  })
}

/**
 * GET /guest/users/:userId/enrollments
 * Xem người dùng đã đăng ký khoá gì thông qua payments completed
 */
export const getGuestUserEnrollmentsController = async (req: Request, res: Response) => {
  const { userId } = req.params

  const result = await adminService.getGuestUserEnrollments(userId)

  return res.status(HTTP_STATUS.OK).json({
    message: ADMIN_MESSAGES.GET_USER_ENROLLMENTS_SUCCESS,
    data: result
  })
}

/**
 * DELETE /guest/users/:userId
 * Xoá người dùng
 */
export const deleteGuestUserController = async (req: Request, res: Response) => {
  const { userId } = req.params

  await adminService.deleteGuestUser(userId)

  return res.status(HTTP_STATUS.OK).json({
    message: ADMIN_MESSAGES.DELETE_USER_SUCCESS
  })
}

/**
 * PATCH /guest/users/:userId/restore
 * Khôi phục người dùng đã bị xóa mềm
 */
export const restoreGuestUserController = async (req: Request, res: Response) => {
  const { userId } = req.params

  await adminService.restoreGuestUser(userId)

  return res.status(HTTP_STATUS.OK).json({
    message: ADMIN_MESSAGES.RESTORE_USER_SUCCESS
  })
}
