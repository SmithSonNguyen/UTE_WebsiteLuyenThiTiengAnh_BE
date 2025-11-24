import { Request, Response, NextFunction } from 'express'
import { getNewsFromAPI, getTopHeadlines } from '~/services/news.services'

/**
 * Controller cho /v2/everything endpoint
 * Tìm kiếm tin tức toàn diện với nhiều tùy chọn
 */
export const getNewsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query = 'english learning', page = 1, pageSize = 20, language = 'en', sortBy = 'publishedAt' } = req.query

    // Validate pageSize
    const validatedPageSize = Math.min(Number(pageSize), 100)

    const data = await getNewsFromAPI({
      query: query as string,
      page: Number(page),
      pageSize: validatedPageSize,
      language: language as string,
      sortBy: sortBy as 'relevancy' | 'popularity' | 'publishedAt'
    })

    res.json({
      message: 'Fetch news successfully',
      data,
      meta: {
        endpoint: 'everything',
        params: {
          query,
          page: Number(page),
          pageSize: validatedPageSize,
          language,
          sortBy
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Controller cho /v2/top-headlines endpoint
 * Lấy tin tức nóng hổi theo quốc gia, danh mục hoặc nguồn
 */
export const getTopHeadlinesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { country, category, sources, q, page = 1, pageSize = 20 } = req.query

    // Validate: Phải có ít nhất 1 trong các params: country, category, sources
    if (!country && !category && !sources) {
      return res.status(400).json({
        message: 'Bad Request: Please provide at least one of: country, category, or sources',
        example: {
          byCountry: '/news/top-headlines?country=us',
          byCategory: '/news/top-headlines?country=us&category=technology',
          bySources: '/news/top-headlines?sources=bbc-news,cnn',
          withSearch: '/news/top-headlines?country=us&q=bitcoin'
        }
      })
    }

    // Validate: Không thể mix sources với country/category
    if (sources && (country || category)) {
      return res.status(400).json({
        message: 'Bad Request: Cannot use "sources" parameter with "country" or "category"',
        hint: 'Either use sources OR use country/category, not both'
      })
    }

    // Validate category
    const validCategories = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology']
    if (category && !validCategories.includes(category as string)) {
      return res.status(400).json({
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
        provided: category
      })
    }

    // Validate pageSize
    const validatedPageSize = Math.min(Number(pageSize), 100)

    const data = await getTopHeadlines({
      country: country as string | undefined,
      category: category as any,
      sources: sources as string | undefined,
      q: q as string | undefined,
      page: Number(page),
      pageSize: validatedPageSize
    })

    res.json({
      message: 'Fetch top headlines successfully',
      data,
      meta: {
        endpoint: 'top-headlines',
        params: {
          country,
          category,
          sources,
          q,
          page: Number(page),
          pageSize: validatedPageSize
        }
      }
    })
  } catch (error) {
    next(error)
  }
}
