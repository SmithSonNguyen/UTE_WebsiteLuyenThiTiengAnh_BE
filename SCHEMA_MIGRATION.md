# Course Management System - Database Schema

## Tổng quan

Hệ thống đã được tái cấu trúc thành 3 schema chính:

### 1. Course Schema

- **Mục đích**: Lưu trữ thông tin khóa học tổng quan
- **Loại bỏ**: `schedule` (đã chuyển sang Class)
- **Thêm mới**: `courseStructure` với validation

### 2. Class Schema (Mới)

- **Mục đích**: Quản lý các lớp học cụ thể của từng khóa học
- **Bao gồm**: schedule, instructor, capacity management

### 3. Enrollment Schema (Mới)

- **Mục đích**: Quản lý việc đăng ký học viên vào lớp
- **Bao gồm**: progress tracking, payment status

## Ví dụ Data Flow

### 1. Tạo Course

```javascript
const course = new Course({
  title: 'TOEIC Intensive Course',
  description: 'Comprehensive TOEIC preparation course',
  type: 'live-meet',
  price: 2000000,
  level: 'intermediate',
  targetScoreRange: { min: 600, max: 850 },
  courseStructure: {
    totalSessions: 20,
    hoursPerSession: 2.5,
    totalHours: 50, // 20 * 2.5
    durationWeeks: 10,
    description: '20 sessions over 10 weeks, 2 sessions per week'
  },
  features: ['Live interaction', 'Practice tests', 'Certificate'],
  status: 'active'
})
```

### 2. Tạo Classes cho Course

```javascript
// Class 1: Thứ 2, 4, 6 - 19:00
const class1 = new Class({
  courseId: course._id,
  className: 'TOEIC Intensive - Evening Class A',
  instructor: instructorId1,
  schedule: {
    days: ['Monday', 'Wednesday', 'Friday'],
    time: '19:00',
    timezone: 'Asia/Ho_Chi_Minh',
    meetLink: 'https://zoom.us/j/123456789',
    startDate: new Date('2024-02-01'),
    durationWeeks: 10
  },
  capacity: {
    maxStudents: 25,
    currentStudents: 0
  }
})

// Class 2: Thứ 3, 5, 7 - 09:00
const class2 = new Class({
  courseId: course._id,
  className: 'TOEIC Intensive - Morning Class B',
  instructor: instructorId2,
  schedule: {
    days: ['Tuesday', 'Thursday', 'Saturday'],
    time: '09:00',
    timezone: 'Asia/Ho_Chi_Minh',
    meetLink: 'https://zoom.us/j/987654321',
    startDate: new Date('2024-02-05'),
    durationWeeks: 10
  },
  capacity: {
    maxStudents: 20,
    currentStudents: 0
  }
})
```

### 3. Student Enrollment

```javascript
const enrollment = new Enrollment({
  studentId: studentId,
  classId: class1._id,
  courseId: course._id,
  progress: {
    sessionsAttended: 0,
    totalSessions: 20,
    completionPercentage: 0
  },
  paymentStatus: 'paid',
  paymentInfo: {
    amount: 2000000,
    paymentDate: new Date(),
    transactionId: 'TXN123456'
  }
})
```

## API Endpoints Cần Update

### 1. GET /courses

```javascript
// Trả về course list với class count
const courses = await Course.aggregate([
  { $match: { status: 'active' } },
  {
    $lookup: {
      from: 'classes',
      localField: '_id',
      foreignField: 'courseId',
      as: 'classes'
    }
  },
  {
    $addFields: {
      availableClasses: {
        $size: {
          $filter: {
            input: '$classes',
            cond: { $eq: ['$$this.status', 'scheduled'] }
          }
        }
      }
    }
  }
])
```

### 2. GET /courses/:id/classes

```javascript
// Lấy tất cả classes của một course
const classes = await Class.find({
  courseId: courseId,
  status: { $in: ['scheduled', 'ongoing'] }
})
  .populate('instructor', 'name email')
  .sort({ 'schedule.startDate': 1 })
```

### 3. POST /enrollments

```javascript
// Đăng ký vào class cụ thể
const enrollment = new Enrollment({
  studentId: req.user._id,
  classId: req.body.classId,
  courseId: req.body.courseId,
  progress: {
    totalSessions: courseStructure.totalSessions
  }
})

// Update class capacity
await Class.findByIdAndUpdate(classId, {
  $inc: { 'capacity.currentStudents': 1 }
})
```

## Migration Script

```javascript
// Script để migrate data từ old schema sang new schema
async function migrateCourseData() {
  const oldCourses = await Course.find({ schedule: { $exists: true } })

  for (const course of oldCourses) {
    // Create default class from course schedule
    const newClass = new Class({
      courseId: course._id,
      className: `${course.title} - Default Class`,
      instructor: course.instructor,
      schedule: course.schedule,
      capacity: {
        maxStudents: course.schedule.maxStudents,
        currentStudents: course.studentsCount
      }
    })
    await newClass.save()

    // Remove schedule from course
    await Course.findByIdAndUpdate(course._id, {
      $unset: { schedule: 1 },
      $set: {
        courseStructure: {
          totalSessions: course.schedule.durationWeeks * 2, // estimate
          hoursPerSession: course.schedule.durationPerSession || 2,
          totalHours: course.schedule.durationWeeks * 2 * (course.schedule.durationPerSession || 2)
        }
      }
    })
  }
}
```

## Lợi ích của Architecture mới

1. **Flexibility**: Một course có thể có nhiều class với schedule khác nhau
2. **Scalability**: Dễ dàng thêm instructor, thay đổi capacity
3. **Tracking**: Theo dõi được progress của từng student trong từng class
4. **Management**: Quản lý enrollment, payment, attendance riêng biệt
5. **Analytics**: Dễ dàng thống kê theo class, course, instructor
