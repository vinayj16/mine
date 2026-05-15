import mongoose from 'mongoose';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

const qrCodeSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  sessionType: { type: String, enum: ['class', 'event', 'meeting', 'exam'], required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
  qrCode: { type: String },
  qrCodeData: { type: String },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: { type: Date },
  duration: { type: Number, default: 300 },
  status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
  attendance: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    scannedAt: { type: Date, default: Date.now },
    location: {
      latitude: Number,
      longitude: Number
    }
  }],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

qrCodeSessionSchema.index({ sessionId: 1 });
qrCodeSessionSchema.index({ institutionId: 1, status: 1 });

const QRCodeSession = mongoose.model('QRCodeSession', qrCodeSessionSchema);

class QRCodeAttendanceService {
  async generateSession(sessionType, classId, institutionId, userId, duration, expiresAt) {
    const sessionId = uuidv4();
    const qrCodeData = JSON.stringify({
      sessionId,
      sessionType,
      classId,
      timestamp: Date.now()
    });

    const qrCode = await QRCode.toDataURL(qrCodeData, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });

    const session = new QRCodeSession({
      sessionId,
      sessionType,
      classId,
      institutionId,
      generatedBy: userId,
      qrCode,
      qrCodeData,
      duration: duration || 300,
      expiresAt: expiresAt || new Date(Date.now() + (duration || 300) * 1000),
      status: 'active'
    });

    await session.save();
    return session;
  }

  async scanQRCode(sessionId, userId, location) {
    const session = await QRCodeSession.findOne({ sessionId, status: 'active' });
    if (!session) {
      throw new Error('Invalid or expired QR code session');
    }

    if (new Date() > session.expiresAt) {
      session.status = 'expired';
      await session.save();
      throw new Error('QR code session has expired');
    }

    const alreadyScanned = session.attendance.some(a => a.userId.toString() === userId);
    if (alreadyScanned) {
      throw new Error('Attendance already marked');
    }

    session.attendance.push({ userId, location });
    await session.save();
    return session;
  }

  async getSession(sessionId) {
    return await QRCodeSession.findOne({ sessionId }).populate('attendance.userId', 'name email');
  }

  async getActiveSessions(institutionId) {
    return await QRCodeSession.find({ 
      institutionId, 
      status: 'active',
      expiresAt: { $gt: new Date() }
    });
  }

  async cancelSession(sessionId) {
    return await QRCodeSession.findOneAndUpdate(
      { sessionId },
      { status: 'cancelled' },
      { new: true }
    );
  }

  async getSessionAttendance(sessionId) {
    const session = await QRCodeSession.findOne({ sessionId })
      .populate('attendance.userId', 'name email role');
    return session?.attendance || [];
  }
}

export default new QRCodeAttendanceService();