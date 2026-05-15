import questionBankService from '../services/questionBankService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_QUESTION_TYPES = ['multiple-choice', 'true-false', 'short-answer', 'long-answer', 'fill-in-blank', 'matching', 'essay'];
const VALID_DIFFICULTY_LEVELS = ['easy', 'medium', 'hard', 'expert'];
const VALID_STATUSES = ['active', 'inactive', 'archived', 'draft'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_QUESTION_LENGTH = 5000;
const MAX_ANSWER_LENGTH = 2000;
const MAX_EXPLANATION_LENGTH = 3000;
const MAX_SUBJECT_LENGTH = 100;
const MAX_TOPIC_LENGTH = 100;

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

// Create question
const createQuestion = async (req, res) => {
  try {
    logger.info('Creating question');
    
    const { questionText, questionType, subject, topic, difficultyLevel, marks, options, correctAnswer, explanation } = req.body;
    const institutionId = req.user?.institution;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (!questionText || questionText.trim().length === 0) {
      errors.push('Question text is required');
    } else if (questionText.length > MAX_QUESTION_LENGTH) {
      errors.push('Question text must not exceed ' + MAX_QUESTION_LENGTH + ' characters');
    }
    
    if (!questionType) {
      errors.push('Question type is required');
    } else if (!VALID_QUESTION_TYPES.includes(questionType)) {
      errors.push('Invalid question type. Must be one of: ' + VALID_QUESTION_TYPES.join(', '));
    }
    
    if (!subject || subject.trim().length === 0) {
      errors.push('Subject is required');
    } else if (subject.length > MAX_SUBJECT_LENGTH) {
      errors.push('Subject must not exceed ' + MAX_SUBJECT_LENGTH + ' characters');
    }
    
    if (topic && topic.length > MAX_TOPIC_LENGTH) {
      errors.push('Topic must not exceed ' + MAX_TOPIC_LENGTH + ' characters');
    }
    
    if (difficultyLevel && !VALID_DIFFICULTY_LEVELS.includes(difficultyLevel)) {
      errors.push('Invalid difficulty level. Must be one of: ' + VALID_DIFFICULTY_LEVELS.join(', '));
    }
    
    if (marks !== undefined) {
      if (typeof marks !== 'number' || marks < 0 || marks > 100) {
        errors.push('Marks must be between 0 and 100');
      }
    }
    
    if (questionType === 'multiple-choice') {
      if (!options || !Array.isArray(options) || options.length < 2) {
        errors.push('Multiple choice questions must have at least 2 options');
      } else if (options.length > 10) {
        errors.push('Multiple choice questions cannot have more than 10 options');
      }
    }
    
    if (correctAnswer && typeof correctAnswer === 'string' && correctAnswer.length > MAX_ANSWER_LENGTH) {
      errors.push('Correct answer must not exceed ' + MAX_ANSWER_LENGTH + ' characters');
    }
    
    if (explanation && explanation.length > MAX_EXPLANATION_LENGTH) {
      errors.push('Explanation must not exceed ' + MAX_EXPLANATION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const question = await questionBankService.createQuestion(
      { ...req.body, createdBy: userId },
      institutionId
    );
    
    logger.info('Question created successfully:', { questionId: question._id });
    return createdResponse(res, question, 'Question created successfully');
  } catch (error) {
    logger.error('Error creating question:', error);
    return errorResponse(res, error.message);
  }
};

// Get questions
const getQuestions = async (req, res) => {
  try {
    logger.info('Fetching questions');
    
    const { page, limit, subject, topic, questionType, difficultyLevel, status, search } = req.query;
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
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
    
    if (questionType && !VALID_QUESTION_TYPES.includes(questionType)) {
      errors.push('Invalid question type. Must be one of: ' + VALID_QUESTION_TYPES.join(', '));
    }
    
    if (difficultyLevel && !VALID_DIFFICULTY_LEVELS.includes(difficultyLevel)) {
      errors.push('Invalid difficulty level. Must be one of: ' + VALID_DIFFICULTY_LEVELS.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await questionBankService.getQuestions(institutionId, {
      page: pageNum,
      limit: limitNum,
      subject,
      topic,
      questionType,
      difficultyLevel,
      status,
      search
    });
    
    logger.info('Questions fetched successfully');
    return successResponse(res, {
      questions: result.questions,
      pagination: result.pagination
    }, 'Questions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching questions:', error);
    return errorResponse(res, error.message);
  }
};

// Get question by ID
const getQuestionById = async (req, res) => {
  try {
    logger.info('Fetching question by ID');
    
    const { questionId } = req.params;
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(questionId, 'Question ID');
    if (idError) errors.push(idError);
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const question = await questionBankService.getQuestionById(questionId, institutionId);
    
    if (!question) {
      return notFoundResponse(res, 'Question not found');
    }
    
    logger.info('Question fetched successfully:', { questionId });
    return successResponse(res, question, 'Question retrieved successfully');
  } catch (error) {
    logger.error('Error fetching question:', error);
    if (error.message.includes('not found')) {
      return notFoundResponse(res, error.message);
    }
    return errorResponse(res, error.message);
  }
};

// Update question
const updateQuestion = async (req, res) => {
  try {
    logger.info('Updating question');
    
    const { questionId } = req.params;
    const { questionText, questionType, subject, topic, difficultyLevel, marks, options, correctAnswer, explanation, status } = req.body;
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(questionId, 'Question ID');
    if (idError) errors.push(idError);
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (questionText !== undefined) {
      if (!questionText || questionText.trim().length === 0) {
        errors.push('Question text cannot be empty');
      } else if (questionText.length > MAX_QUESTION_LENGTH) {
        errors.push('Question text must not exceed ' + MAX_QUESTION_LENGTH + ' characters');
      }
    }
    
    if (questionType !== undefined && !VALID_QUESTION_TYPES.includes(questionType)) {
      errors.push('Invalid question type. Must be one of: ' + VALID_QUESTION_TYPES.join(', '));
    }
    
    if (subject !== undefined) {
      if (!subject || subject.trim().length === 0) {
        errors.push('Subject cannot be empty');
      } else if (subject.length > MAX_SUBJECT_LENGTH) {
        errors.push('Subject must not exceed ' + MAX_SUBJECT_LENGTH + ' characters');
      }
    }
    
    if (topic !== undefined && topic.length > MAX_TOPIC_LENGTH) {
      errors.push('Topic must not exceed ' + MAX_TOPIC_LENGTH + ' characters');
    }
    
    if (difficultyLevel !== undefined && !VALID_DIFFICULTY_LEVELS.includes(difficultyLevel)) {
      errors.push('Invalid difficulty level. Must be one of: ' + VALID_DIFFICULTY_LEVELS.join(', '));
    }
    
    if (marks !== undefined) {
      if (typeof marks !== 'number' || marks < 0 || marks > 100) {
        errors.push('Marks must be between 0 and 100');
      }
    }
    
    if (options !== undefined && questionType === 'multiple-choice') {
      if (!Array.isArray(options) || options.length < 2) {
        errors.push('Multiple choice questions must have at least 2 options');
      } else if (options.length > 10) {
        errors.push('Multiple choice questions cannot have more than 10 options');
      }
    }
    
    if (correctAnswer !== undefined && typeof correctAnswer === 'string' && correctAnswer.length > MAX_ANSWER_LENGTH) {
      errors.push('Correct answer must not exceed ' + MAX_ANSWER_LENGTH + ' characters');
    }
    
    if (explanation !== undefined && explanation.length > MAX_EXPLANATION_LENGTH) {
      errors.push('Explanation must not exceed ' + MAX_EXPLANATION_LENGTH + ' characters');
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const question = await questionBankService.updateQuestion(questionId, institutionId, req.body);
    
    if (!question) {
      return notFoundResponse(res, 'Question not found');
    }
    
    logger.info('Question updated successfully:', { questionId });
    return successResponse(res, question, 'Question updated successfully');
  } catch (error) {
    logger.error('Error updating question:', error);
    return errorResponse(res, error.message);
  }
};

// Delete question
const deleteQuestion = async (req, res) => {
  try {
    logger.info('Deleting question');
    
    const { questionId } = req.params;
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(questionId, 'Question ID');
    if (idError) errors.push(idError);
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await questionBankService.deleteQuestion(questionId, institutionId);
    
    logger.info('Question deleted successfully:', { questionId });
    return successResponse(res, null, 'Question deleted successfully');
  } catch (error) {
    logger.error('Error deleting question:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk create questions
const bulkCreateQuestions = async (req, res) => {
  try {
    logger.info('Bulk creating questions');
    
    const { questions } = req.body;
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (!questions || !Array.isArray(questions)) {
      errors.push('Questions must be an array');
    } else if (questions.length === 0) {
      errors.push('Questions array cannot be empty');
    } else if (questions.length > 500) {
      errors.push('Cannot create more than 500 questions at once');
    } else {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.questionText || q.questionText.trim().length === 0) {
          errors.push('Question ' + (i + 1) + ': Question text is required');
          break;
        }
        if (!q.questionType || !VALID_QUESTION_TYPES.includes(q.questionType)) {
          errors.push('Question ' + (i + 1) + ': Invalid or missing question type');
          break;
        }
        if (!q.subject || q.subject.trim().length === 0) {
          errors.push('Question ' + (i + 1) + ': Subject is required');
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await questionBankService.bulkCreateQuestions(questions, institutionId);
    
    logger.info('Questions bulk created successfully:', { count: result.length });
    return createdResponse(res, result, result.length + ' question(s) created successfully');
  } catch (error) {
    logger.error('Error bulk creating questions:', error);
    return errorResponse(res, error.message);
  }
};

// Get random questions
const getRandomQuestions = async (req, res) => {
  try {
    logger.info('Fetching random questions');
    
    const { count, subject, topic, questionType, difficultyLevel } = req.query;
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    const countNum = parseInt(count) || 10;
    
    if (countNum < 1 || countNum > 100) {
      errors.push('Count must be between 1 and 100');
    }
    
    if (questionType && !VALID_QUESTION_TYPES.includes(questionType)) {
      errors.push('Invalid question type. Must be one of: ' + VALID_QUESTION_TYPES.join(', '));
    }
    
    if (difficultyLevel && !VALID_DIFFICULTY_LEVELS.includes(difficultyLevel)) {
      errors.push('Invalid difficulty level. Must be one of: ' + VALID_DIFFICULTY_LEVELS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const questions = await questionBankService.getRandomQuestions(institutionId, {
      count: countNum,
      subject,
      topic,
      questionType,
      difficultyLevel
    });
    
    logger.info('Random questions fetched successfully:', { count: questions.length });
    return successResponse(res, questions, 'Random questions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching random questions:', error);
    return errorResponse(res, error.message);
  }
};

// Get questions for exam
const getQuestionsForExam = async (req, res) => {
  try {
    logger.info('Fetching questions for exam');
    
    const { subject, topics, questionTypes, difficultyDistribution, totalMarks } = req.body;
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (!subject || subject.trim().length === 0) {
      errors.push('Subject is required');
    }
    
    if (topics && !Array.isArray(topics)) {
      errors.push('Topics must be an array');
    }
    
    if (questionTypes && !Array.isArray(questionTypes)) {
      errors.push('Question types must be an array');
    } else if (questionTypes) {
      for (const type of questionTypes) {
        if (!VALID_QUESTION_TYPES.includes(type)) {
          errors.push('Invalid question type: ' + type);
          break;
        }
      }
    }
    
    if (totalMarks !== undefined) {
      if (typeof totalMarks !== 'number' || totalMarks < 1 || totalMarks > 1000) {
        errors.push('Total marks must be between 1 and 1000');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const questions = await questionBankService.getQuestionsForExam(institutionId, req.body);
    
    logger.info('Questions for exam fetched successfully:', { count: questions.length });
    return successResponse(res, questions, 'Questions for exam retrieved successfully');
  } catch (error) {
    logger.error('Error fetching questions for exam:', error);
    return errorResponse(res, error.message);
  }
};

// Get question statistics
const getStatistics = async (req, res) => {
  try {
    logger.info('Fetching question statistics');
    
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stats = await questionBankService.getQuestionStatistics(institutionId);
    
    logger.info('Question statistics fetched successfully');
    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching question statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Duplicate question
const duplicateQuestion = async (req, res) => {
  try {
    logger.info('Duplicating question');
    
    const { questionId } = req.params;
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(questionId, 'Question ID');
    if (idError) errors.push(idError);
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const question = await questionBankService.duplicateQuestion(questionId, institutionId);
    
    logger.info('Question duplicated successfully:', { originalId: questionId, newId: question._id });
    return createdResponse(res, question, 'Question duplicated successfully');
  } catch (error) {
    logger.error('Error duplicating question:', error);
    return errorResponse(res, error.message);
  }
};

// Archive question
const archiveQuestion = async (req, res) => {
  try {
    logger.info('Archiving question');
    
    const { questionId } = req.params;
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(questionId, 'Question ID');
    if (idError) errors.push(idError);
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const question = await questionBankService.archiveQuestion(questionId, institutionId);
    
    if (!question) {
      return notFoundResponse(res, 'Question not found');
    }
    
    logger.info('Question archived successfully:', { questionId });
    return successResponse(res, question, 'Question archived successfully');
  } catch (error) {
    logger.error('Error archiving question:', error);
    return errorResponse(res, error.message);
  }
};

// Get subjects
const getSubjects = async (req, res) => {
  try {
    logger.info('Fetching subjects');
    
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const subjects = await questionBankService.getSubjects(institutionId);
    
    logger.info('Subjects fetched successfully:', { count: subjects.length });
    return successResponse(res, subjects, 'Subjects retrieved successfully');
  } catch (error) {
    logger.error('Error fetching subjects:', error);
    return errorResponse(res, error.message);
  }
};

// Get topics by subject
const getTopicsBySubject = async (req, res) => {
  try {
    logger.info('Fetching topics by subject');
    
    const { subject } = req.params;
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (!subject || subject.trim().length === 0) {
      errors.push('Subject is required');
    } else if (subject.length > MAX_SUBJECT_LENGTH) {
      errors.push('Subject must not exceed ' + MAX_SUBJECT_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const topics = await questionBankService.getTopicsBySubject(institutionId, subject);
    
    logger.info('Topics fetched by subject successfully:', { subject, count: topics.length });
    return successResponse(res, topics, 'Topics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching topics by subject:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete questions
const bulkDeleteQuestions = async (req, res) => {
  try {
    logger.info('Bulk deleting questions');
    
    const { questionIds } = req.body;
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (!questionIds || !Array.isArray(questionIds)) {
      errors.push('Question IDs must be an array');
    } else if (questionIds.length === 0) {
      errors.push('Question IDs array cannot be empty');
    } else if (questionIds.length > 100) {
      errors.push('Cannot delete more than 100 questions at once');
    } else {
      for (const id of questionIds) {
        const idError = validateObjectId(id, 'Question ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await questionBankService.bulkDeleteQuestions(questionIds, institutionId);
    
    logger.info('Questions bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Questions deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting questions:', error);
    return errorResponse(res, error.message);
  }
};

// Export questions
const exportQuestions = async (req, res) => {
  try {
    logger.info('Exporting questions');
    
    const { format, subject, topic, questionType, difficultyLevel } = req.query;
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (questionType && !VALID_QUESTION_TYPES.includes(questionType)) {
      errors.push('Invalid question type. Must be one of: ' + VALID_QUESTION_TYPES.join(', '));
    }
    
    if (difficultyLevel && !VALID_DIFFICULTY_LEVELS.includes(difficultyLevel)) {
      errors.push('Invalid difficulty level. Must be one of: ' + VALID_DIFFICULTY_LEVELS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await questionBankService.exportQuestions(institutionId, {
      format: format.toLowerCase(),
      subject,
      topic,
      questionType,
      difficultyLevel
    });
    
    logger.info('Questions exported successfully:', { format });
    return successResponse(res, exportData, 'Questions exported successfully');
  } catch (error) {
    logger.error('Error exporting questions:', error);
    return errorResponse(res, error.message);
  }
};

// Import questions
const importQuestions = async (req, res) => {
  try {
    logger.info('Importing questions');
    
    const { questions, overwrite } = req.body;
    const institutionId = req.user?.institution;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (!questions || !Array.isArray(questions)) {
      errors.push('Questions must be an array');
    } else if (questions.length === 0) {
      errors.push('Questions array cannot be empty');
    } else if (questions.length > 500) {
      errors.push('Cannot import more than 500 questions at once');
    }
    
    if (overwrite !== undefined && typeof overwrite !== 'boolean') {
      errors.push('overwrite must be a boolean value');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await questionBankService.importQuestions(questions, institutionId, userId, overwrite);
    
    logger.info('Questions imported successfully:', { imported: result.importedCount, skipped: result.skippedCount });
    return successResponse(res, result, 'Questions imported successfully');
  } catch (error) {
    logger.error('Error importing questions:', error);
    return errorResponse(res, error.message);
  }
};

// Get questions by difficulty
const getQuestionsByDifficulty = async (req, res) => {
  try {
    logger.info('Fetching questions by difficulty');
    
    const { difficultyLevel } = req.params;
    const { page, limit, subject } = req.query;
    const institutionId = req.user?.institution;
    
    // Validation
    const errors = [];
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    }
    
    if (!difficultyLevel) {
      errors.push('Difficulty level is required');
    } else if (!VALID_DIFFICULTY_LEVELS.includes(difficultyLevel)) {
      errors.push('Invalid difficulty level. Must be one of: ' + VALID_DIFFICULTY_LEVELS.join(', '));
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
    
    const result = await questionBankService.getQuestionsByDifficulty(institutionId, difficultyLevel, {
      page: pageNum,
      limit: limitNum,
      subject
    });
    
    logger.info('Questions fetched by difficulty successfully:', { difficultyLevel });
    return successResponse(res, result, 'Questions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching questions by difficulty:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  bulkCreateQuestions,
  getRandomQuestions,
  getQuestionsForExam,
  getStatistics,
  duplicateQuestion,
  archiveQuestion,
  getSubjects,
  getTopicsBySubject,
  bulkDeleteQuestions,
  exportQuestions,
  importQuestions,
  getQuestionsByDifficulty
};
