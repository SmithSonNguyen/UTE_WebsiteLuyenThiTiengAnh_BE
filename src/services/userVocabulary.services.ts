import { ObjectId } from 'mongodb'
import UserVocabulary from '~/models/schemas/UserVocabulary.schema'

interface SaveVocabularyPayload {
  userId: string
  word: string
  explanation: string
  sourceLanguage?: string
  contextExample?: string
  tags?: string[]
}

interface GetVocabulariesOptions {
  userId: string
  page?: number
  limit?: number
  search?: string
  tags?: string[]
  isFavorite?: boolean
  sortBy?: 'createdAt' | 'word'
  sortOrder?: 'asc' | 'desc'
}

class UserVocabularyService {
  /**
   * Lưu từ vựng mới của user
   */
  async saveUserVocabulary(payload: SaveVocabularyPayload) {
    const { userId, word, explanation, sourceLanguage, contextExample, tags } = payload

    // Kiểm tra xem từ này đã tồn tại chưa
    const existingVocab = await UserVocabulary.findOne({
      userId: new ObjectId(userId),
      word: word.toLowerCase().trim()
    })

    if (existingVocab) {
      // Nếu đã tồn tại, cập nhật thông tin
      existingVocab.explanation = explanation
      if (sourceLanguage) existingVocab.sourceLanguage = sourceLanguage
      if (contextExample) existingVocab.contextExample = contextExample
      if (tags && tags.length > 0) {
        existingVocab.tags = Array.from(new Set([...(existingVocab.tags ?? []), ...tags]))
      }

      await existingVocab.save()

      return {
        message: 'Vocabulary updated successfully',
        data: existingVocab,
        isNew: false
      }
    }

    // Tạo mới từ vựng
    const newVocabulary = new UserVocabulary({
      userId: new ObjectId(userId),
      word: word.toLowerCase().trim(),
      explanation,
      sourceLanguage: sourceLanguage || 'en',
      contextExample,
      tags: tags || [],
      isFavorite: false,
      reviewCount: 0
    })

    await newVocabulary.save()

    return {
      message: 'Vocabulary saved successfully',
      data: newVocabulary,
      isNew: true
    }
  }

  /**
   * Lấy danh sách từ vựng của user với phân trang và filter
   */
  async getUserVocabularies(options: GetVocabulariesOptions) {
    const { userId, page = 1, limit = 20, search, tags, isFavorite, sortBy = 'createdAt', sortOrder = 'desc' } = options

    // Build query
    const query: any = { userId: new ObjectId(userId) }

    if (search) {
      query.$or = [{ word: { $regex: search, $options: 'i' } }, { explanation: { $regex: search, $options: 'i' } }]
    }

    if (tags && tags.length > 0) {
      query.tags = { $in: tags }
    }

    if (isFavorite !== undefined) {
      query.isFavorite = isFavorite
    }

    // Tính toán phân trang
    const skip = (page - 1) * limit

    // Sắp xếp
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    // Lấy dữ liệu
    const [vocabularies, total] = await Promise.all([
      UserVocabulary.find(query).sort(sort).skip(skip).limit(limit).lean(),
      UserVocabulary.countDocuments(query)
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: vocabularies,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  }

  /**
   * Xóa từ vựng
   */
  async deleteUserVocabulary(userId: string, vocabularyId: string) {
    const result = await UserVocabulary.findOneAndDelete({
      _id: new ObjectId(vocabularyId),
      userId: new ObjectId(userId)
    })

    if (!result) {
      throw new Error('Vocabulary not found or unauthorized')
    }

    return {
      message: 'Vocabulary deleted successfully'
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(userId: string, vocabularyId: string) {
    const vocabulary = await UserVocabulary.findOne({
      _id: new ObjectId(vocabularyId),
      userId: new ObjectId(userId)
    })

    if (!vocabulary) {
      throw new Error('Vocabulary not found or unauthorized')
    }

    vocabulary.isFavorite = !vocabulary.isFavorite
    await vocabulary.save()

    return {
      message: 'Favorite status updated',
      data: vocabulary
    }
  }

  /**
   * Cập nhật review count
   */
  async updateReviewCount(userId: string, vocabularyId: string) {
    const vocabulary = await UserVocabulary.findOne({
      _id: new ObjectId(vocabularyId),
      userId: new ObjectId(userId)
    })

    if (!vocabulary) {
      throw new Error('Vocabulary not found or unauthorized')
    }

    vocabulary.reviewCount = (vocabulary.reviewCount || 0) + 1
    vocabulary.lastReviewedAt = new Date()
    await vocabulary.save()

    return {
      message: 'Review count updated',
      data: vocabulary
    }
  }

  /**
   * Lấy thống kê từ vựng của user
   */
  async getUserVocabularyStats(userId: string) {
    const stats = await UserVocabulary.aggregate([
      { $match: { userId: new ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          favorites: { $sum: { $cond: ['$isFavorite', 1, 0] } },
          totalReviews: { $sum: '$reviewCount' }
        }
      }
    ])

    const tagStats = await UserVocabulary.aggregate([
      { $match: { userId: new ObjectId(userId) } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])

    return {
      total: stats[0]?.total || 0,
      favorites: stats[0]?.favorites || 0,
      totalReviews: stats[0]?.totalReviews || 0,
      topTags: tagStats.map((t) => ({ tag: t._id, count: t.count }))
    }
  }
}

export default new UserVocabularyService()
