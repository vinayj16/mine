import express from 'express';
import gradeController from '../controllers/gradeController.js';
const {
  createGrade,
  getGradeById,
  getGradeByGradeId,
  getAllGrades,
  updateGrade,
  deleteGrade,
  updateStatus,
  getGradesByInstitution,
  getGradesByStatus,
  getGradeByMarks,
  bulkUpdateStatus,
  updateDisplayOrder,
  getGradeStatistics,
  searchGrades
} = gradeController;

import {
  createGradeValidator,
  updateGradeValidator,
  gradeIdValidator,
  gradeIdParamValidator,
  statusValidator,
  updateStatusValidator,
  bulkUpdateStatusValidator,
  updateDisplayOrderValidator,
  searchValidator,
  getGradeByMarksValidator,
  institutionIdValidator
} from '../validators/gradeValidators.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication to all routes (TESTED & VERIFIED)
router.use(protect);

router.post('/', createGradeValidator, createGrade);  
router.get('/', getAllGrades);  
router.get('/statistics', getGradeStatistics);  
router.get('/search', searchValidator, searchGrades);  
router.get('/by-marks', getGradeByMarksValidator, getGradeByMarks);  
router.get('/institution/:institutionId', institutionIdValidator, getGradesByInstitution);  
router.get('/status/:status', statusValidator, getGradesByStatus);  
router.get('/gradeId/:gradeId', gradeIdParamValidator, getGradeByGradeId);  
router.get('/:id', gradeIdValidator, getGradeById);  
router.put('/:id', gradeIdValidator, updateGradeValidator, updateGrade);  
router.delete('/:id', gradeIdValidator, deleteGrade);  
router.patch('/:id/status', gradeIdValidator, updateStatusValidator, updateStatus);  
router.patch('/:id/display-order', gradeIdValidator, updateDisplayOrderValidator, updateDisplayOrder);  
router.patch('/bulk/status', bulkUpdateStatusValidator, bulkUpdateStatus);  

export default router;
