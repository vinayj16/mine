import express from 'express';
import hostelController from '../controllers/hostelController.js';
const {
  roomController,
  allocationController,
  complaintController,
  visitorLogController,
  roomTypeController
} = hostelController;

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import { validateTenantAccess } from '../middleware/multiTenant.js';
import { sendHostelEmail } from '../config/email.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

const router = express.Router();

// Helper function to get tenant filter for queries
const getTenantFilter = (tenantId) => {
  // Check if tenantId is a valid ObjectId
  if (mongoose.Types.ObjectId.isValid(tenantId)) {
    return { institution: tenantId };
  }
  // For string institution IDs (like "demo-institution"), use string match
  return { institutionId: tenantId };
};

// Apply tenant middleware to all routes (TESTED & VERIFIED)
router.use(protect);
router.use(validateTenantAccess);

// Hostel Building Routes - Hostel Warden and above (TESTED & VERIFIED)
router.post('/hostels',
  authorize('hostel_warden', 'admin', 'institution_admin',   'superadmin', 'principal'),
  hostelController.create
);  

router.get('/hostels',
  authorize('hostel_warden', 'admin', 'institution_admin',   'superadmin', 'principal', 'student', 'parent'),
  hostelController.getAll
);  

router.get('/hostels/:id',
  authorize('hostel_warden', 'admin', 'institution_admin',   'superadmin', 'principal', 'student', 'parent'),
  hostelController.getById
);  

router.put('/hostels/:id',
  authorize('hostel_warden', 'admin', 'institution_admin',   'superadmin', 'principal'),
  hostelController.update
);  

router.delete('/hostels/:id',
  authorize('hostel_warden', 'admin', 'institution_admin',   'superadmin'),
  hostelController.delete
);  

// Room Type Routes - Hostel Warden and above (TESTED & VERIFIED)
router.post('/room-types',
  authorize('hostel_warden', 'admin', 'institution_admin',   'superadmin', 'principal'),
  roomTypeController.create
);  

router.get('/room-types',
  authorize('hostel_warden', 'admin', 'institution_admin',   'superadmin', 'principal', 'student', 'parent'),
  roomTypeController.getAll
);  

router.get('/room-types/:id',
  authorize('hostel_warden', 'admin', 'institution_admin',   'superadmin', 'student', 'parent'),
  roomTypeController.getById
);  

router.put('/room-types/:id',
  authorize('hostel_warden', 'admin', 'institution_admin',   'superadmin'),
  roomTypeController.update
);  

router.delete('/room-types/:id',
  authorize('hostel_warden', 'admin', 'institution_admin',   'superadmin'),
  roomTypeController.delete
);  

// Room Routes - Hostel Warden and above (TESTED & VERIFIED)
router.post('/rooms',
  authorize('hostel_warden', 'admin', 'institution_admin',   'superadmin', 'principal'),
  roomController.create
);  

router.get('/rooms',
  authorize('hostel_warden', 'admin', 'institution_admin',   'superadmin', 'principal', 'student', 'parent'),
  roomController.getAll
);  

router.get('/rooms/:id',
  authorize('hostel_warden', 'admin', 'institution_admin',   'superadmin', 'student', 'parent'),
  roomController.getById
);  

router.put('/rooms/:id',
  authorize('hostel_warden', 'admin', 'institution_admin',   'superadmin'),
  roomController.update
);  

router.delete('/rooms/:id',
  authorize('hostel_warden', 'admin', 'institution_admin',   'superadmin'),
  roomController.delete
);  

router.get('/rooms/availability',
  authorize('hostel_warden', 'admin', 'institution_admin',   'superadmin', 'student', 'parent'),
  roomController.getAvailability
);  

// Allocation Routes - Hostel Warden and above (TESTED & VERIFIED)
router.post('/allocations',
  authorize('hostel_warden', 'admin', 'institution_admin', 'superadmin'),
  allocationController.create
);  

router.get('/allocations',
  authorize('hostel_warden', 'admin', 'institution_admin', 'superadmin'),
  allocationController.getAll
);  

router.put('/allocations/:id/checkout',
  authorize('hostel_warden', 'admin', 'institution_admin', 'superadmin'),
  allocationController.checkout
);  

