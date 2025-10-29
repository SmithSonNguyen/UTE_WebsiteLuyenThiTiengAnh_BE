import { Request, Response } from 'express'
import HTTP_STATUS from '~/constants/httpStatus'
import { TokenPayload } from '~/models/requests/User.requests'
import attendanceService from '~/services/attendance.services'

// Lấy danh sách sinh viên trong lớp
export const getClassStudentsController = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params
    const result = await attendanceService.getClassStudents(classId)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách sinh viên thành công',
      result
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Lấy danh sách sinh viên thất bại',
      error: (error as Error).message
    })
  }
}

// Lấy điểm danh theo ngày
export const getAttendanceByDateController = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params
    const { date } = req.query
    const { user_id } = req.decoded_authorization as TokenPayload

    if (!date) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu tham số ngày'
      })
    }

    const result = await attendanceService.getAttendanceByDate(classId, date as string, user_id)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy điểm danh thành công',
      result
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Lấy điểm danh thất bại',
      error: (error as Error).message
    })
  }
}

// Lưu điểm danh
export const saveAttendanceController = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params
    const { date, students } = req.body
    const { user_id } = req.decoded_authorization as TokenPayload

    if (!date || !students || !Array.isArray(students)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Dữ liệu điểm danh không hợp lệ'
      })
    }

    const result = await attendanceService.saveAttendance(classId, date, user_id, students)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lưu điểm danh thành công',
      result
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Lưu điểm danh thất bại',
      error: (error as Error).message
    })
  }
}

// Lấy lịch sử điểm danh của lớp
export const getAttendanceHistoryController = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params
    const { fromDate, toDate } = req.query

    const result = await attendanceService.getAttendanceHistory(classId, fromDate as string, toDate as string)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy lịch sử điểm danh thành công',
      result
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Lấy lịch sử điểm danh thất bại',
      error: (error as Error).message
    })
  }
}

// Lấy tổng quan điểm danh của lớp
export const getClassAttendanceOverviewController = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params
    const result = await attendanceService.getClassAttendanceOverview(classId)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy tổng quan điểm danh thành công',
      result
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Lấy tổng quan điểm danh thất bại',
      error: (error as Error).message
    })
  }
}
