// services/payment.services.ts
import { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat, VerifyReturnUrl } from 'vnpay'
import Payment, { IPayment } from '~/models/schemas/Payment.schema'
import Enrollment from '~/models/schemas/Enrollment.schema'
import Class from '~/models/schemas/Class.schema'
import Course from '~/models/schemas/Course.schema'
import mongoose from 'mongoose'

class PaymentService {
  private vnpay: VNPay

  constructor() {
    this.vnpay = new VNPay({
      tmnCode: process.env.VNP_TMN_CODE as string,
      secureSecret: process.env.VNP_HASHSECRET as string,
      vnpayHost: 'https://sandbox.vnpayment.vn',
      testMode: true,
      hashAlgorithm: 'SHA512',
      loggerFn: ignoreLogger
    })
  }

  /**
   * Tạo payment record và VNPay URL
   */
  async createPayment(payload: {
    userId: string
    courseId?: string // Course._id (optional - dùng khi mua pre-recorded course trực tiếp)
    classId?: string // Class._id (required cho live-meet courses)
    amount: number
    orderInfo: string
    ipAddress: string
    returnUrl?: string
  }) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      let course: any
      let classInfo: any
      let totalSessions = 0
      let finalCourseId: string | undefined

      // 1. CASE 1: Mua qua Class (Live-meet courses)
      if (payload.classId) {
        // Validate classId format
        if (!mongoose.Types.ObjectId.isValid(payload.classId)) {
          throw new Error('Class ID không hợp lệ')
        }

        // Lấy class info và populate courseId
        classInfo = await Class.findById(payload.classId).populate('courseId').session(session)

        if (!classInfo) {
          throw new Error('Lớp học không tồn tại')
        }

        // Lấy course từ populated data
        course = classInfo.courseId
        finalCourseId = course._id.toString()

        console.log('📚 Class Info:', {
          classId: classInfo._id,
          classCode: classInfo.classCode,
          courseId: course._id,
          courseTitle: course.title
        })

        // Kiểm tra lớp còn chỗ không
        if (classInfo.capacity.currentStudents >= classInfo.capacity.maxStudents) {
          throw new Error('Lớp học đã đầy')
        }
      }
      // 2. CASE 2: Mua Course trực tiếp (Pre-recorded courses)
      else if (payload.courseId) {
        // Validate courseId format
        if (!mongoose.Types.ObjectId.isValid(payload.courseId)) {
          throw new Error('Course ID không hợp lệ')
        }

        course = await Course.findById(payload.courseId).session(session)

        if (!course) {
          throw new Error('Khóa học không tồn tại')
        }

        finalCourseId = course._id.toString()

        // Pre-recorded course thường không có totalSessions cụ thể
        // Có thể dùng totalLessons thay vì totalSessions
        totalSessions = course.courseStructure?.totalSessions || 0

        console.log('📚 Course Info:', {
          courseId: course._id,
          courseTitle: course.title,
          type: course.type,
          totalSessions
        })

        // Validate: Pre-recorded course không nên có classId
        if (course.type === 'live-meet') {
          throw new Error('Khóa học live-meet phải đăng ký qua lớp học (classId)')
        }
      }
      // 3. ERROR: Cần ít nhất courseId hoặc classId
      else {
        throw new Error('Cần cung cấp courseId (pre-recorded) hoặc classId (live-meet)')
      }

      // 4. Kiểm tra user đã đăng ký chưa
      const enrollmentQuery: any = {
        studentId: new mongoose.Types.ObjectId(payload.userId),
        status: { $in: ['enrolled', 'completed'] }
      }

      // Query theo classId nếu có, nếu không query theo courseId
      if (payload.classId) {
        enrollmentQuery.classId = new mongoose.Types.ObjectId(payload.classId)
      } else {
        enrollmentQuery.courseId = new mongoose.Types.ObjectId(finalCourseId!)
      }

      const existingEnrollment = await Enrollment.findOne(enrollmentQuery).session(session)

      if (existingEnrollment) {
        const errorMsg = payload.classId ? 'Bạn đã đăng ký lớp học này rồi' : 'Bạn đã mua khóa học này rồi'
        throw new Error(errorMsg)
      }

