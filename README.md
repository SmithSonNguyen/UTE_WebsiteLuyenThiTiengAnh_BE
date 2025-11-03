# UTE Website Luyện Thi Tiếng Anh - Backend API

Backend REST API cho hệ thống học tiếng Anh TOEIC, được xây dựng với Node.js, Express, và MongoDB.

## 🚀 Quick Start

### Cài đặt dependencies

```bash
npm install
```

### Cấu hình environment variables

Tạo file `.env` với nội dung:

```env
PORT=3001
DB_NAME=your_database_name
DB_USERNAME=your_mongo_username
DB_PASSWORD=your_mongo_password
DB_HOST=your_mongo_host
SECRET_KEY=your_jwt_secret_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
```

### Chạy ứng dụng

```bash
npm run dev    # Development mode với nodemon
npm run build  # Build TypeScript to JavaScript
npm start      # Production mode
```

## 📁 Cấu trúc dự án

```
src/
├── controllers/           # Request handlers
│   ├── users.controllers.ts
│   ├── courses.controllers.ts
│   ├── classes.controllers.ts
│   ├── attendance.controllers.ts
│   ├── tests.controllers.ts
│   ├── payment.controllers.ts
│   └── instructor.controllers.ts
├── middlewares/          # Middleware functions
│   ├── users.middlewares.ts
│   ├── usersAuth.middlewares.ts
│   └── lessons.middlewares.ts
├── models/              # Data models & schemas
│   ├── schemas/         # Mongoose schemas
│   │   ├── User.schema.ts
│   │   ├── Course.schema.ts
│   │   ├── Class.schema.ts
│   │   ├── Enrollment.schema.ts
│   │   ├── Attendance.schema.ts
│   │   ├── Test.schema.ts
│   │   ├── Question.schema.ts
│   │   ├── Payment.schema.ts
│   │   └── Review.schema.ts
│   ├── requests/        # Request type definitions
│   └── types/           # Custom TypeScript types
├── routes/              # API route definitions
│   ├── users.routes.ts
│   ├── courses.routes.ts
│   ├── classes.routes.ts
│   ├── attendance.routes.ts
│   ├── enrollments.routes.ts
│   ├── payment.routes.ts
│   └── instructor.routes.ts
├── services/            # Business logic layer
│   ├── users.services.ts
│   ├── courses.services.ts
│   ├── classes.services.ts
│   ├── attendance.services.ts
│   ├── enrollments.services.ts
│   ├── payment.services.ts
│   ├── email.services.ts
│   └── database.services.ts
├── utils/               # Utility functions
│   ├── jwt.ts
│   ├── crypto.ts
│   ├── validation.ts
│   └── handlers.ts
├── constants/           # Application constants
│   ├── config.ts
│   ├── messages.ts
│   ├── httpStatus.ts
│   └── enum.ts
└── index.ts            # Application entry point
```

## 🔐 Authentication & Authorization

### JWT Implementation

- **Access Token**: Thời hạn ngắn (15 phút)
- **Refresh Token**: Thời hạn dài (7 ngày)
- **Auto-refresh**: Tự động gia hạn token
- **Role-based**: Phân quyền theo vai trò

### User Roles

```typescript
type UserRole = 'guest' | 'registered' | 'paid' | 'free' | 'admin' | 'instructor'
```

### Authentication Middleware

```typescript
// Kiểm tra access token
app.use('/protected-route', accessTokenValidator)

// Kiểm tra role cụ thể
app.use('/instructor-only', authUser(['instructor', 'admin']))
```

## 📊 Database Models

### User Schema

```typescript
interface IUser {
  password: string
  isVerified: boolean
  profile: {
    lastname: string
    firstname: string
    email: string
    phone: string
    avatar?: string
  }
  instructorInfo: {
    position?: string
    specialization?: string
    experience?: string
  }
  role: UserRole
  purchasedCourses: string[]
}
```

### Course Schema

