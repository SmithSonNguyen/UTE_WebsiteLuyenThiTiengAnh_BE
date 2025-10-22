// middlewares/instructorAuth.ts
import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import Class from '~/models/schemas/Class.schema' // Import Class model của bạn
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'

export const requireInstructor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classId = req.params.classId
    if (!classId) {
      throw new ErrorWithStatus({
        message: 'Class ID is required',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    if (!req.decoded_authorization || !req.decoded_authorization.user_id) {
      throw new ErrorWithStatus({
        message: 'Unauthorized',
        status: HTTP_STATUS.UNAUTHORIZED
      })
    }

    const userId = new mongoose.Types.ObjectId(req.decoded_authorization.user_id)

    // Check nếu là admin (bonus: admin bypass tất cả)
    if (req.decoded_authorization.role === 'admin') {
      // Attach class để dùng sau
      const classDoc = await Class.findById(classId).lean()
      if (!classDoc) {
        throw new ErrorWithStatus({
          message: 'Class not found',
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      ;(req as any).class = classDoc
      return next()
    }

    // Query Class để kiểm tra instructor match
    const classDoc = await Class.findById(classId)
      .select('instructor') // Chỉ lấy field cần để nhanh
      .lean()

    if (!classDoc || classDoc.instructor.toString() !== userId.toString()) {
      throw new ErrorWithStatus({
        message: 'Bạn không phải là giảng viên của lớp học này',
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    // Check role là 'instructor' (nếu JWT có role)
    if (req.decoded_authorization.role !== 'instructor') {
      throw new ErrorWithStatus({
        message: 'Quyền giảng viên yêu cầu',
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    // Attach class vào req để dùng sau (ví dụ: lấy schedule, students)
    ;(req as any).class = classDoc
    next()
  } catch (error) {
    next(error)
  }
}
