// middlewares/enrollmentAuth.ts
import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import Enrollment from '~/models/schemas/Enrollment.schema' // Import model Enrollment của bạn
import { ErrorWithStatus } from '~/models/Errors' // Import từ project của bạn
import HTTP_STATUS from '~/constants/httpStatus' // Import HTTP status của bạn

export const requireEnrollment = async (req: Request, res: Response, next: NextFunction) => {
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

    // Query Enrollment
    const enrollment = await Enrollment.findOne({
      studentId: userId,
      classId: new mongoose.Types.ObjectId(classId),
      status: 'enrolled'
    }).lean()

    if (!enrollment) {
      // OPTION 1: Chỉ cho student (không check instructor) - Sử dụng cái này nếu chưa có role
      throw new ErrorWithStatus({
        message: 'Bạn chưa đăng ký lớp học này hoặc đăng ký chưa được phê duyệt.',
        status: HTTP_STATUS.FORBIDDEN
      })

      // OPTION 2: Thêm check instructor (uncomment nếu JWT có role)
      // if (req.decoded_authorization.role === 'instructor') {
      //   const classDoc = await Class.findById(classId).select('instructor').lean();
      //   if (classDoc && classDoc.instructor.toString() === userId.toString()) {
      //     (req as any).enrollment = null; // Phân biệt instructor vs student
      //     return next();
      //   }
      // }
      // throw new ErrorWithStatus({
      //   message: 'Bạn chưa đăng ký lớp học này hoặc đăng ký chưa được phê duyệt',
      //   status: HTTP_STATUS.FORBIDDEN
      // });
    }

    // Attach enrollment cho student
    ;(req as any).enrollment = enrollment
    next()
  } catch (error) {
    next(error)
  }
}
