import mongoose from 'mongoose';
import logger from '../utils/logger.js';

// Question Bank Schema
const questionBankSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  subtopic: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium',
  },
  questionType: {
    type: String,
    enum: ['mcq', 'true_false', 'short_answer', 'essay', 'fill_blank', 'matching'],
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  options: [{
    text: String,
    isCorrect: Boolean,
  }],
  correctAnswer: String,
  explanation: String,
  marks: {
    type: Number,
    default: 1,
  },
  timeLimit: Number, // in seconds
  tags: [String],
  bloomsTaxonomy: {
    type: String,
    enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
  },
  attachments: [{
    type: String,
    url: String,
  }],
  usageCount: {
    type: Number,
    default: 0,
  },
  averageScore: Number,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active',
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
questionBankSchema.index({ subject: 1, topic: 1, difficulty: 1 });
questionBankSchema.index({ tags: 1 });
questionBankSchema.index({ tenant: 1, status: 1 });

const QuestionBank = mongoose.model('QuestionBank', questionBankSchema);

class QuestionBankService {
  /**
   * Create question
   * @param {Object} questionData - Question data
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Question
   */
  async createQuestion(questionData, tenantId) {
    try {
      const question = new QuestionBank({
        ...questionData,
        tenant: tenantId,
      });

      await question.save();
      await question.populate('createdBy');

      logger.info(`Question created: ${question._id}`);
      return question;
    } catch (error) {
      logger.error(`Error creating question: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get questions
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filters
   * @returns {Object} Questions with pagination
   */
  async getQuestions(tenantId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        subject,
        topic,
        difficulty,
        questionType,
        tags,
        status,
        search,
      } = filters;

      const query = { tenant: tenantId };

      if (subject) query.subject = subject;
      if (topic) query.topic = topic;
      if (difficulty) query.difficulty = difficulty;
      if (questionType) query.questionType = questionType;
      if (status) query.status = status;
      if (tags) query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
      if (search) {
        query.$or = [
          { question: { $regex: search, $options: 'i' } },
          { topic: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
        ];
      }

      const questions = await QuestionBank.find(query)
        .populate('createdBy')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      const total = await QuestionBank.countDocuments(query);

      return {
        questions,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error fetching questions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get question by ID
   * @param {string} questionId - Question ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Question
   */
  async getQuestionById(questionId, tenantId) {
    try {
      const question = await QuestionBank.findOne({
        _id: questionId,
        tenant: tenantId,
      }).populate('createdBy');

      if (!question) {
        throw new Error('Question not found');
      }

      return question;
    } catch (error) {
      logger.error(`Error fetching question: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update question
   * @param {string} questionId - Question ID
   * @param {string} tenantId - Tenant ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated question
   */
  async updateQuestion(questionId, tenantId, updateData) {
    try {
      const question = await QuestionBank.findOneAndUpdate(
        { _id: questionId, tenant: tenantId },
        updateData,
        { new: true, runValidators: true }
      ).populate('createdBy');

      if (!question) {
        throw new Error('Question not found');
      }

      logger.info(`Question updated: ${questionId}`);
      return question;
    } catch (error) {
      logger.error(`Error updating question: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete question
   * @param {string} questionId - Question ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Deleted question
   */
  async deleteQuestion(questionId, tenantId) {
    try {
      const question = await QuestionBank.findOneAndDelete({
        _id: questionId,
        tenant: tenantId,
      });

      if (!question) {
        throw new Error('Question not found');
      }

      logger.info(`Question deleted: ${questionId}`);
      return question;
    } catch (error) {
      logger.error(`Error deleting question: ${error.message}`);
      throw error;
    }
  }

  /**
   * Bulk create questions
   * @param {Array} questionsData - Array of question data
   * @param {string} tenantId - Tenant ID
   * @returns {Array} Created questions
   */
  async bulkCreateQuestions(questionsData, tenantId) {
    try {
      const questions = questionsData.map(q => ({
        ...q,
        tenant: tenantId,
      }));

      const result = await QuestionBank.insertMany(questions);

      logger.info(`Bulk created ${result.length} questions`);
      return result;
    } catch (error) {
      logger.error(`Error bulk creating questions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get random questions
   * @param {string} tenantId - Tenant ID
   * @param {Object} criteria - Selection criteria
   * @returns {Array} Random questions
   */
  async getRandomQuestions(tenantId, criteria) {
    try {
      const { count = 10, subject, topic, difficulty, questionType } = criteria;

      const query = { tenant: tenantId, status: 'active' };

      if (subject) query.subject = subject;
      if (topic) query.topic = topic;
      if (difficulty) query.difficulty = difficulty;
      if (questionType) query.questionType = questionType;

      const questions = await QuestionBank.aggregate([
        { $match: query },
        { $sample: { size: parseInt(count) } },
      ]);

      return questions;
    } catch (error) {
      logger.error(`Error fetching random questions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get questions by criteria for exam
   * @param {string} tenantId - Tenant ID
   * @param {Object} criteria - Selection criteria
   * @returns {Array} Questions
   */
  async getQuestionsForExam(tenantId, criteria) {
    try {
      const {
        subject,
        topics = [],
        difficultyDistribution = {},
        totalQuestions = 10,
      } = criteria;

      const questions = [];
      const query = { tenant: tenantId, status: 'active', subject };

      // Get questions based on difficulty distribution
      for (const [difficulty, count] of Object.entries(difficultyDistribution)) {
        const difficultyQuery = { ...query, difficulty };

        if (topics.length > 0) {
          difficultyQuery.topic = { $in: topics };
        }

        const difficultyQuestions = await QuestionBank.aggregate([
          { $match: difficultyQuery },
          { $sample: { size: parseInt(count) } },
        ]);

        questions.push(...difficultyQuestions);
      }

      // If we don't have enough questions, get more randomly
      if (questions.length < totalQuestions) {
        const remaining = totalQuestions - questions.length;
        const usedIds = questions.map(q => q._id);

        const additionalQuery = { ...query, _id: { $nin: usedIds } };
        if (topics.length > 0) {
          additionalQuery.topic = { $in: topics };
        }

        const additionalQuestions = await QuestionBank.aggregate([
          { $match: additionalQuery },
          { $sample: { size: remaining } },
        ]);

        questions.push(...additionalQuestions);
      }

      return questions.slice(0, totalQuestions);
    } catch (error) {
      logger.error(`Error fetching questions for exam: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get question statistics
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Statistics
   */
  async getQuestionStatistics(tenantId) {
    try {
      const questions = await QuestionBank.find({ tenant: tenantId });

      const stats = {
        total: questions.length,
        bySubject: {},
        byDifficulty: {},
        byType: {},
        byStatus: {},
        totalUsage: questions.reduce((sum, q) => sum + q.usageCount, 0),
      };

      questions.forEach(q => {
        // By subject
        stats.bySubject[q.subject] = (stats.bySubject[q.subject] || 0) + 1;

        // By difficulty
        stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1;

        // By type
        stats.byType[q.questionType] = (stats.byType[q.questionType] || 0) + 1;

        // By status
        stats.byStatus[q.status] = (stats.byStatus[q.status] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error(`Error fetching question statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Duplicate question
   * @param {string} questionId - Question ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Duplicated question
   */
  async duplicateQuestion(questionId, tenantId) {
    try {
      const original = await QuestionBank.findOne({
        _id: questionId,
        tenant: tenantId,
      });

      if (!original) {
        throw new Error('Question not found');
      }

      const duplicate = new QuestionBank({
        ...original.toObject(),
        _id: undefined,
        question: `${original.question} (Copy)`,
        usageCount: 0,
        createdAt: undefined,
        updatedAt: undefined,
      });

      await duplicate.save();

      logger.info(`Question duplicated: ${questionId} -> ${duplicate._id}`);
      return duplicate;
    } catch (error) {
      logger.error(`Error duplicating question: ${error.message}`);
      throw error;
    }
  }

  /**
   * Archive question
   * @param {string} questionId - Question ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Archived question
   */
  async archiveQuestion(questionId, tenantId) {
    try {
      const question = await QuestionBank.findOneAndUpdate(
        { _id: questionId, tenant: tenantId },
        { status: 'archived' },
        { new: true }
      );

      if (!question) {
        throw new Error('Question not found');
      }

      logger.info(`Question archived: ${questionId}`);
      return question;
    } catch (error) {
      logger.error(`Error archiving question: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all subjects
   * @param {string} tenantId - Tenant ID
   * @returns {Array} Subjects
   */
  async getSubjects(tenantId) {
    try {
      const subjects = await QuestionBank.distinct('subject', { tenant: tenantId });
      return subjects;
    } catch (error) {
      logger.error(`Error fetching subjects: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get topics by subject
   * @param {string} tenantId - Tenant ID
   * @param {string} subject - Subject
   * @returns {Array} Topics
   */
  async getTopicsBySubject(tenantId, subject) {
    try {
      const topics = await QuestionBank.distinct('topic', {
        tenant: tenantId,
        subject,
      });
      return topics;
    } catch (error) {
      logger.error(`Error fetching topics: ${error.message}`);
      throw error;
    }
  }
}

export default new QuestionBankService();
