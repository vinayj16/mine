import { OnlineExam, ExamSubmission } from '../models/OnlineExam.js';
import logger from '../utils/logger.js';
import plagiarismService from './plagiarismService.js';

class OnlineExamService {
  // Exam Management
  async createExam(examData, teacherId, schoolId) {
    try {
      const totalMarks = examData.questions.reduce((sum, q) => sum + q.points, 0);
      
      const exam = new OnlineExam({
        ...examData,
        teacher: teacherId,
        schoolId,
        tenant: schoolId,
        totalMarks,
      });

      await exam.save();
      logger.info('Online exam created', { examId: exam._id });
      return exam;
    } catch (error) {
      logger.error('Failed to create exam', { error: error.message });
      throw error;
    }
  }

  async getExams(schoolId, filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20, classId, subjectId, status, teacherId } = { ...filters, ...pagination };
      const skip = (page - 1) * limit;

      const query = { schoolId };

      if (classId) query.class = classId;
      if (subjectId) query.subject = subjectId;
      if (status) query.status = status;
      if (teacherId) query.teacher = teacherId;

      const [exams, total] = await Promise.all([
        OnlineExam.find(query)
          .populate('subject', 'name')
          .populate('class', 'name grade')
          .populate('section', 'name')
          .populate('teacher', 'name email')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        OnlineExam.countDocuments(query),
      ]);

