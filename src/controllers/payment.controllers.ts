// controllers/payment.controllers.ts
import { Request, Response, NextFunction } from 'express'
import paymentService from '~/services/payment.services'
import HTTP_STATUS from '~/constants/httpStatus'
import { VerifyReturnUrl } from 'vnpay'
import Payment from '~/models/schemas/Payment.schema'
import mongoose from 'mongoose'

export const createVNPayPaymentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('\n🎮 CREATE PAYMENT CONTROLLER')
    console.log('==========================================')

    // Log toàn bộ request info
    console.log('Headers:', JSON.stringify(req.headers, null, 2))
    console.log('Body:', JSON.stringify(req.body, null, 2))
    console.log('Body type:', typeof req.body)
    console.log('Body is object:', typeof req.body === 'object' && req.body !== null)
    console.log('Decoded auth:', req.decoded_authorization)
    console.log('==========================================\n')

    // 1. Check authentication
    const userId = req.decoded_authorization?.user_id

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Vui lòng đăng nhập để thanh toán'
      })
    }

    // 2. Check body exists
    if (!req.body) {
      console.error('❌ req.body is falsy:', req.body)
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Request body is missing',
        debug: {
          bodyValue: req.body,
          bodyType: typeof req.body,
          contentType: req.headers['content-type']
        }
      })
    }

    // 3. Check body is object
    if (typeof req.body !== 'object') {
      console.error('❌ req.body is not an object:', typeof req.body)
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Request body must be a JSON object',
        debug: {
          bodyType: typeof req.body,
          bodyValue: req.body
        }
      })
    }

    // 4. Safe destructuring with explicit checks
    const courseId = req.body.courseId || null
    const classId = req.body.classId || null
    const amount = req.body.amount || 0
    const orderInfo = req.body.orderInfo || ''

    console.log('📦 Extracted values:', {
      courseId,
      classId,
      amount,
      orderInfo,
      rawBody: req.body
    })

    // 5. Validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Số tiền không hợp lệ',
        received: {
          amount,
          amountType: typeof amount
        }
      })
    }

    if (!courseId && !classId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Cần cung cấp courseId (pre-recorded) hoặc classId (live-meet)',
        received: { courseId, classId }
      })
    }

    // 6. Create payment
    console.log('✅ Validation passed, creating payment...')

    const result = await paymentService.createPayment({
      userId,
      courseId: courseId || undefined,
      classId: classId || undefined,
      amount: amount, // VNPay requires amount * 100
      orderInfo: orderInfo || `Thanh toán ${classId ? 'lớp học' : 'khóa học'}`,
      ipAddress:
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1',
      returnUrl: req.body.returnUrl
    })

    console.log('✅ Payment created successfully:', result.paymentId)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Tạo payment thành công',
      result
    })
  } catch (error) {
    console.error('❌ CREATE PAYMENT ERROR:', error)
    console.error('Stack:', (error as Error).stack)

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Tạo payment thất bại',
      error: (error as Error).message
    })
  }
}

export const vnpayCallbackController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query as unknown as VerifyReturnUrl

    console.log('📥 VNPay callback:', query)

    const result = await paymentService.handleVNPayCallback(query)

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'

    if (result.success) {
      const redirectUrl = `${clientUrl}/payment/success?paymentId=${result.payment._id}&enrollmentId=${result.enrollment?._id}`
      console.log('✅ Redirecting to success:', redirectUrl)
      return res.redirect(redirectUrl)
    } else {
      const redirectUrl = `${clientUrl}/payment/failed?message=${encodeURIComponent(result.message)}&paymentId=${result.payment._id}`
      console.log('❌ Redirecting to failed:', redirectUrl)
      return res.redirect(redirectUrl)
    }
  } catch (error) {
    console.error('❌ VNPay callback error:', error)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    return res.redirect(
      `${clientUrl}/payment/error?message=${encodeURIComponent('Có lỗi xảy ra trong quá trình xử lý thanh toán')}`
    )
  }
}

/**
 * Lấy lịch sử thanh toán
 */
