# Hướng dẫn Fix lỗi Email Service

## Vấn đề

```
Error: self-signed certificate in certificate chain
```

## Nguyên nhân

- Lỗi SSL certificate khi kết nối với Gmail SMTP
- Có thể do cấu hình mạng, firewall, hoặc corporate network

## Giải pháp

### 1. Development Mode (Khuyến nghị cho test)

Server đã được cấu hình để sử dụng mock OTP trong development:

```env
NODE_ENV=development
```

**Mock OTP**: `123456` (sẽ luôn valid trong development)

### 2. Sửa Gmail Settings

1. Đi tới [Google Account Settings](https://myaccount.google.com/)
2. Bật 2-Factor Authentication
3. Tạo App Password:
   - Security → 2-Step Verification → App Passwords
   - Select "Mail" và device
   - Copy mật khẩu 16 ký tự

### 3. Alternative Email Configuration

Thêm vào `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
```

### 4. Test Email Service

API để test email connection:

```bash
GET /api/test-email
```

## Development Testing

### Bước 1: Test với Mock OTP

1. Đảm bảo `NODE_ENV=development` trong `.env`
2. Sử dụng OTP `123456` để test flow
3. Kiểm tra console logs

### Bước 2: Test thực tế

Khi email service hoạt động:

1. Gửi OTP qua API `/otp/send-otp`
2. Kiểm tra email
3. Sử dụng OTP thực để verify

## Status Messages

### Console Logs

- ✅ `Email service is ready` - Email hoạt động bình thường
- ⚠️ `Using development mock OTP` - Đang dùng mock
- ❌ `Email service error` - Lỗi kết nối

### API Responses

- Mock mode: `"Using mock OTP for development"`
- Real mode: `"OTP sent successfully"`
