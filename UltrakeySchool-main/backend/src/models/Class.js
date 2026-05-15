import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  classId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  section: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  
  students: {
    type: Number,
    default: 0,
    min: 0
  },
  
  subjects: {
    type: [String],
    default: []
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true
  },
  
  academicYear: {
    type: String,
    required: true
  },
  
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: false,
    index: true
  },
  
  institution: {
    type: String,
    default: null,
    index: true
  },
  
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  
  classTeacherName: {
    type: String,
    default: ''
  },
  
  capacity: {
    type: Number,
    default: 40
  },
  
  room: {
    type: String,
    trim: true
  },
  
  description: {
    type: String,
    trim: true
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
  },
  
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

classSchema.index({ name: 1, section: 1, academicYear: 1, institutionId: 1 }, { unique: true });
classSchema.index({ institutionId: 1, status: 1 });
classSchema.index({ academicYear: 1, status: 1 });

classSchema.pre('save', async function(next) {
  if (this.isNew && !this.classId) {
    const count = await mongoose.model('Class').countDocuments();
    this.classId = `C${String(count + 138038).padStart(6, '0')}`;
  }
  next();
});

const Class = mongoose.model('Class', classSchema);

export default Class;