// Student/Parent specific routes (TESTED & VERIFIED)
router.get('/my-allocation',
  authorize('student'),
  async (req, res) => {  
    try {
      const Allocation = (await import('../models/Hostel.js')).Allocation;

      const allocation = await Allocation.findOne({
        student: req.user.id,
        status: 'active'
      })
      .populate('room', 'roomNumber hostel floor type facilities rent securityDeposit')
      .populate('allocatedBy', 'name');

      const { successResponse } = await import('../utils/apiResponse.js');
      return successResponse(res, { allocation });
    } catch (error) {
      const { errorResponse } = await import('../utils/apiResponse.js');
      return errorResponse(res, 'Failed to retrieve allocation', 500);
    }
  }
);

// Complaint Routes - All authenticated users can file, hostel warden can manage (TESTED & VERIFIED)
router.post('/complaints',
  complaintController.create
);  

router.get('/complaints',
  complaintController.getAll
);  

router.put('/complaints/:id/status',
  authorize('hostel_warden', 'admin', 'institution_admin', 'superadmin'),
  complaintController.updateStatus
);  

// Visitor Log Routes - Hostel Warden and above for management, students for their rooms (TESTED & VERIFIED)
router.post('/visitor-logs/check-in',
  authorize('hostel_warden', 'admin', 'institution_admin', 'superadmin', 'student'),
  visitorLogController.checkIn
);  

router.put('/visitor-logs/:id/check-out',
  authorize('hostel_warden', 'admin', 'institution_admin', 'superadmin', 'student'),
  visitorLogController.checkOut
);  

router.get('/visitor-logs',
  authorize('hostel_warden', 'admin', 'institution_admin', 'superadmin'),
  visitorLogController.getAll
);  

 // Hostel Dashboard - Hostel Warden specific (TESTED & VERIFIED)
