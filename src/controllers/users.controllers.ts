import { Request, Response } from 'express'
import { NextFunction, ParamsDictionary } from 'express-serve-static-core'
import usersService from '~/services/users.services'
import {
  LoginReqBody,
  RegisterReqBody,
  RefreshTokenReqBody,
  TokenPayload,
  UpdateProfileReqBody,
  SendOTPReqBody
} from '../models/requests/User.requests'
import { ObjectId } from 'mongoose'
import { USERS_MESSAGES } from '../constants/messages'
import { IUser } from '../models/schemas/User.schema'
import { config } from 'dotenv'
//import usersServices from '~/services/users.services'
config()
// Gửi OTP
export const sendOTP = async (
  req: Request<ParamsDictionary, any, SendOTPReqBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, purpose } = req.body
    const result = await usersService.sendOTP(email, purpose)
    res.json(result)
  } catch (error) {
    console.error('Send OTP error:', error)
    res.status(500).json({ message: 'Gửi OTP thất bại' })
  }
}

// Xác thực OTP và tạo tài khoản
export const verifyRegisterOTP = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  try {
    const { email, otp, firstname, lastname, birthday, password, confirm_password } = req.body

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' })
    }

    const result = await usersService.verifyRegisterOTP({
      email,
      otp,
      firstname,
      lastname,
      birthday,
      password,
      confirm_password
    })
    res.json(result)
  } catch (error) {
    console.error('Verify OTP error:', error)
    res.status(500).json({ message: 'Xác thực OTP thất bại' })
  }
}

export const verifyResetPasswordOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body
    console.log('Received email and otp:', email)

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' })
    }

    const result = await usersService.verifyResetPasswordOTP({
      email,
      otp
    })
    res.json(result)
  } catch (error) {
    console.error('Verify OTP error:', error)
    res.status(500).json({ message: 'Xác thực OTP thất bại' })
  }
}

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, new_password, confirm_password } = req.body
    const result = await usersService.resetPassword(email, new_password, confirm_password)
    res.json(result)
  } catch (error) {
    console.error('Reset Password error:', error)
    res.status(500).json({ message: 'Đặt lại mật khẩu thất bại' })
  }
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
    const role = user.role
    const result = await usersService.login({ user_id: user_id.toString() }, { role })

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
  // Lấy user_id từ access token đã được decode
  const { user_id } = req.decoded_authorization as TokenPayload

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

export const getUploadSignatureController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Có thể lấy user_id để log hoặc kiểm tra quyền nếu cần
    const { user_id } = req.decoded_authorization as TokenPayload
    //console.log('User requesting upload signature:', user_id)

    const signatureData = await usersService.generateUploadSignature()

    const response = {
      message: 'Get upload signature success',
      signature: signatureData.signature,
      timestamp: signatureData.timestamp,
      cloudname: signatureData.cloudname,
      apikey: signatureData.apikey
    }

    res.json(response)
  } catch (error) {
    console.error('Error in getUploadSignatureController:', error)
    next(error)
  }
}

export const updateProfileController = async (
  req: Request<ParamsDictionary, any, UpdateProfileReqBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    // Lấy user_id từ access token đã được decode
    const { user_id } = req.decoded_authorization as TokenPayload

    const updatedUser = await usersService.updateProfile(user_id, req.body)

    res.json({
      message: USERS_MESSAGES.UPDATE_ME_SUCCESS,
      user: updatedUser
    })
  } catch (error) {
    next(error)
  }
}

export const logoutController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Lấy user_id từ access token đã được decode
    const { user_id } = req.decoded_authorization as TokenPayload

    await usersService.logout(user_id)

    // Xóa refresh token cookie
    res.clearCookie('refreshToken')

    res.json({
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    })
  } catch (error) {
    next(error)
  }
}
