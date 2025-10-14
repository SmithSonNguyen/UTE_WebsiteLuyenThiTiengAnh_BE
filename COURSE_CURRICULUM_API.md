# Course Curriculum API Response Examples

## API Response Structure

### GET /courses/:id - Course với Curriculum

```json
{
  "_id": "671234567890abcdef123456",
  "title": "Complete TOEIC Preparation Course",
  "description": "Comprehensive TOEIC course with detailed curriculum",
  "type": "pre-recorded",
  "price": 2500000,
  "discountPrice": 1999000,
  "discountPercent": 20,
  "level": "intermediate",
  "targetScoreRange": {
    "min": 600,
    "max": 850
  },
  "rating": {
    "average": 4.8,
    "reviewsCount": 256
  },
  "studentsCount": 1540,
  "features": ["Video lectures", "Practice tests", "Downloadable materials", "Certificate"],
  "courseStructure": {
    "totalSessions": 32,
    "hoursPerSession": 1.5,
    "totalHours": 48,
    "durationWeeks": 16,
    "description": "32 bài học trong 16 tuần"
  },
  "preRecordedContent": {
    "totalTopics": 5,
    "totalLessons": 32,
    "totalExercises": 12,
    "accessDuration": 12,
    "accessDurationUnit": "months",
    "downloadable": true,
    "certificate": true,
    "description": "5 chủ đề, 32 bài học"
  },
  "instructor": {
    "_id": "671234567890abcdef123457",
    "name": "Ms. Sarah Johnson",
    "email": "sarah.johnson@example.com"
  },
  "thumbnail": "https://example.com/thumbnails/toeic-course.jpg",
  "status": "active",
  "curriculum": [
    {
      "_id": "671234567890abcdef123458",
      "title": "Practice Set 3: Luyện nghe chính tả",
      "description": "Luyện tập kỹ năng nghe và chính tả với các bài test thực tế",
      "orderIndex": 3,
      "learningObjectives": ["Nâng cao kỹ năng nghe hiểu", "Luyện chính tả từ vựng", "Phân biệt âm thanh tương tự"],
      "stats": {
        "totalLessons": 8,
        "totalDuration": 240,
        "estimatedHours": 4.0
      },
      "lessons": [
        {
          "_id": "671234567890abcdef123459",
          "title": "Practice Set 3 Listening test 1",
          "description": "Bài test nghe đầu tiên của practice set 3",
          "duration": 30,
          "difficulty": "medium",
          "isPreview": false,
          "contentType": "quiz",
          "orderIndex": 1,
          "isLocked": true
        },
        {
          "_id": "671234567890abcdef12345a",
          "title": "Practice Set 3 Listening test 2",
          "description": "Bài test nghe thứ hai với độ khó tăng dần",
          "duration": 30,
          "difficulty": "medium",
          "isPreview": false,
          "contentType": "quiz",
          "orderIndex": 2,
          "isLocked": true
        },
        {
          "_id": "671234567890abcdef12345b",
          "title": "Practice Set 3 Listening test 3",
          "description": "Bài test nghe thứ ba - nâng cao",
          "duration": 30,
          "difficulty": "hard",
          "isPreview": false,
          "contentType": "quiz",
          "orderIndex": 3,
          "isLocked": true
        },
        {
          "_id": "671234567890abcdef12345c",
          "title": "Practice Set 3 Listening test 4",
          "description": "Bài test nghe thứ tư - thực chiến",
          "duration": 30,
          "difficulty": "hard",
          "isPreview": false,
          "contentType": "quiz",
          "orderIndex": 4,
          "isLocked": true
        },
        {
          "_id": "671234567890abcdef12345d",
          "title": "Practice Set 3 Listening test 5",
          "description": "Bài test nghe thứ năm - comprehensive",
          "duration": 30,
          "difficulty": "hard",
          "isPreview": false,
          "contentType": "quiz",
          "orderIndex": 5,
          "isLocked": true
        },
        {
          "_id": "671234567890abcdef12345e",
          "title": "Practice Set 3 Listening test 6",
          "description": "Bài test nghe thứ sáu - mixed types",
          "duration": 30,
          "difficulty": "hard",
          "isPreview": false,
          "contentType": "quiz",
          "orderIndex": 6,
          "isLocked": true
        },
        {
          "_id": "671234567890abcdef12345f",
          "title": "Practice Set 3 Listening test 7",
          "description": "Bài test nghe thứ bảy - advanced level",
          "duration": 30,
          "difficulty": "hard",
          "isPreview": false,
          "contentType": "quiz",
          "orderIndex": 7,
          "isLocked": true
        },
        {
          "_id": "671234567890abcdef123460",
          "title": "Practice Set 3 Listening test 8",
          "description": "Bài test nghe cuối cùng - final assessment",
          "duration": 30,
          "difficulty": "hard",
          "isPreview": false,
          "contentType": "quiz",
          "orderIndex": 8,
          "isLocked": true
        }
      ]
    },
    {
      "_id": "671234567890abcdef123461",
      "title": "Practice Set 4: Luyện nghe chính tả",
      "description": "Tiếp tục luyện tập kỹ năng nghe với độ khó tăng dần",
      "orderIndex": 4,
      "learningObjectives": [
        "Hoàn thiện kỹ năng nghe hiểu",
        "Tăng tốc độ xử lý thông tin",
        "Chuẩn bị cho bài thi thực tế"
      ],
      "stats": {
        "totalLessons": 4,
        "totalDuration": 120,
        "estimatedHours": 2.0
      },
      "lessons": [
        {
          "_id": "671234567890abcdef123462",
          "title": "Practice Set 4 Listening test 1",
          "description": "Bài test đầu tiên của practice set 4",
          "duration": 30,
          "difficulty": "hard",
          "isPreview": false,
          "contentType": "quiz",
          "orderIndex": 1,
          "isLocked": true
        },
        {
          "_id": "671234567890abcdef123463",
          "title": "Practice Set 4 Listening test 2",
          "description": "Bài test thứ hai - tăng độ phức tạp",
          "duration": 30,
          "difficulty": "hard",
          "isPreview": false,
          "contentType": "quiz",
          "orderIndex": 2,
          "isLocked": true
        },
        {
          "_id": "671234567890abcdef123464",
          "title": "Practice Set 4 Listening test 3",
          "description": "Bài test thứ ba - simulation mode",
          "duration": 30,
          "difficulty": "hard",
          "isPreview": false,
          "contentType": "quiz",
          "orderIndex": 3,
          "isLocked": true
        },
        {
          "_id": "671234567890abcdef123465",
          "title": "Practice Set 4 Listening test 4",
          "description": "Bài test cuối - final preparation",
          "duration": 30,
          "difficulty": "hard",
          "isPreview": false,
          "contentType": "quiz",
          "orderIndex": 4,
          "isLocked": true
        }
      ]
    },
    {
      "_id": "671234567890abcdef123466",
      "title": "Practice Set 5: Luyện nghe chính tả",
      "description": "Practice set cuối cùng - master level",
      "orderIndex": 5,
      "learningObjectives": [
        "Đạt mức độ thành thạo cao nhất",
        "Sẵn sàng cho kỳ thi chính thức",
        "Tự tin với mọi dạng câu hỏi"
      ],
      "stats": {
        "totalLessons": 4,
        "totalDuration": 120,
        "estimatedHours": 2.0
      },
      "lessons": [
        {
          "_id": "671234567890abcdef123467",
          "title": "Practice Set 5 Listening test 1",
          "description": "Master level test 1 - expert difficulty",
          "duration": 30,
          "difficulty": "hard",
          "isPreview": false,
          "contentType": "quiz",
          "orderIndex": 1,
          "isLocked": true
        },
        {
          "_id": "671234567890abcdef123468",
          "title": "Practice Set 5 Listening test 2",
          "description": "Master level test 2 - advanced patterns",
          "duration": 30,
          "difficulty": "hard",
          "isPreview": false,
          "contentType": "quiz",
          "orderIndex": 2,
          "isLocked": true
        },
        {
          "_id": "671234567890abcdef123469",
          "title": "Practice Set 5 Listening test 3",
          "description": "Master level test 3 - complex scenarios",
          "duration": 30,
          "difficulty": "hard",
          "isPreview": false,
          "contentType": "quiz",
          "orderIndex": 3,
          "isLocked": true
        },
        {
          "_id": "671234567890abcdef12346a",
          "title": "Practice Set 5 Listening test 4",
          "description": "Final master test - ultimate challenge",
          "duration": 30,
          "difficulty": "hard",
          "isPreview": false,
          "contentType": "quiz",
          "orderIndex": 4,
          "isLocked": true
        }
      ]
    }
  ],
  "stats": {
    "totalTopics": 3,
    "totalLessons": 16,
    "totalPreviewLessons": 0,
    "totalDuration": 480,
    "totalHours": 8.0
  },
  "createdAt": "2024-10-13T10:00:00.000Z",
  "updatedAt": "2024-10-13T10:00:00.000Z"
}
```