      return {
        exams,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to fetch exams', { error: error.message });
      throw error;
    }
  }

  async getExamById(examId, schoolId) {
    try {
      const exam = await OnlineExam.findOne({ _id: examId, schoolId })
        .populate('subject', 'name')
        .populate('class', 'name grade')
        .populate('section', 'name')
        .populate('teacher', 'name email');

      if (!exam) {
        throw new Error('Exam not found');
      }

      return exam;
    } catch (error) {
      logger.error('Failed to fetch exam', { examId, error: error.message });
      throw error;
    }
  }

  async updateExam(examId, schoolId, updateData) {
    try {
      // Recalculate total marks if questions are updated
      if (updateData.questions) {
        updateData.totalMarks = updateData.questions.reduce((sum, q) => sum + q.points, 0);
      }

      const exam = await OnlineExam.findOneAndUpdate(
        { _id: examId, schoolId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!exam) {
        throw new Error('Exam not found');
      }

      logger.info('Exam updated', { examId });
      return exam;
    } catch (error) {
      logger.error('Failed to update exam', { examId, error: error.message });
      throw error;
    }
  }

  async deleteExam(examId, schoolId) {
    try {
      // Check if there are submissions
      const submissionsCount = await ExamSubmission.countDocuments({ exam: examId });

      if (submissionsCount > 0) {
        throw new Error('Cannot delete exam with existing submissions');
      }

      const exam = await OnlineExam.findOneAndDelete({ _id: examId, schoolId });

      if (!exam) {
        throw new Error('Exam not found');
      }

      logger.info('Exam deleted', { examId });
      return exam;
    } catch (error) {
      logger.error('Failed to delete exam', { examId, error: error.message });
      throw error;
    }
  }

  async publishExam(examId, schoolId) {
    try {
      const exam = await OnlineExam.findOneAndUpdate(
        { _id: examId, schoolId },
        { status: 'published' },
        { new: true }
      );

      if (!exam) {
        throw new Error('Exam not found');
      }

      logger.info('Exam published', { examId });
      return exam;
    } catch (error) {
      logger.error('Failed to publish exam', { examId, error: error.message });
      throw error;
    }
  }

  // Student Exam Taking
  async startExam(examId, studentId, schoolId) {
    try {
      const exam = await OnlineExam.findOne({ _id: examId, schoolId });

      if (!exam) {
        throw new Error('Exam not found');
      }

      // Check if exam is available
      const now = new Date();
      if (now < exam.startTime) {
        throw new Error('Exam has not started yet');
      }
      if (now > exam.endTime) {
        throw new Error('Exam has ended');
      }

      // Check if student already started
      let submission = await ExamSubmission.findOne({ exam: examId, student: studentId });

      if (submission && submission.status === 'submitted') {
        throw new Error('You have already submitted this exam');
      }

      if (!submission) {
        // Create new submission
        submission = new ExamSubmission({
          exam: examId,
          student: studentId,
          startedAt: new Date(),
          schoolId,
          tenant: schoolId,
          answers: [],
        });

        await submission.save();
      }

      // Return exam with shuffled questions if enabled
      let questions = exam.questions;
      if (exam.settings.shuffleQuestions) {
        questions = this.shuffleArray([...questions]);
      }

      if (exam.settings.shuffleOptions) {
        questions = questions.map(q => ({
          ...q.toObject(),
          options: q.options ? this.shuffleArray([...q.options]) : [],
        }));
      }

      // Remove correct answers from questions
      const sanitizedQuestions = questions.map(q => {
        const question = q.toObject ? q.toObject() : q;
        if (question.options) {
          question.options = question.options.map(opt => ({
            text: opt.text,
            _id: opt._id,
          }));
        }
        delete question.correctAnswer;
        return question;
      });

      return {
        submission: submission._id,
        exam: {
          _id: exam._id,
          title: exam.title,
          description: exam.description,
          instructions: exam.instructions,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          questions: sanitizedQuestions,
          settings: exam.settings,
        },
        startedAt: submission.startedAt,
        timeRemaining: this.calculateTimeRemaining(submission.startedAt, exam.duration),
      };
    } catch (error) {
      logger.error('Failed to start exam', { examId, studentId, error: error.message });
      throw error;
    }
  }

  async saveAnswer(submissionId, questionId, answer, timeTaken) {
    try {
      const submission = await ExamSubmission.findById(submissionId);

      if (!submission) {
        throw new Error('Submission not found');
      }

      if (submission.status === 'submitted') {
        throw new Error('Exam already submitted');
      }

      // Find and update or add answer
      const existingAnswerIndex = submission.answers.findIndex(
        a => a.questionId.toString() === questionId
      );

      if (existingAnswerIndex >= 0) {
        submission.answers[existingAnswerIndex].answer = answer;
        submission.answers[existingAnswerIndex].timeTaken = timeTaken;
      } else {
        submission.answers.push({
          questionId,
          answer,
          timeTaken,
        });
      }

      await submission.save();
      return submission;
    } catch (error) {
      logger.error('Failed to save answer', { submissionId, error: error.message });
      throw error;
    }
  }

  async submitExam(submissionId, studentId) {
    try {
      const submission = await ExamSubmission.findOne({
        _id: submissionId,
        student: studentId,
      }).populate('exam');

      if (!submission) {
        throw new Error('Submission not found');
      }

      if (submission.status === 'submitted') {
        throw new Error('Exam already submitted');
      }

      submission.submittedAt = new Date();
      submission.timeTaken = Math.floor((submission.submittedAt - submission.startedAt) / 1000);
      submission.status = 'submitted';

      // Auto-grade objective questions
      await this.autoGradeSubmission(submission);

      await submission.save();

      logger.info('Exam submitted', { submissionId });
      return submission;
    } catch (error) {
      logger.error('Failed to submit exam', { submissionId, error: error.message });
      throw error;
    }
  }

  async recordTabSwitch(submissionId) {
    try {
      const submission = await ExamSubmission.findById(submissionId).populate('exam');

      if (!submission) {
        throw new Error('Submission not found');
      }

      submission.proctoring.tabSwitches += 1;
      submission.proctoring.tabSwitchTimestamps.push(new Date());

      // Check if exceeded max tab switches
      if (submission.exam.settings.maxTabSwitches &&
          submission.proctoring.tabSwitches > submission.exam.settings.maxTabSwitches) {
        submission.proctoring.violations.push({
          type: 'excessive-tab-switches',
          timestamp: new Date(),
          description: `Exceeded maximum allowed tab switches (${submission.exam.settings.maxTabSwitches})`,
        });
      }

      await submission.save();
      return submission.proctoring;
    } catch (error) {
      logger.error('Failed to record tab switch', { submissionId, error: error.message });
      throw error;
    }
  }

  // Grading
  async autoGradeSubmission(submission) {
    try {
      const exam = submission.exam || await OnlineExam.findById(submission.exam);
      let totalScore = 0;

      submission.answers.forEach(answer => {
        const question = exam.questions.id(answer.questionId);
        if (!question) return;

        if (question.type === 'multiple-choice') {
          const correctOption = question.options.find(opt => opt.isCorrect);
          if (correctOption && answer.answer === correctOption.text) {
            totalScore += question.points;
          }
        } else if (question.type === 'true-false') {
          if (answer.answer === question.correctAnswer) {
            totalScore += question.points;
          }
        }
      });

      submission.score = totalScore;
      submission.percentage = (totalScore / exam.totalMarks) * 100;
      submission.autoGraded = true;

      // Determine if needs manual grading
      const hasSubjectiveQuestions = exam.questions.some(
        q => ['short-answer', 'essay'].includes(q.type)
      );

      if (!hasSubjectiveQuestions) {
        submission.status = 'graded';
      }

      return submission;
    } catch (error) {
      logger.error('Failed to auto-grade submission', { error: error.message });
      throw error;
    }
  }

  async manualGradeQuestion(submissionId, questionId, score, feedback, gradedBy) {
    try {
      const submission = await ExamSubmission.findById(submissionId).populate('exam');

      if (!submission) {
        throw new Error('Submission not found');
      }

      const question = submission.exam.questions.id(questionId);
      if (!question) {
        throw new Error('Question not found');
      }

      // Add or update manual grading
      const existingGradeIndex = submission.manualGrading.findIndex(
        mg => mg.questionId.toString() === questionId
      );

      const gradeData = {
        questionId,
        score: Math.min(score, question.points),
        feedback,
        gradedBy,
        gradedAt: new Date(),
      };

      if (existingGradeIndex >= 0) {
        submission.manualGrading[existingGradeIndex] = gradeData;
      } else {
        submission.manualGrading.push(gradeData);
      }

      // Recalculate total score
      submission.calculateScore();

      // Check if all subjective questions are graded
      const subjectiveQuestions = submission.exam.questions.filter(
        q => ['short-answer', 'essay'].includes(q.type)
      );

      const allGraded = subjectiveQuestions.every(q =>
        submission.manualGrading.some(mg => mg.questionId.toString() === q._id.toString())
      );

      if (allGraded) {
        submission.status = 'graded';
      }

      await submission.save();

      logger.info('Question manually graded', { submissionId, questionId });
      return submission;
    } catch (error) {
      logger.error('Failed to manually grade question', { submissionId, error: error.message });
      throw error;
    }
  }

  // Plagiarism Detection
  async checkPlagiarism(submissionId) {
    try {
      const submission = await ExamSubmission.findById(submissionId).populate('exam');

      if (!submission) {
        throw new Error('Submission not found');
      }

      // Get all submissions for this exam
      const allSubmissions = await ExamSubmission.find({
        exam: submission.exam._id,
        _id: { $ne: submissionId },
        status: { $in: ['submitted', 'graded'] },
      });

      const matches = await plagiarismService.compareSubmissions(
        submission,
        allSubmissions
      );

      submission.plagiarismCheck = {
        checked: true,
        score: matches.overallScore,
        matches: matches.matches,
        checkedAt: new Date(),
      };

      await submission.save();

      logger.info('Plagiarism check completed', { submissionId, score: matches.overallScore });
      return submission.plagiarismCheck;
    } catch (error) {
      logger.error('Failed to check plagiarism', { submissionId, error: error.message });
      throw error;
    }
  }

  // Statistics
  async getExamStatistics(examId, schoolId) {
    try {
      const [exam, submissions] = await Promise.all([
        OnlineExam.findOne({ _id: examId, schoolId }),
        ExamSubmission.find({ exam: examId, status: { $in: ['submitted', 'graded'] } }),
      ]);

      if (!exam) {
        throw new Error('Exam not found');
      }

      const totalStudents = submissions.length;
      const gradedSubmissions = submissions.filter(s => s.status === 'graded');
      const scores = gradedSubmissions.map(s => s.score);

      const statistics = {
        totalStudents,
        submitted: submissions.length,
        graded: gradedSubmissions.length,
        pending: totalStudents - gradedSubmissions.length,
        averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
        highestScore: scores.length > 0 ? Math.max(...scores) : 0,
        lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
        passRate: gradedSubmissions.filter(s => s.score >= exam.passingMarks).length / gradedSubmissions.length * 100,
      };

      return statistics;
    } catch (error) {
      logger.error('Failed to get exam statistics', { examId, error: error.message });
      throw error;
    }
  }

  // Helper methods
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  calculateTimeRemaining(startTime, duration) {
    const elapsed = Math.floor((new Date() - startTime) / 1000);
    const remaining = (duration * 60) - elapsed;
    return Math.max(0, remaining);
  }
}

export default new OnlineExamService();
