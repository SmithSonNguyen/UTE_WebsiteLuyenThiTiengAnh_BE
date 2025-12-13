import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { instructorService } from '~/services/instructor.services'
import { TokenPayload } from '~/models/requests/User.requests'
import { INSTRUCTOR_MESSAGES } from '~/constants/messages'
import HTTP_STATUS from '~/constants/httpStatus'

export const getInstructorProfileController = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload
    const instructor = await instructorService.getInstructorDetails(user_id)

    res.json({
      message: INSTRUCTOR_MESSAGES.GET_PROFILE_SUCCESS,
      result: instructor
    })
  } catch (error) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      message: error instanceof Error ? error.message : INSTRUCTOR_MESSAGES.GET_PROFILE_FAILED
    })
  }
}

export const getInstructorClassesController = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload
    const classes = await instructorService.getInstructorClasses(user_id)

    res.json({
      message: INSTRUCTOR_MESSAGES.GET_CLASSES_SUCCESS,
      result: classes
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : INSTRUCTOR_MESSAGES.GET_CLASSES_FAILED
    })
  }
}

interface UpdateInstructorProfileReqBody {
  firstname?: string
  lastname?: string
  phone?: string
  address?: string
  bio?: string
  avatar?: string
  department?: string
  position?: string
  specialization?: string
  experience?: string
  education?: string
}

export const updateInstructorProfileController = async (
  req: Request<ParamsDictionary, any, UpdateInstructorProfileReqBody>,
  res: Response
) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload
    const updateData = req.body

    const updatedInstructor = await instructorService.updateInstructorProfile(user_id, updateData)

    res.json({
      message: INSTRUCTOR_MESSAGES.UPDATE_PROFILE_SUCCESS,
      result: updatedInstructor
    })
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: error instanceof Error ? error.message : INSTRUCTOR_MESSAGES.UPDATE_PROFILE_FAILED
    })
  }
}
