import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import bannedIPController from '../controllers/bannedIPController.js';

const {
  getAllBannedIPs,
  getBannedIPById,
  checkIPBanned,
  createBannedIP,
  updateBannedIP,
  deleteBannedIP,
  bulkDeleteBannedIPs
} = bannedIPController;

const router = express.Router();

// Public route (TESTED & VERIFIED)
router.get('/check/:ipAddress', checkIPBanned);  

// Admin routes (TESTED & VERIFIED)
router.use(protect);
router.use(authorize(['admin', 'super_admin']));

router.get('/', getAllBannedIPs);  
router.get('/:id', getBannedIPById);  
router.post('/', createBannedIP);  
router.post('/bulk-delete', bulkDeleteBannedIPs);  
router.put('/:id', updateBannedIP);  
router.delete('/:id', deleteBannedIP);  

export default router;
