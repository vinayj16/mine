import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'short-answer', 'essay', 'fill-blank', 'matching'],
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
  correctAnswer: {
    type: String, // For short-answer, essay, fill-blank
  },
  points: {
    type: Number,
    required: true,
    default: 1,
  },
  explanation: {
    type: String,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  tags: [String],
  attachments: [{
    type: String, // URLs to images, documents
  }],
}, { _id: true });

const onlineExamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  questions: [questionSchema],
  totalMarks: {
    type: Number,
    required: true,
  },
  passingMarks: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number, // in minutes
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  instructions: {
    type: String,
  },
  settings: {
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    shuffleOptions: {
      type: Boolean,
      default: false,
    },
    showResultsImmediately: {
      type: Boolean,
      default: false,
    },
    allowReview: {
      type: Boolean,
      default: true,
    },
    preventCopyPaste: {
      type: Boolean,
      default: true,
    },
    enableProctoring: {
      type: Boolean,
      default: false,
    },
    requireWebcam: {
      type: Boolean,
      default: false,
    },
    detectTabSwitch: {
      type: Boolean,
      default: true,
    },
    maxTabSwitches: {
      type: Number,
      default: 3,
    },
    autoSubmitOnTimeEnd: {
      type: Boolean,
      default: true,
    },
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    default: 'draft',
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
}, {
  timestamps: true,
});

const examSubmissionSchema = new mongoose.Schema({
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
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    answer: mongoose.Schema.Types.Mixed, // Can be string, array, or object
    timeTaken: Number, // seconds spent on this question
    flagged: {
      type: Boolean,
      default: false,
    },
  }],
  startedAt: {
    type: Date,
    required: true,
  },
  submittedAt: {
    type: Date,
  },
  timeTaken: {
    type: Number, // total time in seconds
  },
  score: {
    type: Number,
  },
  percentage: {
    type: Number,
  },
  grade: {
    type: String,
  },
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'graded', 'absent'],
    default: 'in-progress',
  },
  autoGraded: {
    type: Boolean,
    default: false,
  },
  manualGrading: [{
    questionId: mongoose.Schema.Types.ObjectId,
    score: Number,
    feedback: String,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    gradedAt: Date,
  }],
  proctoring: {
    tabSwitches: {
      type: Number,
      default: 0,
    },
    tabSwitchTimestamps: [Date],
    screenshots: [String], // URLs to screenshots
    violations: [{
      type: String,
      timestamp: Date,
      description: String,
    }],
  },
  plagiarismCheck: {
    checked: {
      type: Boolean,
      default: false,
    },
    score: Number, // 0-100, higher means more plagiarism
    matches: [{
      studentId: mongoose.Schema.Types.ObjectId,
      similarity: Number,
      matchedText: String,
    }],
    checkedAt: Date,
  },
  feedback: {
    type: String,
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
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
onlineExamSchema.index({ schoolId: 1, class: 1, status: 1 });
onlineExamSchema.index({ teacher: 1, status: 1 });
onlineExamSchema.index({ startTime: 1, endTime: 1 });
examSubmissionSchema.index({ exam: 1, student: 1 });
examSubmissionSchema.index({ student: 1, status: 1 });
examSubmissionSchema.index({ exam: 1, status: 1 });

// Methods
examSubmissionSchema.methods.calculateScore = function() {
  const exam = this.populated('exam') || this.exam;
  let totalScore = 0;
  
  this.answers.forEach(answer => {
    const question = exam.questions.id(answer.questionId);
    if (!question) return;
    
    // Find manual grading if exists
    const manualGrade = this.manualGrading.find(
      mg => mg.questionId.toString() === answer.questionId.toString()
    );
    
    if (manualGrade) {
      totalScore += manualGrade.score;
    } else if (question.type === 'multiple-choice' || question.type === 'true-false') {
      // Auto-grade objective questions
      const correctOption = question.options.find(opt => opt.isCorrect);
      if (correctOption && answer.answer === correctOption.text) {
        totalScore += question.points;
      }
    }
  });
  
  this.score = totalScore;
  this.percentage = (totalScore / exam.totalMarks) * 100;
  return totalScore;
};

export const OnlineExam = mongoose.model('OnlineExam', onlineExamSchema);
export const ExamSubmission = mongoose.model('ExamSubmission', examSubmissionSchema);
