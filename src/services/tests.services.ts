import Test from '~/models/schemas/Test.schema'
import Question from '~/models/schemas/Question.schema'
import { Types } from 'mongoose'
import UserAnswer, { IUserAnswerItem } from '~/models/schemas/UserAnswer.schema'

// Interface cho kết quả trả về từ aggregation
interface QuestionSection {
  _id: string
  part: number
  title: string
  questions: unknown[]
  createdAt?: Date
  updatedAt?: Date
}

// Interface cho filter parameters
interface TestFilterParams {
  category?: string
  year?: string
  search?: string
  difficulty?: string
  page?: string
  limit?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

const testsService = {
  getAllTests: async () => {
    return await Test.find()
  },

  getFilteredTests: async (filterParams: TestFilterParams) => {
    const {
      category,
      year,
      search,
      difficulty,
      page = '1',
      limit = '12',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filterParams

    // Build filter object
    const filter: Record<string, unknown> = {}

    // Category filter
    if (category && category !== 'tat-ca') {
      filter.category = category
    }

    // Year filter
    if (year) {
      filter.year = parseInt(year)
    }

    // Difficulty filter
    if (difficulty) {
      filter.difficulty = difficulty
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { testId: { $regex: search, $options: 'i' } }
      ]
    }

    // Pagination
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Sort object
    const sort: Record<string, 1 | -1> = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Execute query
    const [tests, total] = await Promise.all([
      Test.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
      Test.countDocuments(filter)
    ])

    // Get available filters for frontend
    const [availableYears, availableCategories] = await Promise.all([Test.distinct('year'), Test.distinct('category')])

    return {
      tests,
      total,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      },
      filters: {
        availableYears: availableYears.sort((a: number, b: number) => b - a),
        availableCategories: availableCategories.sort()
      }
    }
  },

  getAllQuestionsOptimized: async (testId: string): Promise<QuestionSection[]> => {
    const sections = await Question.aggregate<QuestionSection>([
      // 1. Lọc theo testId
      {
        $match: { testId }
      },

      // 2. Sắp xếp các câu hỏi con theo number
      {
        $addFields: {
          questions: {
            $sortArray: {
              input: '$questions',
              sortBy: { number: 1 }
            }
          }
        }
      },

      // 3. Tạo sortKey để sắp xếp các section
      {
        $addFields: {
          sortKey: {
            $concat: [{ $toString: '$part' }, '.', { $toString: { $min: '$questions.number' } }]
          }
        }
      },

      // 4. Sắp xếp theo sortKey
      {
        $sort: { sortKey: 1 }
      },

      // 5. Loại bỏ trường sortKey (nếu không cần trong output)
      {
        $unset: ['sortKey', 'questions.answer']
      }
    ])

    return sections
  },

  // now accepts optional mark and rightAnswerNumber which come from frontend grading
  saveUserAnswers: async (
    userId: string,
    testId: string,
    answers: IUserAnswerItem[],
    mark?: number | null,
    rightAnswerNumber?: number | null
  ) => {
    const payload: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      testId,
      answers
    }

    if (typeof mark === 'number') payload.mark = mark
    if (typeof rightAnswerNumber === 'number') payload.rightAnswerNumber = rightAnswerNumber

    // ✅ Luôn tạo mới document cho mỗi attempt (không update cái cũ)
    // Điều này giúp track lịch sử đầy đủ của user
    const userAnswer = new UserAnswer(payload)
    return await userAnswer.save()
  },

  getAllAnswers: async (testId: string) => {
    const questions = await Question.find({ testId }).lean()

    // Gom theo part (để frontend còn biết kỹ năng nào là listening/reading)
    const sectionsMap = new Map()

    for (const q of questions) {
      if (!sectionsMap.has(q.part)) {
        sectionsMap.set(q.part, {
          part: q.part,
          type: q.part <= 4 ? 'listening' : 'reading',
          questions: []
        })
      }

      // Mỗi câu chỉ cần number + answer
      const subQs = Array.isArray(q.questions)
        ? q.questions.map((x) => ({
            number: x.number,
            answer: x.answer
          }))
        : []

      sectionsMap.get(q.part).questions.push(...subQs)
    }

    // Sort lại toàn bộ
    const result = Array.from(sectionsMap.values()).map((section) => ({
      ...section,
      questions: section.questions.sort((a: { number: number }, b: { number: number }) => a.number - b.number)
    }))

    return result
  },

  // ✅ Lấy toàn bộ kết quả làm bài của user cho một test cụ thể
  getUserTestAttempts: async (userId: string, testId: string) => {
    // Lấy tất cả lần làm của user cho test này
    const attempts = await UserAnswer.find({
      userId: new Types.ObjectId(userId),
      testId
    })
      .sort({ createdAt: -1 })
      .lean()

    return attempts
  },

  // ✅ Lấy toàn bộ lịch sử làm bài của user (tất cả tests)
  getUserTestHistory: async (userId: string) => {
    const history = await UserAnswer.find({
      userId: new Types.ObjectId(userId)
    })
      .sort({ createdAt: -1 })
      .lean()

    return history
  },

  getTestById: async (testId: string) => {
    return await Test.findOne({
      testId
    }).lean()
  }
}

export default testsService
