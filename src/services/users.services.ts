import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enum'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import databaseService from './database.services'
import { RegisterReqBody, UpdateProfileReqBody } from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import { hashPassword } from '~/utils/crypto'
import crypto from 'crypto'
import mongoose from 'mongoose'

class UsersService {
  private signAccessToken({ user_id }: { user_id: string }, { role }: { role?: string } = {}) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        role
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

  private signAccessAndRefreshToken({ user_id }: { user_id: string }, { role }: { role?: string } = {}) {
    //do thấy medthod này được lặp lại nhiều nên tạo thành 1 method riêng
    return Promise.all([this.signAccessToken({ user_id }, { role }), this.signRefreshToken({ user_id })])
  }

  async login({ user_id }: { user_id: string }, { role }: { role?: string } = {}) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id }, { role })

    // Upsert: nếu user_id tồn tại thì update refreshtoken, nếu không có thì tạo mới
    await RefreshToken.findOneAndUpdate(
      { user_id: new mongoose.Types.ObjectId(user_id) }, // điều kiện tìm kiếm
      { refreshtoken: refresh_token }, // giá trị update
      { upsert: true, new: true } // upsert = tạo mới nếu không có, new = trả về doc mới
    )

    return {
      access_token,
      refresh_token
    }
  }
  async getMe(user_id: string) {
    const user = await User.findById(user_id, 'profile')
    if (!user) {
      throw new Error('User not found')
    }
    return user.profile
  }

  async register(payload: RegisterReqBody) {
    const result = await User.create({
      ...payload,
      password: hashPassword(payload.password),
      profile: {
        lastname: payload.lastname,
        firstname: payload.firstname,
        email: payload.email,
        birthday: new Date(payload.birthday)
      }
    })
    const user_id = result.id.toString()
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id })
    await RefreshToken.create({
      user_id: result._id,
      refreshtoken: refresh_token
    })
    return { access_token, refresh_token }
  }

  async checkEmailExist(email: string) {
    const user = await User.findOne({ 'profile.email': email })
    return !!user
  }

  async refreshToken({ user_id, refresh_token }: { user_id: string; refresh_token: string }) {
    // Ở đây sẽ tạo ra 2 token mới => Dùng Promise.all để chạy song song 2 hàm vì nó không liên quan đến nhau
    // user chưa verify thì vẫn cho phép ngta lấy refresh token
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id }),
      this.signRefreshToken({ user_id }),
      RefreshToken.deleteOne({ refreshtoken: refresh_token }) //Xoá refresh token ngta gửi lên
    ])

    // Insert refresh token mới vào DB
    await RefreshToken.create({
      user_id: new mongoose.Types.ObjectId(user_id),
      refreshtoken: new_refresh_token
    })

    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token
    }
  }

  async generateUploadSignature() {
    const cloudname = process.env.CLOUDINARY_CLOUD_NAME
    const apikey = process.env.CLOUDINARY_API_KEY
    const apisecret = process.env.CLOUDINARY_API_SECRET

    //console.log('Cloudinary config:', { cloudname, apikey, apisecret: apisecret ? 'EXISTS' : 'MISSING' })

    if (!cloudname || !apikey || !apisecret) {
      throw new Error('Cloudinary configuration is missing')
    }

    const timestamp = Math.round(new Date().getTime() / 1000)
    const paramsToSign = `timestamp=${timestamp}`

    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + apisecret)
      .digest('hex')

    const result = {
      signature,
      timestamp,
      cloudname,
      apikey
    }

    //console.log('Generated signature result:', result)
    return result
  }

  async updateProfile(user_id: string, payload: UpdateProfileReqBody) {
    const updateData: any = {}

    // Cập nhật thông tin profile
    if (payload.lastname !== undefined) updateData['profile.lastname'] = payload.lastname
    if (payload.firstname !== undefined) updateData['profile.firstname'] = payload.firstname
    if (payload.birthday !== undefined) updateData['profile.birthday'] = new Date(payload.birthday)
    if (payload.phone !== undefined) {
      // Cho phép phone trống hoặc có giá trị
      updateData['profile.phone'] = payload.phone.trim() === '' ? '' : payload.phone
    }
    if (payload.avatar !== undefined) updateData['profile.avatar'] = payload.avatar

    const updatedUser = await User.findByIdAndUpdate(user_id, { $set: updateData }, { new: true, select: 'profile' })

    if (!updatedUser) {
      throw new Error('User not found')
    }

    return updatedUser.profile
  }

  async logout(user_id: string) {
    // Debug: kiểm tra số lượng refresh token trước khi xóa
    // const countBefore = await RefreshToken.countDocuments({
    //   user_id: new mongoose.Types.ObjectId(user_id)
    // })
    //console.log(`User ${user_id} has ${countBefore} refresh tokens before logout`)

    // Xóa tất cả refresh token của user này
    // Chuyển string thành ObjectId để match với schema
    const result = await RefreshToken.deleteMany({
      user_id: new mongoose.Types.ObjectId(user_id)
    })

    //console.log(`Deleted ${result.deletedCount} refresh tokens for user ${user_id}`)
    return result
  }
}

const usersService = new UsersService()
export default usersService
