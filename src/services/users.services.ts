import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enum'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import databaseService from './database.services'

class UsersService {
  private signAccessToken({ user_id }: { user_id: string }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN ? parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN, 10) : undefined //toán tử 3 ngôi: condition ? valueIfTrue : valueIfFalse
      }
    })
  }

  private signRefreshToken({ user_id }: { user_id: string }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ? parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN, 10) : undefined
      }
    })
  }

  private signAccessAndRefreshToken({ user_id }: { user_id: string }) {
    //do thấy medthod này được lặp lại nhiều nên tạo thành 1 method riêng
    return Promise.all([this.signAccessToken({ user_id }), this.signRefreshToken({ user_id })])
  }

  async login({ user_id }: { user_id: string }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id })

    // Upsert: nếu user_id tồn tại thì update refreshtoken, nếu không có thì tạo mới
    await RefreshToken.findOneAndUpdate(
      { user_id }, // điều kiện tìm kiếm
      { refreshtoken: refresh_token }, // giá trị update
      { upsert: true, new: true } // upsert = tạo mới nếu không có, new = trả về doc mới
    )

    return {
      access_token,
      refresh_token
    }
  }
  async getMe(user_id: string) {
    const result = await RefreshToken.findOne({ user_id })
    if (!result) {
      throw new Error('User not found')
    }
    return result
  }
}

const usersService = new UsersService()
export default usersService
