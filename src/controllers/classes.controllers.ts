import { Request, Response } from 'express'
import HTTP_STATUS from '~/constants/httpStatus'
import { CLASSES_MESSAGES } from '~/constants/messages'
import classService from '~/services/classes.services'

// Tạo lớp học mới
export const createClassController = async (req: Request, res: Response) => {
  try {
    const result = await classService.createClass(req.body)
    return res.status(HTTP_STATUS.CREATED).json({
      message: CLASSES_MESSAGES.CREATE_CLASS_SUCCESS,
      result
    })
  } catch (error) {
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      message: 'Tạo lớp học thất bại',
      error: (error as Error).message
    })
  }
}

// Lấy danh sách lớp học theo level
export const getClassesByLevelController = async (req: Request, res: Response) => {
  try {
    const { level } = req.params as { level: 'beginner' | 'intermediate' | 'advanced' }
    const classes = await classService.getClassesByLevel(level)

    return res.status(HTTP_STATUS.OK).json({
      message: `Lấy danh sách lớp học ${level} thành công`,
      result: {
        classes,
        count: classes.length
      }
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Lấy danh sách lớp học thất bại',
      error: (error as Error).message
    })
  }
}

// Lấy tất cả lớp học với pagination
export const getAllClassesController = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, courseId } = req.query
    const result = await classService.getAllClasses({
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      courseId: courseId as string
    })

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách lớp học thành công',
      result
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Lấy danh sách lớp học thất bại',
      error: (error as Error).message
    })
  }
}

// Lấy chi tiết lớp học
export const getClassDetailController = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params
    const classDetail = await classService.getClassDetail(classId)

    if (!classDetail) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Không tìm thấy lớp học'
      })
    }

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy chi tiết lớp học thành công',
      result: classDetail
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Lấy chi tiết lớp học thất bại',
      error: (error as Error).message
    })
  }
}

// Cập nhật thông tin lớp học
export const updateClassController = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params
    const result = await classService.updateClass(classId, req.body)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Cập nhật lớp học thành công',
      result
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Cập nhật lớp học thất bại',
      error: (error as Error).message
    })
  }
}

// Xóa lớp học
export const deleteClassController = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params
    await classService.deleteClass(classId)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Xóa lớp học thành công'
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Xóa lớp học thất bại',
      error: (error as Error).message
    })
  }
}

// Đăng ký vào lớp học
export const enrollClassController = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params
    const { userId } = req.body
    const result = await classService.enrollClass(classId, userId)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Đăng ký lớp học thành công',
      result
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Đăng ký lớp học thất bại',
      error: (error as Error).message
    })
  }
}

// Lấy mã lớp học tiếp theo cho level
export const getNextClassCodeController = async (req: Request, res: Response) => {
  try {
    const { level } = req.params as { level: 'beginner' | 'intermediate' | 'advanced' }
    const nextCode = await classService.getNextClassCode(level)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy mã lớp học tiếp theo thành công',
      result: {
        level,
        nextClassCode: nextCode
      }
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Lấy mã lớp học tiếp theo thất bại',
      error: (error as Error).message
    })
  }
}

// Lấy thông tin lớp học cho học viên (bao gồm enrollment status)
export const getClassForStudentController = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params
    const studentId = req.decoded_authorization?.user_id // Lấy từ JWT token sau khi authenticate

    const classInfo = await classService.getClassForStudent(classId, studentId)

    if (!classInfo) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Không tìm thấy lớp học'
      })
    }

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy thông tin lớp học thành công',
      result: classInfo
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Lấy thông tin lớp học thất bại',
      error: (error as Error).message
    })
  }
}

// Lấy danh sách lớp học sắp khai giảng theo courseId
export const getUpcomingClassesByCourseController = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params
    const upcomingClasses = await classService.getUpcomingClassesByCourse(courseId)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách lớp học sắp khai giảng thành công',
      result: {
        classes: upcomingClasses,
        count: upcomingClasses.length,
        courseId
      }
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Lấy danh sách lớp học sắp khai giảng thất bại',
      error: (error as Error).message
    })
  }
}

// Lấy danh sách lớp học sắp khai giảng theo level
export const getUpcomingClassesByLevelController = async (req: Request, res: Response) => {
  try {
    const { level } = req.params as { level: 'beginner' | 'intermediate' | 'advanced' }
    const upcomingClasses = await classService.getUpcomingClassesByLevel(level)

    return res.status(HTTP_STATUS.OK).json({
      message: `Lấy danh sách lớp học sắp khai giảng ${level} thành công`,
      result: {
        classes: upcomingClasses,
        count: upcomingClasses.length,
        level
      }
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Lấy danh sách lớp học sắp khai giảng theo level thất bại',
      error: (error as Error).message
    })
  }
}
