import express from 'express'
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

import adminRouter from '~/routes/admin.routes'
dotenv.config()

const app = express()
const port = process.env.PORT

//middleware: .use() - parse qua dạng json để xử lý các dữ liệu đầu vào
app.use(
  cors({
    origin: 'http://localhost:5173', // FE chạy ở đây
    credentials: true // Nếu bạn dùng cookie, jwt với header
  })
)
app.use(cookieParser())
app.use(express.json())

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

databaseService.connect()

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof ErrorWithStatus) {
    if (err instanceof EntityError) {
      return res.status(err.status).json({ message: err.message, errors: err.errors })
    }
    return res.status(err.status).json({ message: err.message })
  }
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
})

//Khởi động server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
