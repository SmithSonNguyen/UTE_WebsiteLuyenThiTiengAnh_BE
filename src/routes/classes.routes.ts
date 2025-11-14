import { Router } from 'express'
import {
  createClassController,
  getAllClassesController,
  getClassesByLevelController,
  getClassDetailController,
  getClassForStudentController,
  updateClassController,
  deleteClassController,
  enrollClassController,
  getNextClassCodeController,
  getUpcomingClassesByCourseController,
  getUpcomingClassesByLevelController,
  updateClassLinkController,
  getAllUpcomingLiveClassesController
} from '~/controllers/classes.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { requireEnrollment } from '~/middlewares/enrollments.middlewares'
import { requireInstructor } from '~/middlewares/instructors.middlewares'

const classesRouter = Router()

/**
 * Description: Get all upcoming live classes (public endpoint for schedule page)
 * Path: /classes/schedule/upcoming
 * Method: GET
 */
classesRouter.get('/schedule/upcoming', getAllUpcomingLiveClassesController)

classesRouter.use(accessTokenValidator)

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
 * Description: Get class information for student (includes enrollment status)
 * Path: /classes/:classId/student
 * Method: GET
 * Params: classId
 * Headers: Authorization (JWT token)
 */
classesRouter.get('/:classId/student', requireEnrollment, getClassForStudentController)

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

classesRouter.post('/:classId/update-link', requireInstructor, updateClassLinkController)

export default classesRouter
