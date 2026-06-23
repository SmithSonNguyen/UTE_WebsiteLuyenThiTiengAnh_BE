// controllers/speaking.controllers.ts
import { Request, Response, NextFunction } from 'express'
import speakingService from '~/services/speaking.services'
import HTTP_STATUS from '~/constants/httpStatus'
import SpeakingResult from '~/models/schemas/SpeakingResult.schema'
import mongoose from 'mongoose'

/**
 * POST /speaking/grade
 * Body: { testId, testName?, questionId, partNumber, partTitle, prompt,
 *         targetText?, question?, context?, scheduleInfo?, topic?, transcript }
 * Gọi Groq AI chấm điểm → lưu vào MongoDB → trả về kết quả
 */
export const gradeSpeakingController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      testId,
      testName,
      questionId,
      partNumber,
      partTitle,
      prompt,
      targetText,
      question,
      context,
      scheduleInfo,
      topic,
      transcript
    } = req.body

    const userId = req.decoded_authorization?.user_id

    // ── Validation ────────────────────────────────────────────────────────────
    if (!transcript || typeof transcript !== 'string' || transcript.trim() === '') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Transcript không được để trống'
      })
    }
    if (!questionId || !partNumber || !partTitle || !prompt) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin câu hỏi (questionId, partNumber, partTitle, prompt)'
      })
    }

    // ── Gọi Groq AI chấm điểm ────────────────────────────────────────────────
    const gradeResult = await speakingService.gradeAnswer({
      questionId: Number(questionId),
      partNumber: Number(partNumber),
      partTitle:  String(partTitle),
      prompt:     String(prompt),
      targetText:   targetText   ? String(targetText)   : undefined,
      question:     question     ? String(question)     : undefined,
      context:      context      ? String(context)      : undefined,
      scheduleInfo: scheduleInfo ? String(scheduleInfo) : undefined,
      topic:        topic        ? String(topic)        : undefined,
      transcript:   transcript.trim()
    })

    // ── Lưu vào MongoDB (upsert: 1 user + 1 testId = 1 document) ─────────────
    if (userId && mongoose.Types.ObjectId.isValid(userId) && testId) {
      try {
        const resolvedTestId = String(testId)
        const qIdx           = Number(questionId) - 1   // index trong answers array

        const answerData = {
          questionId:  Number(questionId),
          partNumber:  Number(partNumber),
          partTitle:   String(partTitle),
          transcript:  transcript.trim(),
          audioUrl:    null,
          aiGraded:    true,
          aiMarkdown:  gradeResult.rawMarkdown,
          totalScore:  null,   // FE tự parse từ aiMarkdown nếu cần
          answeredAt:  new Date()
        }

        await SpeakingResult.findOneAndUpdate(
          {
            userId: new mongoose.Types.ObjectId(userId),
            testId: resolvedTestId
          },
          {
            $set: {
              testName:    testName ? String(testName) : `Speaking Test`,
              [`answers.${qIdx}`]: answerData,
              updatedAt:   new Date()
            },
            $setOnInsert: {
              startedAt: new Date(),
              status:    'in_progress'
            },
            $inc: { gradedCount: 1, answeredCount: 1 }
          },
          {
            upsert:        true,
            new:           true,
            setDefaultsOnInsert: true
          }
        )
      } catch (dbErr) {
        // Lỗi lưu DB không block response — chỉ log
        console.error('⚠️ Lỗi lưu SpeakingResult vào MongoDB:', dbErr)
      }
    }

    return res.status(HTTP_STATUS.OK).json({
      message: 'Chấm điểm thành công',
      result: gradeResult
    })
  } catch (error) {
    console.error('❌ Speaking grade error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi khi chấm điểm Speaking',
      error: (error as Error).message
    })
  }
}

/**
 * GET /speaking/history/:testId
 * Lấy lịch sử làm bài Speaking của user cho 1 đề cụ thể
 */
export const getSpeakingHistoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.decoded_authorization?.user_id
    const { testId } = req.params

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Unauthorized' })
    }

    const history = await SpeakingResult.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      testId: String(testId)
    }).lean()

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy lịch sử thành công',
      result: history || null
    })
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi khi lấy lịch sử Speaking',
      error: (error as Error).message
    })
  }
}

/**
 * GET /speaking/all-history
 * Lấy tất cả lịch sử làm Speaking của user (danh sách các đề đã làm)
 */
export const getAllSpeakingHistoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.decoded_authorization?.user_id

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Unauthorized' })
    }

    const history = await SpeakingResult.find(
      { userId: new mongoose.Types.ObjectId(userId) },
      { answers: 0 }   // Bỏ answers array để response nhỏ gọn
    )
      .sort({ updatedAt: -1 })
      .lean()

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy lịch sử thành công',
      result: history
    })
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi khi lấy lịch sử Speaking',
      error: (error as Error).message
    })
  }
}
