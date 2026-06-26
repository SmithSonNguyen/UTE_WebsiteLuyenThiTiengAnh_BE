import express from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import HTTP_STATUS from './constants/httpStatus'
import { EntityError, ErrorWithStatus } from './models/Errors'
import lessonsRouter from './routes/lessons.routes'
import freeentrytestRouter from './routes/freeentrytest.routes'
import testsRouter from './routes/tests.routes'
import coursesRouter from './routes/courses.routes'
import reviewsRouter from './routes/reviews.routes'
import classesRouter from './routes/classes.routes'
import enrollmentsRouter from './routes/enrollments.routes'
import instructorRouter from './routes/instructor.routes'
import attendanceRouter from './routes/attendance.routes'
import paymentRouter from './routes/payment.routes'
import makeupRequestsRouter from './routes/makeuprequests.routes'
import newsRouter from './routes/news.routes'
import extractRouter from './routes/extract.routes'
import adminRouter from '~/routes/admin.routes'
import aiRouter from '~/routes/ai.routes'
import speakingRouter from '~/routes/speaking.routes'
import writingTestsRouter from '~/routes/writingtests.routes'
import chatRouter from '~/routes/chat.routes'
import livekitRoutes from './routes/livekit.route'
import writingTestsService from '~/services/writingtests.services'
import { chatService } from '~/services/chat.services'
import { verifyToken } from '~/utils/jwt'
dotenv.config()

const app = express()
const port = process.env.PORT

// Tạo HTTP server từ express app (bắt buộc cho Socket.IO)
const httpServer = http.createServer(app)

// Khởi tạo Socket.IO server
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000
})

//middleware: .use() - parse qua dạng json để xử lý các dữ liệu đầu vào
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173', // FE chạy ở đây
    credentials: true // Nếu bạn dùng cookie, jwt với header
  })
)
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// 🔍 DEBUG Middleware
app.use((req, res, next) => {
  console.log('\n' + '='.repeat(60))
  console.log(`📨 ${req.method} ${req.originalUrl}`)
  console.log('='.repeat(60))
  console.log('Headers:', {
    'content-type': req.headers['content-type'],
    authorization: req.headers.authorization ? 'Present ✅' : 'Missing ❌',
    'content-length': req.headers['content-length']
  })
  console.log('Body:', {
    value: req.body,
    type: typeof req.body,
    isObject: typeof req.body === 'object',
    isNull: req.body === null,
    isUndefined: req.body === undefined,
    keys: req.body ? Object.keys(req.body) : 'N/A',
    stringified: JSON.stringify(req.body)
  })
  console.log('='.repeat(60) + '\n')
  next()
})

// middleware: nghĩa là phải chạy qua hàm use này trước, xong mới vô userRouter nếu user truy cập /users/...
app.use('/users', usersRouter)
app.use('/lessons', lessonsRouter)
app.use('/toeic-home', freeentrytestRouter)
app.use('/tests', testsRouter)
app.use('/courses', coursesRouter)
app.use('/reviews', reviewsRouter)
app.use('/classes', classesRouter)
app.use('/enrollments', enrollmentsRouter)
app.use('/instructor', instructorRouter)
app.use('/attendance', attendanceRouter)
app.use('/admin', adminRouter)
app.use('/payment', paymentRouter)
app.use('/makeup-requests', makeupRequestsRouter)
app.use('/news', newsRouter)
app.use('/extract', extractRouter)
app.use('/ai', aiRouter)
app.use('/speaking', speakingRouter)
app.use('/writing-tests', writingTestsRouter)
app.use('/chat', chatRouter)
app.use('/api/livekit', livekitRoutes)

// ============================================================
// Socket.IO — Chat realtime
// ============================================================

// Map lưu userId → socketId (để gửi tin nhắn trực tiếp)
const userSocketMap = new Map<string, string>()

// Middleware xác thực JWT khi kết nối WebSocket
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1]
    if (!token) {
      return next(new Error('Unauthorized: No token provided'))
    }

    const decoded = await verifyToken({
      token,
      secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    })

    ;(socket as any).userId = decoded.user_id
    next()
  } catch (error) {
    next(new Error('Unauthorized: Invalid token'))
  }
})

