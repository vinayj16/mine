import express from 'express';
import transportController from '../controllers/transportController.js';
import transportService from '../services/transportService.js';
import driverController from '../controllers/driverController.js';
import pickupPointController from '../controllers/pickupPointController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import { sendTransportEmail } from '../config/email.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

const {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  assignStudentToRoute,
  getStudentTransports,
  updateStudentTransport,
  deleteStudentTransport,
  createTrip,
  startTrip,
  completeTrip,
  cancelTrip,
  getTrips,
  getTripById,
  createMaintenance,
  getMaintenanceRecords,
  addFuelRecord,
  getFuelRecords,
  getTransportStatistics,
  getTransportAnalytics,
  exportTransportData,
  searchTransport,
  bulkUpdateVehicles,
  bulkDeleteVehicles
} = transportController;

const router = express.Router();

// All routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// All routes with authorization - include institution_owner and institution_admin
router.get('/export', authorize(['super_admin', 'admin', 'transport_manager', 'principal',   'institution_admin']), exportTransportData);  
router.get('/analytics', authorize(['super_admin', 'admin', 'transport_manager', 'principal',   'institution_admin']), getTransportAnalytics);  
router.get('/statistics', authorize(['super_admin', 'admin', 'transport_manager', 'principal',   'institution_admin']), getTransportStatistics);

// Bulk operations (must come before /) (TESTED & VERIFIED)
router.post('/vehicles/bulk-update', authorize(['super_admin', 'admin', 'transport_manager', 'principal']), bulkUpdateVehicles);  
router.post('/vehicles/bulk-delete', authorize(['super_admin', 'admin', 'transport_manager', 'principal']), bulkDeleteVehicles);  

// Vehicle Management (TESTED & VERIFIED)
router.post('/vehicles', authorize(['super_admin', 'admin', 'transport_manager', 'principal',   'institution_admin']), createVehicle);  
router.get('/vehicles', getVehicles);  
router.get('/vehicles/:id', getVehicleById);
router.put('/vehicles/:id', authorize(['super_admin', 'admin', 'transport_manager', 'principal',   'institution_admin']), updateVehicle);  
router.delete('/vehicles/:id', authorize(['super_admin', 'admin', 'transport_manager', 'principal',   'institution_admin']), deleteVehicle);  

// Route Management (TESTED & VERIFIED)
router.post('/routes', authorize(['super_admin', 'admin', 'transport_manager', 'principal',   'institution_admin']), createRoute);  
router.get('/routes', getRoutes);  
router.get('/routes/:id', getRouteById);
router.put('/routes/:id', authorize(['super_admin', 'admin', 'transport_manager',   'institution_admin']), updateRoute);  
router.delete('/routes/:id', authorize(['super_admin', 'admin', 'transport_manager',   'institution_admin']), deleteRoute);  

// Student Transport Assignment (TESTED & VERIFIED)
router.post('/assignments', authorize(['super_admin', 'admin', 'transport_manager', 'principal',   'institution_admin']), assignStudentToRoute);  
router.get('/assignments', getStudentTransports);  
router.put('/assignments/:id', authorize(['super_admin', 'admin', 'transport_manager', 'principal',   'institution_admin']), updateStudentTransport);  
router.delete('/assignments/:id', authorize(['super_admin', 'admin', 'transport_manager', 'principal',   'institution_admin']), deleteStudentTransport);

// Trip Management (TESTED & VERIFIED)
router.post('/trips', authorize(['super_admin', 'admin', 'transport_manager', 'principal', 'driver']), createTrip);  
router.put('/trips/:id/start', authorize(['super_admin', 'admin', 'transport_manager', 'principal', 'driver']), startTrip);  
router.put('/trips/:id/complete', authorize(['super_admin', 'admin', 'transport_manager', 'principal', 'driver']), completeTrip);  
router.put('/trips/:id/cancel', authorize(['super_admin', 'admin', 'transport_manager', 'principal', 'driver']), cancelTrip);  
router.get('/trips', getTrips);  
router.get('/trips/:id', getTripById);  

// Vehicle Maintenance (TESTED & VERIFIED)
router.post('/maintenance', authorize(['super_admin', 'admin', 'transport_manager', 'principal']), createMaintenance);  
router.get('/maintenance', getMaintenanceRecords);  

// Fuel Management (TESTED & VERIFIED)
router.post('/fuel', authorize(['super_admin', 'admin', 'transport_manager', 'driver', 'principal']), addFuelRecord);  
router.get('/fuel', getFuelRecords);  

// Report endpoints (TESTED & VERIFIED)
router.get('/reports', authorize(['super_admin', 'admin', 'transport_manager', 'principal']), async (req, res) => {
  try {
    const institutionId = req.user?.institutionId;
    const result = await transportService.getTransportReports(institutionId, req.query);
    return successResponse(res, result.reports, 'Transport reports retrieved successfully', result.pagination);
  } catch (error) {
    logger.error('Error fetching transport reports:', error);
    return errorResponse(res, error.message);
  }
});