```typescript
interface ICourse {
  title: string
  description: string
  type: 'pre-recorded' | 'live-meet'
  price: number
  level: 'beginner' | 'intermediate' | 'advanced'
  courseStructure: {
    totalSessions: number
    hoursPerSession: number
    totalHours: number
  }
  preRecordedContent?: {
    totalTopics: number
    totalLessons: number
    videoLessons: Array<{
      title: string
      url: string
      duration?: string
    }>
  }
}
```

## 🛣️ API Endpoints

### Authentication Routes (`/users`)

```bash
POST   /users/login                    # Đăng nhập
POST   /users/send-otp-register        # Gửi OTP đăng ký
POST   /users/verify-otp-register      # Xác thực OTP đăng ký
POST   /users/send-otp-reset-password  # Gửi OTP reset password
POST   /users/verify-otp-reset-password # Xác thực OTP reset
POST   /users/reset-password           # Reset password
GET    /users/me                       # Thông tin user hiện tại
POST   /users/refresh-token            # Làm mới access token
POST   /users/logout                   # Đăng xuất
PUT    /users/update-profile           # Cập nhật profile
GET    /users/upload-signature         # Cloudinary upload signature
```

### Course Management (`/courses`)

```bash
GET    /courses                        # Danh sách khóa học
GET    /courses/:id                    # Chi tiết khóa học
POST   /courses                        # Tạo khóa học (instructor)
PUT    /courses/:id                    # Cập nhật khóa học
DELETE /courses/:id                    # Xóa khóa học
```

### Class Management (`/classes`)

```bash
GET    /classes                        # Danh sách lớp học
GET    /classes/:id                    # Chi tiết lớp học
POST   /classes                        # Tạo lớp học
PUT    /classes/:id                    # Cập nhật lớp học
GET    /classes/:id/students           # Danh sách học viên
```

### Enrollment (`/enrollments`)

```bash
GET    /enrollments/my-classes         # Lớp học của tôi
POST   /enrollments                    # Đăng ký lớp học
GET    /enrollments/:id                # Chi tiết đăng ký
PUT    /enrollments/:id/progress       # Cập nhật tiến độ
```

### Attendance Management (`/attendance`)

```bash
GET    /attendance/class/:classId      # Danh sách điểm danh lớp
POST   /attendance                     # Tạo buổi điểm danh
PUT    /attendance/update              # Cập nhật điểm danh
GET    /attendance/student/:studentId  # Lịch sử điểm danh học viên
```

### Test & Exam (`/tests`, `/freeentrytest`)

```bash
GET    /tests                          # Danh sách bài test
GET    /tests/:id                      # Chi tiết bài test
POST   /tests/:id/submit               # Nộp bài test
GET    /tests/:id/result               # Kết quả bài test
GET    /freeentrytest                  # Free entry test
POST   /freeentrytest/submit           # Nộp free entry test
```

### Payment (`/payment`)

```bash
POST   /payment/create-payment         # Tạo thanh toán VNPay
GET    /payment/vnpay-return           # Callback VNPay
GET    /payment/history               # Lịch sử thanh toán
POST   /payment/verify                # Xác thực thanh toán
```

### Instructor Dashboard (`/instructor`)

```bash
GET    /instructor/dashboard           # Dashboard data
GET    /instructor/classes             # Lớp học của giảng viên
GET    /instructor/students            # Học viên của giảng viên
GET    /instructor/attendance-stats    # Thống kê điểm danh
```

## 🔧 Configuration

### Environment Variables

```typescript
export const envConfig = {
  port: process.env.PORT || 3001,
  dbName: process.env.DB_NAME,
  dbUsername: process.env.DB_USERNAME,
  dbPassword: process.env.DB_PASSWORD,
  dbHost: process.env.DB_HOST,
  secretKey: process.env.SECRET_KEY,
  emailHost: process.env.EMAIL_HOST,
  emailPort: process.env.EMAIL_PORT,
  emailUser: process.env.EMAIL_USER,
  emailPassword: process.env.EMAIL_PASSWORD
}
```

### Database Connection

