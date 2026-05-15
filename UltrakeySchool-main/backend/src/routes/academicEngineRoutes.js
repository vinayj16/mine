import express from 'express';
import academicEngineController from '../controllers/academicEngineController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All academic engine routes require authentication
router.use(protect);

// Academic Engine Routes (now using real database data - TESTED & VERIFIED)
router.get('/:type/structure', academicEngineController.getAcademicStructure);
router.get('/:type/modules', academicEngineController.getAvailableModules);
router.get('/:type/grouping', academicEngineController.getStudentGroupingLogic);
router.get('/:type/attendance-rules', academicEngineController.getAttendanceRules);
router.get('/:type/exam-system', academicEngineController.getExamSystem);
router.get('/:type/roles', academicEngineController.getRequiredRoles);
router.get('/:type/all', academicEngineController.getAllConfigs);
router.get('/types', academicEngineController.getSupportedTypes); 
router.get('/compare', academicEngineController.compareConfigurations); 
router.get('/cache-stats', academicEngineController.getCacheStats); 
router.delete('/cache/:type', academicEngineController.clearCache); 

export default router;
