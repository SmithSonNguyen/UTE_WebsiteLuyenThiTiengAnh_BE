import { GoogleGenerativeAI } from '@google/generative-ai'
import { Response } from 'express'

// ──────────────────────────────────────────────
// Key rotation
// ──────────────────────────────────────────────
const GEMINI_KEYS = [process.env.GEMINI_API_KEY_1].filter(Boolean) as string[]

const GROQ_API_KEY = process.env.GROQ_API_KEY

let keyIndex = 0
function nextKey(): string {
  const key = GEMINI_KEYS[keyIndex % GEMINI_KEYS.length]
  keyIndex++
  return key
}

// ──────────────────────────────────────────────
// Kiểu dữ liệu câu hỏi gửi từ FE
// ──────────────────────────────────────────────
export interface QuestionPayload {
  number: number
  part: number
  questionText?: string
  options?: string[]
  userAnswer?: string
  correctAnswer?: string
  isCorrect?: boolean
  imageUrl?: string | string[]
  mediaUrl?: string
  paragraph?: string
}

// ──────────────────────────────────────────────
// Mô tả từng Part
// ──────────────────────────────────────────────
const PART_DESCRIPTIONS: Record<number, string> = {
  1: 'Part 1 – Photographs: Mô tả hình ảnh. Nghe 1 câu mô tả, chọn câu phù hợp nhất với ảnh.',
  2: 'Part 2 – Question-Response: Nghe câu hỏi/phát biểu, chọn câu trả lời phù hợp nhất (A/B/C).',
  3: 'Part 3 – Short Conversations: Nghe đoạn hội thoại ngắn (2-3 người), trả lời 3 câu hỏi.',
  4: 'Part 4 – Short Talks: Nghe bài phát biểu/thông báo ngắn, trả lời 3 câu hỏi.',
  5: 'Part 5 – Incomplete Sentences: Điền vào chỗ trống trong câu để hoàn chỉnh câu.',
  6: 'Part 6 – Text Completion: Điền vào chỗ trống trong đoạn văn ngắn.',
  7: 'Part 7 – Reading Comprehension: Đọc bài văn/email/quảng cáo và trả lời câu hỏi.'
}

