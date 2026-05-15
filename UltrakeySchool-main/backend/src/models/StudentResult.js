import mongoose from 'mongoose';

const studentResultSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
    index: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  academicYear: {
    type: String,
    required: true,
    index: true
  },
  term: {
    type: String,
    enum: ['1st', '2nd', '3rd', 'annual', 'midterm', 'final'],
    required: true
  },
  subjects: [{
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    subjectName: {
      type: String,
      required: true
    },
    marksObtained: {
      type: Number,
      required: true
    },
    totalMarks: {
      type: Number,
      required: true
    },
    grade: {
      type: String
    },
    remarks: {
      type: String
    }
  }],
  totalMarksObtained: {
    type: Number,
    required: true
  },
  totalMaxMarks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  overallGrade: {
    type: String
  },
  rank: {
    type: Number
  },
  attendance: {
    present: Number,
    total: Number,
    percentage: Number
  },
  teacherRemarks: {
    type: String
  },
  principalRemarks: {
    type: String
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  publishedDate: {
    type: Date
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

studentResultSchema.index({ schoolId: 1, studentId: 1, academicYear: 1 });
studentResultSchema.index({ examId: 1, studentId: 1 }, { unique: true });

const StudentResult = mongoose.model('StudentResult', studentResultSchema);

export default StudentResult;