```typescript
// MongoDB connection với Mongoose
const MONGO_URI = `mongodb://${username}:${password}@${host}/${dbName}`
mongoose.connect(MONGO_URI)
```

## 🛠️ Development Tools

### Scripts

```json
{
  "dev": "npx nodemon", // Development với auto-restart
  "build": "rimraf ./dist && tsc && tsc-alias", // Build TypeScript
  "start": "node dist/index.js", // Production start
  "lint": "eslint .", // Check code quality
  "lint:fix": "eslint . --fix", // Fix linting issues
  "prettier": "prettier --check .", // Check formatting
  "prettier:fix": "prettier --write ." // Fix formatting
}
```

### Code Quality

- **TypeScript**: Type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Nodemon**: Auto-restart development server

## 📧 Email Service

### OTP Email Templates

```typescript
// Gửi OTP đăng ký
await sendOTPEmail(email, otp, 'register')

// Gửi OTP reset password
await sendOTPEmail(email, otp, 'reset-password')
```

### Email Configuration

```typescript
const transporter = nodemailer.createTransporter({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD
  }
})
```

## 💳 Payment Integration

### VNPay Configuration

```typescript
// Tạo payment URL
const paymentUrl = vnpay.buildPaymentUrl({
  amount: course.price,
  orderInfo: `Thanh toan khoa hoc ${course.title}`,
  returnUrl: 'http://localhost:3000/payment/success'
})
```

### Payment Flow

1. User chọn khóa học và thanh toán
2. Backend tạo payment request tới VNPay
3. User thực hiện thanh toán trên VNPay
4. VNPay callback về backend
5. Backend verify và cập nhật trạng thái thanh toán
6. Redirect user về frontend với kết quả

## 🔄 Data Synchronization

### Attendance Sync

```typescript
// Sync điểm danh với enrollment progress
await syncEnrollmentProgress(classId, studentId)

// Real-time attendance tracking
const realTimeAttendance = await getRealTimeAttendance(enrollmentId)
```

### Progress Tracking

- **Automatic**: Auto-update khi có attendance mới
- **Manual**: API endpoint để force sync
- **Real-time**: Hybrid approach (cached + real-time validation)

## 🧪 Testing

### Postman Collection

- Import file `BE_WebsiteLuyenThiTiengAnh.postman_collection.json`
- Bao gồm tất cả API endpoints với sample requests
- Pre-configured authentication

### Testing Strategy

```bash
# Test authentication flow
POST /users/send-otp-register
POST /users/verify-otp-register
POST /users/login

# Test course enrollment
GET /courses
POST /enrollments
GET /enrollments/my-classes

# Test instructor features
GET /instructor/dashboard
PUT /attendance/update
```

## 🚀 Production Deployment

### Build Process

```bash
npm run build  # Compile TypeScript
npm start      # Start production server
```

### Production Checklist

- [ ] Set production environment variables
- [ ] Configure production MongoDB
- [ ] Set up email service (Gmail App Password)
- [ ] Configure VNPay production credentials
- [ ] Set up reverse proxy (nginx)
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging

## 📈 Performance Optimizations

### Database

- **Indexing**: Compound indexes for frequent queries
- **Aggregation**: MongoDB aggregation pipelines
- **Pagination**: Limit + skip for large datasets

### Caching Strategy

- **In-memory**: Cache frequently accessed data
- **Redis**: For production scalability
- **Query optimization**: Efficient Mongoose queries

### Error Handling

```typescript
// Global error handler
app.use((error, req, res, next) => {
  logger.error(error.message)
  res.status(500).json({
    message: 'Internal Server Error'
  })
})
```

## 🔐 Security Features

### Data Protection

- **Password hashing**: bcrypt
- **JWT security**: Secure token generation
- **Input validation**: Express validator
- **CORS**: Cross-origin resource sharing
- **Rate limiting**: Prevent API abuse

### Best Practices

- Environment variables for sensitive data
- HTTP-only cookies for refresh tokens
- Access token short expiry
- OTP verification for critical actions

---

_Backend API Documentation - Last updated November 2025_
