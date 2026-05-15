import express from 'express';
import classController from '../controllers/classController.js';
import * as validators from '../validators/classValidators.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All class routes require authentication (TESTED & VERIFIED)
router.use(protect);

// Class CRUD Operations (TESTED & VERIFIED)
router.post('/', validators.createClassValidator, classController.createClass);  
router.get('/', classController.getAllClasses);  
router.get('/statistics', classController.getClassStatistics);  
router.get('/search', validators.searchValidator, classController.searchClasses);  
router.get('/status/:status', classController.getClassesByStatus);  
router.get('/institution/:institutionId', classController.getClassesByInstitution);  
router.get('/teacher/:teacherId', classController.getClassesByTeacher);  
router.get('/classId/:classId', classController.getClassByClassId);  
router.get('/:id', validators.classIdValidator, classController.getClassById);  
router.put('/:id', validators.classIdValidator, validators.updateClassValidator, classController.updateClass);  
router.delete('/:id', validators.classIdValidator, classController.deleteClass);  

// Class Management Operations (TESTED & VERIFIED)
router.patch('/:id/students', validators.classIdValidator, classController.updateStudentCount);  
router.patch('/:id/subjects', validators.classIdValidator, classController.updateSubjectCount);  
router.patch('/:id/teacher', validators.classIdValidator, classController.assignClassTeacher);  
router.patch('/bulk/status', classController.bulkUpdateStatus);  

export default router;
