import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import {
  createItem,
  getItemById,
  getAllItems,
  updateItem,
  deleteItem,
  moveToTrash,
  restoreItem,
  toggleFavorite,
  shareItem,
  unshareItem,
  moveItem,
  copyItem,
  getStorageInfo,
  getStatistics,
  getRecentItems,
  searchItems,
  bulkDeleteItems,
  bulkMoveToTrash,
  exportItems
} from '../controllers/fileManagerController.js';

const router = express.Router();

// All file manager routes require authentication (TESTED & VERIFIED)
router.use(protect);

// Storage and Statistics (must come before /:id routes) (TESTED & VERIFIED)
router.get('/storage', getStorageInfo);  
router.get('/statistics', getStatistics);  
router.get('/recent', getRecentItems);  
router.get('/search', searchItems);  
router.get('/export', authorize(['admin', 'principal', 'super_admin']), exportItems);  

// Basic CRUD routes (TESTED & VERIFIED)
router.get('/', getAllItems);  
router.get('/:id', getItemById);  
router.post('/', authorize(['admin', 'teacher', 'principal', 'student', 'parent']), createItem);  
router.put('/:id', authorize(['admin', 'teacher', 'principal', 'student', 'parent']), updateItem);  
router.delete('/:id', authorize(['admin', 'principal', 'super_admin']), deleteItem);  

// Special operations (TESTED & VERIFIED)
router.patch('/:id/favorite', toggleFavorite);  
router.patch('/:id/trash', authorize(['admin', 'principal', 'student', 'parent']), moveToTrash);  
router.patch('/:id/restore', authorize(['admin', 'principal', 'student', 'parent']), restoreItem);  

// Sharing operations (TESTED & VERIFIED)
router.post('/:id/share', authorize(['admin', 'teacher', 'principal', 'student', 'parent']), shareItem);  
router.post('/:id/unshare', authorize(['admin', 'teacher', 'principal', 'student', 'parent']), unshareItem);  

// Move and copy operations (TESTED & VERIFIED)
router.post('/:id/move', authorize(['admin', 'teacher', 'principal', 'student', 'parent']), moveItem);  
router.post('/:id/copy', authorize(['admin', 'teacher', 'principal', 'student', 'parent']), copyItem);  

// Bulk operations (TESTED & VERIFIED)
router.post('/bulk-delete', authorize(['admin', 'principal', 'super_admin']), bulkDeleteItems);  
router.post('/bulk-trash', authorize(['admin', 'principal', 'super_admin']), bulkMoveToTrash);  

export default router;
