import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import HTTP_STATUS from './constants/httpStatus'
import { EntityError, ErrorWithStatus } from './models/Errors'
import lessonsRouter from './routes/lessons.routes'
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

// middleware: nghĩa là phải chạy qua hàm use này trước, xong mới vô userRouter nếu user truy cập /users/...
app.use('/users', usersRouter)
app.use('/lessons', lessonsRouter)

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
