import onlineExamService from '../services/onlineExamService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_EXAM_STATUSES = ['draft', 'published', 'ongoing', 'completed', 'archived'];
const VALID_QUESTION_TYPES = ['multiple-choice', 'true-false', 'short-answer', 'essay', 'fill-blank', 'matching'];
const VALID_SUBMISSION_STATUSES = ['not-started', 'in-progress', 'submitted', 'graded'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_QUESTIONS = 200;
const MAX_DURATION_MINUTES = 600;
const MAX_ATTEMPTS = 10;

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
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return 'Start date must be before end date';
    }
  }
  return null;
};

// Exam Management
const createExam = async (req, res) => {
  try {
    logger.info('Creating new online exam');
    
    const { title, description, subject, duration, totalMarks, passingMarks, startDate, endDate, questions, maxAttempts, shuffleQuestions } = req.body;
    const userId = req.user?._id;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!title || title.trim().length === 0) {
      errors.push('Exam title is required');
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.push('Title must not exceed ' + MAX_TITLE_LENGTH + ' characters');
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (!subject || subject.trim().length === 0) {
      errors.push('Subject is required');
    }
    
    if (!duration) {
      errors.push('Exam duration is required');
    } else if (duration < 1 || duration > MAX_DURATION_MINUTES) {
      errors.push('Duration must be between 1 and ' + MAX_DURATION_MINUTES + ' minutes');
    }
    
    if (!totalMarks) {
      errors.push('Total marks is required');
    } else if (totalMarks < 1 || totalMarks > 1000) {
      errors.push('Total marks must be between 1 and 1000');
    }
    
    if (passingMarks !== undefined) {
      if (passingMarks < 0 || passingMarks > totalMarks) {
        errors.push('Passing marks must be between 0 and total marks');
      }
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
      const dateRangeError = validateDateRange(startDate, endDate);
      if (dateRangeError) errors.push(dateRangeError);
    }
    
    if (questions) {
      if (!Array.isArray(questions)) {
        errors.push('Questions must be an array');
      } else if (questions.length > MAX_QUESTIONS) {
        errors.push('Cannot have more than ' + MAX_QUESTIONS + ' questions');
      }
    }
    
    if (maxAttempts !== undefined) {
      if (maxAttempts < 1 || maxAttempts > MAX_ATTEMPTS) {
        errors.push('Max attempts must be between 1 and ' + MAX_ATTEMPTS);
      }
    }
    
    if (!userId) {
      errors.push('User authentication is required');
    }
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exam = await onlineExamService.createExam(req.body, userId, tenant);
    
    logger.info('Online exam created successfully:', { examId: exam._id });
    return createdResponse(res, exam, 'Exam created successfully');
  } catch (error) {
    logger.error('Error creating online exam:', error);
    return errorResponse(res, error.message);
  }
};