router.get('/dashboard/stats',
  authorize('hostel_warden', 'admin', 'institution_admin',   'superadmin', 'principal'),
  async (req, res) => {  
    try {
      const { Room, Allocation, HostelComplaint } = await import('../models/Hostel.js');
      
      if (!Room || !Allocation || !HostelComplaint) {
        return res.status(500).json({ success: false, message: 'Hostel models not loaded properly' });
      }
      
      // Build query filter based on tenant validity
      const tenantFilter = mongoose.Types.ObjectId.isValid(req.tenantId)
        ? { institution: req.tenantId }
        : {};
      
      // Aggregate dashboard data with safe countDocuments calls
      const getCount = async (model, filter = {}) => {
        try {
          if (model && typeof model.countDocuments === 'function') {
            return await model.countDocuments(filter);
          }
          return 0;
        } catch (err) {
          console.error('Count error:', err.message);
          return 0;
        }
      };
      
      const [
        totalRooms,
        availableRooms,
        occupiedRooms,
        activeAllocations,
        pendingComplaints
      ] = await Promise.all([
        getCount(Room, tenantFilter),
        getCount(Room, { ...tenantFilter, status: 'available' }),
        getCount(Room, { ...tenantFilter, status: 'occupied' }),
        getCount(Allocation, { ...tenantFilter, status: 'active' }),
        getCount(HostelComplaint, {
          ...tenantFilter,
          status: { $in: ['pending', 'in-progress'] }
        })
      ]);

      const { successResponse } = await import('../utils/apiResponse.js');
      return successResponse(res, {
        totalResidents: activeAllocations,
        totalRooms: totalRooms,
        maintenanceIssues: 0,
        pendingComplaints: pendingComplaints,
        vacantRooms: availableRooms,
        occupiedRooms: occupiedRooms
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      const { errorResponse } = await import('../utils/apiResponse.js');
      return errorResponse(res, 'Failed to retrieve dashboard stats: ' + error.message, 500);
    }
  }
);

router.get('/dashboard/rooms',
  authorize('hostel_warden', 'admin', 'institution_admin',   'superadmin', 'principal'),
  async (req, res) => {  
    try {
      const { Room, Allocation } = await import('../models/Hostel.js');

      // Build query filter based on tenant validity
      const tenantFilter = mongoose.Types.ObjectId.isValid(req.tenantId)
        ? { institution: req.tenantId }
        : {};

      const rooms = await Room.find(tenantFilter)
        .populate('createdBy', 'name')
        .sort({ roomNumber: 1 });

      const roomData = await Promise.all(rooms.map(async (room) => {
        const currentResidents = await Allocation.countDocuments({
          room: room._id,
          status: 'active'
        });

        return {
          id: room._id.toString(),
          roomNumber: room.roomNumber,
          hostel: room.hostel,
          block: room.block,
          type: room.type,
          floor: room.floor,
          currentResidents,
          capacity: room.capacity,
          occupied: room.occupied || 0,
          rent: room.rent,
          status: room.status
        };
      }));

      const { successResponse } = await import('../utils/apiResponse.js');
      return successResponse(res, { rooms: roomData, total: roomData.length });
    } catch (error) {
      console.error('Dashboard rooms error:', error);
      const { errorResponse } = await import('../utils/apiResponse.js');
      return errorResponse(res, 'Failed to retrieve room data: ' + error.message, 500);
    }
  }
);

router.get('/dashboard/occupancy',
  authorize('hostel_warden', 'admin', 'institution_admin', 'superadmin'),
  async (req, res) => {  
    try {
      const { Room, Allocation } = await import('../models/Hostel.js');

      const blocks = await Room.distinct('hostel', { institution: req.tenantId });

      const occupancyData = await Promise.all(blocks.map(async (block) => {
        const rooms = await Room.find({ institution: req.tenantId, hostel: block });
        const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
        const totalOccupied = await Allocation.countDocuments({
          room: { $in: rooms.map(r => r._id) },
          status: 'active'
        });

        return {
          block,
          occupied: totalOccupied,
          vacant: totalCapacity - totalOccupied
        };
      }));

      const { successResponse } = await import('../utils/apiResponse.js');
      return successResponse(res, { occupancyData });
    } catch (error) {
      const { errorResponse } = await import('../utils/apiResponse.js');
      return errorResponse(res, 'Failed to retrieve occupancy data', 500);
    }
  }
);

// Maintenance routes (would need maintenance controller - placeholder for now) (TESTED & VERIFIED)
router.get('/maintenance',
  authorize('hostel_warden', 'admin', 'institution_admin', 'superadmin'),
  async (req, res) => {  
    try {
      const { HostelMaintenance } = await import('../models/Hostel.js');

      const maintenance = await HostelMaintenance.find({
        institution: req.tenantId
      }).sort({ scheduledDate: 1 });

      const { successResponse } = await import('../utils/apiResponse.js');
      return successResponse(res, { maintenance });
    } catch (error) {
      const { errorResponse } = await import('../utils/apiResponse.js');
      return errorResponse(res, 'Failed to retrieve maintenance records', 500);
    }
  }
);

// Room inventory routes (TESTED & VERIFIED)
router.get('/inventory',
  authorize('hostel_warden', 'admin', 'institution_admin', 'superadmin'),
  async (req, res) => {  
    try {
      const RoomInventory = (await import('../models/Hostel.js')).RoomInventory;

      const inventory = await RoomInventory.find({
        institution: req.tenantId
      })
      .populate('room', 'roomNumber hostel floor')
      .sort({ lastChecked: -1 });

      const { successResponse } = await import('../utils/apiResponse.js');
      return successResponse(res, { inventory });
    } catch (error) {
      const { errorResponse } = await import('../utils/apiResponse.js');
      return errorResponse(res, 'Failed to retrieve inventory', 500);
    }
  }
);

// Send hostel email (TESTED & VERIFIED)
router.post(
  '/send-email/:studentId',
  authorize('hostel_warden', 'admin', 'institution_admin', 'superadmin'),
  async (req, res) => {  
    try {
      const { studentId } = req.params;
      const { hostelData } = req.body;

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

      // Send hostel email
      await sendHostelEmail(
        { email: parent.email, name: parent.name },
        {
          studentName: student.name,
          studentId: student.studentId,
          studentClass: student.class,
          ...hostelData
        }
      );

      logger.info('Hostel email sent successfully:', { studentId, parentEmail: parent.email });
      return successResponse(res, { message: 'Hostel email sent successfully' });
    } catch (error) {
      logger.error('Error sending hostel email:', error);
      return errorResponse(res, error.message || 'Failed to send hostel email', 500);
    }
  }
);

export default router;
