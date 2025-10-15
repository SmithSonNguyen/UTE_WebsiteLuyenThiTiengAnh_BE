import Test from '~/models/schemas/Test.schema'
import Question from '~/models/schemas/Question.schema'
import { Types } from 'mongoose'
import { Section } from '~/models/types/Section.types'

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

  getAllQuestionsOptimized: async (testId: string): Promise<Section[]> => {
    const sections = await Question.aggregate<Section>([
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
  }
}

export default testsService
