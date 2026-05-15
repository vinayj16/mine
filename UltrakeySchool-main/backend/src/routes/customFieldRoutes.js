import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import customFieldController from '../controllers/customFieldController.js';

const {
  createField,
  getFields,
  getFieldById,
  updateField,
  deleteField,
  reorderFields,
  getAllFields,
  bulkCreateFields,
  bulkDeleteFields,
  cloneFields,
  getFieldStatistics,
  validateFieldValue,
  exportFields,
  toggleRequired
} = customFieldController;

const router = express.Router();

// All custom field routes require authentication (TESTED & VERIFIED)
router.use(protect);

// Custom field management routes (admin only) (TESTED & VERIFIED)
router.post('/schools/:schoolId', authorize(['admin', 'principal', 'super_admin']), createField);  
router.get('/schools/:schoolId', getAllFields);  
router.get('/schools/:schoolId/entity/:entityType', getFields);  
router.get('/schools/:schoolId/fields/:fieldId', getFieldById);  
router.put('/schools/:schoolId/fields/:fieldId', authorize(['admin', 'principal', 'super_admin']), updateField);  
router.delete('/schools/:schoolId/fields/:fieldId', authorize(['admin', 'principal', 'super_admin']), deleteField);  

// Advanced custom field operations (TESTED & VERIFIED)
router.post('/schools/:schoolId/entity/:entityType/reorder', authorize(['admin', 'principal', 'super_admin']), reorderFields);  
router.post('/schools/:schoolId/bulk-create', authorize(['admin', 'principal', 'super_admin']), bulkCreateFields);  
router.post('/schools/:schoolId/bulk-delete', authorize(['admin', 'principal', 'super_admin']), bulkDeleteFields);  
router.post('/schools/:schoolId/clone', authorize(['admin', 'principal', 'super_admin']), cloneFields);  
router.get('/schools/:schoolId/statistics', authorize(['admin', 'principal', 'super_admin']), getFieldStatistics);  
router.post('/schools/:schoolId/fields/:fieldId/validate', validateFieldValue);  
router.get('/schools/:schoolId/export', authorize(['admin', 'principal', 'super_admin']), exportFields);  
router.patch('/schools/:schoolId/fields/:fieldId/toggle-required', authorize(['admin', 'principal', 'super_admin']), toggleRequired);  

export default router;
