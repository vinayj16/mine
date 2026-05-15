import express from 'express';
import contactMessageController from '../controllers/contactMessageController.js';
const {
  getContactMessages,
  createContactMessage,
  updateMessageStatus,
  deleteContactMessage
} = contactMessageController;

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';

const router = express.Router();

// Public route to submit a contact message (TESTED & VERIFIED)
router.post('/', createContactMessage);  

// Protected routes (Admin/Staff only) (TESTED & VERIFIED)
router.use(protect);
router.use(authorize(['admin', 'super_admin', 'staff']));

router.get('/', getContactMessages);  
router.patch('/:id/status', updateMessageStatus);  
router.delete('/:id', deleteContactMessage);  

export default router;
