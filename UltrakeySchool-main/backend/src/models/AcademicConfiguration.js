import mongoose from 'mongoose';

const academicConfigurationSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true
  },
  
  institutionType: {
    type: String,
    enum: ['SCHOOL', 'INTER_COLLEGE', 'DEGREE_COLLEGE', 'ENGINEERING_COLLEGE'],
    required: true,
    index: true
  },
  
  hierarchy: [{
    type: String,
    enum: ['academic_year', 'class', 'section', 'year', 'stream', 'department', 'course', 'semester', 'subject']
  }],
  
  studentGrouping: {
    type: String,
    enum: ['class_section', 'year_stream_section', 'course_semester']
  },
  
  terminology: {
    student: { type: String, default: 'Student' },
    teacher: { type: String, default: 'Teacher' },
    class: { type: String, default: 'Class' },
    section: { type: String, default: 'Section' },
    exam: { type: String, default: 'Exam' },
    result: { type: String, default: 'Result' }
  },
  
  modules: [{
    type: String
  }],
  
  features: {
    promotion: { type: Boolean, default: true },
    streams: { type: Boolean, default: false },
    departments: { type: Boolean, default: false },
    courses: { type: Boolean, default: false },
    semesters: { type: Boolean, default: false },
    credits: { type: Boolean, default: false },
    practicals: { type: Boolean, default: false },
    boardExams: { type: Boolean, default: false },
    gpa: { type: Boolean, default: false },
    cgpa: { type: Boolean, default: false },
    workload: { type: Boolean, default: false }
  },
  
  groupingLogic: {
    groupBy: String,
    fields: [String],
    promotionLogic: String
  },
  
  attendanceRules: {
    minimumRequired: { type: Number, default: 75 },
    shortageAllowed: { type: Number, default: 25 },
    medicalLeaveAllowed: { type: Number, default: 10 },
    dailyAttendance: { type: Boolean, default: true },
    subjectWise: { type: Boolean, default: false },
    practicalAttendance: { type: Boolean, default: false },
    boardCompliance: { type: Boolean, default: false },
    creditBased: { type: Boolean, default: false },
    internalEligibility: { type: Boolean, default: false }
  },
  
  examSystem: {
    type: { type: String, enum: ['annual', 'board_preparation', 'semester'] },
    internalWeightage: { type: Number, default: 0 },
    externalWeightage: { type: Number, default: 100 },
    subjects: [{ type: String }],
    grading: { type: String, enum: ['percentage', 'gpa'] },
    creditSystem: { type: Boolean, default: false },
    backlog: { type: Boolean, default: false },
    boardIntegration: { type: Boolean, default: false }
  },
  
  roles: [{
    type: String
  }],
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

academicConfigurationSchema.index({ institutionId: 1, institutionType: 1 }, { unique: true });
academicConfigurationSchema.index({ institutionType: 1, isActive: 1 });

export default mongoose.model('AcademicConfiguration', academicConfigurationSchema);
