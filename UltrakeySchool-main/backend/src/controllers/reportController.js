import studentService from '../services/studentService.js';
import attendanceService from '../services/attendanceService.js';
import feeService from '../services/feeService.js';
import homeWorkService from '../services/homeWorkService.js';
import scheduledReportService from '../services/scheduledReportService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_REPORT_TYPES = ['student', 'attendance', 'fee', 'academic', 'homework', 'exam', 'performance', 'custom'];
const VALID_PERIODS = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'];
const VALID_FORMATS = ['summary', 'detailed', 'pdf', 'excel', 'csv'];
const VALID_FREQUENCIES = ['once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];

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

// Helper function to validate date format
const validateDate = (date, fieldName = 'Date') => {
  if (!date) return null; // Date is optional
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate date range
const validateDateRange = (startDate, endDate) => {
  const errors = [];
  
  if (startDate) {
    const startDateError = validateDate(startDate, 'Start date');
    if (startDateError) errors.push(startDateError);
  }
  
  if (endDate) {
    const endDateError = validateDate(endDate, 'End date');
    if (endDateError) errors.push(endDateError);
  }
  
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    errors.push('Start date must be before end date');
  }
  
  return errors;
};

// Helper function to get institution ID
const getInstitutionId = (req) => req.user?.schoolId || req.user?.institutionId || req.tenantId;

// Get comprehensive student report
const getStudentReport = async (req, res) => {
  try {
    logger.info('Generating student report');
    
    const { studentId } = req.params;
    const { academicYear } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (academicYear) {
      const yearRegex = /^\d{4}$/;
      if (!yearRegex.test(academicYear)) {
        errors.push('Academic year must be in YYYY format');
      } else {
        const year = parseInt(academicYear);
        if (year < 2000 || year > 2100) {
          errors.push('Academic year must be between 2000 and 2100');
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const currentYear = academicYear || new Date().getFullYear();
    
    const [studentDetails, attendance, fees, results, homework] = await Promise.all([
      studentService.getStudentDetails(studentId, schoolId),
      studentService.getStudentAttendance(studentId, schoolId, { startDate: new Date(currentYear + '-01-01') }),
      studentService.getStudentFees(studentId, schoolId, { academicYear: currentYear }),
      studentService.getStudentResults(studentId, schoolId, { academicYear: currentYear }),
      homeWorkService.getHomeWorks(schoolId, { studentId }, { page: 1, limit: 100 })
    ]);
    
    if (!studentDetails) {
      return notFoundResponse(res, 'Student not found');
    }
    
    // Calculate attendance percentage
    const attendanceStats = attendance.stats || { total: 0, present: 0 };
    const attendancePercentage = attendanceStats.total > 0
      ? ((attendanceStats.present / attendanceStats.total) * 100).toFixed(2)
      : 0;
    
    // Calculate homework statistics
    const totalHomework = homework.homeWorks?.length || 0;
    const submittedHomework = homework.homeWorks?.reduce((sum, h) => {
      const submission = h.submissions?.find(s => s.studentId?.toString() === studentId);
      return sum + (submission && submission.status === 'submitted' ? 1 : 0);
    }, 0) || 0;
    
    // Calculate average marks
    const resultsList = results || [];
    const averageMarks = resultsList.length > 0
      ? (resultsList.reduce((sum, r) => sum + (r.marks || 0), 0) / resultsList.length).toFixed(2)
      : 0;
    
    // Get subject-wise performance
    const subjects = resultsList.map(result => ({
      name: result.subjectId?.name || result.subjectName || 'N/A',
      marks: result.marks || 0,
      grade: result.grade || 'N/A',
      attendance: result.attendance || 0
    }));
    
    // Get class information
    const className = studentDetails.classId?.name || 'N/A';
    const sectionName = studentDetails.sectionId?.name || 'N/A';
    
    const report = {
      student: {
        id: studentDetails._id,
        name: (studentDetails.firstName || '') + ' ' + (studentDetails.lastName || ''),
        class: className + (sectionName ? '-' + sectionName : ''),
        rollNumber: studentDetails.rollNumber || 'N/A'
      },
      academicSummary: {
        attendancePercentage: parseFloat(attendancePercentage),
        totalHomework,
        submittedHomework,
        averageMarks: parseFloat(averageMarks)
      },
      subjects
    };
    
    logger.info('Student report generated successfully:', { studentId });
    return successResponse(res, report, 'Student report generated successfully');
  } catch (error) {
    logger.error('Error generating student report:', error);
    return errorResponse(res, error.message);
  }
};

// Get attendance report
const getAttendanceReport = async (req, res) => {
  try {
    logger.info('Generating attendance report');
    
    const { classId, sectionId, startDate, endDate, date } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (sectionId) {
      const sectionIdError = validateObjectId(sectionId, 'Section ID');
      if (sectionIdError) errors.push(sectionIdError);
    }
    
    const dateRangeErrors = validateDateRange(startDate, endDate);
    errors.push(...dateRangeErrors);
    
    if (date) {
      const dateError = validateDate(date, 'Date');
      if (dateError) errors.push(dateError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Get attendance data
    const targetDate = date ? new Date(date) : new Date();
    const attendance = await attendanceService.getBulkAttendance(schoolId, 'student', targetDate);
    
    // Filter by class and section if provided
    let filteredAttendance = attendance || [];
    if (classId) {
      filteredAttendance = filteredAttendance.filter(a => a.classId?.toString() === classId);
    }
    if (sectionId) {
      filteredAttendance = filteredAttendance.filter(a => a.sectionId?.toString() === sectionId);
    }
    
    // Calculate summary
    const totalStudents = filteredAttendance.length;
    const present = filteredAttendance.filter(a => a.status === 'present').length;
    const absent = filteredAttendance.filter(a => a.status === 'absent').length;
    const late = filteredAttendance.filter(a => a.status === 'late').length;
    const percentage = totalStudents > 0 ? ((present / totalStudents) * 100).toFixed(2) : 0;
    
    const report = {
      attendance: filteredAttendance,
      summary: {
        totalStudents,
        present,
        absent,
        late,
        percentage: parseFloat(percentage)
      }
    };
    
    logger.info('Attendance report generated successfully');
    return successResponse(res, report, 'Attendance report generated successfully');
  } catch (error) {
    logger.error('Error generating attendance report:', error);
    return errorResponse(res, error.message);
  }
};

// Get fee report
const getFeeReport = async (req, res) => {
  try {
    logger.info('Generating fee report');
    
    const { period, format } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (period && !VALID_PERIODS.includes(period)) {
      errors.push('Invalid period. Must be one of: ' + VALID_PERIODS.join(', '));
    }
    
    const reportFormat = format || 'summary';
    if (!VALID_FORMATS.includes(reportFormat)) {
      errors.push('Invalid format. Must be one of: ' + VALID_FORMATS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const report = await feeService.getFeesReport(schoolId, period, reportFormat);
    
    logger.info('Fee report generated successfully');
    return successResponse(res, report, 'Fee report generated successfully');
  } catch (error) {
    logger.error('Error generating fee report:', error);
    return errorResponse(res, error.message);
  }
};

// Create report template
const createReportTemplate = async (req, res) => {
  try {
    logger.info('Creating report template');
    
    const { name, reportType, parameters, format } = req.body;
    const institution = getInstitutionId(req);
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution ID is required');
    }
    
    if (!name || name.trim().length === 0) {
      errors.push('Template name is required');
    } else if (name.length > 200) {
      errors.push('Template name must not exceed 200 characters');
    }
    
    if (!reportType) {
      errors.push('Report type is required');
    } else if (!VALID_REPORT_TYPES.includes(reportType)) {
      errors.push('Invalid report type. Must be one of: ' + VALID_REPORT_TYPES.join(', '));
    }
    
    if (format && !VALID_FORMATS.includes(format)) {
      errors.push('Invalid format. Must be one of: ' + VALID_FORMATS.join(', '));
    }
    
    if (parameters && typeof parameters !== 'object') {
      errors.push('Parameters must be an object');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const template = await scheduledReportService.createTemplate({
      ...req.body,
      institution,
      createdBy: userId
    });
    
    logger.info('Report template created successfully:', { templateId: template._id });
    return createdResponse(res, template, 'Report template created successfully');
  } catch (error) {
    logger.error('Error creating report template:', error);
    return errorResponse(res, error.message);
  }
};

// List report templates
const listReportTemplates = async (req, res) => {
  try {
    logger.info('Fetching report templates');
    
    const { reportType } = req.query;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution ID is required');
    }
    
    if (reportType && !VALID_REPORT_TYPES.includes(reportType)) {
      errors.push('Invalid report type. Must be one of: ' + VALID_REPORT_TYPES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const templates = await scheduledReportService.listTemplates(institution, reportType);
    
    logger.info('Report templates fetched successfully:', { count: templates.length });
    return successResponse(res, templates, 'Report templates retrieved successfully');
  } catch (error) {
    logger.error('Error fetching report templates:', error);
    return errorResponse(res, error.message);
  }
};

// Create scheduled report
const createScheduledReport = async (req, res) => {
  try {
    logger.info('Creating scheduled report');
    
    const { templateId, frequency, recipients, startDate, endDate } = req.body;
    const institution = getInstitutionId(req);
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution ID is required');
    }
    
    const templateIdError = validateObjectId(templateId, 'Template ID');
    if (templateIdError) errors.push(templateIdError);
    
    if (!frequency) {
      errors.push('Frequency is required');
    } else if (!VALID_FREQUENCIES.includes(frequency)) {
      errors.push('Invalid frequency. Must be one of: ' + VALID_FREQUENCIES.join(', '));
    }
    
    if (recipients && !Array.isArray(recipients)) {
      errors.push('Recipients must be an array');
    } else if (recipients && recipients.length === 0) {
      errors.push('At least one recipient is required');
    } else if (recipients && recipients.length > 100) {
      errors.push('Cannot have more than 100 recipients');
    }
    
    const dateRangeErrors = validateDateRange(startDate, endDate);
    errors.push(...dateRangeErrors);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const schedule = await scheduledReportService.prepareSchedule({
      ...req.body,
      institution,
      createdBy: userId
    });
    
    logger.info('Scheduled report created successfully:', { scheduleId: schedule._id });
    return createdResponse(res, schedule, 'Scheduled report created successfully');
  } catch (error) {
    logger.error('Error creating scheduled report:', error);
    return errorResponse(res, error.message);
  }
};

// List scheduled reports
const listScheduledReports = async (req, res) => {
  try {
    logger.info('Fetching scheduled reports');
    
    const { status } = req.query;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const schedules = await scheduledReportService.listSchedules(institution, status);
    
    logger.info('Scheduled reports fetched successfully:', { count: schedules.length });
    return successResponse(res, schedules, 'Scheduled reports retrieved successfully');
  } catch (error) {
    logger.error('Error fetching scheduled reports:', error);
    return errorResponse(res, error.message);
  }
};

// Run scheduled report now
const runScheduledReportNow = async (req, res) => {
  try {
    logger.info('Running scheduled report');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Schedule ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const payload = await scheduledReportService.runScheduledReport(id);
    
    logger.info('Scheduled report executed successfully:', { scheduleId: id });
    return successResponse(res, payload, 'Report executed successfully');
  } catch (error) {
    logger.error('Error running scheduled report:', error);
    return errorResponse(res, error.message);
  }
};

// Get academic performance report
const getAcademicPerformanceReport = async (req, res) => {
  try {
    logger.info('Generating academic performance report');
    
    const { classId, sectionId, subjectId, academicYear } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (sectionId) {
      const sectionIdError = validateObjectId(sectionId, 'Section ID');
      if (sectionIdError) errors.push(sectionIdError);
    }
    
    if (subjectId) {
      const subjectIdError = validateObjectId(subjectId, 'Subject ID');
      if (subjectIdError) errors.push(subjectIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const report = await studentService.getAcademicPerformanceReport(schoolId, {
      classId,
      sectionId,
      subjectId,
      academicYear
    });
    
    logger.info('Academic performance report generated successfully');
    return successResponse(res, report, 'Academic performance report generated successfully');
  } catch (error) {
    logger.error('Error generating academic performance report:', error);
    return errorResponse(res, error.message);
  }
};

// Get homework report
const getHomeworkReport = async (req, res) => {
  try {
    logger.info('Generating homework report');
    
    const { classId, sectionId, subjectId, startDate, endDate } = req.query;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (classId) {
      const classIdError = validateObjectId(classId, 'Class ID');
      if (classIdError) errors.push(classIdError);
    }
    
    if (sectionId) {
      const sectionIdError = validateObjectId(sectionId, 'Section ID');
      if (sectionIdError) errors.push(sectionIdError);
    }
    
    if (subjectId) {
      const subjectIdError = validateObjectId(subjectId, 'Subject ID');
      if (subjectIdError) errors.push(subjectIdError);
    }
    
    const dateRangeErrors = validateDateRange(startDate, endDate);
    errors.push(...dateRangeErrors);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const report = await homeWorkService.getHomeworkReport(schoolId, {
      classId,
      sectionId,
      subjectId,
      startDate,
      endDate
    });
    
    logger.info('Homework report generated successfully');
    return successResponse(res, report, 'Homework report generated successfully');
  } catch (error) {
    logger.error('Error generating homework report:', error);
    return errorResponse(res, error.message);
  }
};

// Export report
const exportReport = async (req, res) => {
  try {
    logger.info('Exporting report');
    
    const { reportType, format, parameters } = req.body;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    if (!schoolId) {
      errors.push('School ID is required');
    }
    
    if (!reportType) {
      errors.push('Report type is required');
    } else if (!VALID_REPORT_TYPES.includes(reportType)) {
      errors.push('Invalid report type. Must be one of: ' + VALID_REPORT_TYPES.join(', '));
    }
    
    if (!format) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (parameters && typeof parameters !== 'object') {
      errors.push('Parameters must be an object');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await scheduledReportService.exportReport(schoolId, {
      reportType,
      format: format.toLowerCase(),
      parameters
    });
    
    logger.info('Report exported successfully:', { reportType, format });
    return successResponse(res, exportData, 'Report exported successfully');
  } catch (error) {
    logger.error('Error exporting report:', error);
    return errorResponse(res, error.message);
  }
};

// Get report template by ID
const getReportTemplateById = async (req, res) => {
  try {
    logger.info('Fetching report template by ID');
    
    const { id } = req.params;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Template ID');
    if (idError) errors.push(idError);
    
    if (!institution) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const template = await scheduledReportService.getTemplateById(id, institution);
    
    if (!template) {
      return notFoundResponse(res, 'Report template not found');
    }
    
    logger.info('Report template fetched successfully:', { templateId: id });
    return successResponse(res, template, 'Report template retrieved successfully');
  } catch (error) {
    logger.error('Error fetching report template:', error);
    return errorResponse(res, error.message);
  }
};

// Update report template
const updateReportTemplate = async (req, res) => {
  try {
    logger.info('Updating report template');
    
    const { id } = req.params;
    const { name, reportType, parameters, format } = req.body;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Template ID');
    if (idError) errors.push(idError);
    
    if (!institution) {
      errors.push('Institution ID is required');
    }
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        errors.push('Template name cannot be empty');
      } else if (name.length > 200) {
        errors.push('Template name must not exceed 200 characters');
      }
    }
    
    if (reportType !== undefined && !VALID_REPORT_TYPES.includes(reportType)) {
      errors.push('Invalid report type. Must be one of: ' + VALID_REPORT_TYPES.join(', '));
    }
    
    if (format !== undefined && !VALID_FORMATS.includes(format)) {
      errors.push('Invalid format. Must be one of: ' + VALID_FORMATS.join(', '));
    }
    
    if (parameters !== undefined && typeof parameters !== 'object') {
      errors.push('Parameters must be an object');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const template = await scheduledReportService.updateTemplate(id, institution, req.body);
    
    if (!template) {
      return notFoundResponse(res, 'Report template not found');
    }
    
    logger.info('Report template updated successfully:', { templateId: id });
    return successResponse(res, template, 'Report template updated successfully');
  } catch (error) {
    logger.error('Error updating report template:', error);
    return errorResponse(res, error.message);
  }
};

// Delete report template
const deleteReportTemplate = async (req, res) => {
  try {
    logger.info('Deleting report template');
    
    const { id } = req.params;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Template ID');
    if (idError) errors.push(idError);
    
    if (!institution) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await scheduledReportService.deleteTemplate(id, institution);
    
    logger.info('Report template deleted successfully:', { templateId: id });
    return successResponse(res, null, 'Report template deleted successfully');
  } catch (error) {
    logger.error('Error deleting report template:', error);
    return errorResponse(res, error.message);
  }
};

// Update scheduled report
const updateScheduledReport = async (req, res) => {
  try {
    logger.info('Updating scheduled report');
    
    const { id } = req.params;
    const { frequency, recipients, startDate, endDate, isActive } = req.body;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Schedule ID');
    if (idError) errors.push(idError);
    
    if (!institution) {
      errors.push('Institution ID is required');
    }
    
    if (frequency !== undefined && !VALID_FREQUENCIES.includes(frequency)) {
      errors.push('Invalid frequency. Must be one of: ' + VALID_FREQUENCIES.join(', '));
    }
    
    if (recipients !== undefined) {
      if (!Array.isArray(recipients)) {
        errors.push('Recipients must be an array');
      } else if (recipients.length === 0) {
        errors.push('At least one recipient is required');
      } else if (recipients.length > 100) {
        errors.push('Cannot have more than 100 recipients');
      }
    }
    
    const dateRangeErrors = validateDateRange(startDate, endDate);
    errors.push(...dateRangeErrors);
    
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      errors.push('isActive must be a boolean value');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const schedule = await scheduledReportService.updateSchedule(id, institution, req.body);
    
    if (!schedule) {
      return notFoundResponse(res, 'Scheduled report not found');
    }
    
    logger.info('Scheduled report updated successfully:', { scheduleId: id });
    return successResponse(res, schedule, 'Scheduled report updated successfully');
  } catch (error) {
    logger.error('Error updating scheduled report:', error);
    return errorResponse(res, error.message);
  }
};

// Delete scheduled report
const deleteScheduledReport = async (req, res) => {
  try {
    logger.info('Deleting scheduled report');
    
    const { id } = req.params;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Schedule ID');
    if (idError) errors.push(idError);
    
    if (!institution) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await scheduledReportService.deleteSchedule(id, institution);
    
    logger.info('Scheduled report deleted successfully:', { scheduleId: id });
    return successResponse(res, null, 'Scheduled report deleted successfully');
  } catch (error) {
    logger.error('Error deleting scheduled report:', error);
    return errorResponse(res, error.message);
  }
};

// Get report history
const getReportHistory = async (req, res) => {
  try {
    logger.info('Fetching report history');
    
    const { reportType, startDate, endDate, page, limit } = req.query;
    const institution = getInstitutionId(req);
    
    // Validation
    const errors = [];
    
    if (!institution) {
      errors.push('Institution ID is required');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (reportType && !VALID_REPORT_TYPES.includes(reportType)) {
      errors.push('Invalid report type. Must be one of: ' + VALID_REPORT_TYPES.join(', '));
    }
    
    const dateRangeErrors = validateDateRange(startDate, endDate);
    errors.push(...dateRangeErrors);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await scheduledReportService.getReportHistory(institution, {
      reportType,
      startDate,
      endDate,
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Report history fetched successfully');
    return successResponse(res, result, 'Report history retrieved successfully');
  } catch (error) {
    logger.error('Error fetching report history:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export {
  getStudentReport,
  getAttendanceReport,
  getFeeReport,
  createReportTemplate,
  listReportTemplates,
  createScheduledReport,
  listScheduledReports,
  runScheduledReportNow,
  getAcademicPerformanceReport,
  getHomeworkReport,
  exportReport,
  getReportTemplateById,
  updateReportTemplate,
  deleteReportTemplate,
  updateScheduledReport,
  deleteScheduledReport,
  getReportHistory
};

export default {
  getStudentReport,
  getAttendanceReport,
  getFeeReport,
  createReportTemplate,
  listReportTemplates,
  createScheduledReport,
  listScheduledReports,
  runScheduledReportNow,
  getAcademicPerformanceReport,
  getHomeworkReport,
  exportReport,
  getReportTemplateById,
  updateReportTemplate,
  deleteReportTemplate,
  updateScheduledReport,
  deleteScheduledReport,
  getReportHistory
};
