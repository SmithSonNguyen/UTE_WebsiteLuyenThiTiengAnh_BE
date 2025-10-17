import { Jwt, JwtPayload } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import { ParamsDictionary } from 'express-serve-static-core'

export interface LoginReqBody {
  email: string
  password: string
}

export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
}

export interface RegisterReqBody {
  lastname: string
  firstname: string
  email: string
  password: string
  confirm_password: string
  birthday: string
}

export interface RefreshTokenReqBody {
  refresh_token: string
}

export interface UpdateProfileReqBody {
  lastname?: string
  firstname?: string
  birthday?: string
  phone?: string
  avatar?: string
}
