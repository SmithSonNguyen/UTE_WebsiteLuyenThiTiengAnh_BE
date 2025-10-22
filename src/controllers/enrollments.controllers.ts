// controllers/enrollments.controller.ts
import { Request, Response, NextFunction } from 'express'
import { enrollmentsService } from '~/services/enrollments.services' // Adjust path
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import mongoose from 'mongoose'
export const getMySchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.decoded_authorization) {
      return next(
        new ErrorWithStatus({
          message: 'Unauthorized',
          status: HTTP_STATUS.UNAUTHORIZED
        })
      )
    }
    const userId = new mongoose.Types.ObjectId(req.decoded_authorization.user_id)
    const period = (req.query.period as string) || 'all'

    const enrollments = await enrollmentsService.getMySchedule(userId, period)

    res.json(enrollments)
  } catch (error) {
    next(
      new ErrorWithStatus({
        message: 'Lỗi khi lấy lịch học',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    )
  }
}
