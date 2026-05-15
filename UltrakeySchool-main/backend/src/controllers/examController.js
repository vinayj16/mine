import examService from '../services/examService.js';
import Exam from '../models/Exam.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_EXAM_TYPES = ['midterm', 'final', 'quiz', 'practical', 'oral', 'assignment', 'project', 'unit_test', 'mock', 'board'];
const VALID_EXAM_STATUSES = ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed', 'grading'];
const VALID_TERMS = ['1', '2', '3', 'annual', 'semester1', 'semester2'];
const VALID_ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'excused'];
const VALID_GRADING_SYSTEMS = ['percentage', 'gpa', 'letter', 'pass_fail'];

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
const validateDate = (dateString, fieldName = 'Date') => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate date range
const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) {
    return 'Start date must be before end date';
  }
  return null;
};

// Helper function to validate time format (HH:MM)
const validateTime = (timeString, fieldName = 'Time') => {
  if (!timeString) return null;
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(timeString)) {
    return 'Invalid ' + fieldName + ' format. Expected HH:MM';
  }
  return null;
};

// Helper function to validate academic year format (YYYY-YYYY)
const validateAcademicYear = (year) => {
  if (!year) return null;
  const yearRegex = /^\d{4}-\d{4}$/;
  if (!yearRegex.test(year)) {
    return 'Invalid academic year format. Expected YYYY-YYYY';
  }
  const [startYear, endYear] = year.split('-').map(Number);
  if (endYear !== startYear + 1) {
    return 'Academic year end must be one year after start';
  }
  return null;
};

