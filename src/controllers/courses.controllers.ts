import { Request, Response } from 'express'
import { NextFunction, ParamsDictionary } from 'express-serve-static-core'
import coursesService from '~/services/courses.services'
//import { CreateCourseReqBody, GetCoursesQuery } from '../models/requests/Course.requests'
import { ObjectId } from 'mongoose'

export const getAllCoursesController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit, type, level, status } = req.query

    const result = await coursesService.getAllCourses({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      type: type as 'pre-recorded' | 'live-meet' | undefined,
      level: level as 'beginner' | 'intermediate' | 'advanced' | undefined,
      status: status as 'active' | 'inactive' | 'draft' | undefined
    })

    res.status(200).json({
      message: 'Get all courses successfully',
      result
    })
  } catch (error) {
    next(error)
  }
}

export const getFeaturedCoursesController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response,
  next: NextFunction
) => {
  try {
    const featuredCourses = await coursesService.getFeaturedCourses()
    res.status(200).json(featuredCourses)
  } catch (error) {
    next(error)
  }
}

export const getDetailedCoursesController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response,
  next: NextFunction
) => {
  try {
    const courseId = req.params.id
    const course = await coursesService.getCourseById(courseId)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }
    res.status(200).json(course)
  } catch (error) {
    next(error)
  }
}

export const getMyEnrolledCoursesController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.decoded_authorization?.user_id

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized - User not authenticated'
      })
    }

    const enrolledCourses = await coursesService.getMyEnrolledCourses(userId.toString())

    res.status(200).json({
      message: 'Get enrolled courses successfully',
      result: {
        courses: enrolledCourses,
        total: enrolledCourses.length
      }
    })
  } catch (error) {
    next(error)
  }
}

export const getMyEnrolledCoursesVideoController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response,
  next: NextFunction
) => {
  try {
    const courseId = req.params.id
    const userId = req.decoded_authorization?.user_id

    // Kiểm tra user đã mua khóa học chưa
    const hasAccess = await coursesService.checkUserCourseAccess(userId, courseId)

    if (!hasAccess) {
      return res.status(403).json({
        message: 'Bạn chưa mua khóa học này. Vui lòng mua khóa học để tiếp tục.'
      })
    }

    // Lấy thông tin khóa học với videoLessons
    const course = await coursesService.getEnrolledCourseById(courseId, userId)

    if (!course) {
      return res.status(404).json({
        message: 'Không tìm thấy khóa học'
      })
    }

    res.status(200).json(course)
  } catch (error) {
    next(error)
  }
}
