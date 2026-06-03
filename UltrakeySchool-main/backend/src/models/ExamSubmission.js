import mongoose from 'mongoose';

const examSubmissionSchema = new mongoose.Schema({
  submissionId: {
    type: String,
    required: true,
    unique: true
  },

  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
    index: true
  },

  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },

  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true
  },

  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    index: true
  },

  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    index: true
  },

  submissionDate: {
    type: Date,
    required: true,
    default: Date.now
  },

  submittedAt: {
    type: Date
  },

  status: {
    type: String,
    enum: ['pending', 'submitted', 'late', 'graded', 'rejected'],
    default: 'pending',
    index: true
  },

  answers: [{
    questionId: String,
    answer: mongoose.Schema.Types.Mixed,
    marksObtained: Number,
    isCorrect: Boolean
  }],

  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    fileType: String,
    uploadedAt: Date
  }],

  totalMarks: {
    type: Number,
    default: 0
  },

  obtainedMarks: {
    type: Number,
    default: 0
  },

  percentage: {
    type: Number,
    default: 0
  },

  grade: {
    type: String
  },

  remarks: {
    type: String
  },

  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },

  gradedAt: {
    type: Date
  },

  timeTaken: {
    type: Number, // in minutes
    default: 0
  },

  ipAddress: String,

  browserInfo: {
    userAgent: String,
    platform: String
  },

  proctoringData: {
    suspiciousActivities: [{
      timestamp: Date,
      activity: String,
      description: String
    }],
    flagCount: {
      type: Number,
      default: 0
    }
  },

  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

examSubmissionSchema.index({ institutionId: 1, examId: 1, studentId: 1 });
examSubmissionSchema.index({ studentId: 1, examId: 1 });
examSubmissionSchema.index({ submissionDate: -1 });
examSubmissionSchema.index({ status: 1, submissionDate: -1 });

examSubmissionSchema.pre('save', async function(next) {
  if (this.isNew && !this.submissionId) {
    const count = await mongoose.model('ExamSubmission').countDocuments();
    this.submissionId = `EXSUB${String(count + 1).padStart(6, '0')}`;
  }

  // Calculate percentage if marks are available
  if (this.totalMarks > 0 && this.obtainedMarks !== undefined) {
    this.percentage = (this.obtainedMarks / this.totalMarks) * 100;
  }

  next();
});

const ExamSubmission = mongoose.model('ExamSubmission', examSubmissionSchema);

export default ExamSubmission;
