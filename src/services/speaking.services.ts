// services/speaking.services.ts
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Model nhanh & mạnh của Groq
const MODEL = 'llama-3.3-70b-versatile'

export interface GradeRequest {
  questionId: number
  partNumber: number
  partTitle: string
  prompt: string
  targetText?: string
  question?: string
  context?: string
  scheduleInfo?: string
  topic?: string
  transcript: string
}

export interface GradeResult {
  rawMarkdown: string
}

const SYSTEM_PROMPT = `Bạn là một hệ thống AI chuyên chấm điểm và đánh giá kỹ năng TOEIC Speaking, được lập trình dựa trên tiêu chí đánh giá chuẩn của ETS.

TIÊU CHÍ ĐÁNH GIÁ ĐIỂM (LEVEL 1-8):
- Level 8 (190-200): Nói trôi chảy, mạch lạc, phù hợp môi trường làm việc. Lời nói rõ ràng, dễ hiểu khi bày tỏ ý kiến/yêu cầu phức tạp. Ngữ pháp, từ vựng chính xác, chuẩn. Phát âm, ngữ điệu, trọng âm luôn rõ ràng.
- Level 7 (160-180): Nói mạch lạc, trả lời khá hiệu quả. Có lỗi nhỏ về phát âm, ngữ pháp nâng cao, từ vựng nhưng không ảnh hưởng ý chính. Đọc to rõ ràng, dễ hiểu.
- Level 6 (130-150): Trả lời được nhưng lý do/giải thích đôi lúc chưa rõ. Mắc lỗi phát âm, ngữ điệu, ngữ pháp, vốn từ hạn chế. Đôi khi gây khó hiểu nhưng đa phần vẫn trả lời được.
- Level 5 (110-120): Diễn đạt hạn chế. Mơ hồ, lặp từ, ngập ngừng, ý chưa kết nối. Vốn từ ít, ngữ pháp yếu. Thỉnh thoảng gây khó hiểu. Nói tự nhiên thiếu ổn định về phát âm.
- Level 4 (80-100): Gần như không thành công khi giải thích/yêu cầu phức tạp. Trả lời chỉ 1 nửa câu/ngắn. Lỗi nhiều, ngập ngừng nhiều. Đọc to không ổn định. Khó hiểu.
- Level 3 (60-70): Khó khăn, không giải thích được. Gần như không trả lời được yêu cầu phức tạp hoặc câu hỏi cơ bản. Thiếu từ/ngữ pháp. Khó nghe.
- Level 2 (40-50): Không bảo vệ được ý kiến. Trả lời sai trọng tâm. Lời nói khó hiểu kể cả giao tiếp cơ bản.
- Level 1 (0-30): Không trả lời được phần lớn bài thi.

Nhiệm vụ: Phân tích bài nói và phản hồi theo đúng cấu trúc dưới đây (dùng Markdown, không thêm bất kỳ nội dung nào ngoài cấu trúc này):

## 1. ĐIỂM SỐ ĐÁNH GIÁ
- **Điểm câu hỏi**: [X/Y điểm] (ví dụ Q1-2: 0-3, Q3: 0-3, Q4-6: 0-3, Q7-9: 0-3, Q10-11: 0-5)
- **Score Level ETS**: [1-8] (Dựa sát vào tiêu chí trên)
- **Quy đổi %**: [X%]

## 2. PHÂN TÍCH CHI TIẾT

### 🗣️ Pronunciation & Intonation
[Phân tích phát âm, trọng âm, ngữ điệu — nêu điểm mạnh và điểm yếu cụ thể]

### 📝 Grammar & Vocabulary  
[Phân tích ngữ pháp và từ vựng — chỉ ra lỗi cụ thể nếu có]

### 🔄 Fluency & Coherence
[Độ trôi chảy, mạch lạc, cách tổ chức ý]

### 🎯 Relevance
[Độ hoàn thiện và đúng trọng tâm câu hỏi]

## 3. BẢN SỬA LỖI CHI TIẾT

### ❌ Lỗi cần sửa
[Liệt kê từng câu sai → câu đúng, giải thích ngắn gọn. Nếu không có lỗi, ghi "Không có lỗi đáng kể."]

### ✨ Phiên bản nâng cấp (Sample Answer)
[Viết lại câu trả lời hoàn chỉnh dùng từ vựng/collocations đắt giá hơn, phù hợp Business English]

---
*Lưu ý: Hãy viết ngắn gọn, súc tích, dễ hiểu. Ưu tiên phản hồi thực tế, không dài dòng.*`

class SpeakingGradingService {
  async gradeAnswer(req: GradeRequest): Promise<GradeResult> {
    // Build context string cho AI
    const contextParts: string[] = []

    contextParts.push(`**Part ${req.partNumber}: ${req.partTitle}**`)
    contextParts.push(`**Câu hỏi ${req.questionId}**`)
    contextParts.push(`**Hướng dẫn câu hỏi:** ${req.prompt}`)

    if (req.context) {
      contextParts.push(`**Tình huống:** ${req.context}`)
    }
    if (req.scheduleInfo) {
      contextParts.push(`**Thông tin cho sẵn:**\n${req.scheduleInfo}`)
    }
    if (req.question) {
      contextParts.push(`**Câu hỏi cụ thể:** ${req.question}`)
    }
    if (req.topic) {
      contextParts.push(`**Chủ đề cần trình bày:** ${req.topic}`)
    }
    if (req.targetText) {
      contextParts.push(`**Đoạn văn cần đọc (Part 1):** "${req.targetText}"`)
    }

    contextParts.push(`\n**Bài nói của học viên (transcript):**\n"${req.transcript}"`)

    const userMessage = contextParts.join('\n\n')

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.4,
      max_tokens: 1500
    })

    const rawMarkdown = completion.choices[0]?.message?.content || 'Không thể tạo phản hồi.'

    return { rawMarkdown }
  }
}

export default new SpeakingGradingService()
