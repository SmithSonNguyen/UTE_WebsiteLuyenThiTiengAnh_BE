# Tính năng OTP Verification cho Đăng ký

## Tổng quan

Đã implement thành công hệ thống xác thực OTP (One-Time Password) cho tính năng đăng ký người dùng, tăng cường bảo mật và xác thực email.

## Backend Implementation

### 1. Database Schema (OTP.schema.ts)

- **Collection**: `otps`
- **TTL Index**: Tự động xóa OTP hết hạn
- **Fields**:
  - `email`: Email người dùng
  - `otp`: Mã OTP 6 số
  - `purpose`: 'register' | 'reset_password'
  - `isUsed`: Trạng thái đã sử dụng
  - `expiresAt`: Thời gian hết hạn (5 phút)

### 2. Email Service (email.services.ts)

- **Provider**: Gmail SMTP
- **Template**: HTML email đẹp mắt với styling
- **Features**:
  - OTP hiển thị rõ ràng
  - Thông tin thời gian hết hạn
  - Responsive design
  - Professional branding

### 3. API Endpoints

**Base URL**: `/otp`

#### POST `/send-otp`

```json
{
  "email": "user@example.com",
  "purpose": "register" // optional, default: "register"
}
```

#### POST `/verify-otp`

```json
{
  "email": "user@example.com",
  "otp": "123456",
  "purpose": "register" // optional, default: "register"
}
```

#### POST `/register-with-otp`

```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirm_password": "password123",
  "lastname": "Nguyen",
  "firstname": "Van A",
  "birthday": "1990-01-01",
  "otp": "123456"
}
```

### 4. Services Implementation

- **OTP Generation**: Random 6-digit numbers
- **Security**: Automatic cleanup of old/used OTPs
- **Validation**: Email existence check, OTP expiration
- **User Creation**: Full registration flow with JWT tokens

## Frontend Implementation

### 1. New Component (RegisterWithOTP.jsx)

- **2-step Process**: Form submission → OTP verification
- **Features**:
  - Real-time countdown timer
  - Resend OTP functionality
  - Form validation with Yup
  - Responsive UI design
  - Error handling with toast notifications

### 2. API Integration (otpApi.js)

```javascript
// Send OTP
sendOTPApi(email, purpose)

// Verify OTP
verifyOTPApi(email, otp, purpose)

// Register with OTP
registerWithOTPApi(userData)
```

### 3. Routing

- **Route**: `/register-otp`
- **Fallback**: Link từ trang register thường

## Configuration

### Environment Variables (.env)

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
```

### Gmail Setup Required

1. Enable 2-Factor Authentication
2. Generate App Password
3. Use App Password (not regular password)

## Security Features

### 1. OTP Security

- **Length**: 6 digits
- **Expiration**: 5 minutes
- **Single Use**: Auto-mark as used
- **Auto Cleanup**: TTL index

### 2. Email Validation

- **Duplicate Check**: Prevent multiple registrations
- **Format Validation**: Email format checking
- **Domain Verification**: Through email delivery

### 3. Rate Limiting

- **Resend Cooldown**: 5-minute timer
- **Old OTP Cleanup**: Remove previous codes

## User Experience

### 1. Registration Flow

1. **Form Submission**: Complete registration details
2. **OTP Email**: Receive styled email with code
3. **Verification**: Enter 6-digit code
4. **Completion**: Automatic login with tokens

### 2. Error Handling

- **Invalid OTP**: Clear error messages
- **Expired OTP**: Resend option
- **Email Issues**: Fallback instructions
- **Network Errors**: Retry mechanisms

### 3. UI Features

- **Real-time Countdown**: Visual expiration timer
- **Loading States**: Button and form states
- **Responsive Design**: Mobile-friendly
- **Accessibility**: ARIA labels and focus management

## Testing Checklist

### Backend Tests

- [ ] OTP generation uniqueness
- [ ] Email sending functionality
- [ ] OTP expiration handling
- [ ] Database cleanup
- [ ] API endpoint validation

### Frontend Tests

- [ ] Form validation
- [ ] OTP input handling
- [ ] Timer functionality
- [ ] Error state display
- [ ] Responsive design

## Production Deployment

### 1. Email Service

- Setup production Gmail account
- Generate App Password
- Configure environment variables

### 2. Database

- Ensure TTL indexes are created
- Monitor OTP collection size

### 3. Monitoring

- Email delivery rates
- OTP success rates
- User registration completion

## Future Enhancements

### 1. Additional Features

- SMS OTP as alternative
- Rate limiting per IP
- Admin dashboard for OTP stats
- Multiple language support

### 2. Security Improvements

- CAPTCHA integration
- Device fingerprinting
- Suspicious activity detection
- Audit logging

## Dependencies Added

### Backend

```json
{
  "nodemailer": "^6.9.x",
  "@types/nodemailer": "^6.4.x"
}
```

### Frontend

```json
{
  "react-toastify": "^9.1.x"
}
```

## File Structure

### Backend

```
src/
├── controllers/otp.controllers.ts
├── routes/otp.routes.ts
├── services/email.services.ts
├── models/schemas/OTP.schema.ts
└── constants/messages.ts (updated)
```

### Frontend

```
src/
├── pages/auth/RegisterWithOTP.jsx
├── api/otpApi.js
└── routes/AppRouter.jsx (updated)
```

---

**Status**: ✅ Implementation Complete
**Testing**: Ready for development testing
**Documentation**: Complete with examples
