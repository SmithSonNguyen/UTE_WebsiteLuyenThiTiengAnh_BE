// routes/payment.routes.ts
import { Router } from 'express'
import {
  createVNPayPaymentController,
  vnpayCallbackController,
  getPaymentHistoryController,
  checkCourseAccessController,
  checkHasPurchaseController
} from '~/controllers/payment.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const paymentRouter = Router()

/**
 * POST /api/payment/vnpay
 * Tạo payment và lấy VNPay URL
 * Body: { courseId?, classId?, amount, orderInfo? }
 */
paymentRouter.post('/vnpay', accessTokenValidator, wrapRequestHandler(createVNPayPaymentController))

/**
 * GET /api/payment/vnpay/callback
 * VNPay callback endpoint (không cần auth)
 */
paymentRouter.get('/vnpay/callback', wrapRequestHandler(vnpayCallbackController))

/**
 * GET /api/payment/history
 * Lấy lịch sử thanh toán của user
 * Query: ?status=completed&page=1&limit=10
 */
paymentRouter.get('/history', accessTokenValidator, wrapRequestHandler(getPaymentHistoryController))

/**
 * GET /api/payment/access/:courseId
 * Kiểm tra quyền truy cập course
 */
paymentRouter.get('/access/:courseId', accessTokenValidator, wrapRequestHandler(checkCourseAccessController))

/**
 * GET /api/payment/has-purchase
 * Kiểm tra user có ít nhất 1 payment status=completed hay không
 * Dùng để mở khoá toàn bộ Speaking Test khi user đã mua bất kỳ khóa học nào
 */
paymentRouter.get('/has-purchase', accessTokenValidator, wrapRequestHandler(checkHasPurchaseController))

export default paymentRouter