      // 5. Tạo payment record
      const vnp_TxnRef = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`

      const paymentData: Partial<IPayment> = {
        userId: new mongoose.Types.ObjectId(payload.userId),
        // Lưu cả courseId và classId (nếu có)
        courseId: finalCourseId ? new mongoose.Types.ObjectId(finalCourseId) : undefined,
        classId: payload.classId ? new mongoose.Types.ObjectId(payload.classId) : undefined,
        amount: payload.amount,
        currency: 'VND',
        paymentMethod: 'vnpay',
        status: 'pending',
        orderInfo: payload.orderInfo,
        ipAddress: payload.ipAddress,
        returnUrl: payload.returnUrl || `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/result`,
        vnpay: {
          vnp_TxnRef
        }
      }

      console.log('💳 Creating payment:', {
        vnp_TxnRef,
        userId: payload.userId,
        courseId: finalCourseId,
        classId: payload.classId,
        amount: payload.amount
      })

      const payment = await Payment.create([paymentData], { session })

      // 6. Build VNPay payment URL
      const vnpayUrl = await this.vnpay.buildPaymentUrl({
        vnp_Amount: payload.amount, // VNPay amount (đã nhân 100 ở controller)
        vnp_IpAddr: payload.ipAddress,
        vnp_TxnRef,
        vnp_OrderInfo: payload.orderInfo,
        vnp_OrderType: ProductCode.Other,
        vnp_Locale: VnpLocale.VN,
        vnp_CreateDate: dateFormat(new Date()),
        vnp_ReturnUrl: `${process.env.BACKEND_URL || 'http://localhost:4000'}/payment/vnpay/callback`
      })

      await session.commitTransaction()

      return {
        paymentId: payment[0]._id,
        vnpayUrl,
        vnp_TxnRef,
        courseInfo: {
          courseId: finalCourseId,
          courseTitle: course.title,
          classCode: classInfo?.classCode,
          totalSessions
        }
      }
    } catch (error) {
      await session.abortTransaction()
      console.error('❌ Create payment error:', error)
      throw error
    } finally {
      session.endSession()
    }
  }

  /**
   * Xử lý callback từ VNPay
   */
  async handleVNPayCallback(query: VerifyReturnUrl) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      // 1. Verify signature từ VNPay
      const verify = this.vnpay.verifyReturnUrl(query)

      if (!verify.isVerified) {
        throw new Error('Chữ ký không hợp lệ - Có thể bị tấn công')
      }

      const { vnp_TxnRef, vnp_ResponseCode, vnp_TransactionNo, vnp_BankCode, vnp_CardType, vnp_PayDate } = query

      console.log('🔔 VNPay callback received:', {
        vnp_TxnRef,
        vnp_ResponseCode,
        vnp_TransactionNo,
        isVerified: verify.isVerified
      })

      // 2. Tìm payment record
      const payment = await Payment.findOne({ 'vnpay.vnp_TxnRef': vnp_TxnRef }).session(session)

      if (!payment) {
        throw new Error(`Không tìm thấy giao dịch với TxnRef: ${vnp_TxnRef}`)
      }

      // Kiểm tra payment đã được xử lý chưa (tránh duplicate callback)
      if (payment.status === 'completed') {
        console.log('⚠️ Payment already processed:', payment._id)
        await session.commitTransaction()
        return {
          success: true,
          message: 'Giao dịch đã được xử lý trước đó',
          payment
        }
      }

      // 3. Cập nhật payment với thông tin từ VNPay
      payment.vnpay = {
        ...payment.vnpay,
        vnp_TransactionNo: vnp_TransactionNo as string,
        vnp_BankCode: vnp_BankCode as string,
        vnp_CardType: vnp_CardType as string,
        vnp_PayDate: vnp_PayDate ? new Date(this.parseVNPayDate(vnp_PayDate as string)) : undefined,
        vnp_ResponseCode: vnp_ResponseCode as string,
        vnp_SecureHash: query.vnp_SecureHash as string
      }

      // 4. Xử lý theo response code
      if (vnp_ResponseCode === '00') {
        // ✅ THANH TOÁN THÀNH CÔNG
        payment.status = 'completed'
        payment.completedAt = new Date()

        console.log('✅ Payment successful, creating enrollment...')

        // 5. Tạo enrollment
        let finalCourseId = payment.courseId

        // Nếu thanh toán qua classId, lấy courseId từ class
        if (payment.classId && !finalCourseId) {
          const classInfo = await Class.findById(payment.classId).session(session)
          if (classInfo) {
            finalCourseId = classInfo.courseId as any
          }
        }

        const enrollmentData: any = {
          studentId: payment.userId,
          courseId: finalCourseId,
          classId: payment.classId,
          enrollmentDate: new Date(),
          status: 'enrolled',
          progress: {
            sessionsAttended: 0,
            totalSessions: 0
          },
          paymentStatus: 'paid',
          paymentInfo: {
            amount: payment.amount,
            paymentDate: new Date(),
            transactionId: vnp_TransactionNo as string
          }
        }

        // Tính totalSessions và update counters
        if (payment.classId) {
          // CASE: Đăng ký qua Class (live-meet)
          const classInfo = await Class.findById(payment.classId).session(session)

          if (classInfo) {
            // Tính totalSessions
            const startDate = new Date(classInfo.schedule.startDate)
            const endDate = classInfo.schedule.endDate
              ? new Date(classInfo.schedule.endDate)
              : new Date(startDate.getTime() + (classInfo.schedule.durationWeeks || 0) * 7 * 24 * 60 * 60 * 1000)

            const totalWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
            enrollmentData.progress.totalSessions = totalWeeks * classInfo.schedule.days.length

            // Tăng currentStudents trong Class
            await Class.findByIdAndUpdate(
              payment.classId,
              {
                $inc: { 'capacity.currentStudents': 1 }
              },
              { session }
            )

            console.log('📈 Updated class:', {
              classId: payment.classId,
              newCurrentStudents: classInfo.capacity.currentStudents + 1
            })
          }
        } else if (payment.courseId) {
          // CASE: Mua course trực tiếp (pre-recorded)
          const course = await Course.findById(payment.courseId).session(session)

          if (course) {
            enrollmentData.progress.totalSessions = course.courseStructure?.totalSessions || 0

            // Tăng studentsCount trong Course
            await Course.findByIdAndUpdate(
              payment.courseId,
              {
                $inc: { studentsCount: 1 }
              },
              { session }
            )

            console.log('📈 Updated course:', {
              courseId: payment.courseId,
              newStudentsCount: (course.studentsCount || 0) + 1
            })
          }
        }

        // Tạo enrollment record
        const enrollment = await Enrollment.create([enrollmentData], { session })
        payment.enrollmentId = enrollment[0]._id as mongoose.Types.ObjectId

        console.log('🎓 Enrollment created:', {
          enrollmentId: enrollment[0]._id,
          studentId: payment.userId,
          courseId: finalCourseId,
          classId: payment.classId
        })

        await payment.save({ session })
        await session.commitTransaction()

        return {
          success: true,
          message: 'Thanh toán thành công! Bạn đã được đăng ký vào khóa học.',
          payment,
          enrollment: enrollment[0]
        }
      } else {
        // ❌ THANH TOÁN THẤT BẠI
        payment.status = 'failed'
        payment.errorMessage = this.getVNPayErrorMessage(vnp_ResponseCode as string)

        console.log('❌ Payment failed:', {
          code: vnp_ResponseCode,
          message: payment.errorMessage
        })

        await payment.save({ session })
        await session.commitTransaction()

        return {
          success: false,
          message: payment.errorMessage,
          payment
        }
      }
    } catch (error) {
      await session.abortTransaction()
      console.error('❌ VNPay callback error:', error)
      throw error
    } finally {
      session.endSession()
    }
  }

  /**
   * Lấy lịch sử thanh toán của user
   */
  async getPaymentHistory(
    userId: string,
    options?: {
      status?: string
      page?: number
      limit?: number
    }
  ) {
    const { status, page = 1, limit = 10 } = options || {}
    const skip = (page - 1) * limit

    const filter: any = { userId: new mongoose.Types.ObjectId(userId) }
    if (status) {
      filter.status = status
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('courseId', 'title price level type')
        .populate('classId', 'classCode schedule')
        .populate('enrollmentId', 'status progress')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(filter)
    ])

    return {
      payments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    }
  }

  /**
   * Kiểm tra quyền truy cập course
   */
  async checkCourseAccess(userId: string, courseId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(courseId)) {
      throw new Error('Invalid user ID or course ID')
    }

    const enrollment = await Enrollment.findOne({
      studentId: new mongoose.Types.ObjectId(userId),
      courseId: new mongoose.Types.ObjectId(courseId),
      status: { $in: ['enrolled', 'completed'] },
      paymentStatus: 'paid'
    })
      .populate('courseId', 'title type')
      .lean()

    return {
      hasAccess: !!enrollment,
      enrollment
    }
  }

  /**
   * Kiểm tra quyền truy cập class
   */
  async checkClassAccess(userId: string, classId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(classId)) {
      throw new Error('Invalid user ID or class ID')
    }

    const enrollment = await Enrollment.findOne({
      studentId: new mongoose.Types.ObjectId(userId),
      classId: new mongoose.Types.ObjectId(classId),
      status: { $in: ['enrolled', 'completed'] },
      paymentStatus: 'paid'
    })
      .populate('classId', 'classCode schedule')
      .populate('courseId', 'title')
      .lean()

    return {
      hasAccess: !!enrollment,
      enrollment
    }
  }

  // Helper methods
  private parseVNPayDate(dateString: string): Date {
    // Format: YYYYMMDDHHmmss
    const year = parseInt(dateString.substring(0, 4))
    const month = parseInt(dateString.substring(4, 6)) - 1
    const day = parseInt(dateString.substring(6, 8))
    const hour = parseInt(dateString.substring(8, 10))
    const minute = parseInt(dateString.substring(10, 12))
    const second = parseInt(dateString.substring(12, 14))

    return new Date(year, month, day, hour, minute, second)
  }

  private getVNPayErrorMessage(code: string): string {
    const errorMessages: Record<string, string> = {
      '07': 'Giao dịch nghi ngờ gian lận',
      '09': 'Thẻ chưa đăng ký Internet Banking',
      '10': 'Xác thực thông tin thẻ không đúng quá số lần quy định',
      '11': 'Đã hết hạn chờ thanh toán',
      '12': 'Thẻ bị khóa',
      '13': 'Nhập sai mật khẩu quá số lần quy định',
      '24': 'Khách hàng hủy giao dịch',
      '51': 'Tài khoản không đủ số dư',
      '65': 'Tài khoản đã vượt quá hạn mức giao dịch',
      '75': 'Ngân hàng đang bảo trì',
      '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
      '99': 'Lỗi không xác định'
    }

    return errorMessages[code] || 'Giao dịch thất bại'
  }
}

export default new PaymentService()
