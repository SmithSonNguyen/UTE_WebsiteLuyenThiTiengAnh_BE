import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
dotenv.config()

const app = express()
const port = process.env.PORT

//middleware: .use() - parse qua dạng json để xử lý các dữ liệu đầu vào
app.use(cookieParser())
app.use(express.json())

// middleware: nghĩa là phải chạy qua hàm use này trước, xong mới vô userRouter nếu user truy cập /users/...
app.use('/users', usersRouter)

databaseService.connect()

//Khởi động server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
