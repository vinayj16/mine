import express from 'express';
import classScheduleController from '../controllers/classScheduleController.js';
import * as validators from '../validators/classScheduleValidators.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All class schedule routes require authentication (TESTED & VERIFIED)
router.use(protect)

// Class Schedule CRUD Operations (TESTED & VERIFIED)
router.post('/', validators.createScheduleValidator, classScheduleController.createSchedule);  
router.get('/', classScheduleController.getAllSchedules);  
router.get('/statistics', classScheduleController.getScheduleStatistics);  
router.get('/search', validators.searchValidator, classScheduleController.searchSchedules);  
router.get('/class/:classId', classScheduleController.getSchedulesByClass);  
router.get('/class/:classId/weekly', classScheduleController.getWeeklySchedule);  
router.get('/teacher/:teacherId', classScheduleController.getSchedulesByTeacher);  
router.get('/teacher/:teacherId/weekly', classScheduleController.getTeacherWeeklySchedule);  
router.get('/day/:day', classScheduleController.getSchedulesByDay);  
router.get('/:id', validators.scheduleIdValidator, classScheduleController.getScheduleById);  
router.put('/:id', validators.scheduleIdValidator, validators.updateScheduleValidator, classScheduleController.updateSchedule);  
router.delete('/:id', validators.scheduleIdValidator, classScheduleController.deleteSchedule);  
router.patch('/:id/cancel', validators.scheduleIdValidator, classScheduleController.cancelSchedule);  

export default router;
