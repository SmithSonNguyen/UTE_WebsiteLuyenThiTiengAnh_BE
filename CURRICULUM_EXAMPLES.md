# Curriculum Management System - Example Usage

## Tạo khóa học Pre-recorded với Topics và Lessons

### 1. Tạo Course

```javascript
const course = await Course.create({
  title: 'Complete TOEIC Preparation Course',
  description: 'Comprehensive TOEIC course with detailed curriculum',
  type: 'pre-recorded',
  price: 2500000,
  level: 'intermediate',
  targetScoreRange: { min: 600, max: 850 },
  courseStructure: {
    totalSessions: 50, // Will be updated from lessons
    hoursPerSession: 1.5,
    totalHours: 75,
    durationWeeks: 16,
    description: '50 bài học trong 16 tuần'
  },
  preRecordedContent: {
    totalTopics: 0, // Will auto-calculate
    totalLessons: 0, // Will auto-calculate
    totalExercises: 0, // Will auto-calculate
    accessDuration: 12,
    accessDurationUnit: 'months',
    downloadable: true,
    certificate: true
  },
  features: ['Video lectures', 'Practice tests', 'Downloadable materials', 'Certificate'],
  status: 'active'
})
```

### 2. Tạo Topics

```javascript
const topics = await Topic.create([
  {
    course: course._id,
    title: 'TOEIC Listening Part 1 - Photographs',
    description: 'Học cách mô tả hình ảnh và nhận diện từ vựng',
    orderIndex: 1,
    learningObjectives: [
      'Nhận diện từ vựng mô tả người và vật',
      'Phân biệt thì hiện tại và quá khứ',
      'Nắm vững cấu trúc câu mô tả hành động'
    ],
    stats: {
      totalLessons: 0, // Will be updated automatically
      totalDuration: 0,
      estimatedHours: 0
    }
  },
  {
    course: course._id,
    title: 'TOEIC Listening Part 2 - Question-Response',
    description: 'Luyện nghe và trả lời câu hỏi ngắn',
    orderIndex: 2,
    learningObjectives: [
      'Nhận diện các loại câu hỏi Wh-questions',
      'Phân biệt Yes/No questions',
      'Nắm vững các câu trả lời thông dụng'
    ]
  },
  {
    course: course._id,
    title: 'TOEIC Reading Part 5 - Incomplete Sentences',
    description: 'Grammar và vocabulary cho câu hỏi điền khuyết',
    orderIndex: 3,
    learningObjectives: [
      'Nắm vững các cấu trúc ngữ pháp cơ bản',
      'Học từ vựng theo chủ đề',
      'Phương pháp làm bài hiệu quả'
    ]
  },
  {
    course: course._id,
    title: 'Mock Tests & Final Review',
    description: 'Kiểm tra tổng hợp và ôn tập cuối khóa',
    orderIndex: 4,
    learningObjectives: ['Làm bài thi thử hoàn chỉnh', 'Ôn tập kiến thức tổng quát', 'Chiến lược làm bài thi']
  }
])
```

### 3. Tạo Lessons cho từng Topic

```javascript
// Topic 1: TOEIC Listening Part 1
const topic1Lessons = await Lesson.create([
  {
    course: course._id,
    topic: topics[0]._id,
    title: 'Giới thiệu TOEIC Listening Part 1',
    description: 'Tổng quan về cấu trúc và chiến lược làm bài',
    orderIndex: 1,
    content: {
      type: 'video',
      videoUrl: 'https://example.com/videos/intro-part1.mp4',
      videoDuration: 1200, // 20 minutes
      videoThumbnail: 'https://example.com/thumbs/intro-part1.jpg'
    },
    duration: 20,
    difficulty: 'easy',
    isPreview: true, // Cho phép xem trước miễn phí
    isRequired: true,
    attachments: [
      {
        name: 'TOEIC Part 1 Study Guide.pdf',
        url: 'https://example.com/files/part1-guide.pdf',
        type: 'pdf',
        size: 2048000 // 2MB
      }
    ]
  },
  {
    course: course._id,
    topic: topics[0]._id,
    title: 'Từ vựng mô tả người',
    description: 'Học từ vựng về ngoại hình, hành động của con người',
    orderIndex: 2,
    content: {
      type: 'video',
      videoUrl: 'https://example.com/videos/vocabulary-people.mp4',
      videoDuration: 1800, // 30 minutes
      videoThumbnail: 'https://example.com/thumbs/vocab-people.jpg'
    },
    duration: 30,
    difficulty: 'medium',
    isPreview: false,
    isRequired: true
  },
  {
    course: course._id,
    topic: topics[0]._id,
    title: 'Bài tập thực hành Part 1',
    description: '20 câu hỏi thực hành với đáp án chi tiết',
    orderIndex: 3,
    content: {
      type: 'quiz',
      quizId: null, // Reference to Quiz collection (create separately)
      exerciseData: {
        questions: 20,
        timeLimit: 1200, // 20 minutes
        passingScore: 70
      }
    },
    duration: 25,
    difficulty: 'medium',
    isPreview: false,
    isRequired: true
  }
])

// Topic 2: TOEIC Listening Part 2
const topic2Lessons = await Lesson.create([
  {
    course: course._id,
    topic: topics[1]._id,
    title: 'Chiến lược làm bài Part 2',
    description: 'Phương pháp nghe và xác định đáp án đúng',
    orderIndex: 1,
    content: {
      type: 'video',
      videoUrl: 'https://example.com/videos/strategy-part2.mp4',
      videoDuration: 1500, // 25 minutes
      videoThumbnail: 'https://example.com/thumbs/strategy-part2.jpg'
    },
    duration: 25,
    difficulty: 'medium',
    isPreview: false,
    isRequired: true
  },
  {
    course: course._id,
    topic: topics[1]._id,
    title: 'Wh-Questions Practice',
    description: 'Luyện tập với các câu hỏi Who, What, When, Where',
    orderIndex: 2,
    content: {
      type: 'video',
      videoUrl: 'https://example.com/videos/wh-questions.mp4',
      videoDuration: 2100, // 35 minutes
      videoThumbnail: 'https://example.com/thumbs/wh-questions.jpg'
    },
    duration: 35,
    difficulty: 'hard',
    isPreview: false,
    isRequired: true
  }
])
```

