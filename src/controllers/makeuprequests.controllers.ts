import { Request, Response, NextFunction } from 'express'
import makeupRequestsService from '~/services/makeuprequests.services'
import mongoose from 'mongoose'
import { TokenPayload } from '~/models/requests/User.requests'

export const availableMakeupClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { originalClassId, sessionNumber } = req.params
    const { user_id } = req.decoded_authorization as TokenPayload
    const studentId = user_id
    console.log('originalClassId:', originalClassId)
    console.log('sessionNumber:', sessionNumber)
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
