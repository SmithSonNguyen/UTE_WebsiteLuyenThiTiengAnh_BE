import { Types } from 'mongoose'
import WritingTest, { IWritingTest } from '~/models/schemas/WritingTest.schema'
import WritingResult, { IAIFeedback, IWritingAnswerItem } from '~/models/schemas/WritingResult.schema'

// ─── Seed data: đề thi mẫu khớp với dữ liệu hardcode trong FE ─────────────────

const SEED_WRITING_TEST = {
  writingTestId: 'mock-writing-01',
  name: 'TOEIC Writing Test – Đề 01',
  description: 'Đề thi thử TOEIC Writing với đầy đủ 3 phần: mô tả ảnh, phản hồi email và viết luận.',
  duration: 60,
  difficulty: 'intermediate' as const,
  completedCount: 0,
  questions: [
    // ── Part 1: Photo Description (Q1–5) ──────────────────────────────────────
    {
      questionNumber: 1,
      part: 1 as const,
      type: 'photo_description' as const,
      imageUrl: 'https://s4-media1.study4.com/media/toeic_sw_tests/writing/image17.png'
    },
    {
      questionNumber: 2,
      part: 1 as const,
      type: 'photo_description' as const,
      imageUrl: 'https://s4-media1.study4.com/media/toeic_sw_tests/writing/image3.png'
    },
    {
      questionNumber: 3,
      part: 1 as const,
      type: 'photo_description' as const,
      imageUrl: 'https://s4-media1.study4.com/media/toeic_sw_tests/writing/image19.png'
    },
    {
      questionNumber: 4,
      part: 1 as const,
      type: 'photo_description' as const,
      imageUrl: 'https://s4-media1.study4.com/media/toeic_sw_tests/writing/image41.png'
    },
    {
      questionNumber: 5,
      part: 1 as const,
      type: 'photo_description' as const,
      imageUrl: 'https://s4-media1.study4.com/media/toeic_sw_tests/writing/image24.png'
    },

    // ── Part 2: Email Response (Q6–7) ─────────────────────────────────────────
    {
      questionNumber: 6,
      part: 2 as const,
      type: 'email_response' as const,
      emailFrom: 'update@dailyjobseeker.com',
      emailTo: 'Anna Billings',
      emailSubject: 'Daily Jobseeker update',
      emailSent: 'March 14, 20—',
      emailBody:
        'Dear Daily Jobseeker subscriber,\n\nMarleyhome Inc. is looking for an experienced accountant to fill a vacancy in its Accounting Department. The company needs someone with an accounting degree and at least three years of experience. Contact Ralph Kramer, r_kramer@marleyhome.com.',
      emailDirections:
        'Directions: Respond to the e-mail as if you are interested in applying for the position. Make ONE statement about your professional background and TWO requests for information about the job.'
    },
    {
      questionNumber: 7,
      part: 2 as const,
      type: 'email_response' as const,
      emailFrom: 'Elisa Hays, Front Desk Supervisor',
      emailTo: 'Front desk agents, Hotel Mediterraneo',
      emailSubject: 'Reservation system',
      emailSent: 'December 1, 20—',
      emailBody:
        'It has come to my attention that several of you have experienced problems with the reservation system recently. Please send me a complete list of the issues that each of you have encountered.\n\nSincerely,\nElisa Hays\nFront Desk Supervisor',
      emailDirections:
        'Directions: Respond to the e-mail as if you are a front desk agent at Hotel Mediterraneo. In your e-mail, describe THREE problems with the reservation system.'
    },

    // ── Part 3: Opinion Essay (Q8) ────────────────────────────────────────────
    {
      questionNumber: 8,
      part: 3 as const,
      type: 'opinion_essay' as const,
      essayPrompt:
        'Many people enjoy spending time playing and watching sports. Why do you think sports are important to people? Give specific reasons and examples to support your opinion.'
    }
  ]
}

// ─── Service ───────────────────────────────────────────────────────────────────

const writingTestsService = {
  /**
   * Đảm bảo seed data tồn tại trong DB.
   * Được gọi 1 lần khi server khởi động (hoặc gọi thủ công).
   */
  seedDefaultTest: async (): Promise<void> => {
    const exists = await WritingTest.findOne({ writingTestId: SEED_WRITING_TEST.writingTestId })
    if (!exists) {
      await WritingTest.create(SEED_WRITING_TEST)
      console.log('✅ Seeded default writing test: writing-001')
    }
  },

  /**
   * Lấy danh sách tất cả đề thi writing (không bao gồm chi tiết câu hỏi).
   */
  getAllWritingTests: async () => {
    return await WritingTest.find().select('-questions').sort({ createdAt: -1 }).lean()
  },

  /**
   * Lấy chi tiết 1 đề thi theo writingTestId (bao gồm tất cả câu hỏi).
   */
  getWritingTestById: async (writingTestId: string): Promise<IWritingTest | null> => {
    return await WritingTest.findOne({ writingTestId }).lean()
  },

  /**
   * Nộp bài – lưu kết quả vào collection writingresults.
   * Nếu user đã làm bài này trước đó → cập nhật, không tạo mới.
   */
  submitWritingTest: async (
    userId: string,
    writingTestId: string,
    answers: IWritingAnswerItem[],
    aiFeedback?: IAIFeedback | null
  ) => {
    const userObjectId = new Types.ObjectId(userId)

    // Kiểm tra đã làm bài chưa
    const existing = await WritingResult.findOne({ userId: userObjectId, writingTestId })

    if (existing) {
      // Cập nhật bài cũ
      existing.answers = answers
      existing.submittedAt = new Date()
      if (aiFeedback) existing.aiFeedback = aiFeedback
      await existing.save()
      return { result: existing, isNew: false }
    } else {
      // Tạo mới
      const newResult = await WritingResult.create({
        userId: userObjectId,
        writingTestId,
        answers,
        aiFeedback: aiFeedback ?? null,
        submittedAt: new Date()
      })

      // Tăng completedCount cho đề thi
      await WritingTest.updateOne({ writingTestId }, { $inc: { completedCount: 1 } })

      return { result: newResult, isNew: true }
    }
  },

  /**
   * Lấy kết quả bài làm của 1 user cho 1 đề thi.
   */
  getWritingResult: async (userId: string, writingTestId: string) => {
    return await WritingResult.findOne({
      userId: new Types.ObjectId(userId),
      writingTestId
    }).lean()
  },

  /**
   * Lấy lịch sử tất cả bài làm writing của 1 user.
   */
  getUserWritingHistory: async (userId: string) => {
    return await WritingResult.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean()
  }
}

export default writingTestsService