## Frontend Component Usage

### CourseDetail Component

```jsx
// In CourseDetail.jsx
const [expandedTopics, setExpandedTopics] = useState({})

const toggleTopic = (topicId) => {
  setExpandedTopics((prev) => ({
    ...prev,
    [topicId]: !prev[topicId]
  }))
}

// Render curriculum
{
  course?.curriculum?.map((topic, index) => (
    <div key={topic._id} className='border border-gray-200 rounded-lg mb-4'>
      {/* Topic Header */}
      <div
        className='flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50'
        onClick={() => toggleTopic(topic._id)}
      >
        <div className='flex items-center'>
          <ChevronDownIcon
            className={`w-5 h-5 mr-3 transition-transform ${expandedTopics[topic._id] ? 'rotate-180' : ''}`}
          />
          <span className='font-medium text-gray-900'>{topic.title}</span>
        </div>
        <span className='text-sm text-gray-500'>{topic.stats?.totalLessons || topic.lessons?.length} bài</span>
      </div>

      {/* Topic Lessons */}
      {expandedTopics[topic._id] && (
        <div className='border-t border-gray-200'>
          {topic.lessons?.map((lesson, lessonIndex) => (
            <div key={lesson._id} className='flex items-center justify-between p-4 hover:bg-gray-50'>
              <div className='flex items-center'>
                <span className='w-6 h-6 rounded-full bg-gray-100 text-xs flex items-center justify-center mr-3'>
                  {lessonIndex + 1}
                </span>
                <span className='text-gray-700'>{lesson.title}</span>
              </div>

              {/* Lock Icon for paid lessons */}
              {lesson.isLocked && <LockClosedIcon className='w-4 h-4 text-gray-400' />}
            </div>
          ))}
        </div>
      )}
    </div>
  ))
}
```

