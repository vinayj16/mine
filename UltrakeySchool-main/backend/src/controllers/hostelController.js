import { Room, Hostel, Allocation, HostelComplaint, VisitorLog, RoomType } from '../models/Hostel.js';
import { Recruitment } from '../models/Recruitment.js';
import { PerformanceReview } from '../models/PerformanceReview.js';
import { Training } from '../models/hr.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse, badRequestResponse, forbiddenResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_ROOM_STATUSES = ['available', 'occupied', 'maintenance', 'reserved', 'unavailable'];
const VALID_ALLOCATION_STATUSES = ['active', 'checked-out', 'cancelled', 'expired'];
const VALID_COMPLAINT_STATUSES = ['pending', 'in-progress', 'resolved', 'closed', 'rejected'];
const VALID_COMPLAINT_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_COMPLAINT_CATEGORIES = ['maintenance', 'cleanliness', 'noise', 'security', 'facilities', 'other'];
const VALID_HOSTEL_TYPES = ['boys', 'girls', 'mixed', 'staff'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const VALID_HOSTEL_STATUSES = ['active', 'inactive'];
const VALID_RECRUITMENT_STATUSES = ['draft', 'published', 'closed', 'cancelled'];
const VALID_REVIEW_STATUSES = ['draft', 'submitted', 'approved', 'rejected'];
const VALID_TRAINING_STATUSES = ['scheduled', 'ongoing', 'completed', 'cancelled'];

// Helper function to validate MongoDB ObjectId
const validateObjectId = (id, fieldName = 'ID') => {
  if (!id) {
    return fieldName + ' is required';
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate date
const validateDate = (date, fieldName = 'Date') => {
  if (!date) {
    return fieldName + ' is required';
  }
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate date range
const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) {
    return 'Start date cannot be after end date';
  }
  return null;
};

// ============ ROOM CONTROLLER FUNCTIONS ============

const createRoom = async (req, res) => {
  try {
    logger.info('Creating room');
    const { roomNumber, hostel, floor, capacity, type, status, block, rent, securityDeposit, facilities } = req.body;
    const errors = [];
    
    if (!roomNumber || roomNumber.trim().length === 0) {
      errors.push('Room number is required');
    } else if (roomNumber.length > 50) {
      errors.push('Room number must not exceed 50 characters');
    }
    
    if (floor === undefined || floor === null) {
      errors.push('Floor is required');
    } else {
      const floorNum = parseInt(floor);
      if (isNaN(floorNum) || floorNum < 0) {
        errors.push('Floor must be a non-negative number');
      }
    }
    
    if (capacity === undefined || capacity === null) {
      errors.push('Capacity is required');
    } else {
      const capacityNum = parseInt(capacity);
      if (isNaN(capacityNum) || capacityNum < 1) {
        errors.push('Capacity must be at least 1');
      } else if (capacityNum > 20) {
        errors.push('Capacity must not exceed 20');
      }
    }
    
    if (status && !VALID_ROOM_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_ROOM_STATUSES.join(', '));
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Handle both ObjectId and string institution IDs
    const roomData = {
      roomNumber: roomNumber.trim(),
      hostel: hostel || 'boys',
      floor: parseInt(floor),
      capacity: parseInt(capacity),
      type: type || 'single',
      status: status || 'available',
      block: block || '',
      rent: rent || 0,
      securityDeposit: securityDeposit || 0,
      facilities: facilities || [],
      createdBy: req.user?.id
    };
    
    // Only set institution if tenantId is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(req.tenantId)) {
      roomData.institution = req.tenantId;
    } else {
      // For string institution IDs, store as institutionId
      roomData.institutionId = req.tenantId;
    }
    
    const room = new Room(roomData);
    await room.save();
    
    logger.info('Room created successfully:', { roomId: room._id });
    return createdResponse(res, room, 'Room added successfully');
  } catch (error) {
    logger.error('Error creating room:', error);
    return errorResponse(res, error.message);
  }
};

const getAllRooms = async (req, res) => {
  try {
    logger.info('Fetching all rooms');
    const { page, limit, hostel, status, floor, type } = req.query;
    const errors = [];
    
    if (hostel) {
      const hostelIdError = validateObjectId(hostel, 'Hostel ID');
      if (hostelIdError) errors.push(hostelIdError);
    }
    
    if (status && !VALID_ROOM_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_ROOM_STATUSES.join(', '));
    }
    
    if (floor) {
      const floorNum = parseInt(floor);
      if (isNaN(floorNum) || floorNum < 0) {
        errors.push('Floor must be a non-negative number');
      }
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (limitNum < 1 || limitNum > 100) errors.push('Limit must be between 1 and 100');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    // Build query - handle both ObjectId and string institution IDs
    const query = mongoose.Types.ObjectId.isValid(req.tenantId)
      ? { institution: req.tenantId }
      : { institutionId: req.tenantId };
    
    if (hostel) query.hostel = hostel;
    if (status) query.status = status;
    if (floor) query.floor = parseInt(floor);
    if (type) query.type = type;
    
    const skip = (pageNum - 1) * limitNum;
    const [rooms, total] = await Promise.all([
      Room.find(query).populate('createdBy', 'name').sort({ roomNumber: 1 }).skip(skip).limit(limitNum),
      Room.countDocuments(query)
    ]);
    
    logger.info('Rooms fetched successfully');
    return successResponse(res, { rooms, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, 'Rooms retrieved successfully');
  } catch (error) {
    logger.error('Error fetching rooms:', error);
    return errorResponse(res, error.message);
  }
};

const getRoomById = async (req, res) => {
  try {
    logger.info('Fetching room by ID');
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Room ID');
    if (idError) errors.push(idError);
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const room = await Room.findOne({ _id: req.params.id, institution: req.tenantId }).populate('createdBy', 'name').populate('hostel', 'name');
    if (!room) return notFoundResponse(res, 'Room not found');
    
    logger.info('Room fetched successfully:', { roomId: req.params.id });
    return successResponse(res, room, 'Room retrieved successfully');
  } catch (error) {
    logger.error('Error fetching room:', error);
    return errorResponse(res, error.message);
  }
};

const updateRoom = async (req, res) => {
  try {
    logger.info('Updating room');
    const { roomNumber, capacity, floor, status } = req.body;
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Room ID');
    if (idError) errors.push(idError);
    if (roomNumber !== undefined && (!roomNumber || roomNumber.trim().length === 0)) errors.push('Room number cannot be empty');
    if (capacity !== undefined && (isNaN(parseInt(capacity)) || parseInt(capacity) < 1 || parseInt(capacity) > 20)) errors.push('Capacity must be between 1 and 20');
    if (floor !== undefined && (isNaN(parseInt(floor)) || parseInt(floor) < 0)) errors.push('Floor must be a non-negative number');
    if (status !== undefined && !VALID_ROOM_STATUSES.includes(status)) errors.push('Invalid status');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const room = await Room.findOneAndUpdate({ _id: req.params.id, institution: req.tenantId }, req.body, { new: true, runValidators: true }).populate('createdBy', 'name');
    if (!room) return notFoundResponse(res, 'Room not found');
    
    logger.info('Room updated successfully:', { roomId: req.params.id });
    return successResponse(res, room, 'Room updated successfully');
  } catch (error) {
    logger.error('Error updating room:', error);
    return errorResponse(res, error.message);
  }
};

const deleteRoom = async (req, res) => {
  try {
    logger.info('Deleting room');
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Room ID');
    if (idError) errors.push(idError);
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const room = await Room.findOneAndDelete({ _id: req.params.id, institution: req.tenantId });
    if (!room) return notFoundResponse(res, 'Room not found');
    
    logger.info('Room deleted successfully:', { roomId: req.params.id });
    return successResponse(res, null, 'Room deleted successfully');
  } catch (error) {
    logger.error('Error deleting room:', error);
    return errorResponse(res, error.message);
  }
};

const getRoomAvailability = async (req, res) => {
  try {
    logger.info('Fetching room availability');
    const { hostel, floor } = req.query;
    const errors = [];
    if (hostel) {
      const hostelIdError = validateObjectId(hostel, 'Hostel ID');
      if (hostelIdError) errors.push(hostelIdError);
    }
    if (floor && (isNaN(parseInt(floor)) || parseInt(floor) < 0)) errors.push('Floor must be a non-negative number');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const query = { institution: req.tenantId, status: 'available' };
    if (hostel) query.hostel = hostel;
    if (floor) query.floor = parseInt(floor);
    
    const availableRooms = await Room.find(query).sort({ roomNumber: 1 });
    logger.info('Room availability fetched successfully');
    return successResponse(res, { availableRooms, count: availableRooms.length }, 'Room availability retrieved successfully');
  } catch (error) {
    logger.error('Error fetching room availability:', error);
    return errorResponse(res, error.message);
  }
};

// ============ ALLOCATION CONTROLLER FUNCTIONS ============

const createAllocation = async (req, res) => {
  try {
    logger.info('Creating room allocation');
    const { studentId, roomId, expectedCheckoutDate, notes } = req.body;
    const errors = [];
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    const roomIdError = validateObjectId(roomId, 'Room ID');
    if (roomIdError) errors.push(roomIdError);
    if (expectedCheckoutDate) {
      const dateError = validateDate(expectedCheckoutDate, 'Expected checkout date');
      if (dateError) errors.push(dateError);
    }
    if (notes && notes.length > 1000) errors.push('Notes must not exceed 1000 characters');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const room = await Room.findOne({ _id: roomId, institution: req.tenantId, status: 'available' });
    if (!room || room.occupied >= room.capacity) return badRequestResponse(res, 'Room is not available for allocation');
    
    const existingAllocation = await Allocation.findOne({ student: studentId, institution: req.tenantId, status: 'active' });
    if (existingAllocation) return badRequestResponse(res, 'Student already has an active room allocation');
    
    const allocation = new Allocation({ student: studentId, room: roomId, expectedCheckoutDate, notes, institution: req.tenantId, allocatedBy: req.user?.id });
    await allocation.save();
    
    room.occupied += 1;
    if (room.occupied >= room.capacity) room.status = 'occupied';
    await room.save();
    await allocation.populate(['student', 'room', 'allocatedBy']);
    
    logger.info('Room allocated successfully:', { allocationId: allocation._id });
    return createdResponse(res, allocation, 'Room allocated successfully');
  } catch (error) {
    logger.error('Error creating allocation:', error);
    return errorResponse(res, error.message);
  }
};

const getAllAllocations = async (req, res) => {
  try {
    logger.info('Fetching all allocations');
    const { student, room, status, page, limit } = req.query;
    const errors = [];
    if (student) {
      const studentIdError = validateObjectId(student, 'Student ID');
      if (studentIdError) errors.push(studentIdError);
    }
    if (room) {
      const roomIdError = validateObjectId(room, 'Room ID');
      if (roomIdError) errors.push(roomIdError);
    }
    if (status && !VALID_ALLOCATION_STATUSES.includes(status)) errors.push('Invalid status');
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (limitNum < 1 || limitNum > 100) errors.push('Limit must be between 1 and 100');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const query = { institution: req.tenantId };
    if (student) query.student = student;
    if (room) query.room = room;
    if (status) query.status = status;
    
    const skip = (pageNum - 1) * limitNum;
    const [allocations, total] = await Promise.all([
      Allocation.find(query).populate('student', 'name email studentId').populate('room', 'roomNumber hostel floor').populate('allocatedBy', 'name').sort({ allocationDate: -1 }).skip(skip).limit(limitNum),
      Allocation.countDocuments(query)
    ]);
    
    logger.info('Allocations fetched successfully');
    return successResponse(res, { allocations, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, 'Allocations retrieved successfully');
  } catch (error) {
    logger.error('Error fetching allocations:', error);
    return errorResponse(res, error.message);
  }
};

const checkoutAllocation = async (req, res) => {
  try {
    logger.info('Checking out allocation');
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Allocation ID');
    if (idError) errors.push(idError);
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const allocation = await Allocation.findOne({ _id: req.params.id, institution: req.tenantId, status: 'active' }).populate('room');
    if (!allocation) return notFoundResponse(res, 'Active allocation not found');
    
    allocation.status = 'checked-out';
    allocation.actualCheckoutDate = new Date();
    await allocation.save();
    
    const room = allocation.room;
    room.occupied = Math.max(0, room.occupied - 1);
    if (room.occupied < room.capacity) room.status = 'available';
    await room.save();
    
    logger.info('Checkout completed successfully:', { allocationId: req.params.id });
    return successResponse(res, allocation, 'Checkout completed successfully');
  } catch (error) {
    logger.error('Error checking out:', error);
    return errorResponse(res, error.message);
  }
};

// ============ COMPLAINT CONTROLLER FUNCTIONS ============

const createHostelComplaint = async (req, res) => {
  try {
    logger.info('Creating complaint');
    const { title, description, category, priority, room } = req.body;
    const errors = [];
    if (!title || title.trim().length === 0) errors.push('Title is required');
    else if (title.length > 200) errors.push('Title must not exceed 200 characters');
    if (!description || description.trim().length === 0) errors.push('Description is required');
    else if (description.length > 2000) errors.push('Description must not exceed 2000 characters');
    if (category && !VALID_COMPLAINT_CATEGORIES.includes(category)) errors.push('Invalid category');
    if (priority && !VALID_COMPLAINT_PRIORITIES.includes(priority)) errors.push('Invalid priority');
    if (room) {
      const roomIdError = validateObjectId(room, 'Room ID');
      if (roomIdError) errors.push(roomIdError);
    }
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const complaint = new HostelComplaint({ ...req.body, reportedBy: req.user?.id, institution: req.tenantId });
    await complaint.save();
    await complaint.populate('reportedBy', 'name email');
    
    logger.info('HostelComplaint created successfully:', { complaintId: complaint._id });
    return createdResponse(res, complaint, 'HostelComplaint filed successfully');
  } catch (error) {
    logger.error('Error creating complaint:', error);
    return errorResponse(res, error.message);
  }
};

const getAllHostelComplaints = async (req, res) => {
  try {
    logger.info('Fetching all complaints');
    const { status, priority, category, page, limit } = req.query;
    const errors = [];
    if (status && !VALID_COMPLAINT_STATUSES.includes(status)) errors.push('Invalid status');
    if (priority && !VALID_COMPLAINT_PRIORITIES.includes(priority)) errors.push('Invalid priority');
    if (category && !VALID_COMPLAINT_CATEGORIES.includes(category)) errors.push('Invalid category');
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (limitNum < 1 || limitNum > 100) errors.push('Limit must be between 1 and 100');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const query = { institution: req.tenantId };
    if (!['hostel_warden', 'superadmin', 'institution_admin'].includes(req.user?.role)) query.reportedBy = req.user?.id;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    
    const skip = (pageNum - 1) * limitNum;
    const [complaints, total] = await Promise.all([
      HostelComplaint.find(query).populate('reportedBy', 'name email').populate('assignedTo', 'name').populate('resolvedBy', 'name').populate('room', 'roomNumber hostel floor').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      HostelComplaint.countDocuments(query)
    ]);
    
    logger.info('HostelComplaints fetched successfully');
    return successResponse(res, { complaints, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, 'HostelComplaints retrieved successfully');
  } catch (error) {
    logger.error('Error fetching complaints:', error);
    return errorResponse(res, error.message);
  }
};

const updateHostelComplaintStatus = async (req, res) => {
  try {
    logger.info('Updating complaint status');
    const { status, resolution, assignedTo } = req.body;
    const errors = [];
    const idError = validateObjectId(req.params.id, 'HostelComplaint ID');
    if (idError) errors.push(idError);
    if (!status || status.trim().length === 0) errors.push('Status is required');
    else if (!VALID_COMPLAINT_STATUSES.includes(status)) errors.push('Invalid status');
    if (assignedTo) {
      const assignedToError = validateObjectId(assignedTo, 'Assigned to');
      if (assignedToError) errors.push(assignedToError);
    }
    if (resolution && resolution.length > 2000) errors.push('Resolution must not exceed 2000 characters');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const complaint = await HostelComplaint.findOne({ _id: req.params.id, institution: req.tenantId });
    if (!complaint) return notFoundResponse(res, 'HostelComplaint not found');
    
    complaint.status = status;
    if (assignedTo) complaint.assignedTo = assignedTo;
    if (status === 'resolved') {
      complaint.resolvedBy = req.user?.id;
      complaint.resolvedDate = new Date();
      complaint.resolution = resolution;
    }
    await complaint.save();
    
    logger.info('HostelComplaint status updated successfully:', { complaintId: req.params.id });
    return successResponse(res, complaint, 'HostelComplaint status updated successfully');
  } catch (error) {
    logger.error('Error updating complaint status:', error);
    return errorResponse(res, error.message);
  }
};

// ============ VISITOR LOG CONTROLLER FUNCTIONS ============

const checkInVisitor = async (req, res) => {
  try {
    logger.info('Checking in visitor');
    const { visitor, roomId, purpose } = req.body;
    const errors = [];
    if (!visitor || !visitor.name || visitor.name.trim().length === 0) errors.push('Visitor name is required');
    if (visitor && visitor.phone) {
      const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/;
      if (!phoneRegex.test(visitor.phone)) errors.push('Invalid visitor phone format');
    }
    const roomIdError = validateObjectId(roomId, 'Room ID');
    if (roomIdError) errors.push(roomIdError);
    if (!purpose || purpose.trim().length === 0) errors.push('Purpose is required');
    else if (purpose.length > 500) errors.push('Purpose must not exceed 500 characters');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const room = await Room.findOne({ _id: roomId, institution: req.tenantId });
    if (!room) return notFoundResponse(res, 'Room not found');
    
    const allocation = await Allocation.findOne({ room: roomId, student: req.user?.id, status: 'active', institution: req.tenantId });
    if (!allocation && !['hostel_warden', 'superadmin', 'institution_admin'].includes(req.user?.role)) {
      return forbiddenResponse(res, 'You do not have access to log visitors for this room');
    }
    
    const visitorLog = new VisitorLog({ visitor, student: allocation ? allocation.student : req.user?.id, room: roomId, purpose, institution: req.tenantId, loggedBy: req.user?.id });
    await visitorLog.save();
    
    logger.info('Visitor checked in successfully:', { visitorLogId: visitorLog._id });
    return createdResponse(res, visitorLog, 'Visitor checked in successfully');
  } catch (error) {
    logger.error('Error checking in visitor:', error);
    return errorResponse(res, error.message);
  }
};

const checkOutVisitor = async (req, res) => {
  try {
    logger.info('Checking out visitor');
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Visitor log ID');
    if (idError) errors.push(idError);
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const visitorLog = await VisitorLog.findOneAndUpdate({ _id: req.params.id, institution: req.tenantId }, { checkOutTime: new Date(), status: 'checked-out' }, { new: true });
    if (!visitorLog) return notFoundResponse(res, 'Visitor log not found');
    
    logger.info('Visitor checked out successfully:', { visitorLogId: req.params.id });
    return successResponse(res, visitorLog, 'Visitor checked out successfully');
  } catch (error) {
    logger.error('Error checking out visitor:', error);
    return errorResponse(res, error.message);
  }
};

const getAllVisitorLogs = async (req, res) => {
  try {
    logger.info('Fetching all visitor logs');
    const { room, date, page, limit } = req.query;
    const errors = [];
    if (room) {
      const roomIdError = validateObjectId(room, 'Room ID');
      if (roomIdError) errors.push(roomIdError);
    }
    if (date) {
      const dateError = validateDate(date, 'Date');
      if (dateError) errors.push(dateError);
    }
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (limitNum < 1 || limitNum > 100) errors.push('Limit must be between 1 and 100');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const query = { institution: req.tenantId };
    if (room) query.room = room;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.checkInTime = { $gte: startDate, $lt: endDate };
    }
    
    const skip = (pageNum - 1) * limitNum;
    const [visitorLogs, total] = await Promise.all([
      VisitorLog.find(query).populate('student', 'name email studentId').populate('room', 'roomNumber hostel floor').populate('loggedBy', 'name').sort({ checkInTime: -1 }).skip(skip).limit(limitNum),
      VisitorLog.countDocuments(query)
    ]);
    
    logger.info('Visitor logs fetched successfully');
    return successResponse(res, { visitorLogs, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, 'Visitor logs retrieved successfully');
  } catch (error) {
    logger.error('Error fetching visitor logs:', error);
    return errorResponse(res, error.message);
  }
};

const createHostel = async (req, res) => {
  try {
    logger.info('Creating hostel');
    const { name, code, type, campus, address, status } = req.body;
    const errors = [];
    if (!name || name.trim().length === 0) errors.push('Hostel name is required');
    if (!code || code.trim().length === 0) errors.push('Hostel code is required');
    if (!type || !VALID_HOSTEL_TYPES.includes(type)) errors.push('Invalid hostel type');
    if (status && !VALID_HOSTEL_STATUSES.includes(status)) errors.push('Invalid hostel status');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const existing = await Hostel.findOne({ code: code.trim(), institution: req.tenantId });
    if (existing) return badRequestResponse(res, 'Hostel code already exists');
    
    const hostel = new Hostel({
      name: name.trim(),
      code: code.trim(),
      type,
      campus: campus?.trim(),
      address: address?.trim(),
      status: status || 'active',
      institution: req.tenantId,
      createdBy: req.user?.id
    });
    
    await hostel.save();
    
    logger.info('Hostel created successfully:', { hostelId: hostel._id });
    return createdResponse(res, hostel, 'Hostel created successfully');
  } catch (error) {
    logger.error('Error creating hostel:', error);
    return errorResponse(res, error.message);
  }
};

const getAllHostels = async (req, res) => {
  try {
    logger.info('Fetching all hostels');
    const { type, status, search, page, limit } = req.query;
    const errors = [];
    if (type && !VALID_HOSTEL_TYPES.includes(type)) errors.push('Invalid hostel type');
    if (status && !VALID_HOSTEL_STATUSES.includes(status)) errors.push('Invalid hostel status');
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (limitNum < 1 || limitNum > 100) errors.push('Limit must be between 1 and 100');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    // Handle both ObjectId and string institution IDs
    const query = mongoose.Types.ObjectId.isValid(req.tenantId)
      ? { institution: req.tenantId }
      : { institutionId: req.tenantId };
    
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { code: regex }, { campus: regex }];
    }
    
    const skip = (pageNum - 1) * limitNum;
    const [hostels, total] = await Promise.all([
      Hostel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Hostel.countDocuments(query)
    ]);
    
    logger.info('Hostels fetched successfully');
    return successResponse(res, { hostels, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, 'Hostels retrieved successfully');
  } catch (error) {
    logger.error('Error fetching hostels:', error);
    return errorResponse(res, error.message);
  }
};

const getHostelById = async (req, res) => {
  try {
    logger.info('Fetching hostel by ID');
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Hostel ID');
    if (idError) errors.push(idError);
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const hostel = await Hostel.findOne({ _id: req.params.id, institution: req.tenantId });
    if (!hostel) return notFoundResponse(res, 'Hostel not found');
    
    logger.info('Hostel fetched successfully:', { hostelId: req.params.id });
    return successResponse(res, hostel, 'Hostel retrieved successfully');
  } catch (error) {
    logger.error('Error fetching hostel:', error);
    return errorResponse(res, error.message);
  }
};

const updateHostel = async (req, res) => {
  try {
    logger.info('Updating hostel');
    const { name, code, type, campus, address, status } = req.body;
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Hostel ID');
    if (idError) errors.push(idError);
    if (type && !VALID_HOSTEL_TYPES.includes(type)) errors.push('Invalid hostel type');
    if (status && !VALID_HOSTEL_STATUSES.includes(status)) errors.push('Invalid hostel status');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    if (code) {
      const duplicate = await Hostel.findOne({ code: code.trim(), institution: req.tenantId, _id: { $ne: req.params.id } });
      if (duplicate) return badRequestResponse(res, 'Hostel code already exists');
    }
    
    const updates = {};
    if (name) updates.name = name.trim();
    if (code) updates.code = code.trim();
    if (type) updates.type = type;
    if (campus !== undefined) updates.campus = campus ? campus.trim() : '';
    if (address !== undefined) updates.address = address ? address.trim() : '';
    if (status) updates.status = status;
    
    const hostel = await Hostel.findOneAndUpdate(
      { _id: req.params.id, institution: req.tenantId },
      { ...updates },
      { new: true, runValidators: true }
    );
    
    if (!hostel) return notFoundResponse(res, 'Hostel not found');
    
    logger.info('Hostel updated successfully:', { hostelId: req.params.id });
    return successResponse(res, hostel, 'Hostel updated successfully');
  } catch (error) {
    logger.error('Error updating hostel:', error);
    return errorResponse(res, error.message);
  }
};

const deleteHostel = async (req, res) => {
  try {
    logger.info('Deleting hostel');
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Hostel ID');
    if (idError) errors.push(idError);
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const hostel = await Hostel.findOneAndDelete({ _id: req.params.id, institution: req.tenantId });
    if (!hostel) return notFoundResponse(res, 'Hostel not found');
    
    logger.info('Hostel deleted successfully:', { hostelId: req.params.id });
    return successResponse(res, null, 'Hostel deleted successfully');
  } catch (error) {
    logger.error('Error deleting hostel:', error);
    return errorResponse(res, error.message);
  }
};

const createRoomType = async (req, res) => {
  try {
    logger.info('Creating room type');
    const { type, description } = req.body;
    const errors = [];
    if (!type || type.trim().length === 0) errors.push('Room type name is required');
    if (!description || description.trim().length === 0) errors.push('Description is required');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const existing = await RoomType.findOne({ type: type.trim(), institution: req.tenantId });
    if (existing) return badRequestResponse(res, 'Room type already exists');
    
    const roomType = new RoomType({
      type: type.trim(),
      description: description.trim(),
      institution: req.tenantId,
      createdBy: req.user?.id
    });
    
    await roomType.save();
    
    logger.info('Room type created successfully:', { roomTypeId: roomType._id });
    return createdResponse(res, roomType, 'Room type created successfully');
  } catch (error) {
    logger.error('Error creating room type:', error);
    return errorResponse(res, error.message);
  }
};

const getAllRoomTypes = async (req, res) => {
  try {
    logger.info('Fetching room types');
    const { page, limit, search } = req.query;
    const errors = [];
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (limitNum < 1 || limitNum > 100) errors.push('Limit must be between 1 and 100');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    // Handle both ObjectId and string institution IDs
    const query = mongoose.Types.ObjectId.isValid(req.tenantId)
      ? { institution: req.tenantId }
      : { institutionId: req.tenantId };
    
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ type: regex }, { description: regex }];
    }
    
    const skip = (pageNum - 1) * limitNum;
    const [roomTypes, total] = await Promise.all([
      RoomType.find(query).sort({ type: 1 }).skip(skip).limit(limitNum),
      RoomType.countDocuments(query)
    ]);
    
    logger.info('Room types fetched successfully');
    return successResponse(res, { roomTypes, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, 'Room types retrieved successfully');
  } catch (error) {
    logger.error('Error fetching room types:', error);
    return errorResponse(res, error.message);
  }
};

const getRoomTypeById = async (req, res) => {
  try {
    logger.info('Fetching room type by ID');
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Room type ID');
    if (idError) errors.push(idError);
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const roomType = await RoomType.findOne({ _id: req.params.id, institution: req.tenantId });
    if (!roomType) return notFoundResponse(res, 'Room type not found');
    
    logger.info('Room type fetched successfully:', { roomTypeId: req.params.id });
    return successResponse(res, roomType, 'Room type retrieved successfully');
  } catch (error) {
    logger.error('Error fetching room type:', error);
    return errorResponse(res, error.message);
  }
};

const updateRoomType = async (req, res) => {
  try {
    logger.info('Updating room type');
    const { type, description } = req.body;
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Room type ID');
    if (idError) errors.push(idError);
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    if (type) {
      const duplicate = await RoomType.findOne({ type: type.trim(), institution: req.tenantId, _id: { $ne: req.params.id } });
      if (duplicate) return badRequestResponse(res, 'Room type already exists');
    }
    
    const updates = {};
    if (type) updates.type = type.trim();
    if (description !== undefined) updates.description = description ? description.trim() : '';
    
    const roomType = await RoomType.findOneAndUpdate(
      { _id: req.params.id, institution: req.tenantId },
      { ...updates },
      { new: true, runValidators: true }
    );
    
    if (!roomType) return notFoundResponse(res, 'Room type not found');
    
    logger.info('Room type updated successfully:', { roomTypeId: req.params.id });
    return successResponse(res, roomType, 'Room type updated successfully');
  } catch (error) {
    logger.error('Error updating room type:', error);
    return errorResponse(res, error.message);
  }
};

const deleteRoomType = async (req, res) => {
  try {
    logger.info('Deleting room type');
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Room type ID');
    if (idError) errors.push(idError);
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const roomType = await RoomType.findOneAndDelete({ _id: req.params.id, institution: req.tenantId });
    if (!roomType) return notFoundResponse(res, 'Room type not found');
    
    logger.info('Room type deleted successfully:', { roomTypeId: req.params.id });
    return successResponse(res, null, 'Room type deleted successfully');
  } catch (error) {
    logger.error('Error deleting room type:', error);
    return errorResponse(res, error.message);
  }
};

const roomController = {
  create: createRoom,
  getAll: getAllRooms,
  getById: getRoomById,
  update: updateRoom,
  delete: deleteRoom,
  getAvailability: getRoomAvailability
};

const allocationController = {
  create: createAllocation,
  getAll: getAllAllocations,
  checkout: checkoutAllocation
};

const complaintController = {
  create: createHostelComplaint,
  getAll: getAllHostelComplaints,
  updateStatus: updateHostelComplaintStatus
};

const visitorLogController = {
  checkIn: checkInVisitor,
  checkOut: checkOutVisitor,
  getAll: getAllVisitorLogs
};

const hostelController = {
  create: createHostel,
  getAll: getAllHostels,
  getById: getHostelById,
  update: updateHostel,
  delete: deleteHostel
};

const roomTypeController = {
  create: createRoomType,
  getAll: getAllRoomTypes,
  getById: getRoomTypeById,
  update: updateRoomType,
  delete: deleteRoomType
};

// ============ RECRUITMENT CONTROLLER FUNCTIONS ============

const createRecruitment = async (req, res) => {
  try {
    logger.info('Creating job posting');
    const { title, description, department, positions, deadline, status } = req.body;
    const errors = [];
    if (!title || title.trim().length === 0) errors.push('Title is required');
    else if (title.length > 200) errors.push('Title must not exceed 200 characters');
    if (!description || description.trim().length === 0) errors.push('Description is required');
    if (!department || department.trim().length === 0) errors.push('Department is required');
    if (positions !== undefined && (isNaN(parseInt(positions)) || parseInt(positions) < 1)) errors.push('Positions must be at least 1');
    if (deadline) {
      const dateError = validateDate(deadline, 'Deadline');
      if (dateError) errors.push(dateError);
    }
    if (status && !VALID_RECRUITMENT_STATUSES.includes(status)) errors.push('Invalid status');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const recruitment = new Recruitment({ ...req.body, institution: req.tenantId, postedBy: req.user?.id });
    await recruitment.save();
    
    logger.info('Job posting created successfully:', { recruitmentId: recruitment._id });
    return createdResponse(res, recruitment, 'Job posting created successfully');
  } catch (error) {
    logger.error('Error creating job posting:', error);
    return errorResponse(res, error.message);
  }
};

const getAllRecruitments = async (req, res) => {
  try {
    logger.info('Fetching all job postings');
    const { status, department, page, limit } = req.query;
    const errors = [];
    if (status && !VALID_RECRUITMENT_STATUSES.includes(status)) errors.push('Invalid status');
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (limitNum < 1 || limitNum > 100) errors.push('Limit must be between 1 and 100');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const query = { institution: req.tenantId };
    if (status) query.status = status;
    if (department) query.department = department;
    
    const skip = (pageNum - 1) * limitNum;
    const [recruitments, total] = await Promise.all([
      Recruitment.find(query).populate('postedBy', 'name').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Recruitment.countDocuments(query)
    ]);
    
    logger.info('Job postings fetched successfully');
    return successResponse(res, { recruitments, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, 'Job postings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching job postings:', error);
    return errorResponse(res, error.message);
  }
};

const applyForJob = async (req, res) => {
  try {
    logger.info('Applying for job');
    const { resume, coverLetter } = req.body;
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Job ID');
    if (idError) errors.push(idError);
    if (!resume || resume.trim().length === 0) errors.push('Resume is required');
    if (coverLetter && coverLetter.length > 2000) errors.push('Cover letter must not exceed 2000 characters');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const recruitment = await Recruitment.findOne({ _id: req.params.id, institution: req.tenantId, status: 'published' });
    if (!recruitment) return notFoundResponse(res, 'Job posting not found or not active');
    
    const existingApplication = recruitment.applicants.find(app => app.user.toString() === req.user?.id);
    if (existingApplication) return badRequestResponse(res, 'You have already applied for this position');
    
    recruitment.applicants.push({ user: req.user?.id, resume, coverLetter });
    await recruitment.save();
    
    logger.info('Job application submitted successfully:', { recruitmentId: req.params.id });
    return successResponse(res, null, 'Job application submitted successfully');
  } catch (error) {
    logger.error('Error applying for job:', error);
    return errorResponse(res, error.message);
  }
};

// ============ PERFORMANCE REVIEW CONTROLLER FUNCTIONS ============

const createPerformanceReview = async (req, res) => {
  try {
    logger.info('Creating performance review');
    const { employee, reviewer, reviewPeriod, overallRating, status } = req.body;
    const errors = [];
    const employeeIdError = validateObjectId(employee, 'Employee ID');
    if (employeeIdError) errors.push(employeeIdError);
    const reviewerIdError = validateObjectId(reviewer, 'Reviewer ID');
    if (reviewerIdError) errors.push(reviewerIdError);
    if (!reviewPeriod || reviewPeriod.trim().length === 0) errors.push('Review period is required');
    if (overallRating !== undefined && (isNaN(parseFloat(overallRating)) || parseFloat(overallRating) < 0 || parseFloat(overallRating) > 5)) errors.push('Overall rating must be between 0 and 5');
    if (status && !VALID_REVIEW_STATUSES.includes(status)) errors.push('Invalid status');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const performanceReview = new PerformanceReview({ ...req.body, institution: req.tenantId });
    await performanceReview.save();
    
    logger.info('Performance review created successfully:', { reviewId: performanceReview._id });
    return createdResponse(res, performanceReview, 'Performance review created successfully');
  } catch (error) {
    logger.error('Error creating performance review:', error);
    return errorResponse(res, error.message);
  }
};

const getAllPerformanceReviews = async (req, res) => {
  try {
    logger.info('Fetching all performance reviews');
    const { employee, status, page, limit } = req.query;
    const errors = [];
    if (employee) {
      const employeeIdError = validateObjectId(employee, 'Employee ID');
      if (employeeIdError) errors.push(employeeIdError);
    }
    if (status && !VALID_REVIEW_STATUSES.includes(status)) errors.push('Invalid status');
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (limitNum < 1 || limitNum > 100) errors.push('Limit must be between 1 and 100');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const query = { institution: req.tenantId };
    if (req.user?.role !== 'hr_manager' && req.user?.role !== 'superadmin') query.employee = req.user?.id;
    else if (employee) query.employee = employee;
    if (status) query.status = status;
    
    const skip = (pageNum - 1) * limitNum;
    const [reviews, total] = await Promise.all([
      PerformanceReview.find(query).populate('employee', 'name').populate('reviewer', 'name').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      PerformanceReview.countDocuments(query)
    ]);
    
    logger.info('Performance reviews fetched successfully');
    return successResponse(res, { reviews, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, 'Performance reviews retrieved successfully');
  } catch (error) {
    logger.error('Error fetching performance reviews:', error);
    return errorResponse(res, error.message);
  }
};

// ============ TRAINING CONTROLLER FUNCTIONS ============

const createTraining = async (req, res) => {
  try {
    logger.info('Creating training program');
    const { title, description, category, startDate, endDate, capacity, status } = req.body;
    const errors = [];
    if (!title || title.trim().length === 0) errors.push('Title is required');
    else if (title.length > 200) errors.push('Title must not exceed 200 characters');
    if (!description || description.trim().length === 0) errors.push('Description is required');
    if (startDate) {
      const dateError = validateDate(startDate, 'Start date');
      if (dateError) errors.push(dateError);
    }
    if (endDate) {
      const dateError = validateDate(endDate, 'End date');
      if (dateError) errors.push(dateError);
    }
    if (startDate && endDate) {
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    if (capacity !== undefined && (isNaN(parseInt(capacity)) || parseInt(capacity) < 1)) errors.push('Capacity must be at least 1');
    if (status && !VALID_TRAINING_STATUSES.includes(status)) errors.push('Invalid status');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const training = new Training({ ...req.body, institution: req.tenantId, createdBy: req.user?.id });
    await training.save();
    
    logger.info('Training program created successfully:', { trainingId: training._id });
    return createdResponse(res, training, 'Training program created successfully');
  } catch (error) {
    logger.error('Error creating training program:', error);
    return errorResponse(res, error.message);
  }
};

const getAllTrainings = async (req, res) => {
  try {
    logger.info('Fetching all training programs');
    const { status, category, page, limit } = req.query;
    const errors = [];
    if (status && !VALID_TRAINING_STATUSES.includes(status)) errors.push('Invalid status');
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (limitNum < 1 || limitNum > 100) errors.push('Limit must be between 1 and 100');
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const query = { institution: req.tenantId };
    if (status) query.status = status;
    if (category) query.category = category;
    
    const skip = (pageNum - 1) * limitNum;
    const [trainings, total] = await Promise.all([
      Training.find(query).populate('createdBy', 'name').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Training.countDocuments(query)
    ]);
    
    logger.info('Training programs fetched successfully');
    return successResponse(res, { trainings, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, 'Training programs retrieved successfully');
  } catch (error) {
    logger.error('Error fetching training programs:', error);
    return errorResponse(res, error.message);
  }
};

const enrollInTraining = async (req, res) => {
  try {
    logger.info('Enrolling in training');
    const errors = [];
    const idError = validateObjectId(req.params.id, 'Training ID');
    if (idError) errors.push(idError);
    if (!req.tenantId) errors.push('Institution information is required');
    if (errors.length > 0) return validationErrorResponse(res, errors);
    
    const training = await Training.findOne({ _id: req.params.id, institution: req.tenantId });
    if (!training) return notFoundResponse(res, 'Training program not found');
    
    const existingEnrollment = training.enrolled.find(enroll => enroll.employee.toString() === req.user?.id);
    if (existingEnrollment) return badRequestResponse(res, 'You are already enrolled in this training');
    
    if (training.capacity && training.enrolled.length >= training.capacity) return badRequestResponse(res, 'Training program is full');
    
    training.enrolled.push({ employee: req.user?.id });
    await training.save();
    
    logger.info('Enrolled in training successfully:', { trainingId: req.params.id });
    return successResponse(res, null, 'Successfully enrolled in training program');
  } catch (error) {
    logger.error('Error enrolling in training:', error);
    return errorResponse(res, error.message);
  }
};

// ============ BULK OPERATIONS ============

const bulkUpdateRooms = async (req, res) => {
  try {
    logger.info('Bulk updating rooms');
    const { roomIds, updates } = req.body;
    const errors = [];
    
    if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
      errors.push('Room IDs array is required and must not be empty');
    } else if (roomIds.length > 100) {
      errors.push('Cannot update more than 100 rooms at once');
    }
    
    if (!updates || typeof updates !== 'object') {
      errors.push('Updates object is required');
    }
    
    if (updates?.status && !VALID_ROOM_STATUSES.includes(updates.status)) {
      errors.push('Invalid status in updates');
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await Room.updateMany(
      { _id: { $in: roomIds }, institution: req.tenantId },
      { $set: updates }
    );
    
    logger.info('Bulk room update completed:', { count: result.modifiedCount });
    return successResponse(res, { modifiedCount: result.modifiedCount }, 'Rooms updated successfully');
  } catch (error) {
    logger.error('Error in bulk room update:', error);
    return errorResponse(res, error.message);
  }
};

const bulkDeleteRooms = async (req, res) => {
  try {
    logger.info('Bulk deleting rooms');
    const { roomIds } = req.body;
    const errors = [];
    
    if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
      errors.push('Room IDs array is required and must not be empty');
    } else if (roomIds.length > 100) {
      errors.push('Cannot delete more than 100 rooms at once');
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await Room.deleteMany({
      _id: { $in: roomIds },
      institution: req.tenantId
    });
    
    logger.info('Bulk room deletion completed:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Rooms deleted successfully');
  } catch (error) {
    logger.error('Error in bulk room deletion:', error);
    return errorResponse(res, error.message);
  }
};

// ============ EXPORT OPERATIONS ============

const exportRooms = async (req, res) => {
  try {
    logger.info('Exporting rooms');
    const { format, hostel, status } = req.query;
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (hostel) {
      const hostelIdError = validateObjectId(hostel, 'Hostel ID');
      if (hostelIdError) errors.push(hostelIdError);
    }
    
    if (status && !VALID_ROOM_STATUSES.includes(status)) {
      errors.push('Invalid status');
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { institution: req.tenantId };
    if (hostel) query.hostel = hostel;
    if (status) query.status = status;
    
    const rooms = await Room.find(query).populate('hostel', 'name').lean();
    
    logger.info('Rooms exported successfully:', { format, count: rooms.length });
    return successResponse(res, { format: format.toLowerCase(), data: rooms, count: rooms.length }, 'Rooms exported successfully');
  } catch (error) {
    logger.error('Error exporting rooms:', error);
    return errorResponse(res, error.message);
  }
};

const exportAllocations = async (req, res) => {
  try {
    logger.info('Exporting allocations');
    const { format, status } = req.query;
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (status && !VALID_ALLOCATION_STATUSES.includes(status)) {
      errors.push('Invalid status');
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { institution: req.tenantId };
    if (status) query.status = status;
    
    const allocations = await Allocation.find(query)
      .populate('student', 'name email studentId')
      .populate('room', 'roomNumber hostel floor')
      .lean();
    
    logger.info('Allocations exported successfully:', { format, count: allocations.length });
    return successResponse(res, { format: format.toLowerCase(), data: allocations, count: allocations.length }, 'Allocations exported successfully');
  } catch (error) {
    logger.error('Error exporting allocations:', error);
    return errorResponse(res, error.message);
  }
};

// ============ STATISTICS & ANALYTICS ============

const getRoomStatistics = async (req, res) => {
  try {
    logger.info('Fetching room statistics');
    
    if (!req.tenantId) {
      return validationErrorResponse(res, ['Institution information is required']);
    }
    
    const [totalRooms, availableRooms, occupiedRooms, maintenanceRooms, totalCapacity, totalOccupied] = await Promise.all([
      Room.countDocuments({ institution: req.tenantId }),
      Room.countDocuments({ institution: req.tenantId, status: 'available' }),
      Room.countDocuments({ institution: req.tenantId, status: 'occupied' }),
      Room.countDocuments({ institution: req.tenantId, status: 'maintenance' }),
      Room.aggregate([
        { $match: { institution: new mongoose.Types.ObjectId(req.tenantId) } },
        { $group: { _id: null, total: { $sum: '$capacity' } } }
      ]),
      Room.aggregate([
        { $match: { institution: new mongoose.Types.ObjectId(req.tenantId) } },
        { $group: { _id: null, total: { $sum: '$occupied' } } }
      ])
    ]);
    
    const statistics = {
      totalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
      totalCapacity: totalCapacity[0]?.total || 0,
      totalOccupied: totalOccupied[0]?.total || 0,
      occupancyRate: totalCapacity[0]?.total ? ((totalOccupied[0]?.total || 0) / totalCapacity[0].total * 100).toFixed(2) + '%' : '0%'
    };
    
    logger.info('Room statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching room statistics:', error);
    return errorResponse(res, error.message);
  }
};

const getAllocationStatistics = async (req, res) => {
  try {
    logger.info('Fetching allocation statistics');
    
    if (!req.tenantId) {
      return validationErrorResponse(res, ['Institution information is required']);
    }
    
    const [totalAllocations, activeAllocations, checkedOutAllocations, cancelledAllocations] = await Promise.all([
      Allocation.countDocuments({ institution: req.tenantId }),
      Allocation.countDocuments({ institution: req.tenantId, status: 'active' }),
      Allocation.countDocuments({ institution: req.tenantId, status: 'checked-out' }),
      Allocation.countDocuments({ institution: req.tenantId, status: 'cancelled' })
    ]);
    
    const statistics = {
      totalAllocations,
      activeAllocations,
      checkedOutAllocations,
      cancelledAllocations
    };
    
    logger.info('Allocation statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching allocation statistics:', error);
    return errorResponse(res, error.message);
  }
};

const getHostelComplaintStatistics = async (req, res) => {
  try {
    logger.info('Fetching complaint statistics');
    
    if (!req.tenantId) {
      return validationErrorResponse(res, ['Institution information is required']);
    }
    
    const [totalHostelComplaints, pendingHostelComplaints, inProgressHostelComplaints, resolvedHostelComplaints, byPriority, byCategory] = await Promise.all([
      HostelComplaint.countDocuments({ institution: req.tenantId }),
      HostelComplaint.countDocuments({ institution: req.tenantId, status: 'pending' }),
      HostelComplaint.countDocuments({ institution: req.tenantId, status: 'in-progress' }),
      HostelComplaint.countDocuments({ institution: req.tenantId, status: 'resolved' }),
      HostelComplaint.aggregate([
        { $match: { institution: new mongoose.Types.ObjectId(req.tenantId) } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      HostelComplaint.aggregate([
        { $match: { institution: new mongoose.Types.ObjectId(req.tenantId) } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ])
    ]);
    
    const statistics = {
      totalHostelComplaints,
      pendingHostelComplaints,
      inProgressHostelComplaints,
      resolvedHostelComplaints,
      byPriority: byPriority.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byCategory: byCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
    
    logger.info('HostelComplaint statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching complaint statistics:', error);
    return errorResponse(res, error.message);
  }
};

const getVisitorAnalytics = async (req, res) => {
  try {
    logger.info('Fetching visitor analytics');
    const { groupBy, startDate, endDate } = req.query;
    const errors = [];
    
    const validGroupBy = ['day', 'week', 'month', 'room'];
    if (groupBy && !validGroupBy.includes(groupBy)) {
      errors.push('Invalid groupBy. Must be one of: ' + validGroupBy.join(', '));
    }
    
    if (startDate) {
      const dateError = validateDate(startDate, 'Start date');
      if (dateError) errors.push(dateError);
    }
    
    if (endDate) {
      const dateError = validateDate(endDate, 'End date');
      if (dateError) errors.push(dateError);
    }
    
    if (startDate && endDate) {
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const matchQuery = { institution: new mongoose.Types.ObjectId(req.tenantId) };
    
    if (startDate || endDate) {
      matchQuery.checkInTime = {};
      if (startDate) matchQuery.checkInTime.$gte = new Date(startDate);
      if (endDate) matchQuery.checkInTime.$lte = new Date(endDate);
    }
    
    let groupByField;
    switch (groupBy) {
      case 'day':
        groupByField = { $dateToString: { format: '%Y-%m-%d', date: '$checkInTime' } };
        break;
      case 'week':
        groupByField = { $week: '$checkInTime' };
        break;
      case 'month':
        groupByField = { $dateToString: { format: '%Y-%m', date: '$checkInTime' } };
        break;
      case 'room':
        groupByField = '$room';
        break;
      default:
        groupByField = { $dateToString: { format: '%Y-%m-%d', date: '$checkInTime' } };
    }
    
    const analytics = await VisitorLog.aggregate([
      { $match: matchQuery },
      { $group: { _id: groupByField, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    logger.info('Visitor analytics fetched successfully');
    return successResponse(res, { groupBy: groupBy || 'day', analytics }, 'Analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching visitor analytics:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  // Controllers used by routes/hostelRoutes.js
  roomController,
  allocationController,
  complaintController,
  visitorLogController,
  roomTypeController,
  create: createHostel,
  getAll: getAllHostels,
  getById: getHostelById,
  update: updateHostel,
  delete: deleteHostel,

  // Explicit exports (useful for direct imports/tests)
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  getRoomAvailability,
  createAllocation,
  getAllAllocations,
  checkoutAllocation,
  createHostelComplaint,
  getAllHostelComplaints,
  updateHostelComplaintStatus,
  checkInVisitor,
  checkOutVisitor,
  getAllVisitorLogs,
  createHostel,
  getAllHostels,
  getHostelById,
  updateHostel,
  deleteHostel,
  createRoomType,
  getAllRoomTypes,
  getRoomTypeById,
  updateRoomType,
  deleteRoomType,
  createRecruitment,
  getAllRecruitments,
  applyForJob,
  createPerformanceReview,
  getAllPerformanceReviews,
  createTraining,
  getAllTrainings,
  enrollInTraining,
  bulkUpdateRooms,
  bulkDeleteRooms,
  exportRooms,
  exportAllocations,
  getRoomStatistics,
  getAllocationStatistics,
  getHostelComplaintStatistics,
  getVisitorAnalytics
};
