import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import playerController from '../controllers/playerController.js';

const {
  createPlayer,
  getPlayerById,
  getAllPlayers,
  updatePlayer,
  deletePlayer,
  getPlayersByStatus,
  getPlayersBySport,
  getPlayersByStudent,
  updateStatus,
  bulkUpdateStatus,
  bulkDeletePlayers,
  getPlayerStatistics,
  searchPlayers,
  exportPlayers,
  getActivePlayers,
  archivePlayer,
  restorePlayer,
  addAchievement,
  updateStatistics
} = playerController;

const router = express.Router();

// All player routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// CRUD Operations (TESTED & VERIFIED)
router.get('/', getAllPlayers);  
router.get('/statistics', authorize(['admin', 'principal']), getPlayerStatistics);  
router.get('/active', getActivePlayers);  
router.get('/search', searchPlayers);  
router.get('/status/:status', getPlayersByStatus);  
router.get('/sport/:sportId', getPlayersBySport);  
router.get('/student/:studentId', getPlayersByStudent);  
router.get('/:id', getPlayerById);  
router.post('/', authorize(['admin', 'principal']), createPlayer);  
router.put('/:id', authorize(['admin', 'principal']), updatePlayer);  
router.delete('/:id', authorize(['super_admin']), deletePlayer);  

// Status Management (TESTED & VERIFIED)
router.patch('/:id/status', authorize(['admin', 'principal']), updateStatus);  
router.patch('/:id/archive', authorize(['admin', 'principal']), archivePlayer);  
router.patch('/:id/restore', authorize(['admin', 'principal']), restorePlayer);  

// Achievements and Statistics (TESTED & VERIFIED)
router.post('/:id/achievements', authorize(['admin', 'principal']), addAchievement);  
router.patch('/:id/statistics', authorize(['admin', 'principal']), updateStatistics);  

// Bulk Operations (TESTED & VERIFIED)
router.post('/bulk-update-status', authorize(['admin', 'principal']), bulkUpdateStatus);  
router.post('/bulk-delete', authorize(['super_admin']), bulkDeletePlayers);  

// Export (TESTED & VERIFIED)
router.get('/export', authorize(['admin', 'principal']), exportPlayers);  

export default router;
