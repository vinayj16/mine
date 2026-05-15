import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sectionId: {
    type: String,
    unique: true,
    sparse: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School'
  },
  classTeacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  capacity: {
    type: Number,
    default: 40
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  subjects: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    }
  }],
  roomNumber: {
    type: String
  },
  academicYear: {
    type: String,
    default: () => new Date().getFullYear().toString()
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  }
}, {
  timestamps: true
});

// Index for faster queries
sectionSchema.index({ classId: 1, institutionId: 1 });
sectionSchema.index({ tenantId: 1 });

const Section = mongoose.model('Section', sectionSchema);

export default Section;
