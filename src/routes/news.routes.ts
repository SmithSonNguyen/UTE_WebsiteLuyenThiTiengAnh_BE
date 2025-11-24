import { Router } from 'express'
import { wrapRequestHandler } from '~/utils/handlers'
import { getNewsController, getTopHeadlinesController } from '~/controllers/news.controllers'

const newsRouter = Router()

/**
 * @route GET /news/everything
 * @desc Lấy tin tức từ everything endpoint (search toàn bộ)
 * @query {string} query - Từ khóa tìm kiếm (required)
 * @query {number} page - Số trang (default: 1)
 * @query {number} pageSize - Số kết quả mỗi trang (default: 20, max: 100)
 * @query {string} language - Ngôn ngữ (default: 'en')
 * @query {string} sortBy - Sắp xếp: relevancy, popularity, publishedAt (default: publishedAt)
 */
newsRouter.get('/everything', wrapRequestHandler(getNewsController))

/**
 * @route GET /news/top-headlines
 * @desc Lấy tin tức nóng từ top-headlines endpoint
 * @query {string} country - Mã quốc gia 2 ký tự (us, gb, vn...)
 * @query {string} category - Danh mục (business, entertainment, general, health, science, sports, technology)
 * @query {string} sources - Nguồn tin, cách nhau bởi dấu phẩy (vd: bbc-news,cnn)
 * @query {string} q - Từ khóa tìm kiếm
 * @query {number} page - Số trang (default: 1)
 * @query {number} pageSize - Số kết quả mỗi trang (default: 20, max: 100)
 *
 * NOTE: Không thể mix 'sources' với 'country' hoặc 'category'
 */
newsRouter.get('/top-headlines', wrapRequestHandler(getTopHeadlinesController))

/**
 * @route GET /news (Legacy route - để backward compatibility)
 * @desc Alias cho /news/everything
 */
newsRouter.get('/', wrapRequestHandler(getNewsController))

export default newsRouter
