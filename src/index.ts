import express from 'express'
import usersRouter from './routes/users.routes'

const app = express()
const port = 3000

//middleware: .use() - parse qua dạng json để xử lý các dữ liệu đầu vào
app.use(express.json())

// middleware: nghĩa là phải chạy qua hàm use này trước, xong mới vô userRouter nếu user truy cập /users/...
app.use('/users', usersRouter)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
