import { Request, Response } from 'express'
import { NextFunction, ParamsDictionary } from 'express-serve-static-core'
import usersService from '~/services/users.services'
import { LoginReqBody } from '../models/requests/User.requests'
import { ObjectId } from 'mongoose'
import { USERS_MESSAGES } from '../constants/messages'
import { IUser } from '../models/schemas/User.schema'
export const registerController = async (req: Request, res: Response) => {
  // ...existing code...
  return res.json()
}

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const user = req.user as IUser | undefined //Lấy user từ req.user đã được gán ở middleware
  console.log(user)
  if (!user) return res.status(400).json({ message: 'User not found' })
  const user_id = user._id as ObjectId
  const result = await usersService.login({ user_id: user_id.toString() })

  const access_token = result.access_token
  const refresh_token = result.refresh_token

  res.cookie('refreshToken', refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // chỉ secure khi prod
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 ngày
  })

  res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    access_token,
    //refresh_token,
    user: user.profile
  })
}
