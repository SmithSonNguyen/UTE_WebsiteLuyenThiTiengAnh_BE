# UTE Website Luyện Thi Tiếng Anh - Backend API

Backend REST API cho hệ thống học tiếng Anh TOEIC, được xây dựng với Node.js, Express, TypeScript và MongoDB.

## 🚀 Quick Start

### Cài đặt dependencies

```bash
npm install
```

### Cấu hình environment variables

Tạo file `.env` dựa trên `.env.example`:

```env
# Server Configuration
PORT=3001

# Database Configuration
DB_NAME=your_database_name
DB_USERNAME=your_mongo_username
DB_PASSWORD=your_mongo_password
DB_HOST=your_mongo_host

# JWT Configuration
SECRET_KEY=your_jwt_secret_key
REFRESH_SECRET_KEY=your_refresh_secret_key
ACCESS_TOKEN_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=100d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# VNPay Configuration
VNPAY_TMN_CODE=your_vnpay_tmn_code
VNPAY_HASH_SECRET=your_vnpay_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5173/payment/success

# News API
NEWS_API_KEY=your_newsapi_key

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Chạy ứng dụng

```bash
npm run dev    # Development mode với nodemon
npm run build  # Build TypeScript to JavaScript
npm start      # Production mode
npm run lint   # Chạy ESLint
npm run lint:fix # Tự động fix lỗi ESLint
npm run prettier # Kiểm tra formatting
npm run prettier:fix # Tự động format code
```

## 📁 Cấu trúc dự án

```
src/
├── controllers/           # Request handlers
│   ├── admin.controllers.ts          # Admin dashboard & management
│   ├── attendance.controllers.ts     # Điểm danh
│   ├── classes.controllers.ts        # Quản lý lớp học
│   ├── courses.controllers.ts        # Quản lý khóa học
│   ├── enrollments.controllers.ts    # Đăng ký khóa học
│   ├── extract.controllers.ts        # Trích xuất nội dung web
│   ├── freeentrytest.controllers.ts  # Bài test đầu vào miễn phí
│   ├── instructor.controllers.ts     # Giảng viên
│   ├── lessons.controllers.ts        # Bài học
│   ├── makeuprequests.controllers.ts # Yêu cầu học bù
│   ├── news.controllers.ts           # Tin tức
│   ├── payment.controllers.ts        # Thanh toán VNPay
│   ├── reviews.controllers.ts        # Đánh giá khóa học
│   ├── tests.controllers.ts          # Bài kiểm tra TOEIC
│   ├── userprogress.controllers.ts   # Tiến độ học tập
│   ├── users.controllers.ts          # Quản lý người dùng
│   └── userVocabulary.controllers.ts # Từ vựng cá nhân
│
├── middlewares/          # Middleware functions
│   ├── admins.middlewares.ts
│   ├── enrollments.middlewares.ts
│   ├── instructors.middlewares.ts
│   ├── lessons.middlewares.ts
│   ├── users.middlewares.ts
│   ├── usersAuth.middlewares.ts
│   └── userVocabulary.middlewares.ts
│
├── models/              # Data models & schemas
│   ├── schemas/         # Mongoose schemas
│   │   ├── Attendance.schema.ts      # Điểm danh
│   │   ├── Class.schema.ts           # Lớp học
│   │   ├── Course.schema.ts          # Khóa học
│   │   ├── Enrollment.schema.ts      # Đăng ký
│   │   ├── FreeEntryTest.schema.ts   # Test đầu vào
│   │   ├── Lesson.schema.ts          # Bài học
│   │   ├── MakeupRequest.schema.ts   # Yêu cầu học bù
│   │   ├── OTP.schema.ts             # OTP verification
│   │   ├── Payment.schema.ts         # Thanh toán
│   │   ├── Question.schema.ts        # Câu hỏi thi
│   │   ├── RefreshToken.schema.ts    # JWT refresh tokens
│   │   ├── Review.schema.ts          # Đánh giá
│   │   ├── Test.schema.ts            # Bài test TOEIC
│   │   ├── Topic.schema.ts           # Chủ đề
│   │   ├── User.schema.ts            # Người dùng
│   │   ├── UserAnswer.schema.ts      # Câu trả lời
│   │   ├── UserProgress.schema.ts    # Tiến độ học
│   │   ├── UserVocabulary.schema.ts  # Từ vựng đã lưu
│   │   └── Vocabulary.schema.ts      # Từ vựng
│   ├── requests/        # Request type definitions
│   │   ├── Attendance.requests.ts
│   │   └── User.requests.ts
│   └── Errors.ts        # Custom error classes
│
├── routes/              # API route definitions
│   ├── admin.routes.ts         # Admin APIs
│   ├── attendance.routes.ts    # Điểm danh APIs
│   ├── classes.routes.ts       # Lớp học APIs
│   ├── courses.routes.ts       # Khóa học APIs
│   ├── enrollments.routes.ts   # Đăng ký APIs
│   ├── extract.routes.ts       # Web scraping APIs
│   ├── freeentrytest.routes.ts # Test đầu vào APIs
│   ├── instructor.routes.ts    # Giảng viên APIs
│   ├── lessons.routes.ts       # Bài học APIs
│   ├── makeuprequests.routes.ts # Học bù APIs
│   ├── news.routes.ts          # Tin tức APIs
│   ├── payment.routes.ts       # Thanh toán APIs
│   ├── reviews.routes.ts       # Đánh giá APIs
│   ├── tests.routes.ts         # TOEIC test APIs
│   └── users.routes.ts         # User APIs
│
├── services/            # Business logic layer
│   ├── admin.services.ts
│   ├── attendance.services.ts
│   ├── classes.services.ts
│   ├── courses.services.ts
│   ├── database.services.ts      # MongoDB connection
│   ├── email.services.ts         # Email sending (Nodemailer)
│   ├── enrollments.services.ts
│   ├── extract.services.ts       # Web content extraction
│   ├── freeentrytest.services.ts
│   ├── instructor.services.ts
│   ├── lessons.services.ts
│   ├── makeuprequests.services.ts
│   ├── news.services.ts          # NewsAPI integration
│   ├── payment.services.ts       # VNPay integration
│   ├── reviews.services.ts
│   ├── tests.services.ts
│   ├── users.services.ts
│   └── userVocabulary.services.ts
│
├── utils/               # Utility functions
│   ├── courseUtils.ts   # Course helper functions
│   ├── crypto.ts        # Password hashing & encryption
│   ├── handlers.ts      # Request handler wrappers
│   ├── jwt.ts           # JWT token generation & validation
│   └── validation.ts    # Input validation helpers
│
├── constants/           # Application constants
│   ├── config.ts        # App configuration
│   ├── dir.ts           # Directory paths
│   ├── enum.ts          # Enumerations
│   ├── httpStatus.ts    # HTTP status codes
│   ├── messages.ts      # Response messages
│   └── regex.ts         # Regular expressions
│
├── scripts/             # Utility scripts
│   └── seedUsers.ts     # Database seeding
│
├── index.ts            # Application entry point
└── type.d.ts           # Global type declarations
```

## 🔐 Authentication & Authorization

### Hệ thống phân quyền (Role-Based Access Control)

- **Guest**: Người dùng chưa đăng nhập (có thể xem khóa học, làm test miễn phí)
- **Registered**: Người dùng đã đăng ký tài khoản, đã xác thực email
- **Paid**: Học viên đã thanh toán khóa học
- **Free**: Học viên nhận được khóa học miễn phí
- **Instructor**: Giảng viên (quản lý lớp học, điểm danh)
- **Admin**: Quản trị viên (toàn quyền hệ thống)

### OTP Verification System

Hệ thống xác thực OTP qua email cho:

- Đăng ký tài khoản mới
- Khôi phục mật khẩu
- OTP có thời hạn 5 phút
- Gửi qua Nodemailer với Gmail SMTP

### JWT Implementation

- **Access Token**: Thời hạn 7 ngày
- **Refresh Token**: Thời hạn 100 ngày
- **Auto-refresh**: Tự động gia hạn token
- **Role-based**: Phân quyền theo vai trò
- Lưu trữ trong MongoDB với schema RefreshToken

## 🛣️ API Endpoints

### 👤 Authentication & User Management (`/users`)

```bash
POST   /users/login                      # Đăng nhập
POST   /users/send-otp-register          # Gửi OTP đăng ký
POST   /users/verify-otp-register        # Xác thực OTP đăng ký
POST   /users/send-otp-reset-password    # Gửi OTP reset password
POST   /users/verify-otp-reset-password  # Xác thực OTP reset
POST   /users/reset-password             # Reset password
GET    /users/me                         # Thông tin user hiện tại 🔒
POST   /users/refresh-token              # Làm mới access token
POST   /users/logout                     # Đăng xuất 🔒
PUT    /users/update-profile             # Cập nhật profile 🔒
GET    /users/upload-signature           # Cloudinary upload signature 🔒
```

### 📚 Course Management (`/courses`)

```bash
GET    /courses/:id                      # Chi tiết khóa học
```

### 🏫 Class Management (`/classes`)

```bash
GET    /classes                          # Danh sách lớp học (filter)
GET    /classes/:classId                 # Chi tiết lớp học
GET    /classes/:classId/schedule        # Lịch học của lớp 🔒
POST   /classes/:classId/makeup-request  # Yêu cầu học bù 🔒
```

### 📝 Enrollment & Registration (`/enrollments`)

```bash
POST   /enrollments/register             # Đăng ký lớp học 🔒
GET    /enrollments/my-enrollments       # Danh sách đăng ký của tôi 🔒
GET    /enrollments/:enrollmentId        # Chi tiết đăng ký 🔒
DELETE /enrollments/:enrollmentId        # Hủy đăng ký 🔒
```

### ✅ Attendance Management (`/attendance`)

```bash
POST   /attendance                       # Tạo phiên điểm danh 🔒 (Instructor)
GET    /attendance/class/:classId        # Lấy danh sách điểm danh theo lớp 🔒
PUT    /attendance/:attendanceId/mark    # Đánh dấu điểm danh 🔒 (Instructor)
PUT    /attendance/:attendanceId/finalize # Hoàn thành điểm danh 🔒 (Instructor)
GET    /attendance/student/:studentId    # Lịch sử điểm danh học viên 🔒
```

### 🎯 TOEIC Tests (`/tests`)

```bash
GET    /tests                            # Danh sách bài test
GET    /tests/filtered                   # Lọc test theo tiêu chí
GET    /tests/:testId/questions          # Lấy câu hỏi của test
POST   /tests/:testId                    # Nộp bài test 🔒
GET    /tests/:testId/result             # Xem kết quả test 🔒
```

### 🎓 Free Entry Test (`/toeic-home`)

```bash
GET    /toeic-home/free-entry-test       # Lấy bài test đầu vào miễn phí
POST   /toeic-home/free-entry-test/submit # Nộp bài test đầu vào 🔒
GET    /toeic-home/free-entry-test/result/:resultId # Xem kết quả 🔒
```

### 💳 Payment Integration (`/payment`)

```bash
POST   /payment/vnpay                    # Tạo link thanh toán VNPay 🔒
GET    /payment/vnpay/callback           # VNPay callback (webhook)
GET    /payment/history                  # Lịch sử thanh toán 🔒
GET    /payment/access/:courseId         # Kiểm tra quyền truy cập 🔒
```

### ⭐ Review & Rating (`/reviews`)

```bash
GET    /reviews/course/:courseId         # Đánh giá của khóa học
POST   /reviews                          # Tạo đánh giá mới 🔒
PUT    /reviews/:reviewId                # Cập nhật đánh giá 🔒
DELETE /reviews/:reviewId                # Xóa đánh giá 🔒
```

### 👨‍🏫 Instructor Dashboard (`/instructor`)

```bash
GET    /instructor/profile               # Thông tin giảng viên 🔒
PUT    /instructor/profile               # Cập nhật thông tin 🔒
GET    /instructor/classes               # Danh sách lớp dạy 🔒
```

### 🔄 Makeup Requests (`/makeup-requests`)

```bash
GET    /makeup-requests/my-requests      # Yêu cầu học bù của tôi 🔒
POST   /makeup-requests                  # Tạo yêu cầu học bù 🔒
PUT    /makeup-requests/:id/approve      # Duyệt yêu cầu 🔒 (Instructor)
PUT    /makeup-requests/:id/reject       # Từ chối yêu cầu 🔒 (Instructor)
```

### 📖 Lessons & Topics (`/lessons`)

```bash
GET    /lessons                          # Danh sách bài học
GET    /lessons/:lessonId                # Chi tiết bài học
GET    /lessons/topic/:topicId           # Bài học theo chủ đề
```

### 📰 News Integration (`/news`)

```bash
GET    /news/everything                  # Tìm kiếm tin tức (NewsAPI)
GET    /news/top-headlines               # Tin tức nổi bật
```

### 🌐 Web Content Extraction (`/extract`)

```bash
POST   /extract                          # Trích xuất nội dung từ URL
```

### 🔧 Admin Panel (`/admin`) 🔒👑

**Dashboard & Analytics**

```bash
GET    /admin/overview-dashboard         # Tổng quan hệ thống
GET    /admin/revenue-by-date            # Doanh thu theo khoảng thời gian
GET    /admin/top-students               # Top học viên xuất sắc
```

**Instructor Management**

```bash
GET    /admin/instructors                # Danh sách giảng viên
POST   /admin/instructors                # Tạo tài khoản giảng viên
DELETE /admin/instructors/:instructorId  # Xóa giảng viên
POST   /admin/assign-class               # Phân công lớp cho giảng viên
GET    /admin/available-classes          # Lớp chưa có giảng viên
```

**Class Management**

```bash
GET    /admin/classes                    # Danh sách tất cả lớp học
POST   /admin/classes                    # Tạo lớp học mới
PUT    /admin/classes/:classId/instructor # Đổi giảng viên
DELETE /admin/classes/:classId           # Xóa lớp học
```

**Pre-Recorded Course Management**

```bash
GET    /admin/courses/pre-recorded       # Danh sách khóa tự học
GET    /admin/courses/pre-recorded/:courseId # Chi tiết khóa học
POST   /admin/courses/pre-recorded       # Tạo khóa học mới
PUT    /admin/courses/pre-recorded/:courseId # Cập nhật khóa học
DELETE /admin/courses/pre-recorded/:courseId # Xóa khóa học
```

**User Management**

```bash
GET    /admin/users                      # Danh sách người dùng (guest)
GET    /admin/users/:userId/enrollments  # Xem đăng ký của user
DELETE /admin/users/:userId              # Xóa người dùng
```

**Utilities**

```bash
GET    /admin/cloudinary-signature       # Cloudinary signature cho upload
```

🔒 = Yêu cầu authentication  
👑 = Yêu cầu quyền Admin

## 🔌 Third-Party Integrations

### VNPay Payment Gateway

- Thanh toán online cho khóa học
- Hỗ trợ ATM, Visa, MasterCard, QR Code
- Sandbox mode cho development
- Webhook callback xử lý kết quả thanh toán

### Cloudinary

- Upload và quản lý hình ảnh (avatar, thumbnails)
- Tự động tối ưu hóa ảnh
- CDN delivery

### NewsAPI

- Tin tức tiếng Anh cho học viên
- Real-time news updates
- Multiple sources và categories

### Nodemailer (Gmail SMTP)

- Gửi OTP verification
- Email thông báo khóa học
- Email reset password

## 📦 Core Dependencies

### Production

```json
{
  "express": "^5.1.0", // Web framework
  "mongoose": "^8.18.0", // MongoDB ODM
  "jsonwebtoken": "^10.0.1", // JWT authentication
  "bcrypt": "^6.0.0", // Password hashing
  "nodemailer": "^7.0.2", // Email sending
  "axios": "^1.13.2", // HTTP client
  "cors": "^2.8.5", // CORS middleware
  "cookie-parser": "^1.4.7", // Cookie parsing
  "date-fns": "^4.1.0", // Date utilities
  "express-validator": "^7.3.1", // Input validation
  "dotenv": "^17.2.3" // Environment variables
}
```

### Development

```json
{
  "typescript": "^5.9.2", // TypeScript compiler
  "nodemon": "^3.1.10", // Auto-reload
  "eslint": "^9.32.0", // Code linting
  "prettier": "^3.6.2", // Code formatting
  "tsx": "^4.20.3" // TypeScript execution
}
```

## 🎯 Key Features

### ✨ Student Features

- ✅ Đăng ký tài khoản với OTP verification
- ✅ Làm bài test đầu vào miễn phí
- ✅ Xem và đăng ký khóa học (live-meet & pre-recorded)
- ✅ Thanh toán online qua VNPay
- ✅ Học từ vựng và lưu từ vựng cá nhân
- ✅ Làm bài thi TOEIC online
- ✅ Xem lịch học, yêu cầu học bù
- ✅ Theo dõi tiến độ học tập
- ✅ Đọc tin tức tiếng Anh

### 👨‍🏫 Instructor Features

- ✅ Quản lý danh sách lớp dạy
- ✅ Điểm danh học viên theo buổi học
- ✅ Duyệt yêu cầu học bù
- ✅ Xem thống kê lớp học
- ✅ Cập nhật thông tin cá nhân

### 👑 Admin Features

- ✅ Dashboard tổng quan (doanh thu, học viên, khóa học)
- ✅ Quản lý giảng viên (CRUD)
- ✅ Quản lý lớp học (CRUD, phân công giảng viên)
- ✅ Quản lý khóa học tự học (CRUD)
- ✅ Quản lý người dùng
- ✅ Xem báo cáo doanh thu theo thời gian
- ✅ Top học viên xuất sắc

## 🚧 Error Handling

### Custom Error Classes

```typescript
class ErrorWithStatus extends Error {
  status: number
  message: string
}

