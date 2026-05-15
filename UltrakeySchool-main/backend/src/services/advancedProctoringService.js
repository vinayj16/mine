import mongoose from 'mongoose';
import logger from '../utils/logger.js';

// Proctoring Session Schema
const proctoringSessionSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OnlineExam',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: Date,
  violations: [{
    type: {
      type: String,
      enum: ['tab_switch', 'face_not_detected', 'multiple_faces', 'looking_away', 'suspicious_object', 'audio_detected', 'screen_share_detected'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    description: String,
    screenshot: String,
    aiConfidence: Number,
  }],
  screenshots: [{
    timestamp: Date,
    url: String,
    aiAnalysis: {
      facesDetected: Number,
      attentionScore: Number,
      suspiciousObjects: [String],
      emotions: Object,
    },
  }],
  webcamStatus: {
    type: String,
    enum: ['active', 'inactive', 'blocked', 'not_available'],
    default: 'inactive',
  },
  screenRecording: {
    enabled: Boolean,
    url: String,
  },
  audioRecording: {
    enabled: Boolean,
    url: String,
  },
  browserInfo: {
    userAgent: String,
    platform: String,
    language: String,
  },
  ipAddress: String,
  location: {
    latitude: Number,
    longitude: Number,
    city: String,
    country: String,
  },
  riskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'flagged', 'terminated'],
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

const ProctoringSession = mongoose.model('ProctoringSession', proctoringSessionSchema);

class AdvancedProctoringService {
  /**
   * Start proctoring session
   * @param {Object} sessionData - Session data
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Proctoring session
   */
  async startProctoringSession(sessionData, tenantId) {
    try {
      const session = new ProctoringSession({
        ...sessionData,
        tenant: tenantId,
      });

      await session.save();
      // Skip populate if OnlineExam/User models don't exist
      try {
        await session.populate(['exam', 'student']);
      } catch (error) {
        logger.warn('OnlineExam/User models not found for populate, skipping');
      }

      logger.info(`Proctoring session started: ${session._id}`);
      return session;
    } catch (error) {
      logger.error(`Error starting proctoring session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Record violation
   * @param {string} sessionId - Session ID
   * @param {Object} violationData - Violation data
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Updated session
   */
  async recordViolation(sessionId, violationData, tenantId) {
    try {
      const session = await ProctoringSession.findOne({
        _id: sessionId,
        tenant: tenantId,
      });

      if (!session) {
        throw new Error('Proctoring session not found');
      }

      session.violations.push(violationData);

      // Update risk score based on violation severity
      const severityScores = {
        low: 5,
        medium: 15,
        high: 30,
        critical: 50,
      };

      session.riskScore = Math.min(
        100,
        session.riskScore + severityScores[violationData.severity || 'medium']
      );

      // Flag session if risk score is too high
      if (session.riskScore >= 70) {
        session.status = 'flagged';
      }

      await session.save();

      logger.info(`Violation recorded for session: ${sessionId}`);
      return session;
    } catch (error) {
      logger.error(`Error recording violation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze screenshot with AI
   * @param {string} sessionId - Session ID
   * @param {Object} screenshotData - Screenshot data
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Analysis result
   */
  async analyzeScreenshot(sessionId, screenshotData, tenantId) {
    try {
      const { imageUrl, timestamp } = screenshotData;

      // Simulate AI analysis (in production, integrate with actual AI service)
      const aiAnalysis = await this.performAIAnalysis(imageUrl);

      const session = await ProctoringSession.findOne({
        _id: sessionId,
        tenant: tenantId,
      });

      if (!session) {
        throw new Error('Proctoring session not found');
      }

      session.screenshots.push({
        timestamp: timestamp || new Date(),
        url: imageUrl,
        aiAnalysis,
      });

      // Check for violations based on AI analysis
      if (aiAnalysis.facesDetected === 0) {
        await this.recordViolation(sessionId, {
          type: 'face_not_detected',
          severity: 'high',
          description: 'No face detected in frame',
          screenshot: imageUrl,
          aiConfidence: aiAnalysis.confidence,
        }, tenantId);
      } else if (aiAnalysis.facesDetected > 1) {
        await this.recordViolation(sessionId, {
          type: 'multiple_faces',
          severity: 'critical',
          description: `${aiAnalysis.facesDetected} faces detected`,
          screenshot: imageUrl,
          aiConfidence: aiAnalysis.confidence,
        }, tenantId);
      }

      if (aiAnalysis.attentionScore < 50) {
        await this.recordViolation(sessionId, {
          type: 'looking_away',
          severity: 'medium',
          description: 'Student appears to be looking away',
          screenshot: imageUrl,
          aiConfidence: aiAnalysis.confidence,
        }, tenantId);
      }

      if (aiAnalysis.suspiciousObjects.length > 0) {
        await this.recordViolation(sessionId, {
          type: 'suspicious_object',
          severity: 'high',
          description: `Suspicious objects detected: ${aiAnalysis.suspiciousObjects.join(', ')}`,
          screenshot: imageUrl,
          aiConfidence: aiAnalysis.confidence,
        }, tenantId);
      }

      await session.save();

      logger.info(`Screenshot analyzed for session: ${sessionId}`);
      return aiAnalysis;
    } catch (error) {
      logger.error(`Error analyzing screenshot: ${error.message}`);
      throw error;
    }
  }

  /**
   * Perform AI analysis (mock implementation)
   * @param {string} imageUrl - Image URL
   * @returns {Object} Analysis result
   */
  async performAIAnalysis(imageUrl) {
    // In production, integrate with actual AI service (AWS Rekognition, Azure Face API, etc.)
    // This is a mock implementation
    return {
      facesDetected: Math.random() > 0.1 ? 1 : Math.floor(Math.random() * 3),
      attentionScore: Math.floor(Math.random() * 100),
      suspiciousObjects: Math.random() > 0.8 ? ['phone', 'book'] : [],
      emotions: {
        neutral: 0.7,
        focused: 0.2,
        confused: 0.1,
      },
      confidence: 0.85 + Math.random() * 0.15,
    };
  }

  /**
   * End proctoring session
   * @param {string} sessionId - Session ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Updated session
   */
  async endProctoringSession(sessionId, tenantId) {
    try {
      const session = await ProctoringSession.findOneAndUpdate(
        { _id: sessionId, tenant: tenantId },
        {
          endTime: new Date(),
          status: 'completed',
        },
        { new: true }
      );

      if (!session) {
        throw new Error('Proctoring session not found');
      }

      // Skip populate if OnlineExam/User models don't exist
      try {
        await session.populate(['exam', 'student']);
      } catch (error) {
        logger.warn('OnlineExam/User models not found for populate, skipping');
      }

      logger.info(`Proctoring session ended: ${sessionId}`);
      return session;
    } catch (error) {
      logger.error(`Error ending proctoring session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get proctoring sessions
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filters
   * @returns {Object} Sessions with pagination
   */
  async getProctoringSessions(tenantId, filters = {}) {
    try {
      const { page = 1, limit = 10, status, examId, studentId } = filters;
      const query = { tenant: tenantId };

      if (status) query.status = status;
      if (examId) query.exam = examId;
      if (studentId) query.student = studentId;

      let sessions = await ProctoringSession.find(query)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      // Try to populate if models exist
      try {
        sessions = await ProctoringSession.populate(sessions, ['exam', 'student']);
      } catch (error) {
        logger.warn('OnlineExam/User models not found for populate, skipping');
      }

      const total = await ProctoringSession.countDocuments(query);

      return {
        sessions,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error fetching proctoring sessions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Session
   */
  async getSessionById(sessionId, tenantId) {
    try {
      const session = await ProctoringSession.findOne({
        _id: sessionId,
        tenant: tenantId,
      });

      if (!session) {
        throw new Error('Proctoring session not found');
      }

      // Try to populate if models exist
      try {
        await session.populate(['exam', 'student']);
      } catch (error) {
        logger.warn('OnlineExam/User models not found for populate, skipping');
      }

      return session;
    } catch (error) {
      logger.error(`Error fetching proctoring session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get proctoring statistics
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filters
   * @returns {Object} Statistics
   */
  async getProctoringStatistics(tenantId, filters = {}) {
    try {
      const { examId } = filters;
      const query = { tenant: tenantId };

      if (examId) query.exam = examId;

      const sessions = await ProctoringSession.find(query);

      const stats = {
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.status === 'active').length,
        completedSessions: sessions.filter(s => s.status === 'completed').length,
        flaggedSessions: sessions.filter(s => s.status === 'flagged').length,
        totalViolations: sessions.reduce((sum, s) => sum + s.violations.length, 0),
        averageRiskScore: sessions.length > 0
          ? (sessions.reduce((sum, s) => sum + s.riskScore, 0) / sessions.length).toFixed(2)
          : 0,
        violationsByType: {},
      };

      // Count violations by type
      sessions.forEach(session => {
        session.violations.forEach(violation => {
          stats.violationsByType[violation.type] = (stats.violationsByType[violation.type] || 0) + 1;
        });
      });

      return stats;
    } catch (error) {
      logger.error(`Error fetching proctoring statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update webcam status
   * @param {string} sessionId - Session ID
   * @param {string} status - Webcam status
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Updated session
   */
  async updateWebcamStatus(sessionId, status, tenantId) {
    try {
      const session = await ProctoringSession.findOneAndUpdate(
        { _id: sessionId, tenant: tenantId },
        { webcamStatus: status },
        { new: true }
      );

      if (!session) {
        throw new Error('Proctoring session not found');
      }

      // Record violation if webcam is blocked or inactive
      if (status === 'blocked' || status === 'inactive') {
        await this.recordViolation(sessionId, {
          type: 'face_not_detected',
          severity: 'high',
          description: `Webcam status: ${status}`,
        }, tenantId);
      }

      return session;
    } catch (error) {
      logger.error(`Error updating webcam status: ${error.message}`);
      throw error;
    }
  }
}

export default new AdvancedProctoringService();
