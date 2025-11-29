import { Request, Response, NextFunction } from 'express'
import makeupRequestsService from '~/services/makeuprequests.services'
import mongoose from 'mongoose'
import { TokenPayload } from '~/models/requests/User.requests'

export const availableMakeupClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { originalClassId, sessionNumber } = req.params
    const { user_id } = req.decoded_authorization as TokenPayload
    const studentId = user_id
    const availableClasses = await makeupRequestsService.getAvailableMakeupClasses(
      studentId,
      originalClassId,
      Number(sessionNumber)
    )
    res.json(availableClasses)
  } catch (error) {
    next(error)
  }
}

export const registerMakeupClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      originalClassId,
      sessionNumberOriginal,
      dateOriginal,
      makeupClassId,
      sessionNumberMakeup,
      dateMakeup,
      timeMakeup
    } = req.body
    const { user_id } = req.decoded_authorization as TokenPayload
    const studentId = user_id
    const result = await makeupRequestsService.registerMakeupClass(
      studentId,
      originalClassId,
      Number(sessionNumberOriginal),
      dateOriginal,
      makeupClassId,
      Number(sessionNumberMakeup),
      dateMakeup,
      timeMakeup
    )
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const getMakeupRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload
    const studentId = user_id
    const makeupRequests = await makeupRequestsService.getMakeupRequestsByStudent(studentId)
    res.json(makeupRequests)
  } catch (error) {
    next(error)
  }
}
export const cancelMakeupRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { makeupRequestId } = req.params
    const { user_id } = req.decoded_authorization as TokenPayload
    const studentId = user_id
    const result = await makeupRequestsService.cancelMakeupRequest(studentId, makeupRequestId)
    res.json(result)
  } catch (error) {
    next(error)
  }
}