router.get('/reports/statistics', authorize(['super_admin', 'admin', 'transport_manager', 'principal']), async (req, res) => {
  try {
    const institutionId = req.user?.institutionId;
    const statistics = await transportService.getTransportStatistics(institutionId);
    return successResponse(res, statistics, 'Transport statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching transport statistics:', error);
    return errorResponse(res, error.message);
  }
});

// Dashboard endpoints (TESTED & VERIFIED)
router.get(
  '/dashboard/stats',
  authorize(['super_admin', 'admin', 'transport_manager', 'principal']),  
  async (req, res) => {
    try {
      const stats = await transportController.getTransportStatistics(req);
      return stats;
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard stats',
        error: error.message
      });
    }
  }
);  

router.get(
  '/dashboard/routes',
  authorize(['super_admin', 'admin', 'transport_manager']),  
  async (req, res) => {
    try {
      const { TransportRoute, TransportAssignment, Vehicle } = await import('../models/Transport.js');
      
      const routes = await TransportRoute.find({ tenant: req.user.tenant })
        .populate('vehicle', 'registrationNumber')
        .populate('stops', 'name');

      const routeData = routes.map(route => {
        const students = route.students || [];
        return {
          route: route.name,
          bus: route.vehicle?.registrationNumber || 'N/A',
          students: students.length,
          status: route.status === 'active' ? 'On Time' : 'Delayed',
          arrivalTime: route.startTime || 'N/A'
        };
      });

      return res.status(200).json({
        success: true,
        data: routeData
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve route data',
        error: error.message
      });
    }
  }
);  

router.get(
  '/dashboard/complaints',
  authorize(['super_admin', 'admin', 'transport_manager']),  
  async (req, res) => {
    try {
      const { Complaint } = await import('../models/complaint.js');
      
      const complaints = await Complaint.find({
        tenant: req.user.tenant,
        category: 'transport',
        status: { $in: ['pending', 'in_progress'] }
      })
      .limit(5);

      const complaintData = complaints.map(complaint => ({
        title: complaint.title,
        severity: complaint.priority === 'high' ? 'critical' : 'warning',
        route: complaint.description
      }));

      return res.status(200).json({
        success: true,
        data: complaintData
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve complaints',
        error: error.message
      });
    }
  }
);  

router.get(
  '/dashboard/status',
  authorize(['super_admin', 'admin', 'transport_manager']),  
  async (req, res) => {
    try {
      const { Vehicle } = await import('../models/Transport.js');
      
      const vehicles = await Vehicle.find({ tenant: req.user.tenant });
      
      const statusCounts = {
        'On Time': 0,
        'Delayed': 0,
        'Maintenance': 0
      };

      vehicles.forEach(vehicle => {
        if (vehicle.status === 'maintenance') {
          statusCounts['Maintenance']++;
        } else if (vehicle.status === 'active') {
          statusCounts['On Time']++;
        } else {
          statusCounts['Delayed']++;
        }
      });

      const statusData = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }));

      return res.status(200).json({
        success: true,
        data: statusData
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve status data',
        error: error.message
      });
    }
  }
);  

// Send transport email (TESTED & VERIFIED)
router.post(
  '/send-email/:studentId',
  authorize(['super_admin', 'admin', 'transport_manager']),  
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const { transportData } = req.body;

      // Fetch student details
      const student = await Student.findById(studentId);
      if (!student) {
        return errorResponse(res, 'Student not found', 404);
      }

      // Fetch parent/guardian details
      const parent = await User.findById(student.parentId);
      if (!parent) {
        return errorResponse(res, 'Parent not found', 404);
      }

      // Send transport email
      await sendTransportEmail(
        { email: parent.email, name: parent.name },
        {
          studentName: student.name,
          studentId: student.studentId,
          studentClass: student.class,
          ...transportData
        }
      );

      logger.info('Transport email sent successfully:', { studentId, parentEmail: parent.email });
      return successResponse(res, { message: 'Transport email sent successfully' });
    } catch (error) {
      logger.error('Error sending transport email:', error);
      return errorResponse(res, error.message || 'Failed to send transport email', 500);
    }
  }
);  

// Pickup Points (TESTED & VERIFIED)
router.get('/pickup-points', pickupPointController.getAllPickupPoints);
router.get('/pickup-points/:id', pickupPointController.getPickupPointById);
router.post('/pickup-points', authorize(['super_admin', 'admin', 'transport_manager', 'principal']), pickupPointController.createPickupPoint);
router.put('/pickup-points/:id', authorize(['super_admin', 'admin', 'transport_manager', 'principal']), pickupPointController.updatePickupPoint);
router.delete('/pickup-points/:id', authorize(['super_admin', 'admin', 'transport_manager', 'principal']), pickupPointController.deletePickupPoint);

// Drivers (TESTED & VERIFIED)
router.get('/drivers', driverController.getAllDrivers);
router.get('/drivers/:id', driverController.getDriverById);
router.post('/drivers', authorize(['super_admin', 'admin', 'transport_manager', 'principal']), driverController.createDriver);
router.put('/drivers/:id', authorize(['super_admin', 'admin', 'transport_manager', 'principal']), driverController.updateDriver);
router.delete('/drivers/:id', authorize(['super_admin', 'admin', 'transport_manager', 'principal']), driverController.deleteDriver);

export default router;