### Course Stats Display

```jsx
// Display course statistics
<div className='bg-gray-50 p-4 rounded-lg'>
  <h3 className='font-semibold mb-3'>Thống kê khóa học</h3>
  <div className='grid grid-cols-2 gap-4 text-sm'>
    <div>
      <span className='text-gray-600'>Tổng chủ đề:</span>
      <span className='ml-2 font-medium'>{course?.stats?.totalTopics}</span>
    </div>
    <div>
      <span className='text-gray-600'>Tổng bài học:</span>
      <span className='ml-2 font-medium'>{course?.stats?.totalLessons}</span>
    </div>
    <div>
      <span className='text-gray-600'>Thời lượng:</span>
      <span className='ml-2 font-medium'>{course?.stats?.totalHours} giờ</span>
    </div>
    <div>
      <span className='text-gray-600'>Xem trước:</span>
      <span className='ml-2 font-medium'>{course?.stats?.totalPreviewLessons} bài</span>
    </div>
  </div>
</div>
```

## API Endpoints

### 1. GET /courses/:id

- Trả về thông tin course đầy đủ với curriculum
- Bao gồm topics và lessons
- Hiển thị trạng thái lock/unlock của lessons

### 2. GET /courses/:id/curriculum

- Chỉ trả về curriculum (không có course info)
- Dùng cho lazy loading hoặc separate component

### 3. GET /courses/:id/preview

- Trả về chỉ preview lessons (miễn phí)
- Dùng cho users chưa mua course

### 4. POST /courses/:id/access

- Check quyền truy cập course của user
- Trả về enrollment status và payment info