// ──────────────────────────────────────────────
// Xây dựng prompt theo từng Part
// ──────────────────────────────────────────────
function buildPrompt(q: QuestionPayload): string {
  const partNum = q.part || 0
  const partDesc = PART_DESCRIPTIONS[partNum] || 'Câu hỏi TOEIC'
  const questionText = q.questionText || '(Câu hỏi không có nội dung text)'
  const userAnswer = q.userAnswer || 'Chưa trả lời'
  const correctAnswer = q.correctAnswer || 'Không rõ'

  const optionsText =
    q.options && q.options.length > 0
      ? q.options.map((opt, idx) => `  ${String.fromCharCode(65 + idx)}. ${opt}`).join('\n')
      : ''

  const paragraphSection = q.paragraph ? `\n📄 Đoạn văn/Script:\n"""\n${q.paragraph}\n"""\n` : ''
  const imageSection = q.imageUrl ? '\n🖼️ Câu hỏi có kèm hình ảnh (Part 1 – mô tả ảnh).\n' : ''
  const audioSection = q.mediaUrl ? '\n🎧 Câu hỏi có kèm audio (cần nghe để trả lời).\n' : ''

  const resultText = q.isCorrect
    ? `✅ Học viên trả lời ĐÚNG (chọn ${userAnswer}).`
    : `❌ Học viên trả lời SAI. Học viên chọn: ${userAnswer} – Đáp án đúng: ${correctAnswer}.`

  const header = `Bạn là giáo viên TOEIC chuyên nghiệp. Hãy giải thích chi tiết câu hỏi TOEIC sau bằng tiếng Việt.\n\n📌 LOẠI CÂU: ${partDesc}`
  const questionBlock = `\n📝 Câu hỏi số ${q.number}:\n${questionText}\n\n${optionsText ? `📋 Các lựa chọn:\n${optionsText}\n\n` : ''}📊 Kết quả: ${resultText}\n🔑 Đáp án đúng: ${correctAnswer}`

  const structureByPart: Record<number, string> = {
    1: `Hãy giải thích theo cấu trúc:
1. **Đáp án đúng và lý do**: Tại sao ${correctAnswer} là đáp án đúng cho câu mô tả ảnh này?
2. **Phân tích các đáp án sai**: Tại sao các đáp án còn lại không đúng? (active/passive voice, subject, location, state vs action...)
3. **Từ vựng TOEIC cần chú ý**: Liệt kê 3-5 từ/cụm từ quan trọng trong Part 1, giải nghĩa và ví dụ.
4. **Mẹo làm Part 1**: Gợi ý chiến lược nhận dạng ảnh nhanh.`,

    2: `Hãy giải thích theo cấu trúc:
1. **Đáp án đúng và lý do**: Tại sao ${correctAnswer} là câu trả lời phù hợp nhất?
2. **Dạng câu hỏi**: Xác định dạng (WH-question / Yes-No / Tag question / Statement)?
3. **Phân tích đáp án sai**: Tại sao các đáp án còn lại không phù hợp?
4. **Từ vựng TOEIC cần chú ý**: 3-5 từ/cụm từ quan trọng trong Part 2.
5. **Mẹo làm Part 2**: Chiến lược nghe và chọn đáp án nhanh.`,

    3: `Hãy giải thích theo cấu trúc:
1. **Đáp án đúng và lý do**: Tại sao ${correctAnswer} đúng dựa trên nội dung hội thoại?
2. **Phân tích đáp án sai**: Tại sao các đáp án còn lại sai hoặc gây nhầm lẫn?
3. **Từ/cụm từ TOEIC cần chú ý**: 3-5 từ/cụm từ quan trọng, giải nghĩa.
4. **Kỹ năng suy luận**: Cách xác định chủ đề/người nói/chi tiết trong Part 3.
5. **Mẹo làm Part 3**: Đọc câu hỏi trước khi nghe, dự đoán nội dung.`,

    4: `Hãy giải thích theo cấu trúc:
1. **Đáp án đúng và lý do**: Tại sao ${correctAnswer} đúng dựa trên nội dung bài nói?
2. **Phân tích đáp án sai**: Điểm sai/gây nhầm của từng đáp án còn lại.
3. **Từ vựng TOEIC cần chú ý**: 3-5 từ/cụm từ thường gặp trong bài phát biểu/thông báo.
4. **Loại bài nói**: Xác định dạng (announcement/advertisement/talk/tour...)?
5. **Mẹo làm Part 4**: Nhận dạng từ khóa, câu mở đầu thường báo chủ đề.`,

    5: `Hãy giải thích theo cấu trúc:
1. **Dạng ngữ pháp/từ vựng**: Câu hỏi kiểm tra kỹ năng gì (từ loại / thì động từ / mạo từ / giới từ / liên từ / từ vựng...)?
2. **Phân tích đáp án đúng (${correctAnswer})**: Giải thích ngữ pháp/từ vựng cụ thể tại sao chọn đáp án này.
3. **Phân tích đáp án sai**: Lý do từng đáp án còn lại không phù hợp về ngữ pháp hoặc nghĩa.
4. **Quy tắc ngữ pháp liên quan**: Tóm tắt quy tắc cần nhớ (cấu trúc câu, collocations, word forms...).
5. **Từ vựng TOEIC cần ghi nhớ**: Từ/cụm từ trong câu cần chú ý, nghĩa, ví dụ.
6. **Mẹo làm Part 5**: Cách xác định loại câu hỏi và tìm đáp án nhanh.`,

    6: `Hãy giải thích theo cấu trúc:
1. **Dạng câu hỏi**: Kiểm tra điều gì (từ loại / ngữ pháp / logic văn cảnh / điền câu)?
2. **Phân tích đáp án đúng (${correctAnswer})**: Lý do ngữ pháp/logic trong ngữ cảnh đoạn văn.
3. **Phân tích đáp án sai**: Lý do cụ thể tại sao từng đáp án không phù hợp.
4. **Ngữ pháp/cấu trúc cần nhớ**: Quy tắc ngữ pháp hoặc cohesion liên quan.
5. **Từ vựng TOEIC cần chú ý**: 3-5 từ/cụm từ quan trọng trong đoạn văn.
6. **Mẹo làm Part 6**: Cách đọc ngữ cảnh để chọn đáp án đúng.`,

    7: `Hãy giải thích theo cấu trúc:
1. **Loại câu hỏi đọc hiểu**: Kiểm tra kỹ năng gì (tìm thông tin / suy luận / từ đồng nghĩa / mục đích / chi tiết)?
2. **Vị trí thông tin trong bài**: Thông tin trả lời câu hỏi nằm ở đâu? Dẫn chứng cụ thể.
3. **Phân tích đáp án đúng (${correctAnswer})**: Lý do chính xác tại sao đây là đáp án đúng.
4. **Phân tích đáp án sai**: Điểm gây nhầm lẫn của từng đáp án còn lại (distractor).
5. **Từ vựng TOEIC cần chú ý**: 4-6 từ/cụm từ quan trọng trong bài đọc,`
  }

  const structure = `Hãy giải thích:
1. **Tại sao đáp án ${correctAnswer} đúng?**
2. **Tại sao các đáp án khác sai?**
3. **Ngữ pháp/từ vựng cần chú ý**`

  return `${header}${imageSection}${audioSection}${paragraphSection}${questionBlock}\n\n${structure}`
}

