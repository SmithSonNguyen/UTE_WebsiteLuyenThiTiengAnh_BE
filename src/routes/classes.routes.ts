import { Router } from 'express'
import {
  createClassController,
  getAllClassesController,
  getClassesByLevelController,
  getClassDetailController,
  updateClassController,
  deleteClassController,
  enrollClassController,
  getNextClassCodeController,
  getUpcomingClassesByCourseController,
  getUpcomingClassesByLevelController
} from '~/controllers/classes.controllers'

const classesRouter = Router()

/**
 * Description: Create a new class
 * Path: /classes
 * Method: POST
 * Body: {
 *   courseId: string,
 *   classId: string,
 *   instructor: string,
 *   schedule: {
 *     days: string[],
 *     meetLink: string,
 *     startTime: string,
 *     endTime: string,
 *     startDate: Date,
 *     durationWeeks: number
 *   },
 *   capacity: {
 *     maxStudents: number
 *   }
 * }
 */
classesRouter.post('/', createClassController)

/**
 * Description: Get all classes with pagination
 * Path: /classes
 * Method: GET
 * Query: ?page=1&limit=10&status=scheduled
 */
classesRouter.get('/', getAllClassesController)

/**
 * Description: Get classes by level
 * Path: /classes/level/:level
 * Method: GET
 * Params: level (beginner | intermediate | advanced)
 */
classesRouter.get('/level/:level', getClassesByLevelController)

/**
 * Description: Get next class code for a level
 * Path: /classes/next-code/:level
 * Method: GET
 * Params: level (beginner | intermediate | advanced)
 */
classesRouter.get('/next-code/:level', getNextClassCodeController)

/**
 * Description: Get upcoming classes by course ID
 * Path: /classes/course/:courseId/upcoming
 * Method: GET
 * Params: courseId
 */
classesRouter.get('/course/:courseId/upcoming', getUpcomingClassesByCourseController)

/**
 * Description: Get upcoming classes by level
 * Path: /classes/level/:level/upcoming
 * Method: GET
 * Params: level (beginner | intermediate | advanced)
 */
classesRouter.get('/level/:level/upcoming', getUpcomingClassesByLevelController)

/**
 * Description: Get class detail by ID
 * Path: /classes/:classId
 * Method: GET
 * Params: classId
 */
classesRouter.get('/:classId', getClassDetailController)

/**
 * Description: Update class information
 * Path: /classes/:classId
 * Method: PUT
 * Params: classId
 * Body: Partial class information
 */
classesRouter.put('/:classId', updateClassController)

/**
 * Description: Delete a class
 * Path: /classes/:classId
 * Method: DELETE
 * Params: classId
 */
classesRouter.delete('/:classId', deleteClassController)

/**
 * Description: Enroll a student to a class
 * Path: /classes/:classId/enroll
 * Method: POST
 * Params: classId
 * Body: { userId: string }
 */
classesRouter.post('/:classId/enroll', enrollClassController)

export default classesRouter