const getExams = async (req, res) => {
  try {
    logger.info('Fetching online exams');
    
    const { page, limit, status, subject, search } = req.query;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (status && !VALID_EXAM_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_EXAM_STATUSES.join(', '));
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await onlineExamService.getExams(tenant, {
      ...req.query,
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Online exams fetched successfully');
    return successResponse(res, result.exams, 'Exams fetched successfully', result.pagination);
  } catch (error) {
    logger.error('Error fetching online exams:', error);
    return errorResponse(res, error.message);
  }
};

const getExamById = async (req, res) => {
  try {
    logger.info('Fetching online exam by ID');
    
    const { id } = req.params;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Exam ID');
    if (idError) errors.push(idError);
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exam = await onlineExamService.getExamById(id, tenant);
    
    if (!exam) {
      return notFoundResponse(res, 'Exam not found');
    }
    
    logger.info('Online exam fetched successfully:', { examId: id });
    return successResponse(res, exam, 'Exam fetched successfully');
  } catch (error) {
    logger.error('Error fetching online exam:', error);
    return errorResponse(res, error.message, 404);
  }
};

const updateExam = async (req, res) => {
  try {
    logger.info('Updating online exam');
    
    const { id } = req.params;
    const { title, description, duration, totalMarks, passingMarks, startDate, endDate, maxAttempts } = req.body;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Exam ID');
    if (idError) errors.push(idError);
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        errors.push('Exam title cannot be empty');
      } else if (title.length > MAX_TITLE_LENGTH) {
        errors.push('Title must not exceed ' + MAX_TITLE_LENGTH + ' characters');
      }
    }
    
    if (description !== undefined && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (duration !== undefined) {
      if (duration < 1 || duration > MAX_DURATION_MINUTES) {
        errors.push('Duration must be between 1 and ' + MAX_DURATION_MINUTES + ' minutes');
      }
    }
    
    if (totalMarks !== undefined) {
      if (totalMarks < 1 || totalMarks > 1000) {
        errors.push('Total marks must be between 1 and 1000');
      }
    }
    
    if (passingMarks !== undefined && totalMarks !== undefined) {
      if (passingMarks < 0 || passingMarks > totalMarks) {
        errors.push('Passing marks must be between 0 and total marks');
      }
    }
    
    if (startDate !== undefined) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate !== undefined) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const dateRangeError = validateDateRange(startDate, endDate);
      if (dateRangeError) errors.push(dateRangeError);
    }
    
    if (maxAttempts !== undefined) {
      if (maxAttempts < 1 || maxAttempts > MAX_ATTEMPTS) {
        errors.push('Max attempts must be between 1 and ' + MAX_ATTEMPTS);
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exam = await onlineExamService.updateExam(id, tenant, req.body);
    
    if (!exam) {
      return notFoundResponse(res, 'Exam not found');
    }
    
    logger.info('Online exam updated successfully:', { examId: id });
    return successResponse(res, exam, 'Exam updated successfully');
  } catch (error) {
    logger.error('Error updating online exam:', error);
    return errorResponse(res, error.message);
  }
};

const deleteExam = async (req, res) => {
  try {
    logger.info('Deleting online exam');
    
    const { id } = req.params;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Exam ID');
    if (idError) errors.push(idError);
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await onlineExamService.deleteExam(id, tenant);
    
    logger.info('Online exam deleted successfully:', { examId: id });
    return successResponse(res, null, 'Exam deleted successfully');
  } catch (error) {
    logger.error('Error deleting online exam:', error);
    return errorResponse(res, error.message);
  }
};

const publishExam = async (req, res) => {
  try {
    logger.info('Publishing online exam');
    
    const { id } = req.params;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Exam ID');
    if (idError) errors.push(idError);
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exam = await onlineExamService.publishExam(id, tenant);
    
    if (!exam) {
      return notFoundResponse(res, 'Exam not found');
    }
    
    logger.info('Online exam published successfully:', { examId: id });
    return successResponse(res, exam, 'Exam published successfully');
  } catch (error) {
    logger.error('Error publishing online exam:', error);
    return errorResponse(res, error.message);
  }
};

// Student Exam Taking
const startExam = async (req, res) => {
  try {
    logger.info('Starting online exam');
    
    const { id } = req.params;
    const userId = req.user?._id;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Exam ID');
    if (idError) errors.push(idError);
    
    if (!userId) {
      errors.push('User authentication is required');
    }
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await onlineExamService.startExam(id, userId, tenant);
    
    logger.info('Online exam started successfully:', { examId: id, userId });
    return successResponse(res, result, 'Exam started successfully');
  } catch (error) {
    logger.error('Error starting online exam:', error);
    return errorResponse(res, error.message);
  }
};

const saveAnswer = async (req, res) => {
  try {
    logger.info('Saving exam answer');
    
    const { submissionId } = req.params;
    const { questionId, answer, timeTaken } = req.body;
    
    // Validation
    const errors = [];
    
    const submissionIdError = validateObjectId(submissionId, 'Submission ID');
    if (submissionIdError) errors.push(submissionIdError);
    
    const questionIdError = validateObjectId(questionId, 'Question ID');
    if (questionIdError) errors.push(questionIdError);
    
    if (answer === undefined || answer === null) {
      errors.push('Answer is required');
    }
    
    if (timeTaken !== undefined) {
      if (typeof timeTaken !== 'number' || timeTaken < 0) {
        errors.push('Time taken must be a positive number');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const submission = await onlineExamService.saveAnswer(
      submissionId,
      questionId,
      answer,
      timeTaken
    );
    
    logger.info('Exam answer saved successfully:', { submissionId, questionId });
    return successResponse(res, submission, 'Answer saved successfully');
  } catch (error) {
    logger.error('Error saving exam answer:', error);
    return errorResponse(res, error.message);
  }
};

const submitExam = async (req, res) => {
  try {
    logger.info('Submitting online exam');
    
    const { submissionId } = req.params;
    const userId = req.user?._id;
    
    // Validation
    const errors = [];
    
    const submissionIdError = validateObjectId(submissionId, 'Submission ID');
    if (submissionIdError) errors.push(submissionIdError);
    
    if (!userId) {
      errors.push('User authentication is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const submission = await onlineExamService.submitExam(submissionId, userId);
    
    if (!submission) {
      return notFoundResponse(res, 'Submission not found');
    }
    
    logger.info('Online exam submitted successfully:', { submissionId });
    return successResponse(res, submission, 'Exam submitted successfully');
  } catch (error) {
    logger.error('Error submitting online exam:', error);
    return errorResponse(res, error.message);
  }
};

const recordTabSwitch = async (req, res) => {
  try {
    logger.info('Recording tab switch');
    
    const { submissionId } = req.params;
    
    // Validation
    const errors = [];
    
    const submissionIdError = validateObjectId(submissionId, 'Submission ID');
    if (submissionIdError) errors.push(submissionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const proctoring = await onlineExamService.recordTabSwitch(submissionId);
    
    logger.info('Tab switch recorded:', { submissionId });
    return successResponse(res, proctoring, 'Tab switch recorded');
  } catch (error) {
    logger.error('Error recording tab switch:', error);
    return errorResponse(res, error.message);
  }
};

// Grading
const manualGradeQuestion = async (req, res) => {
  try {
    logger.info('Manually grading question');
    
    const { submissionId } = req.params;
    const { questionId, score, feedback } = req.body;
    const userId = req.user?._id;
    
    // Validation
    const errors = [];
    
    const submissionIdError = validateObjectId(submissionId, 'Submission ID');
    if (submissionIdError) errors.push(submissionIdError);
    
    const questionIdError = validateObjectId(questionId, 'Question ID');
    if (questionIdError) errors.push(questionIdError);
    
    if (score === undefined || score === null) {
      errors.push('Score is required');
    } else if (typeof score !== 'number' || score < 0) {
      errors.push('Score must be a positive number');
    }
    
    if (feedback && typeof feedback !== 'string') {
      errors.push('Feedback must be a string');
    } else if (feedback && feedback.length > 1000) {
      errors.push('Feedback must not exceed 1000 characters');
    }
    
    if (!userId) {
      errors.push('User authentication is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const submission = await onlineExamService.manualGradeQuestion(
      submissionId,
      questionId,
      score,
      feedback,
      userId
    );
    
    if (!submission) {
      return notFoundResponse(res, 'Submission not found');
    }
    
    logger.info('Question graded successfully:', { submissionId, questionId, score });
    return successResponse(res, submission, 'Question graded successfully');
  } catch (error) {
    logger.error('Error grading question:', error);
    return errorResponse(res, error.message);
  }
};

const getSubmissions = async (req, res) => {
  try {
    logger.info('Fetching exam submissions');
    
    const { examId } = req.params;
    const { page, limit, status } = req.query;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const examIdError = validateObjectId(examId, 'Exam ID');
    if (examIdError) errors.push(examIdError);
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (status && !VALID_SUBMISSION_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_SUBMISSION_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const { ExamSubmission } = await import('../models/OnlineExam.js');
    
    const filter = {
      exam: examId,
      schoolId: tenant
    };
    
    if (status) {
      filter.status = status;
    }
    
    const skip = (pageNum - 1) * limitNum;
    
    const [submissions, total] = await Promise.all([
      ExamSubmission.find(filter)
        .populate('student', 'name email')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ExamSubmission.countDocuments(filter)
    ]);
    
    logger.info('Exam submissions fetched successfully');
    return successResponse(res, {
      submissions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    }, 'Submissions fetched successfully');
  } catch (error) {
    logger.error('Error fetching exam submissions:', error);
    return errorResponse(res, error.message);
  }
};

const getSubmissionById = async (req, res) => {
  try {
    logger.info('Fetching submission by ID');
    
    const { submissionId } = req.params;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const submissionIdError = validateObjectId(submissionId, 'Submission ID');
    if (submissionIdError) errors.push(submissionIdError);
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const { ExamSubmission } = await import('../models/OnlineExam.js');
    const submission = await ExamSubmission.findOne({
      _id: submissionId,
      schoolId: tenant,
    })
      .populate('student', 'name email')
      .populate('exam');
    
    if (!submission) {
      return notFoundResponse(res, 'Submission not found');
    }
    
    logger.info('Submission fetched successfully:', { submissionId });
    return successResponse(res, submission, 'Submission fetched successfully');
  } catch (error) {
    logger.error('Error fetching submission:', error);
    return errorResponse(res, error.message);
  }
};

// Plagiarism Detection
const checkPlagiarism = async (req, res) => {
  try {
    logger.info('Checking plagiarism');
    
    const { submissionId } = req.params;
    
    // Validation
    const errors = [];
    
    const submissionIdError = validateObjectId(submissionId, 'Submission ID');
    if (submissionIdError) errors.push(submissionIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await onlineExamService.checkPlagiarism(submissionId);
    
    logger.info('Plagiarism check completed:', { submissionId });
    return successResponse(res, result, 'Plagiarism check completed');
  } catch (error) {
    logger.error('Error checking plagiarism:', error);
    return errorResponse(res, error.message);
  }
};

const bulkCheckPlagiarism = async (req, res) => {
  try {
    logger.info('Bulk checking plagiarism');
    
    const { examId } = req.params;
    
    // Validation
    const errors = [];
    
    const examIdError = validateObjectId(examId, 'Exam ID');
    if (examIdError) errors.push(examIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const { ExamSubmission } = await import('../models/OnlineExam.js');
    const submissions = await ExamSubmission.find({
      exam: examId,
      status: { $in: ['submitted', 'graded'] },
    });
    
    const results = [];
    for (const submission of submissions) {
      try {
        const result = await onlineExamService.checkPlagiarism(submission._id);
        results.push({
          submissionId: submission._id,
          studentId: submission.student,
          plagiarismScore: result.score,
          matches: result.matches.length,
        });
      } catch (error) {
        results.push({
          submissionId: submission._id,
          error: error.message,
        });
      }
    }
    
    logger.info('Bulk plagiarism check completed:', { examId, count: results.length });
    return successResponse(res, results, 'Bulk plagiarism check completed');
  } catch (error) {
    logger.error('Error bulk checking plagiarism:', error);
    return errorResponse(res, error.message);
  }
};

// Statistics
const getExamStatistics = async (req, res) => {
  try {
    logger.info('Fetching exam statistics');
    
    const { id } = req.params;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Exam ID');
    if (idError) errors.push(idError);
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const statistics = await onlineExamService.getExamStatistics(id, tenant);
    
    logger.info('Exam statistics fetched successfully:', { examId: id });
    return successResponse(res, statistics, 'Statistics fetched successfully');
  } catch (error) {
    logger.error('Error fetching exam statistics:', error);
    return errorResponse(res, error.message);
  }
};

const getStudentResults = async (req, res) => {
  try {
    logger.info('Fetching student results');
    
    const { page, limit } = req.query;
    const userId = req.user?._id;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!userId) {
      errors.push('User authentication is required');
    }
    
    if (!tenant) {
      errors.push('Tenant information is required');
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
    
    const { ExamSubmission } = await import('../models/OnlineExam.js');
    
    const skip = (pageNum - 1) * limitNum;
    
    const [submissions, total] = await Promise.all([
      ExamSubmission.find({
        student: userId,
        schoolId: tenant,
        status: 'graded',
      })
        .populate('exam', 'title subject totalMarks')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ExamSubmission.countDocuments({
        student: userId,
        schoolId: tenant,
        status: 'graded',
      })
    ]);
    
    logger.info('Student results fetched successfully');
    return successResponse(res, {
      submissions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    }, 'Results fetched successfully');
  } catch (error) {
    logger.error('Error fetching student results:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk operations
const bulkDeleteExams = async (req, res) => {
  try {
    logger.info('Bulk deleting exams');
    
    const { examIds } = req.body;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (!examIds || !Array.isArray(examIds)) {
      errors.push('Exam IDs must be an array');
    } else if (examIds.length === 0) {
      errors.push('Exam IDs array cannot be empty');
    } else if (examIds.length > 100) {
      errors.push('Cannot delete more than 100 exams at once');
    } else {
      for (const id of examIds) {
        const idError = validateObjectId(id, 'Exam ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await onlineExamService.bulkDeleteExams(examIds, tenant);
    
    logger.info('Exams bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Exams deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting exams:', error);
    return errorResponse(res, error.message);
  }
};

// Export exam data
const exportExamData = async (req, res) => {
  try {
    logger.info('Exporting exam data');
    
    const { examId } = req.params;
    const { format, includeSubmissions } = req.query;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const examIdError = validateObjectId(examId, 'Exam ID');
    if (examIdError) errors.push(examIdError);
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await onlineExamService.exportExamData({
      examId,
      tenant,
      format: format.toLowerCase(),
      includeSubmissions: includeSubmissions === 'true'
    });
    
    logger.info('Exam data exported successfully:', { examId, format });
    return successResponse(res, exportData, 'Data exported successfully');
  } catch (error) {
    logger.error('Error exporting exam data:', error);
    return errorResponse(res, error.message);
  }
};

// Get exam analytics
const getExamAnalytics = async (req, res) => {
  try {
    logger.info('Fetching exam analytics');
    
    const { startDate, endDate, subject, groupBy } = req.query;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    const validGroupBy = ['day', 'week', 'month', 'year', 'subject'];
    if (groupBy && !validGroupBy.includes(groupBy)) {
      errors.push('Invalid groupBy. Must be one of: ' + validGroupBy.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const analytics = await onlineExamService.getExamAnalytics({
      tenant,
      startDate,
      endDate,
      subject,
      groupBy
    });
    
    logger.info('Exam analytics fetched successfully');
    return successResponse(res, analytics, 'Analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching exam analytics:', error);
    return errorResponse(res, error.message);
  }
};

// Duplicate exam
const duplicateExam = async (req, res) => {
  try {
    logger.info('Duplicating exam');
    
    const { id } = req.params;
    const { newTitle } = req.body;
    const userId = req.user?._id;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Exam ID');
    if (idError) errors.push(idError);
    
    if (!userId) {
      errors.push('User authentication is required');
    }
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (newTitle && newTitle.length > MAX_TITLE_LENGTH) {
      errors.push('Title must not exceed ' + MAX_TITLE_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exam = await onlineExamService.duplicateExam(id, tenant, newTitle, userId);
    
    if (!exam) {
      return notFoundResponse(res, 'Source exam not found');
    }
    
    logger.info('Exam duplicated successfully:', { sourceId: id, duplicateId: exam._id });
    return createdResponse(res, exam, 'Exam duplicated successfully');
  } catch (error) {
    logger.error('Error duplicating exam:', error);
    return errorResponse(res, error.message);
  }
};

// Archive exam
const archiveExam = async (req, res) => {
  try {
    logger.info('Archiving exam');
    
    const { id } = req.params;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Exam ID');
    if (idError) errors.push(idError);
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exam = await onlineExamService.archiveExam(id, tenant);
    
    if (!exam) {
      return notFoundResponse(res, 'Exam not found');
    }
    
    logger.info('Exam archived successfully:', { examId: id });
    return successResponse(res, exam, 'Exam archived successfully');
  } catch (error) {
    logger.error('Error archiving exam:', error);
    return errorResponse(res, error.message);
  }
};

// Get proctoring logs
const getProctoringLogs = async (req, res) => {
  try {
    logger.info('Fetching proctoring logs');
    
    const { submissionId } = req.params;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    const submissionIdError = validateObjectId(submissionId, 'Submission ID');
    if (submissionIdError) errors.push(submissionIdError);
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const logs = await onlineExamService.getProctoringLogs(submissionId, tenant);
    
    logger.info('Proctoring logs fetched successfully:', { submissionId });
    return successResponse(res, logs, 'Proctoring logs retrieved successfully');
  } catch (error) {
    logger.error('Error fetching proctoring logs:', error);
    return errorResponse(res, error.message);
  }
};

// Get question bank
const getQuestionBank = async (req, res) => {
  try {
    logger.info('Fetching question bank');
    
    const { subject, type, difficulty, page, limit } = req.query;
    const tenant = req.user?.tenant;
    
    // Validation
    const errors = [];
    
    if (!tenant) {
      errors.push('Tenant information is required');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (type && !VALID_QUESTION_TYPES.includes(type)) {
      errors.push('Invalid question type. Must be one of: ' + VALID_QUESTION_TYPES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await onlineExamService.getQuestionBank({
      tenant,
      subject,
      type,
      difficulty,
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Question bank fetched successfully');
    return successResponse(res, result, 'Question bank retrieved successfully');
  } catch (error) {
    logger.error('Error fetching question bank:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  publishExam,
  startExam,
  saveAnswer,
  submitExam,
  recordTabSwitch,
  manualGradeQuestion,
  getSubmissions,
  getSubmissionById,
  checkPlagiarism,
  bulkCheckPlagiarism,
  getExamStatistics,
  getStudentResults,
  bulkDeleteExams,
  exportExamData,
  getExamAnalytics,
  duplicateExam,
  archiveExam,
  getProctoringLogs,
  getQuestionBank
};
