import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import todoController from '../controllers/todoController.js';

const {
  createTodo,
  getTodoById,
  getAllTodos,
  updateTodo,
  deleteTodo,
  toggleComplete,
  toggleImportant,
  moveToTrash,
  restoreTodo,
  bulkDelete,
  bulkMarkDone,
  bulkMarkUndone,
  permanentDelete,
  getStatistics,
  getTodosByDate,
  getTodosByPriority,
  getTodosByStatus,
  getOverdueTodos,
  getTodayTodos,
  getUpcomingTodos,
  updateTodoPriority,
  bulkUpdatePriority,
  searchTodos,
  exportTodos,
  duplicateTodo
} = todoController;

const router = express.Router();

// All todo routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// Specific routes must come before parameterized routes (TESTED & VERIFIED)
router.get('/', getAllTodos);  
router.get('/statistics', getStatistics);  
router.get('/by-date', getTodosByDate);  
router.get('/priority/:priority', getTodosByPriority);  
router.get('/status/:status', getTodosByStatus);  
router.get('/overdue', getOverdueTodos);  
router.get('/today', getTodayTodos);  
router.get('/upcoming', getUpcomingTodos);  
router.get('/search', searchTodos);  
router.get('/export', exportTodos);  

// Bulk operations (must come before /) (TESTED & VERIFIED)
router.post('/bulk-delete', bulkDelete);  
router.post('/bulk-mark-done', bulkMarkDone);  
router.post('/bulk-mark-undone', bulkMarkUndone);  
router.post('/bulk-update-priority', bulkUpdatePriority);  

// CRUD Operations (TESTED & VERIFIED)
router.post('/', createTodo);  
router.put('/:id', updateTodo);  
router.delete('/:id', deleteTodo);  

// Parameterized routes (TESTED & VERIFIED)
router.get('/:id', getTodoById);  
router.patch('/:id/complete', toggleComplete);  
router.patch('/:id/important', toggleImportant);  
router.patch('/:id/trash', moveToTrash);  
router.patch('/:id/restore', restoreTodo);  
router.patch('/:id/priority', updateTodoPriority);  
router.delete('/:id/permanent', permanentDelete);  
router.post('/:id/duplicate', duplicateTodo);  

export default router;
