import CallLog from '../models/CallLog.js';

class CallLogService {
  async createCallLog(schoolId, data) {
    return await CallLog.create({ ...data, schoolId });
  }

  async getCallLogs(schoolId, filters = {}) {
    return await CallLog.find({ schoolId, ...filters })
      .populate('callerId', 'firstName lastName')
      .populate('receiverId', 'firstName lastName')
      .sort({ callDate: -1 });
  }

  async getCallLogById(callId, schoolId) {
    const call = await CallLog.findOne({ _id: callId, schoolId })
      .populate('callerId', 'firstName lastName')
      .populate('receiverId', 'firstName lastName');
    if (!call) throw new Error('Call log not found');
    return call;
  }

  async updateCallLog(callId, schoolId, updates) {
    const call = await CallLog.findOneAndUpdate(
      { _id: callId, schoolId },
      { $set: updates },
      { new: true }
    );
    if (!call) throw new Error('Call log not found');
    return call;
  }

  async getCallLogsByUser(schoolId, userId) {
    return await CallLog.find({
      schoolId,
      $or: [{ callerId: userId }, { receiverId: userId }]
    }).sort({ callDate: -1 });
  }

  async getCallAnalytics(schoolId, startDate, endDate) {
    const query = { schoolId, callDate: { $gte: new Date(startDate), $lte: new Date(endDate) } };
    const [total, completed, missed] = await Promise.all([
      CallLog.countDocuments(query),
      CallLog.countDocuments({ ...query, status: 'completed' }),
      CallLog.countDocuments({ ...query, callType: 'missed' })
    ]);
    return { total, completed, missed };
  }
}

export default new CallLogService();
