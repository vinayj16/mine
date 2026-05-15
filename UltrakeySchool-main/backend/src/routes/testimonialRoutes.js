import express from 'express';
import * as testimonialController from '../controllers/testimonialController.js';

const {
  getAllTestimonials,
  getTestimonial,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getTestimonialsByStatus,
  getActiveTestimonials,
  getFeaturedTestimonials,
  updateTestimonialStatus,
  toggleFeatured,
  approveTestimonial,
  rejectTestimonial,
  getTestimonialsByRating,
  bulkUpdateStatus,
  bulkDeleteTestimonials,
  exportTestimonials,
  getTestimonialStatistics,
  searchTestimonials
} = testimonialController.default;

const router = express.Router();

// Specific routes must come before parameterized routes (TESTED & VERIFIED)
router.get('/', getAllTestimonials);  
router.get('/search', searchTestimonials);  
router.get('/statistics', getTestimonialStatistics);  
router.get('/active', getActiveTestimonials);  
router.get('/featured', getFeaturedTestimonials);  
router.get('/status/:status', getTestimonialsByStatus);  
router.get('/rating/:rating', getTestimonialsByRating);  
router.post('/', createTestimonial);  
router.post('/bulk/update-status', bulkUpdateStatus);  
router.post('/bulk/delete', bulkDeleteTestimonials);  
router.get('/export', exportTestimonials);  

// Parameterized routes (TESTED & VERIFIED)
router.get('/:id', getTestimonial);  
router.put('/:id', updateTestimonial);  
router.delete('/:id', deleteTestimonial);  
router.patch('/:id/status', updateTestimonialStatus);  
router.patch('/:id/featured', toggleFeatured);  
router.patch('/:id/approve', approveTestimonial);  
router.patch('/:id/reject', rejectTestimonial);  

export default router;