### 4. Auto-update Course statistics

```javascript
// Update course với statistics từ topics và lessons
await course.updatePreRecordedStats()

// Check kết quả
const updatedCourse = await Course.findById(course._id)
console.log('Course statistics:', updatedCourse.preRecordedContent)
/*
Expected output:
{
  totalTopics: 4,
  totalLessons: 5,
  totalExercises: 1,
  accessDuration: 12,
  accessDurationUnit: "months",
  downloadable: true,
  certificate: true,
  description: "4 chủ đề, 5 bài học"
}
*/
```

### 5. Query Curriculum cho Frontend

```javascript
// Lấy curriculum đầy đủ cho course detail page
const getCurriculum = async (courseId) => {
  const curriculum = await Topic.find({
    course: courseId,
    status: 'active'
  })
    .sort({ orderIndex: 1 })
    .populate({
      path: 'course',
      select: 'title type preRecordedContent'
    })

  // Lấy lessons cho từng topic
  for (let topic of curriculum) {
    topic.lessons = await Lesson.find({
      topic: topic._id,
      status: 'active'
    })
      .sort({ orderIndex: 1 })
      .select('title description duration difficulty isPreview content.type attachments')
  }

  return curriculum
}

// Lấy preview lessons (miễn phí)
const getPreviewLessons = async (courseId) => {
  return await Lesson.find({
    course: courseId,
    isPreview: true,
    status: 'active'
  })
    .populate('topic', 'title orderIndex')
    .sort({ 'topic.orderIndex': 1, orderIndex: 1 })
}
```

### 6. User Progress Tracking

```javascript
// Tạo progress tracking khi user bắt đầu khóa học
const initializeUserProgress = async (userId, courseId) => {
  const topics = await Topic.find({ course: courseId, status: 'active' })
  const lessons = await Lesson.find({ course: courseId, status: 'active' })

  const userProgress = await UserProgress.create({
    user: userId,
    course: courseId,
    overallProgress: {
      totalTopics: topics.length,
      totalLessons: lessons.length,
      completionPercentage: 0
    },
    topicProgress: topics.map((topic) => ({
      topic: topic._id,
      totalLessons: lessons.filter((l) => l.topic.toString() === topic._id.toString()).length,
      completionPercentage: 0,
      timeSpent: 0
    })),
    lessonProgress: lessons.map((lesson) => ({
      lesson: lesson._id,
      status: 'not_started',
      progress: 0,
      timeSpent: 0,
      lastAccessedAt: new Date()
    }))
  })

  return userProgress
}

// Update progress khi user hoàn thành lesson
const markLessonCompleted = async (userId, courseId, lessonId, timeSpent = 0) => {
  const userProgress = await UserProgress.findOne({ user: userId, course: courseId })

  // Update lesson progress
  const lessonProgressIndex = userProgress.lessonProgress.findIndex(
    (lp) => lp.lesson.toString() === lessonId.toString()
  )

  if (lessonProgressIndex !== -1) {
    userProgress.lessonProgress[lessonProgressIndex].status = 'completed'
    userProgress.lessonProgress[lessonProgressIndex].progress = 100
    userProgress.lessonProgress[lessonProgressIndex].completedAt = new Date()
    userProgress.lessonProgress[lessonProgressIndex].timeSpent += timeSpent
  }

  // Update overall progress
  await userProgress.updateOverallProgress()

  return userProgress
}
```

## Lợi ích của cấu trúc này:

1. **📚 Curriculum rõ ràng**: Topics -> Lessons hierarchy
2. **📊 Auto-sync statistics**: Course stats tự động cập nhật từ Topics/Lessons
3. **🎯 Progress tracking**: Theo dõi chi tiết tiến độ học tập
4. **🔍 Flexible queries**: Dễ dàng query theo nhiều tiêu chí
5. **📱 Preview support**: Cho phép xem trước một số lessons miễn phí
6. **📈 Analytics ready**: Dữ liệu sẵn sàng cho báo cáo và phân tích
