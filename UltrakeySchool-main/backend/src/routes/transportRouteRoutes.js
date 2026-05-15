import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import transportRouteController from '../controllers/transportRouteController.js';

const {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  bulkDeleteRoutes,
  getActiveRoutes,
  getRoutesByStatus,
  updateRouteStatus,
  searchRoutes,
  getRouteStatistics,
  getRouteAnalytics,
  exportRoutes,
  bulkUpdateRoutes,
  addStopToRoute,
  removeStopFromRoute,
  updateRouteStop,
  getRouteStops,
  optimizeRoute,
  duplicateRoute
} = transportRouteController;

const router = express.Router();

// All transport route routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// Specific routes must come before parameterized routes (TESTED & VERIFIED)
router.get('/', getAllRoutes);  
router.get('/search', searchRoutes);  
router.get('/active', getActiveRoutes);  
router.get('/statistics', authorize(['admin', 'principal', 'super_admin']), getRouteStatistics);  
router.get('/analytics', authorize(['admin', 'principal', 'super_admin']), getRouteAnalytics);  
router.get('/export', authorize(['admin', 'principal', 'super_admin']), exportRoutes);  
router.get('/status/:status', getRoutesByStatus);  

// Bulk operations (must come before /) (TESTED & VERIFIED)
router.post('/bulk-delete', authorize(['admin', 'principal', 'super_admin']), bulkDeleteRoutes);  
router.post('/bulk-update', authorize(['admin', 'principal', 'super_admin']), bulkUpdateRoutes);  

// Route CRUD operations (TESTED & VERIFIED)
router.post('/', authorize(['admin', 'principal', 'super_admin']), createRoute);  

// Parameterized routes (TESTED & VERIFIED)
router.get('/:id', getRouteById);  
router.put('/:id', authorize(['admin', 'principal', 'super_admin']), updateRoute);  
router.delete('/:id', authorize(['admin', 'principal', 'super_admin']), deleteRoute);  
router.patch('/:id/status', authorize(['admin', 'principal', 'super_admin']), updateRouteStatus);  
router.get('/:id/stops', getRouteStops);  
router.post('/:id/stops', authorize(['admin', 'principal', 'super_admin']), addStopToRoute);  
router.delete('/:id/stops/:stopId', authorize(['admin', 'principal', 'super_admin']), removeStopFromRoute);  
router.put('/:id/stops/:stopId', authorize(['admin', 'principal', 'super_admin']), updateRouteStop);  
router.post('/:id/optimize', authorize(['admin', 'principal', 'super_admin']), optimizeRoute);  
router.post('/:id/duplicate', authorize(['admin', 'principal', 'super_admin']), duplicateRoute);  

export default router;