export const getPaymentHistoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.decoded_authorization?.user_id

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Unauthorized'
      })
    }

    const { status, page, limit } = req.query

    const result = await paymentService.getPaymentHistory(userId, {
      status: status as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    })

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy lịch sử thanh toán thành công',
      result
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Lấy lịch sử thanh toán thất bại',
      error: (error as Error).message
    })
  }
}

/**
 * Kiểm tra quyền truy cập course
 */
export const checkCourseAccessController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.decoded_authorization?.user_id
    const { courseId } = req.params

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Unauthorized'
      })
    }

    const result = await paymentService.checkCourseAccess(userId, courseId)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Kiểm tra quyền truy cập thành công',
      result
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Kiểm tra quyền truy cập thất bại',
      error: (error as Error).message
    })
  }
}

/**
 * Kiểm tra user có ít nhất 1 payment status=completed hay không
 * Dùng để quyết định có mở khoà toàn bộ Speaking Test hay không
 */
export const checkHasPurchaseController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.decoded_authorization?.user_id

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Unauthorized'
      })
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Invalid user ID'
      })
    }

    const completedPayment = await Payment.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'completed'
    }).lean()

    return res.status(HTTP_STATUS.OK).json({
      message: 'Kiểm tra thành công',
      result: {
        hasPurchase: !!completedPayment
      }
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Kiểm tra thất bại',
      error: (error as Error).message
    })
  }
}

// ============================================================
// MOMO CONTROLLERS
// ============================================================

/**
 * POST /api/payment/momo
 * Tạo MoMo payment và trả về payUrl
 */
export const createMomoPaymentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.decoded_authorization?.user_id
    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Vui lòng đăng nhập để thanh toán' })
    }

    const { courseId, classId, amount, orderInfo } = req.body

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Số tiền không hợp lệ' })
    }
    if (!courseId && !classId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Cần cung cấp courseId hoặc classId'
      })
    }

    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1'

    const result = await paymentService.createMomoPayment({
      userId,
      courseId: courseId || undefined,
      classId: classId || undefined,
      amount,
      orderInfo: orderInfo || `Thanh toán ${classId ? 'lớp học' : 'khóa học'} qua MoMo`,
      ipAddress
    })

    console.log('✅ MoMo payment created:', result.paymentId)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Tạo MoMo payment thành công',
      result
    })
  } catch (error) {
    console.error('❌ CREATE MOMO PAYMENT ERROR:', error)
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Tạo payment thất bại',
      error: (error as Error).message
    })
  }
}

/**
 * POST /api/payment/momo/ipn
 * MoMo server gọi vào để xác nhận giao dịch (server-to-server)
 * Không cần auth, phải trả về nhanh (trong 15 giây)
 */
export const momoIPNController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('💜 MoMo IPN body:', req.body)
    const result = await paymentService.handleMomoIPN(req.body)
    // MoMo yêu cầu trả về HTTP 204 No Content khi IPN xử lý thành công
    return res.status(204).json(result)
  } catch (error) {
    console.error('❌ MoMo IPN error:', error)
    // Vẫn trả 200 để tránh MoMo gọi lại liên tục
    return res.status(200).json({
      resultCode: 1,
      message: (error as Error).message
    })
  }
}

/**
 * GET /api/payment/momo/return
 * MoMo redirect user về sau khi thanh toán
 * Xử lý và redirect sang FE
 */
export const momoReturnController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('💜 MoMo return query:', req.query)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    const result = await paymentService.handleMomoReturn(req.query)

    if (result.success) {
      const redirectUrl = `${clientUrl}/payment/success?paymentId=${String(result.payment?._id || '')}&method=momo`
      console.log('✅ MoMo redirect to success:', redirectUrl)
      return res.redirect(redirectUrl)
    } else {
      const redirectUrl = `${clientUrl}/payment/failed?message=${encodeURIComponent(result.message || 'Thanh toán thất bại')}&paymentId=${String(result.payment?._id || '')}&method=momo`
      console.log('❌ MoMo redirect to failed:', redirectUrl)
      return res.redirect(redirectUrl)
    }
  } catch (error) {
    console.error('❌ MoMo return error:', error)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    return res.redirect(
      `${clientUrl}/payment/error?message=${encodeURIComponent('Có lỗi xảy ra trong quá trình xử lý thanh toán MoMo')}`
    )
  }
}
