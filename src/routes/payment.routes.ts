// routes/payment.routes.ts
import { Router } from 'express'
import {
  createVNPayPaymentController,
  vnpayCallbackController,
  getPaymentHistoryController,
  checkCourseAccessController,
  checkHasPurchaseController,
  createMomoPaymentController,
  momoIPNController,
  momoReturnController
} from '~/controllers/payment.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const paymentRouter = Router()

// ============================================================
// VNPAY ROUTES
// ============================================================

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

// ============================================================
// MOMO ROUTES
// ============================================================

/**
 * POST /api/payment/momo
 * Tạo MoMo payment và lấy payUrl
 * Body: { courseId?, classId?, amount, orderInfo? }
 */
paymentRouter.post('/momo', accessTokenValidator, wrapRequestHandler(createMomoPaymentController))

/**
 * POST /api/payment/momo/ipn
 * MoMo server gọi vào để xác nhận giao dịch (server-to-server, không cần auth)
 */
paymentRouter.post('/momo/ipn', wrapRequestHandler(momoIPNController))

/**
 * GET /api/payment/momo/return
 * MoMo redirect user về sau khi thanh toán
 */
paymentRouter.get('/momo/return', wrapRequestHandler(momoReturnController))

// ============================================================
// COMMON ROUTES
// ============================================================

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
 */
paymentRouter.get('/has-purchase', accessTokenValidator, wrapRequestHandler(checkHasPurchaseController))

export default paymentRouter