// ──────────────────────────────────────────────
// Giải thích với Groq + Gemini Fallback + Streaming
// ──────────────────────────────────────────────
export async function explainQuestionStream(question: QuestionPayload, res: Response): Promise<void> {
  const prompt = buildPrompt(question)

  // Ưu tiên Groq trước (nhanh hơn, rẻ hơn, ít lỗi quota)
  if (GROQ_API_KEY) {
    try {
      await explainWithGroq(prompt, res)
      return
    } catch (err: any) {
      console.warn(`[Groq] Failed: ${err?.message}. Trying Gemini fallback...`)
    }
  }

  // Fallback sang Gemini
  await explainWithGemini(prompt, res)
}

// ====================== GROQ ======================
async function explainWithGroq(prompt: string, res: Response): Promise<void> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile', // model mạnh hiện tại
      // model: 'qwen-qwen3-32b',              // thay bằng cái này nếu muốn tiếng Việt tốt hơn
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1200,
      stream: true
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Groq Error: ${response.status} - ${errorText}`)
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) throw new Error('No reader')

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`)
          }
        } catch (e) {
          // ignore parse error
        }
      }
    }
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
  res.end()
}

// ====================== GEMINI (giữ nguyên logic cũ) ======================
async function explainWithGemini(prompt: string, res: Response): Promise<void> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < GEMINI_KEYS.length; attempt++) {
    const apiKey = GEMINI_KEYS[attempt]
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash', // Khuyến nghị dùng 2.5 thay vì 2.0
        generationConfig: { temperature: 0.7, maxOutputTokens: 1200 }
      })

      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no')
      res.flushHeaders()

      const result = await model.generateContentStream(prompt)

      for await (const chunk of result.stream) {
        const text = chunk.text()
        if (text) {
          res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`)
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
      res.end()
      return
    } catch (err: any) {
      console.warn(`[Gemini Key ${attempt + 1}] Failed:`, err?.message)
      lastError = err
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: err?.message || 'AI error' })}\n\n`)
        res.end()
        return
      }
      continue
    }
  }

  if (!res.headersSent) {
    res.status(503).json({
      message: lastError?.message || 'Tất cả AI providers đều lỗi. Vui lòng thử lại sau.'
    })
  }
}
