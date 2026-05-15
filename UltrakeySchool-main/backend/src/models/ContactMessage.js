import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'responded', 'archived'],
        default: 'pending'
    },
    avatar: {
        type: String,
        default: '/assets/img/profiles/avatar-01.jpg'
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School'
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
contactMessageSchema.index({ status: 1 });
contactMessageSchema.index({ createdAt: -1 });

export default mongoose.model('ContactMessage', contactMessageSchema);