class EntityError extends ErrorWithStatus {
  errors: Record<string, any>
}
```

### Global Error Handler

- Tự động catch và xử lý lỗi
- Trả về HTTP status code phù hợp
- Format lỗi thống nhất
- Log lỗi để debug

## 🔒 Security Features

- ✅ **JWT Authentication**: Access token & Refresh token
- ✅ **Password Hashing**: bcrypt với salt rounds
- ✅ **OTP Verification**: Email-based 2FA
- ✅ **Role-Based Access Control**: 6 roles khác nhau
- ✅ **Input Validation**: Express-validator
- ✅ **CORS Protection**: Chỉ cho phép frontend domain
- ✅ **Environment Variables**: Sensitive data trong .env
- ✅ **SQL Injection Prevention**: Mongoose ODM
- ✅ **XSS Protection**: Input sanitization

## 📝 Documentation Files

- `README.md` - Tài liệu chính
- `OTP_IMPLEMENTATION.md` - Hướng dẫn OTP system
- `EMAIL_TROUBLESHOOTING.md` - Debug email issues
- `SCHEMA_MIGRATION.md` - Database migration guide
- `BE_WebsiteLuyenThiTiengAnh.postman_collection.json` - Postman API collection

## 🧪 Testing

Import file `BE_WebsiteLuyenThiTiengAnh.postman_collection.json` vào Postman để test tất cả API endpoints.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

Private project - UTE University

## 👥 Team

Backend Development Team - UTE WebsiteLuyenThiTiengAnh
GET /courses # Danh sách khóa học
GET /courses/:id # Chi tiết khóa học
POST /courses # Tạo khóa học (instructor)
PUT /courses/:id # Cập nhật khóa học
DELETE /courses/:id # Xóa khóa học

````

### Class Management (`/classes`)

```bash
GET    /classes                        # Danh sách lớp học
GET    /classes/:id                    # Chi tiết lớp học
POST   /classes                        # Tạo lớp học
PUT    /classes/:id                    # Cập nhật lớp học
GET    /classes/:id/students           # Danh sách học viên
````

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
