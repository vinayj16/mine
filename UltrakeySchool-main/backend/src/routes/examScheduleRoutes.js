import express from 'express';
const router = express.Router();
import examScheduleController from '../controllers/examScheduleController.js';
const { createExamSchedule, getExamScheduleById, getExamScheduleByScheduleId, getAllExamSchedules, updateExamSchedule, deleteExamSchedule, updateStatus, getExamSchedulesByClass, getExamSchedulesByDate, getExamSchedulesByRoom, getExamSchedulesByInvigilator, bulkUpdateStatus, getExamScheduleStatistics, searchExamSchedules, checkRoomAvailability, exportExamSchedules, bulkDeleteExamSchedules } = examScheduleController;

// Import validators
import {
  createExamScheduleValidator,
  updateExamScheduleValidator,
  scheduleIdValidator,
  scheduleIdParamValidator,
  classIdValidator,
  dateValidator,
  roomNoValidator,
  invigilatorIdValidator,
  updateStatusValidator,
  bulkUpdateStatusValidator,
  searchValidator,
  exportValidator
} from '../validators/examScheduleValidators.js';

// Import middleware
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';

// Apply authentication to all routes (TESTED & VERIFIED)
router.use(protect);

// @route   POST /api/v1/exam-schedules
// @desc    Create a new exam schedule
// @access  Private (Admin, Teacher)
router.post('/', createExamScheduleValidator, createExamSchedule);  

// @route   GET /api/v1/exam-schedules
// @desc    Get all exam schedules with pagination
// @access  Private
router.get('/', getAllExamSchedules);  

// @route   GET /api/v1/exam-schedules/statistics
// @desc    Get exam schedule statistics
// @access  Private
router.get('/statistics', getExamScheduleStatistics);  

// @route   GET /api/v1/exam-schedules/search
// @desc    Search exam schedules
// @access  Private
router.get('/search', searchValidator, searchExamSchedules);  

// @route   GET /api/v1/exam-schedules/export
// @desc    Export exam schedules
// @access  Private
router.get('/export', exportValidator, exportExamSchedules);  

// @route   GET /api/v1/exam-schedules/class/:classId
// @desc    Get exam schedules by class
// @access  Private
router.get('/class/:classId', classIdValidator, getExamSchedulesByClass);  

// @route   GET /api/v1/exam-schedules/date/:date
// @desc    Get exam schedules by date
// @access  Private
router.get('/date/:date', dateValidator, getExamSchedulesByDate);  

// @route   GET /api/v1/exam-schedules/room/:roomNo
// @desc    Get exam schedules by room
// @access  Private
router.get('/room/:roomNo', roomNoValidator, getExamSchedulesByRoom);  

// @route   GET /api/v1/exam-schedules/invigilator/:invigilatorId
// @desc    Get exam schedules by invigilator
// @access  Private
router.get('/invigilator/:invigilatorId', invigilatorIdValidator, getExamSchedulesByInvigilator);  

// @route   GET /api/v1/exam-schedules/check-availability
// @desc    Check room availability
// @access  Private
router.get('/check-availability', checkRoomAvailability);  

// @route   GET /api/v1/exam-schedules/:id
// @desc    Get exam schedule by ID
// @access  Private
router.get('/:id', scheduleIdValidator, getExamScheduleById);  

// @route   GET /api/v1/exam-schedules/schedule/:scheduleId
// @desc    Get exam schedule by schedule ID
// @access  Private
router.get('/schedule/:scheduleId', scheduleIdParamValidator, getExamScheduleByScheduleId);  

// @route   PUT /api/v1/exam-schedules/:id
// @desc    Update exam schedule
// @access  Private (Admin, Teacher)
router.put('/:id', updateExamScheduleValidator, updateExamSchedule);  

// @route   PATCH /api/v1/exam-schedules/:id/status
// @desc    Update exam schedule status
// @access  Private (Admin)
router.patch('/:id/status', updateStatusValidator, updateStatus);  

// @route   PATCH /api/v1/exam-schedules/bulk-status
// @desc    Bulk update exam schedule status
// @access  Private (Admin)
router.patch('/bulk-status', bulkUpdateStatusValidator, bulkUpdateStatus);  

// @route   DELETE /api/v1/exam-schedules/:id
// @desc    Delete exam schedule
// @access  Private (Admin)
router.delete('/:id', scheduleIdValidator, deleteExamSchedule);  

// @route   DELETE /api/v1/exam-schedules/bulk
// @desc    Bulk delete exam schedules
// @access  Private (Admin)
router.delete('/bulk/delete', bulkDeleteExamSchedules);  

export default router;
