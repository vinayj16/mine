import StudentResult from '../models/StudentResult.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['draft', 'published', 'archived', 'pending-review'];
const VALID_TERMS = ['term-1', 'term-2', 'term-3', 'mid-term', 'final', 'annual'];
const VALID_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'E', 'F'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_MARKS = 100;
const MIN_MARKS = 0;

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

// Helper function to validate academic year format
const validateAcademicYear = (year) => {
  if (!year) return null; // Optional
  const yearRegex = /^\d{4}-\d{4}$/;
  if (!yearRegex.test(year)) {
    return 'Academic year must be in YYYY-YYYY format (e.g., 2023-2024)';
  }
  const [startYear, endYear] = year.split('-').map(Number);
  if (endYear !== startYear + 1) {
    return 'Academic year end must be one year after start';
  }
  if (startYear < 2000 || startYear > 2100) {
    return 'Academic year must be between 2000 and 2100';
  }
  return null;
};

// Get results
const getResults = async (req, res) => {
  try {
    logger.info('Fetching results');
    
    const { schoolId } = req.params;
    const { classId, examId, academicYear, term, status, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (examId) {
      const examIdError = validateObjectId(examId, 'Exam ID');
      if (examIdError) errors.push(examIdError);
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (term && !VALID_TERMS.includes(term)) {
      errors.push('Invalid term. Must be one of: ' + VALID_TERMS.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
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
    
    // Build filters
    const filters = { schoolId };
    if (classId) filters.classId = classId;
    if (examId) filters.examId = examId;
    if (academicYear) filters.academicYear = academicYear;
    if (term) filters.term = term;
    if (status) filters.status = status;
    
    const skip = (pageNum - 1) * limitNum;
    const results = await StudentResult.find(filters)
      .populate('studentId', 'admissionNumber firstName lastName rollNumber avatar')
      .populate('examId', 'name examType')
      .populate('classId', 'name section')
      .sort({ 'studentId.admissionNumber': 1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await StudentResult.countDocuments(filters);
    
    logger.info('Results fetched successfully');
    return successResponse(res, {
      results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Results retrieved successfully');
  } catch (error) {
    logger.error('Error fetching results:', error);
    return errorResponse(res, error.message);
  }
};

// Get result by ID
const getResultById = async (req, res) => {
  try {
    logger.info('Fetching result by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Result ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await StudentResult.findById(id)
      .populate('studentId', 'admissionNumber firstName lastName rollNumber avatar')
      .populate('examId', 'name examType')
      .populate('classId', 'name section');
    
    if (!result) {
      return notFoundResponse(res, 'Result not found');
    }
    
    logger.info('Result fetched successfully:', { resultId: id });
    return successResponse(res, result, 'Result retrieved successfully');
  } catch (error) {
    logger.error('Error fetching result:', error);
    return errorResponse(res, error.message);
  }
};

// Create result
const createResult = async (req, res) => {
  try {
    logger.info('Creating result');
    
    const { schoolId } = req.params;
    const { studentId, examId, classId, subjectId, marks, grade, academicYear, term, status } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    const examIdError = validateObjectId(examId, 'Exam ID');
    if (examIdError) errors.push(examIdError);
    
    const classIdError = validateObjectId(classId, 'Class ID');
    if (classIdError) errors.push(classIdError);
    
    if (subjectId) {
      const subjectIdError = validateObjectId(subjectId, 'Subject ID');
      if (subjectIdError) errors.push(subjectIdError);
    }
    
    if (marks === undefined || marks === null) {
      errors.push('Marks are required');
    } else if (typeof marks !== 'number' || marks < MIN_MARKS || marks > MAX_MARKS) {
      errors.push('Marks must be between ' + MIN_MARKS + ' and ' + MAX_MARKS);
    }
    
    if (grade && !VALID_GRADES.includes(grade)) {
      errors.push('Invalid grade. Must be one of: ' + VALID_GRADES.join(', '));
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (term && !VALID_TERMS.includes(term)) {
      errors.push('Invalid term. Must be one of: ' + VALID_TERMS.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const resultData = { ...req.body, schoolId };
    const result = await StudentResult.create(resultData);
    
    logger.info('Result created successfully:', { resultId: result._id });
    return createdResponse(res, result, 'Result created successfully');
  } catch (error) {
    logger.error('Error creating result:', error);
    return errorResponse(res, error.message);
  }
};

// Update result
const updateResult = async (req, res) => {
  try {
    logger.info('Updating result');
    
    const { id } = req.params;
    const { marks, grade, status, term } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Result ID');
    if (idError) errors.push(idError);
    
    if (marks !== undefined) {
      if (typeof marks !== 'number' || marks < MIN_MARKS || marks > MAX_MARKS) {
        errors.push('Marks must be between ' + MIN_MARKS + ' and ' + MAX_MARKS);
      }
    }
    
    if (grade !== undefined && !VALID_GRADES.includes(grade)) {
      errors.push('Invalid grade. Must be one of: ' + VALID_GRADES.join(', '));
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (term !== undefined && !VALID_TERMS.includes(term)) {
      errors.push('Invalid term. Must be one of: ' + VALID_TERMS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await StudentResult.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!result) {
      return notFoundResponse(res, 'Result not found');
    }
    
    logger.info('Result updated successfully:', { resultId: id });
    return successResponse(res, result, 'Result updated successfully');
  } catch (error) {
    logger.error('Error updating result:', error);
    return errorResponse(res, error.message);
  }
};

// Delete result
const deleteResult = async (req, res) => {
  try {
    logger.info('Deleting result');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Result ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await StudentResult.findByIdAndDelete(id);
    
    if (!result) {
      return notFoundResponse(res, 'Result not found');
    }
    
    logger.info('Result deleted successfully:', { resultId: id });
    return successResponse(res, null, 'Result deleted successfully');
  } catch (error) {
    logger.error('Error deleting result:', error);
    return errorResponse(res, error.message);
  }
};

// Publish result
const publishResult = async (req, res) => {
  try {
    logger.info('Publishing result');
    
    const { id } = req.params;
    const userId = req.user?._id;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Result ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await StudentResult.findByIdAndUpdate(
      id,
      { 
        status: 'published',
        publishedDate: new Date(),
        publishedBy: userId
      },
      { new: true }
    );
    
    if (!result) {
      return notFoundResponse(res, 'Result not found');
    }
    
    logger.info('Result published successfully:', { resultId: id });
    return successResponse(res, result, 'Result published successfully');
  } catch (error) {
    logger.error('Error publishing result:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk create results
const bulkCreateResults = async (req, res) => {
  try {
    logger.info('Bulk creating results');
    
    const { schoolId } = req.params;
    const { results } = req.body;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!results || !Array.isArray(results)) {
      errors.push('Results must be an array');
    } else if (results.length === 0) {
      errors.push('Results array cannot be empty');
    } else if (results.length > 500) {
      errors.push('Cannot create more than 500 results at once');
    } else {
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (!result.studentId) {
          errors.push('Result ' + (i + 1) + ': Student ID is required');
          break;
        }
        if (!result.examId) {
          errors.push('Result ' + (i + 1) + ': Exam ID is required');
          break;
        }
        if (result.marks === undefined || typeof result.marks !== 'number') {
          errors.push('Result ' + (i + 1) + ': Valid marks are required');
          break;
        }
        if (result.marks < MIN_MARKS || result.marks > MAX_MARKS) {
          errors.push('Result ' + (i + 1) + ': Marks must be between ' + MIN_MARKS + ' and ' + MAX_MARKS);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const resultsData = results.map(r => ({ ...r, schoolId }));
    const createdResults = await StudentResult.insertMany(resultsData);
    
    logger.info('Results bulk created successfully:', { count: createdResults.length });
    return createdResponse(res, createdResults, createdResults.length + ' result(s) created successfully');
  } catch (error) {
    logger.error('Error bulk creating results:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete results
const bulkDeleteResults = async (req, res) => {
  try {
    logger.info('Bulk deleting results');
    
    const { resultIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!resultIds || !Array.isArray(resultIds)) {
      errors.push('Result IDs must be an array');
    } else if (resultIds.length === 0) {
      errors.push('Result IDs array cannot be empty');
    } else if (resultIds.length > 100) {
      errors.push('Cannot delete more than 100 results at once');
    } else {
      for (const id of resultIds) {
        const idError = validateObjectId(id, 'Result ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await StudentResult.deleteMany({ _id: { $in: resultIds } });
    
    logger.info('Results bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Results deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting results:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk publish results
const bulkPublishResults = async (req, res) => {
  try {
    logger.info('Bulk publishing results');
    
    const { resultIds } = req.body;
    const userId = req.user?._id;
    
    // Validation
    const errors = [];
    
    if (!resultIds || !Array.isArray(resultIds)) {
      errors.push('Result IDs must be an array');
    } else if (resultIds.length === 0) {
      errors.push('Result IDs array cannot be empty');
    } else if (resultIds.length > 100) {
      errors.push('Cannot publish more than 100 results at once');
    } else {
      for (const id of resultIds) {
        const idError = validateObjectId(id, 'Result ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await StudentResult.updateMany(
      { _id: { $in: resultIds } },
      { 
        $set: { 
          status: 'published',
          publishedDate: new Date(),
          publishedBy: userId
        }
      }
    );
    
    logger.info('Results bulk published successfully:', { count: result.modifiedCount });
    return successResponse(res, { publishedCount: result.modifiedCount }, 'Results published successfully');
  } catch (error) {
    logger.error('Error bulk publishing results:', error);
    return errorResponse(res, error.message);
  }
};

// Get results by student
const getResultsByStudent = async (req, res) => {
  try {
    logger.info('Fetching results by student');
    
    const { studentId } = req.params;
    const { academicYear, term, status } = req.query;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (term && !VALID_TERMS.includes(term)) {
      errors.push('Invalid term. Must be one of: ' + VALID_TERMS.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = { studentId };
    if (academicYear) filters.academicYear = academicYear;
    if (term) filters.term = term;
    if (status) filters.status = status;
    
    const results = await StudentResult.find(filters)
      .populate('examId', 'name examType')
      .populate('subjectId', 'name')
      .sort({ createdAt: -1 });
    
    logger.info('Results fetched by student successfully:', { studentId, count: results.length });
    return successResponse(res, results, 'Results retrieved successfully');
  } catch (error) {
    logger.error('Error fetching results by student:', error);
    return errorResponse(res, error.message);
  }
};

// Get results by exam
const getResultsByExam = async (req, res) => {
  try {
    logger.info('Fetching results by exam');
    
    const { examId } = req.params;
    const { classId, status, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const examIdError = validateObjectId(examId, 'Exam ID');
    if (examIdError) errors.push(examIdError);
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = { examId };
    if (classId) filters.classId = classId;
    if (status) filters.status = status;
    
    const skip = (pageNum - 1) * limitNum;
    const results = await StudentResult.find(filters)
      .populate('studentId', 'admissionNumber firstName lastName rollNumber')
      .populate('subjectId', 'name')
      .sort({ marks: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await StudentResult.countDocuments(filters);
    
    logger.info('Results fetched by exam successfully:', { examId });
    return successResponse(res, {
      results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Results retrieved successfully');
  } catch (error) {
    logger.error('Error fetching results by exam:', error);
    return errorResponse(res, error.message);
  }
};

// Get result statistics
const getResultStatistics = async (req, res) => {
  try {
    logger.info('Fetching result statistics');
    
    const { schoolId, examId, classId } = req.query;
    
    // Validation
    const errors = [];
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (examId) {
      const examIdError = validateObjectId(examId, 'Exam ID');
      if (examIdError) errors.push(examIdError);
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = {};
    if (schoolId) filters.schoolId = schoolId;
    if (examId) filters.examId = examId;
    if (classId) filters.classId = classId;
    
    const totalResults = await StudentResult.countDocuments(filters);
    const publishedResults = await StudentResult.countDocuments({ ...filters, status: 'published' });
    const draftResults = await StudentResult.countDocuments({ ...filters, status: 'draft' });
    
    const avgMarks = await StudentResult.aggregate([
      { $match: filters },
      { $group: { _id: null, average: { $avg: '$marks' } } }
    ]);
    
    const gradeDistribution = await StudentResult.aggregate([
      { $match: filters },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    const statistics = {
      totalResults,
      publishedResults,
      draftResults,
      averageMarks: avgMarks.length > 0 ? avgMarks[0].average.toFixed(2) : 0,
      gradeDistribution: gradeDistribution.map(item => ({
        grade: item._id,
        count: item.count
      }))
    };
    
    logger.info('Result statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching result statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Export results
const exportResults = async (req, res) => {
  try {
    logger.info('Exporting results');
    
    const { format, examId, classId, status } = req.query;
    const { schoolId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (examId) {
      const examIdError = validateObjectId(examId, 'Exam ID');
      if (examIdError) errors.push(examIdError);
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = { schoolId };
    if (examId) filters.examId = examId;
    if (classId) filters.classId = classId;
    if (status) filters.status = status;
    
    const results = await StudentResult.find(filters)
      .populate('studentId', 'admissionNumber firstName lastName rollNumber')
      .populate('examId', 'name examType')
      .populate('subjectId', 'name')
      .sort({ 'studentId.admissionNumber': 1 });
    
    const exportData = {
      format: format.toLowerCase(),
      exportedAt: new Date().toISOString(),
      totalResults: results.length,
      results: results.map(r => ({
        studentName: r.studentId ? r.studentId.firstName + ' ' + r.studentId.lastName : 'N/A',
        admissionNumber: r.studentId?.admissionNumber || 'N/A',
        examName: r.examId?.name || 'N/A',
        subjectName: r.subjectId?.name || 'N/A',
        marks: r.marks,
        grade: r.grade,
        status: r.status
      }))
    };
    
    logger.info('Results exported successfully:', { format, count: results.length });
    return successResponse(res, exportData, 'Results exported successfully');
  } catch (error) {
    logger.error('Error exporting results:', error);
    return errorResponse(res, error.message);
  }
};

// Calculate and update grades
const calculateGrades = async (req, res) => {
  try {
    logger.info('Calculating grades');
    
    const { resultIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!resultIds || !Array.isArray(resultIds)) {
      errors.push('Result IDs must be an array');
    } else if (resultIds.length === 0) {
      errors.push('Result IDs array cannot be empty');
    } else if (resultIds.length > 100) {
      errors.push('Cannot calculate grades for more than 100 results at once');
    } else {
      for (const id of resultIds) {
        const idError = validateObjectId(id, 'Result ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Simple grade calculation logic
    const calculateGrade = (marks) => {
      if (marks >= 90) return 'A+';
      if (marks >= 80) return 'A';
      if (marks >= 70) return 'A-';
      if (marks >= 60) return 'B+';
      if (marks >= 50) return 'B';
      if (marks >= 40) return 'B-';
      if (marks >= 35) return 'C+';
      if (marks >= 30) return 'C';
      if (marks >= 25) return 'C-';
      if (marks >= 20) return 'D';
      if (marks >= 10) return 'E';
      return 'F';
    };
    
    const results = await StudentResult.find({ _id: { $in: resultIds } });
    
    const updatePromises = results.map(result => {
      const grade = calculateGrade(result.marks);
      return StudentResult.findByIdAndUpdate(result._id, { grade }, { new: true });
    });
    
    await Promise.all(updatePromises);
    
    logger.info('Grades calculated successfully:', { count: results.length });
    return successResponse(res, { updatedCount: results.length }, 'Grades calculated successfully');
  } catch (error) {
    logger.error('Error calculating grades:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getResults,
  getResultById,
  createResult,
  updateResult,
  deleteResult,
  publishResult,
  bulkCreateResults,
  bulkDeleteResults,
  bulkPublishResults,
  getResultsByStudent,
  getResultsByExam,
  getResultStatistics,
  exportResults,
  calculateGrades
};
