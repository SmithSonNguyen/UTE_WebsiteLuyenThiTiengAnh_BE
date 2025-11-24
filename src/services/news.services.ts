import axios from 'axios'

// Interface cho response từ NewsAPI
interface NewsAPIResponse {
  status: string
  totalResults: number
  articles: Article[]
}

interface Article {
  source: {
    id: string | null
    name: string
  }
  author: string | null
  title: string
  description: string | null
  url: string
  urlToImage: string | null
  publishedAt: string
  content: string | null
}

// Interface cho params của Everything endpoint
interface EverythingParams {
  query: string
  page?: number
  pageSize?: number
  language?: string
  sortBy?: 'relevancy' | 'popularity' | 'publishedAt'
}

// Interface cho params của Top Headlines endpoint
interface TopHeadlinesParams {
  country?: string // 2-letter ISO 3166-1 code (vd: 'us', 'gb', 'vn')
  category?: 'business' | 'entertainment' | 'general' | 'health' | 'science' | 'sports' | 'technology'
  sources?: string // comma-separated string (vd: 'bbc-news,cnn')
  q?: string // keywords to search
  pageSize?: number
  page?: number
}

// Hàm để detect và xử lý content bị cắt
const processArticleContent = (article: Article) => {
  const content = article.content || ''

  // Kiểm tra nếu content bị cắt (có pattern "... [+X chars]")
  const truncationPattern = /\.\.\.\s*\[\+(\d+)\s*chars\]/i
  const match = content.match(truncationPattern)

  if (match) {
    const remainingChars = parseInt(match[1], 10)
    // Loại bỏ phần "[+X chars]" khỏi content
    const cleanedContent = content.replace(truncationPattern, '').trim()

    return {
      ...article,
      content: cleanedContent,
      isContentTruncated: true,
      remainingChars,
      fullContentUrl: article.url
    }
  }

  return {
    ...article,
    isContentTruncated: false,
    remainingChars: 0,
    fullContentUrl: article.url
  }
}

// Service cho endpoint /v2/everything
export const getNewsFromAPI = async ({
  query,
  page = 1,
  pageSize = 20,
  language = 'en',
  sortBy = 'publishedAt'
}: EverythingParams) => {
  try {
    const apiKey = 'e0e2ab53d2e5486b9e390b025cfddade'
    const response = await axios.get<NewsAPIResponse>('https://newsapi.org/v2/everything', {
      params: {
        q: query,
        language,
        sortBy,
        page,
        pageSize,
        apiKey
      }
    })

    // Transform articles để xử lý content bị cắt
    const transformedData = {
      ...response.data,
      articles: response.data.articles.map((article: Article) => processArticleContent(article))
    }

    return transformedData
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('NewsAPI ERROR:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Failed to fetch news')
    }
    console.error('NewsAPI ERROR:', error)
    throw new Error('Failed to fetch news')
  }
}

// Service MỚI cho endpoint /v2/top-headlines
export const getTopHeadlines = async (params: TopHeadlinesParams) => {
  try {
    const apiKey = 'e0e2ab53d2e5486b9e390b025cfddade'

    // Validate params theo quy tắc của NewsAPI
    if (params.sources && (params.country || params.category)) {
      throw new Error("Cannot mix 'sources' param with 'country' or 'category' params")
    }

    // Build params object, chỉ thêm những params có giá trị
    const requestParams: Record<string, string | number> = {
      apiKey
    }

    if (params.country) requestParams.country = params.country
    if (params.category) requestParams.category = params.category
    if (params.sources) requestParams.sources = params.sources
    if (params.q) requestParams.q = params.q
    if (params.pageSize) requestParams.pageSize = params.pageSize
    if (params.page) requestParams.page = params.page

    const response = await axios.get<NewsAPIResponse>('https://newsapi.org/v2/top-headlines', { params: requestParams })

    // Transform articles để xử lý content bị cắt
    const transformedData = {
      ...response.data,
      articles: response.data.articles.map((article: Article) => processArticleContent(article))
    }

    return transformedData
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('NewsAPI Top Headlines ERROR:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Failed to fetch top headlines')
    }
    console.error('NewsAPI Top Headlines ERROR:', error)
    throw new Error('Failed to fetch top headlines')
  }
}
