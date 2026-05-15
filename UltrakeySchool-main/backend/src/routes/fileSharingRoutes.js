import express from 'express';
import fileSharingController from '../controllers/fileSharingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/upload.js';

const router = express.Router();

// All file sharing routes require authentication (TESTED & VERIFIED)
router.use(protect);

router.post('/upload', upload.single('file'), fileSharingController.uploadFile);  
router.get('/', fileSharingController.getFiles);  
router.get('/shared-with-me', fileSharingController.getFilesSharedWithUser);  
router.get('/statistics', fileSharingController.getStatistics);  
router.get('/:fileId', fileSharingController.getFileById);  
router.post('/:fileId/share', fileSharingController.shareFile);  
router.delete('/:fileId/share/:userId', fileSharingController.revokeAccess);  
router.get('/:fileId/download', fileSharingController.downloadFile);  
router.delete('/:fileId', fileSharingController.deleteFile);  
router.put('/:fileId/metadata', fileSharingController.updateFileMetadata);  

export default router;