io.on('connection', (socket) => {
  const userId = (socket as any).userId as string
  console.log(`🔌 Socket connected: userId=${userId}, socketId=${socket.id}`)

  // Lưu mapping userId → socketId
  userSocketMap.set(userId, socket.id)

  // ── Event: Client tham gia room chat ──
  socket.on('join_room', (roomId: string) => {
    // Validate roomId chứa userId
    const parts = roomId.split('_')
    if (parts.length !== 2 || !parts.includes(userId)) {
      socket.emit('error', { message: 'Bạn không có quyền tham gia phòng này' })
      return
    }
    socket.join(roomId)
    console.log(`👥 User ${userId} joined room ${roomId}`)

    // Tự động đánh dấu đã đọc khi vào room
    chatService.markMessagesAsRead(roomId, userId).catch(console.error)
  })

  // ── Event: Rời room ──
  socket.on('leave_room', (roomId: string) => {
    socket.leave(roomId)
  })

  // ── Event: Gửi tin nhắn ──
  socket.on('send_message', async (data: { roomId: string; receiverId: string; content: string }) => {
    try {
      const { roomId, receiverId, content } = data

      // Validate
      if (!roomId || !receiverId || !content?.trim()) {
        socket.emit('error', { message: 'Dữ liệu không hợp lệ' })
        return
      }

      // Validate quyền (roomId phải chứa userId)
      const parts = roomId.split('_')
      if (!parts.includes(userId) || !parts.includes(receiverId)) {
        socket.emit('error', { message: 'Không có quyền gửi tin nhắn trong phòng này' })
        return
      }

      // Lưu vào DB
      const savedMessage = await chatService.saveMessage(roomId, userId, receiverId, content)

      // Emit cho tất cả trong room (bao gồm sender)
      io.to(roomId).emit('new_message', {
        _id: (savedMessage as any)._id?.toString(),
        roomId,
        senderId: userId, // luôn là string (user_id từ JWT), FE dùng để so sánh "tin của mình"
        senderInfo: (savedMessage as any).senderId, // object populate đầy đủ để hiển thị avatar/tên
        receiverId,
        content: savedMessage.content,
        isRead: false,
        createdAt: (savedMessage as any).createdAt
      })

      // Nếu receiver không ở trong room, gửi notification riêng
      const receiverSocketId = userSocketMap.get(receiverId)
      if (receiverSocketId) {
        const receiverRooms = io.sockets.sockets.get(receiverSocketId)?.rooms
        if (receiverRooms && !receiverRooms.has(roomId)) {
          io.to(receiverSocketId).emit('new_message_notification', {
            roomId,
            senderId: userId,
            senderName: (savedMessage as any).senderId?.profile
              ? `${(savedMessage as any).senderId.profile.lastname} ${(savedMessage as any).senderId.profile.firstname}`
              : 'Người dùng',
            content: savedMessage.content,
            createdAt: (savedMessage as any).createdAt
          })
        }
      }
    } catch (error) {
      console.error('❌ send_message error:', error)
      socket.emit('error', { message: 'Lỗi khi gửi tin nhắn' })
    }
  })

  // ── Event: Đánh dấu đã đọc ──
  socket.on('mark_read', async (roomId: string) => {
    try {
      await chatService.markMessagesAsRead(roomId, userId)
      // Thông báo cho người gửi biết tin nhắn đã được đọc
      socket.to(roomId).emit('messages_read', { roomId, readBy: userId })
    } catch (error) {
      console.error('❌ mark_read error:', error)
    }
  })

  // ── Disconnect ──
  socket.on('disconnect', () => {
    userSocketMap.delete(userId)
    console.log(`🔌 Socket disconnected: userId=${userId}`)
  })
})

// ============================================================

databaseService.connect().then(() => {
  // Tự động seed đề thi writing mẫu nếu chưa có
  writingTestsService.seedDefaultTest().catch((err) => {
    console.error('❌ Seed writing test failed:', err)
  })
})

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof ErrorWithStatus) {
    if (err instanceof EntityError) {
      return res.status(err.status).json({ message: err.message, errors: err.errors })
    }
    return res.status(err.status).json({ message: err.message })
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Dữ liệu không hợp lệ',
      errors: Object.values(err.errors).map((e: any) => e.message)
    })
  }

  // Log unknown errors for easier debugging
  console.error('❌ Unhandled error in global handler:', err)

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
})

// Khởi động server (dùng httpServer thay vì app.listen để Socket.IO hoạt động)
httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
