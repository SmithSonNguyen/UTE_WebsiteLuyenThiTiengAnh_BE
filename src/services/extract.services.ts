import axios from 'axios'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

export const extractArticleService = async (encodedUrl: string) => {
  try {
    // 🔥 BẮT BUỘC decode URL trước khi fetch
    const url = decodeURIComponent(encodedUrl)

    console.log('📌 Extracting from URL:', url)

    // 🔥 Fetch HTML từ bài báo thật
    const html = await axios
      .get(url, {
        headers: {
          // Một số báo yêu cầu User-Agent, nên thêm vào
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
        }
      })
      .then((res) => res.data)

    // 🔥 Phân tích HTML bằng JSDOM
    const dom = new JSDOM(html, { url })
    const reader = new Readability(dom.window.document)

    // 🔥 Readability trích xuất bài báo
    const article = reader.parse()

    if (!article) {
      throw new Error('Cannot extract article content')
    }

    return {
      title: article.title,
      content: article.textContent, // văn bản sạch
      html: article.content, // HTML để render lên React
      length: article.textContent?.length || 0
    }
  } catch (error) {
    console.error('❌ Extract ERROR:', error)
    throw new Error('Failed to extract article')
  }
}