const createExam = async (req, res, next) => {
  try {
    logger.info('Creating exam');
    
    const { schoolId } = req.params;
    const { title, description, examType, classId, subjectId, date, startTime, endTime, duration, totalMarks, passingMarks, academicYear, term, gradingSystem } = req.body;

    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!title || title.trim().length === 0) {
      errors.push('Title is required');
    } else if (title.length > 200) {
      errors.push('Title must not exceed 200 characters');
    }
    
    if (description && description.length > 2000) {
      errors.push('Description must not exceed 2000 characters');
    }
    
    if (!examType) {
      errors.push('Exam type is required');
    } else if (!VALID_EXAM_TYPES.includes(examType)) {
      errors.push('Invalid exam type. Must be one of: ' + VALID_EXAM_TYPES.join(', '));
    }
    
    if (!classId) {
      errors.push('Class ID is required');
    } else {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (subjectId) {
      const subjectIdError = validateObjectId(subjectId, 'Subject ID');
      if (subjectIdError) errors.push(subjectIdError);
    }
    
    if (!date) {
      errors.push('Date is required');
    } else {
      const dateError = validateDate(date, 'Date');
      if (dateError) errors.push(dateError);
    }
    
    if (startTime) {
      const startTimeError = validateTime(startTime, 'Start time');
      if (startTimeError) errors.push(startTimeError);
    }
    
    if (endTime) {
      const endTimeError = validateTime(endTime, 'End time');
      if (endTimeError) errors.push(endTimeError);
    }
    
    if (duration !== undefined) {
      const durationNum = parseInt(duration);
      if (isNaN(durationNum) || durationNum < 1) {
        errors.push('Duration must be a positive number (in minutes)');
      } else if (durationNum > 600) {
        errors.push('Duration must not exceed 600 minutes (10 hours)');
      }
    }
    
    if (totalMarks !== undefined) {
      const totalMarksNum = parseFloat(totalMarks);
      if (isNaN(totalMarksNum) || totalMarksNum <= 0) {
        errors.push('Total marks must be a positive number');
      } else if (totalMarksNum > 1000) {
        errors.push('Total marks must not exceed 1000');
      }
    }
    
    if (passingMarks !== undefined) {
      const passingMarksNum = parseFloat(passingMarks);
      if (isNaN(passingMarksNum) || passingMarksNum < 0) {
        errors.push('Passing marks must be a non-negative number');
      }
      if (totalMarks && passingMarksNum > parseFloat(totalMarks)) {
        errors.push('Passing marks cannot exceed total marks');
      }
    }
    
    if (!academicYear) {
      errors.push('Academic year is required');
    } else {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (term && !VALID_TERMS.includes(term)) {
      errors.push('Invalid term. Must be one of: ' + VALID_TERMS.join(', '));
    }
    
    if (gradingSystem && !VALID_GRADING_SYSTEMS.includes(gradingSystem)) {
      errors.push('Invalid grading system. Must be one of: ' + VALID_GRADING_SYSTEMS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const exam = await examService.createExam(schoolId, req.body);
    
    logger.info('Exam created successfully:', { examId: exam._id });
    return createdResponse(res, exam, 'Exam created successfully');
  } catch (error) {
    logger.error('Error creating exam:', error);
    return errorResponse(res, error.message);
  }
};

const getExams = async (req, res, next) => {
  try {
    logger.info('Fetching exams');
    
    const { schoolId } = req.params;
    const { classId, academicYear, term, status, examType, subjectId, startDate, endDate, page, limit, search } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (subjectId) {
      const subjectIdError = validateObjectId(subjectId, 'Subject ID');
      if (subjectIdError) errors.push(subjectIdError);
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (term && !VALID_TERMS.includes(term)) {
      errors.push('Invalid term. Must be one of: ' + VALID_TERMS.join(', '));
    }
    
    if (status && !VALID_EXAM_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_EXAM_STATUSES.join(', '));
    }
    
    if (examType && !VALID_EXAM_TYPES.includes(examType)) {
      errors.push('Invalid exam type. Must be one of: ' + VALID_EXAM_TYPES.join(', '));
    }
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = { page: pageNum, limit: limitNum };
    if (classId) filters.classId = classId;
    if (academicYear) filters.academicYear = academicYear;
    if (term) filters.term = term;
    if (status) filters.status = status;
    if (examType) filters.examType = examType;
    if (subjectId) filters.subjectId = subjectId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (search) filters.search = search;
    
    const exams = await examService.getExams(schoolId, filters);
    
    logger.info('Exams fetched successfully');
    return successResponse(res, exams, 'Exams retrieved successfully');
  } catch (error) {
    logger.error('Error fetching exams:', error);
    return errorResponse(res, error.message);
  }
};

const getExamById = async (req, res, next) => {
  try {
    logger.info('Fetching exam by ID');
    
    const { schoolId, examId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const examIdError = validateObjectId(examId, 'Exam ID');
    if (examIdError) errors.push(examIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exam = await examService.getExamById(examId, schoolId);
    
    if (!exam) {
      return notFoundResponse(res, 'Exam not found');
    }
    
    logger.info('Exam fetched successfully:', { examId });
    return successResponse(res, exam, 'Exam retrieved successfully');
  } catch (error) {
    logger.error('Error fetching exam:', error);
    return errorResponse(res, error.message);
  }
};

const updateExam = async (req, res, next) => {
  try {
    logger.info('Updating exam');
    
    const { schoolId, examId } = req.params;
    const { title, description, examType, date, startTime, endTime, duration, totalMarks, passingMarks, academicYear, term, status, gradingSystem } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const examIdError = validateObjectId(examId, 'Exam ID');
    if (examIdError) errors.push(examIdError);
    
    if (title !== undefined) {
      if (title.trim().length === 0) {
        errors.push('Title cannot be empty');
      } else if (title.length > 200) {
        errors.push('Title must not exceed 200 characters');
      }
    }
    
    if (description !== undefined && description.length > 2000) {
      errors.push('Description must not exceed 2000 characters');
    }
    
    if (examType && !VALID_EXAM_TYPES.includes(examType)) {
      errors.push('Invalid exam type. Must be one of: ' + VALID_EXAM_TYPES.join(', '));
    }
    
    if (status && !VALID_EXAM_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_EXAM_STATUSES.join(', '));
    }
    
    if (date) {
      const dateError = validateDate(date, 'Date');
      if (dateError) errors.push(dateError);
    }
    
    if (startTime) {
      const startTimeError = validateTime(startTime, 'Start time');
      if (startTimeError) errors.push(startTimeError);
    }
    
    if (endTime) {
      const endTimeError = validateTime(endTime, 'End time');
      if (endTimeError) errors.push(endTimeError);
    }
    
    if (duration !== undefined) {
      const durationNum = parseInt(duration);
      if (isNaN(durationNum) || durationNum < 1) {
        errors.push('Duration must be a positive number (in minutes)');
      } else if (durationNum > 600) {
        errors.push('Duration must not exceed 600 minutes (10 hours)');
      }
    }
    
    if (totalMarks !== undefined) {
      const totalMarksNum = parseFloat(totalMarks);
      if (isNaN(totalMarksNum) || totalMarksNum <= 0) {
        errors.push('Total marks must be a positive number');
      } else if (totalMarksNum > 1000) {
        errors.push('Total marks must not exceed 1000');
      }
    }
    
    if (passingMarks !== undefined) {
      const passingMarksNum = parseFloat(passingMarks);
      if (isNaN(passingMarksNum) || passingMarksNum < 0) {
        errors.push('Passing marks must be a non-negative number');
      }
      if (totalMarks && passingMarksNum > parseFloat(totalMarks)) {
        errors.push('Passing marks cannot exceed total marks');
      }
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (term && !VALID_TERMS.includes(term)) {
      errors.push('Invalid term. Must be one of: ' + VALID_TERMS.join(', '));
    }
    
    if (gradingSystem && !VALID_GRADING_SYSTEMS.includes(gradingSystem)) {
      errors.push('Invalid grading system. Must be one of: ' + VALID_GRADING_SYSTEMS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exam = await examService.updateExam(examId, schoolId, req.body);
    
    if (!exam) {
      return notFoundResponse(res, 'Exam not found');
    }
    
    logger.info('Exam updated successfully:', { examId });
    return successResponse(res, exam, 'Exam updated successfully');
  } catch (error) {
    logger.error('Error updating exam:', error);
    return errorResponse(res, error.message);
  }
};

const deleteExam = async (req, res, next) => {
  try {
    logger.info('Deleting exam');
    
    const { schoolId, examId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const examIdError = validateObjectId(examId, 'Exam ID');
    if (examIdError) errors.push(examIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await examService.deleteExam(examId, schoolId);
    
    if (!result) {
      return notFoundResponse(res, 'Exam not found');
    }
    
    logger.info('Exam deleted successfully:', { examId });
    return successResponse(res, null, 'Exam deleted successfully');
  } catch (error) {
    logger.error('Error deleting exam:', error);
    return errorResponse(res, error.message);
  }
};

const getExamsByClass = async (req, res, next) => {
  try {
    logger.info('Fetching exams by class');
    
    const { schoolId, classId } = req.params;
    const { page, limit, academicYear, term } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const classIdError = validateObjectId(classId, 'Class ID');
    if (classIdError) errors.push(classIdError);
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (term && !VALID_TERMS.includes(term)) {
      errors.push('Invalid term. Must be one of: ' + VALID_TERMS.join(', '));
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exams = await examService.getExamsByClass(schoolId, classId, { page: pageNum, limit: limitNum, academicYear, term });
    
    logger.info('Exams by class fetched successfully:', { classId });
    return successResponse(res, exams, 'Exams retrieved successfully');
  } catch (error) {
    logger.error('Error fetching exams by class:', error);
    return errorResponse(res, error.message);
  }
};

const markAttendance = async (req, res, next) => {
  try {
    logger.info('Marking exam attendance');
    
    const { schoolId, examId } = req.params;
    const { studentId, status, remarks } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const examIdError = validateObjectId(examId, 'Exam ID');
    if (examIdError) errors.push(examIdError);
    
    if (!studentId) {
      errors.push('Student ID is required');
    } else {
      const studentIdError = validateObjectId(studentId, 'Student ID');
      if (studentIdError) errors.push(studentIdError);
    }
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_ATTENDANCE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_ATTENDANCE_STATUSES.join(', '));
    }
    
    if (remarks && remarks.length > 500) {
      errors.push('Remarks must not exceed 500 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exam = await examService.markAttendance(examId, schoolId, studentId, status, remarks);
    
    if (!exam) {
      return notFoundResponse(res, 'Exam not found');
    }
    
    logger.info('Exam attendance marked successfully:', { examId, studentId, status });
    return successResponse(res, exam, 'Attendance marked successfully');
  } catch (error) {
    logger.error('Error marking exam attendance:', error);
    return errorResponse(res, error.message);
  }
};

const getAttendance = async (req, res, next) => {
  try {
    logger.info('Fetching exam attendance');
    
    const { schoolId, examId } = req.params;
    const { status } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const examIdError = validateObjectId(examId, 'Exam ID');
    if (examIdError) errors.push(examIdError);
    
    if (status && !VALID_ATTENDANCE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_ATTENDANCE_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const attendance = await examService.getAttendance(examId, schoolId, status);
    
    if (!attendance) {
      return notFoundResponse(res, 'Exam not found');
    }
    
    logger.info('Exam attendance fetched successfully:', { examId });
    return successResponse(res, attendance, 'Attendance retrieved successfully');
  } catch (error) {
    logger.error('Error fetching exam attendance:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk Operations
const bulkUpdateExams = async (req, res) => {
  try {
    logger.info('Bulk updating exams');
    
    const { schoolId } = req.params;
    const { examIds, updates } = req.body;

    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!Array.isArray(examIds) || examIds.length === 0) {
      errors.push('Exam IDs array is required and must not be empty');
    }
    
    if (examIds && examIds.length > 100) {
      errors.push('Cannot update more than 100 exams at once');
    }
    
    if (examIds) {
      for (let i = 0; i < examIds.length; i++) {
        const idError = validateObjectId(examIds[i], 'Exam ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!updates || typeof updates !== 'object') {
      errors.push('Updates object is required');
    }
    
    if (updates && updates.status && !VALID_EXAM_STATUSES.includes(updates.status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_EXAM_STATUSES.join(', '));
    }
    
    if (updates && updates.examType && !VALID_EXAM_TYPES.includes(updates.examType)) {
      errors.push('Invalid exam type. Must be one of: ' + VALID_EXAM_TYPES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const result = await Exam.updateMany(
      { _id: { $in: examIds }, schoolId: new mongoose.Types.ObjectId(schoolId) },
      { $set: updates }
    );

    logger.info('Exams bulk updated successfully:', { count: result.modifiedCount });
    return successResponse(res, {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    }, 'Exams updated successfully');
  } catch (error) {
    logger.error('Error bulk updating exams:', error);
    return errorResponse(res, error.message);
  }
};

const bulkDeleteExams = async (req, res) => {
  try {
    logger.info('Bulk deleting exams');
    
    const { schoolId } = req.params;
    const { examIds } = req.body;

    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!Array.isArray(examIds) || examIds.length === 0) {
      errors.push('Exam IDs array is required and must not be empty');
    }
    
    if (examIds && examIds.length > 100) {
      errors.push('Cannot delete more than 100 exams at once');
    }
    
    if (examIds) {
      for (let i = 0; i < examIds.length; i++) {
        const idError = validateObjectId(examIds[i], 'Exam ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const result = await Exam.deleteMany({
      _id: { $in: examIds },
      schoolId: new mongoose.Types.ObjectId(schoolId)
    });

    logger.info('Exams bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, {
      deletedCount: result.deletedCount
    }, 'Exams deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting exams:', error);
    return errorResponse(res, error.message);
  }
};

// Export Exams
const exportExams = async (req, res) => {
  try {
    logger.info('Exporting exams');
    
    const { schoolId } = req.params;
    const { format, classId, academicYear, term, status, examType, startDate, endDate } = req.query;

    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const validFormats = ['json', 'csv', 'xlsx', 'pdf'];
    if (!format) {
      errors.push('Format is required');
    } else if (!validFormats.includes(format)) {
      errors.push('Invalid format. Must be one of: ' + validFormats.join(', '));
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (term && !VALID_TERMS.includes(term)) {
      errors.push('Invalid term. Must be one of: ' + VALID_TERMS.join(', '));
    }
    
    if (status && !VALID_EXAM_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_EXAM_STATUSES.join(', '));
    }
    
    if (examType && !VALID_EXAM_TYPES.includes(examType)) {
      errors.push('Invalid exam type. Must be one of: ' + VALID_EXAM_TYPES.join(', '));
    }
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const filters = { schoolId: new mongoose.Types.ObjectId(schoolId) };
    if (classId) filters.classId = new mongoose.Types.ObjectId(classId);
    if (academicYear) filters.academicYear = academicYear;
    if (term) filters.term = term;
    if (status) filters.status = status;
    if (examType) filters.examType = examType;
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }

    const exams = await Exam.find(filters).lean();

    logger.info('Exams exported successfully:', { format, count: exams.length });
    return successResponse(res, {
      format,
      count: exams.length,
      data: exams,
      exportedAt: new Date()
    }, 'Exams exported successfully');
  } catch (error) {
    logger.error('Error exporting exams:', error);
    return errorResponse(res, error.message);
  }
};

// Statistics
const getExamStatistics = async (req, res) => {
  try {
    logger.info('Fetching exam statistics');
    
    const { schoolId } = req.params;
    const { classId, academicYear, term, startDate, endDate } = req.query;

    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (term && !VALID_TERMS.includes(term)) {
      errors.push('Invalid term. Must be one of: ' + VALID_TERMS.join(', '));
    }
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const filters = { schoolId: new mongoose.Types.ObjectId(schoolId) };
    if (classId) filters.classId = new mongoose.Types.ObjectId(classId);
    if (academicYear) filters.academicYear = academicYear;
    if (term) filters.term = term;
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }

    const statistics = await Exam.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalExams: { $sum: 1 },
          scheduledExams: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
          ongoingExams: { $sum: { $cond: [{ $eq: ['$status', 'ongoing'] }, 1, 0] } },
          completedExams: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelledExams: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          postponedExams: { $sum: { $cond: [{ $eq: ['$status', 'postponed'] }, 1, 0] } },
          gradingExams: { $sum: { $cond: [{ $eq: ['$status', 'grading'] }, 1, 0] } },
          midtermExams: { $sum: { $cond: [{ $eq: ['$examType', 'midterm'] }, 1, 0] } },
          finalExams: { $sum: { $cond: [{ $eq: ['$examType', 'final'] }, 1, 0] } },
          quizExams: { $sum: { $cond: [{ $eq: ['$examType', 'quiz'] }, 1, 0] } },
          avgTotalMarks: { $avg: '$totalMarks' },
          avgPassingMarks: { $avg: '$passingMarks' },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    const stats = statistics[0] || {
      totalExams: 0,
      scheduledExams: 0,
      ongoingExams: 0,
      completedExams: 0,
      cancelledExams: 0,
      postponedExams: 0,
      gradingExams: 0,
      midtermExams: 0,
      finalExams: 0,
      quizExams: 0,
      avgTotalMarks: 0,
      avgPassingMarks: 0,
      avgDuration: 0
    };

    logger.info('Exam statistics fetched successfully');
    return successResponse(res, stats, 'Exam statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching exam statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Analytics
const getExamAnalytics = async (req, res) => {
  try {
    logger.info('Fetching exam analytics');
    
    const { schoolId } = req.params;
    const { groupBy, classId, academicYear, term, startDate, endDate } = req.query;

    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const validGroupBy = ['day', 'week', 'month', 'year', 'examType', 'status', 'class', 'term'];
    if (!groupBy) {
      errors.push('GroupBy parameter is required');
    } else if (!validGroupBy.includes(groupBy)) {
      errors.push('Invalid groupBy. Must be one of: ' + validGroupBy.join(', '));
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (term && !VALID_TERMS.includes(term)) {
      errors.push('Invalid term. Must be one of: ' + VALID_TERMS.join(', '));
    }
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const filters = { schoolId: new mongoose.Types.ObjectId(schoolId) };
    if (classId) filters.classId = new mongoose.Types.ObjectId(classId);
    if (academicYear) filters.academicYear = academicYear;
    if (term) filters.term = term;
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }

    let groupByField;
    if (groupBy === 'day') {
      groupByField = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
    } else if (groupBy === 'week') {
      groupByField = { $dateToString: { format: '%Y-W%V', date: '$date' } };
    } else if (groupBy === 'month') {
      groupByField = { $dateToString: { format: '%Y-%m', date: '$date' } };
    } else if (groupBy === 'year') {
      groupByField = { $dateToString: { format: '%Y', date: '$date' } };
    } else if (groupBy === 'class') {
      groupByField = '$classId';
    } else {
      groupByField = '$' + groupBy;
    }

    const analytics = await Exam.aggregate([
      { $match: filters },
      {
        $group: {
          _id: groupByField,
          count: { $sum: 1 },
          avgTotalMarks: { $avg: '$totalMarks' },
          avgPassingMarks: { $avg: '$passingMarks' },
          exams: { $push: { title: '$title', date: '$date', status: '$status', examType: '$examType' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    logger.info('Exam analytics fetched successfully:', { groupBy });
    return successResponse(res, analytics, 'Exam analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching exam analytics:', error);
    return errorResponse(res, error.message);
  }
};


export default {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  getExamsByClass,
  markAttendance,
  getAttendance,
  bulkUpdateExams,
  bulkDeleteExams,
  exportExams,
  getExamStatistics,
  getExamAnalytics
};
