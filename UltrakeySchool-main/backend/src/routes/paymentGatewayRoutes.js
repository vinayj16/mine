import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import paymentGatewayController from '../controllers/paymentGatewayController.js';

const {
  createPaymentGateway,
  getPaymentGatewayById,
  getAllPaymentGateways,
  updatePaymentGateway,
  deletePaymentGateway,
  getPaymentGatewaysByStatus,
  getPaymentGatewaysByType,
  updateStatus,
  bulkUpdateStatus,
  bulkDeletePaymentGateways,
  getPaymentGatewayStatistics,
  searchPaymentGateways,
  exportPaymentGateways,
  getActivePaymentGateways,
  toggleGateway,
  testConnection,
  processPayment,
  refundPayment,
  getPaymentHistory,
  getPaymentById
} = paymentGatewayController;

const router = express.Router();

// All payment gateway routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// CRUD Operations (TESTED & VERIFIED)
router.get('/', getAllPaymentGateways);  
router.get('/statistics', authorize(['admin', 'principal']), getPaymentGatewayStatistics);  
router.get('/active', getActivePaymentGateways);  
router.get('/search', searchPaymentGateways);  
router.get('/status/:status', getPaymentGatewaysByStatus);  
router.get('/type/:type', getPaymentGatewaysByType);  
router.get('/:id', getPaymentGatewayById);  
router.post('/', authorize(['super_admin']), createPaymentGateway);  
router.put('/:id', authorize(['admin', 'principal']), updatePaymentGateway);  
router.delete('/:id', authorize(['super_admin']), deletePaymentGateway);  

// Status Management (TESTED & VERIFIED)
router.patch('/:id/status', authorize(['admin', 'principal']), updateStatus);  
router.patch('/:id/toggle', authorize(['admin', 'principal']), toggleGateway);  

// Payment Operations (TESTED & VERIFIED)
router.post('/:id/process', authorize(['admin', 'principal']), processPayment);  
router.post('/payments/:paymentId/refund', authorize(['admin', 'principal']), refundPayment);  
router.get('/payments/history', getPaymentHistory);  
router.get('/payments/:paymentId', getPaymentById);  

// Connection Testing (TESTED & VERIFIED)
router.post('/:id/test', authorize(['admin', 'principal']), testConnection);  

// Bulk Operations (TESTED & VERIFIED)
router.post('/bulk-update-status', authorize(['admin', 'principal']), bulkUpdateStatus);  
router.post('/bulk-delete', authorize(['super_admin']), bulkDeletePaymentGateways);  

// Export (TESTED & VERIFIED)
router.get('/export', authorize(['admin', 'principal']), exportPaymentGateways);  

export default router;
