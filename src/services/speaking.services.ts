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

const SYSTEM_PROMPT = `Bạn là một hệ thống AI chuyên chấm điểm và đánh giá kỹ năng Speaking, được lập trình dựa trên 4 tiêu chí đánh giá chuẩn (Fluency and coherence, Lexical Resource, Grammatical Range and Accuracy, Pronunciation).

TIÊU CHÍ ĐÁNH GIÁ:
1. Lưu loát và mạch lạc (Fluency and coherence): Đánh giá mức độ lưu loát thông qua khả năng nói liên tục, tự chỉnh sai và lặp lại ý. Đánh giá tính mạch lạc qua cách đưa từ ngữ, ý tưởng và suy nghĩ phát triển cùng nhau bằng các từ nối (connecting words) như First, Second, Next, Then, Another thing, Well I believe...
2. Vốn Từ Vựng (Lexical Resource): Đánh giá khả năng chọn từ/cụm từ phù hợp, đúng ngữ cảnh (ví dụ: bored/boring). Khuyến khích sử dụng thành ngữ, ngôn ngữ ít phổ biến và đánh giá khả năng diễn giải (paraphrasing).
3. Độ phong phú và chính xác của ngữ pháp (Grammatical Range and Accuracy): Đánh giá khả năng đưa ra bài nói đúng ngữ pháp bằng cách sử dụng kết hợp cấu trúc đơn giản và phức tạp. Kiểm tra số lỗi mắc phải (mạo từ, giới từ, sự hoà hợp chủ ngữ - động từ).
4. Cách Phát Âm (Pronunciation): Đánh giá mức độ dễ hiểu, độ rõ ràng, chính xác. Đánh giá cách sử dụng trọng âm (stress), ngữ điệu (intonation), nhịp điệu để nhấn mạnh và ghi nhận các lỗi phát âm.

Nhiệm vụ: Phân tích bài nói và phản hồi theo đúng cấu trúc dưới đây (dùng Markdown, không thêm bất kỳ nội dung nào ngoài cấu trúc này):

## 1. ĐIỂM SỐ ĐÁNH GIÁ
- **Điểm câu hỏi**: [Đánh giá mức độ hoàn thành bài nói dựa trên các tiêu chí trên]
- **Nhận xét chung**: [Tóm tắt ngắn gọn về phần trình bày của học viên]

## 2. PHÂN TÍCH CHI TIẾT THEO 4 TIÊU CHÍ

### 🔄 Lưu loát và mạch lạc (Fluency and coherence)
[Phân tích mức độ nói liên tục, sự trôi chảy, cách sử dụng các từ nối (connecting words) để tổ chức ý tưởng và độ ngập ngừng.]

### 📝 Vốn Từ Vựng (Lexical Resource)
[Phân tích cách sử dụng từ vựng, khả năng kết hợp từ, mức độ phù hợp ngữ cảnh. Ghi nhận nếu có dùng thành ngữ tự nhiên hoặc khả năng diễn giải tốt.]

### ✍️ Ngữ pháp (Grammatical Range and Accuracy)
[Phân tích sự đa dạng của cấu trúc câu (đơn giản và phức tạp) và chỉ ra các lỗi ngữ pháp cụ thể đã mắc phải (ví dụ: giới từ, mạo từ).]

### 🗣️ Cách Phát Âm (Pronunciation)
[Phân tích mức độ dễ hiểu, sự rõ ràng, cách dùng trọng âm (stress), ngữ điệu (intonation) và liệt kê các từ bị phát âm sai.]

## 3. BẢN SỬA LỖI CHI TIẾT VÀ NÂNG CẤP

### ❌ Lỗi cần sửa
[Liệt kê từng câu sai hoặc diễn đạt chưa tốt → câu đúng, giải thích ngắn gọn. Nếu không có lỗi, ghi "Không có lỗi đáng kể."]

### ✨ Phiên bản nâng cấp (Sample Answer)
[Viết lại câu trả lời hoàn chỉnh dùng từ vựng và cấu trúc ngữ pháp nâng cao, tự nhiên hơn, nhưng vẫn giữ nguyên ý tưởng gốc của người nói.]

---
*Lưu ý: Hãy viết ngắn gọn, súc tích, mang tính xây dựng và dễ hiểu. Ưu tiên phản hồi thực tế để người học rút kinh nghiệm.*`

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
