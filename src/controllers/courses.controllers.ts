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
