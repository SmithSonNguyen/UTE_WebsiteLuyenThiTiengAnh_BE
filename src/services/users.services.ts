import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enum'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import OTP from '~/models/schemas/OTP.schema'
import { RegisterReqBody, UpdateProfileReqBody } from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import { hashPassword } from '~/utils/crypto'
import crypto from 'crypto'
import mongoose, { ObjectId } from 'mongoose'
import { sendOTPEmail } from '~/services/email.services'
import HTTP_STATUS from '~/constants/httpStatus'
import e from 'express'

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

  private signRefreshToken({ user_id }: { user_id: string }, { role }: { role?: string } = {}) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        role
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ? parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN, 10) : undefined
      }
    })
  }

  private signAccessAndRefreshToken({ user_id }: { user_id: string }, { role }: { role?: string } = {}) {
    //do thấy medthod này được lặp lại nhiều nên tạo thành 1 method riêng
    return Promise.all([this.signAccessToken({ user_id }, { role }), this.signRefreshToken({ user_id }, { role })])
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

  async checkEmailExist(email: string) {
    const user = await User.findOne({ 'profile.email': email })
    return !!user
  }

  // Gửi OTP cho đăng ký hoặc đặt lại mật khẩu
  async sendOTP(email: string, purpose: 'register' | 'reset_password') {
    // Kiểm tra email đã tồn tại chưa
    if (purpose === 'register') {
      const emailExists = await this.checkEmailExist(email)
      if (emailExists) {
        return { status: HTTP_STATUS.BAD_REQUEST, message: 'Email đã được sử dụng' }
      }
    } else if (purpose === 'reset_password') {
      const emailExists = await this.checkEmailExist(email)
      if (!emailExists) {
        return { status: HTTP_STATUS.BAD_REQUEST, message: 'Email chưa được đăng ký' }
      }
    }

    // Tạo và gửi OTP
    const otp = await OTP.createOTP(email, purpose)
    await sendOTPEmail(email, otp, purpose)

    return {
      message: 'OTP đã được gửi đến email của bạn',
      expiresIn: 5 * 60 // 5 minutes in seconds
    }
  }

  async verifyRegisterOTP(payload: RegisterReqBody) {
    if (payload.password !== payload.confirm_password) {
      return { status: HTTP_STATUS.BAD_REQUEST, message: 'Mật khẩu xác nhận không khớp' }
    }

    const valid = await OTP.verifyOTP(payload.email, payload.otp, 'register')
    if (!valid) return { status: HTTP_STATUS.BAD_REQUEST, message: 'OTP không hợp lệ hoặc đã hết hạn' }

    const hashed = hashPassword(payload.password)
    const newUser = new User({
      password: hashed,
      isVerified: true,
      profile: {
        firstname: payload.firstname,
        lastname: payload.lastname,
        email: payload.email,
        birthday: payload.birthday,
        phone: ''
      },
      role: 'guest',
      purchasedCourses: [],
      wishList: []
    })

    await newUser.save()
    return { status: HTTP_STATUS.CREATED, message: 'Đăng ký thành công', userId: newUser._id }
  }

  async verifyResetPasswordOTP({ email, otp }: { email: string; otp: string }) {
    try {
      const valid = await OTP.verifyOTP(email, otp, 'reset_password')
      if (!valid) return { status: HTTP_STATUS.BAD_REQUEST, message: 'OTP không hợp lệ hoặc đã hết hạn' }
      return { status: HTTP_STATUS.OK, message: 'OTP hợp lệ' }
    } catch (error) {
      console.error('Error verifying reset password OTP:', error)
      return { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: 'Xác thực OTP thất bại' }
    }
  }

  async resetPassword(email: string, new_password: string, confirm_password: string) {
    if (new_password !== confirm_password) {
      return { status: HTTP_STATUS.BAD_REQUEST, message: 'Mật khẩu xác nhận không khớp' }
    }
    const hashed = hashPassword(new_password)
    const result = await User.findOneAndUpdate(
      { 'profile.email': email },
      { $set: { password: hashed } },
      { new: true }
    )

    if (!result) {
      return { status: HTTP_STATUS.NOT_FOUND, message: 'Người dùng không tồn tại' }
    }

    return { status: HTTP_STATUS.OK, message: 'Đặt lại mật khẩu thành công' }
  }

  async refreshToken({ user_id, refresh_token }: { user_id: string; refresh_token: string }) {
    // Lấy role từ database để đảm bảo role luôn chính xác
    const user = await User.findById(user_id, 'role')
    if (!user) {
      throw new Error('User not found')
    }
    const role = user.role

    // Ở đây sẽ tạo ra 2 token mới => Dùng Promise.all để chạy song song 2 hàm vì nó không liên quan đến nhau
    // user chưa verify thì vẫn cho phép ngta lấy refresh token
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id }, { role }),
      this.signRefreshToken({ user_id }, { role }),
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
