import { Request, Response } from 'express'
import { NextFunction, ParamsDictionary } from 'express-serve-static-core'
import usersService from '~/services/users.services'
import { LoginReqBody, RegisterReqBody, RefreshTokenReqBody, TokenPayload } from '../models/requests/User.requests'
import { ObjectId } from 'mongoose'
import { USERS_MESSAGES } from '../constants/messages'
import { IUser } from '../models/schemas/User.schema'
import { config } from 'dotenv'
//import usersServices from '~/services/users.services'
config()

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await usersService.register(req.body)
  return res.status(200).json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    access_token: result.access_token,
    refresh_token: result.refresh_token
  })
}

export const loginController = async (
  req: Request<ParamsDictionary, any, LoginReqBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as IUser
    if (!user) {
      return res.status(400).json({ message: USERS_MESSAGES.USER_NOT_FOUND })
    }

    const user_id = user._id as ObjectId
    const result = await usersService.login({ user_id: user_id.toString() })

    const access_token = result.access_token
    const refresh_token = result.refresh_token

    res.cookie('refreshToken', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    })

    res.json({
      message: USERS_MESSAGES.LOGIN_SUCCESS,
      access_token,
      user: user.profile
    })
  } catch (error) {
    console.error('Login error:', error)
    next(error) // middleware error handler sẽ bắt
  }
}

export const getMeController = async (req: Request, res: Response, next: NextFunction) => {
  const user_id = '68ad52a25c1f295197daef3e'.toString() //thủ công tạm thời, sau này lấy từ token
  // Lấy ra user_id từ cái thằng decode
  // const { user_id } = req

  // Gọi xuống Service để xử lý liên quan tới DB
  const user = await usersService.getMe(user_id)

  res.json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result: user
  })
}

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response
) => {
  const refresh_token = req.cookies.refreshToken || req.body.refresh_token

  // Lấy user_id từ request decoded_refresh_token
  const { user_id } = req.decoded_refresh_token as TokenPayload

  // Truyền vào service để tạo mới access_token và refresh_token
  const result = await usersService.refreshToken({ user_id, refresh_token })

  const refresh_token_new = result.refresh_token
  res.cookie('refreshToken', refresh_token_new, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000
  })

  res.json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
    access_token: result.access_token,
    refresh_token: result.refresh_token
  })
}
