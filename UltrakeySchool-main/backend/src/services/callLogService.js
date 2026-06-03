import CallLog from '../models/CallLog.js';

class CallLogService {
  async createCallLog(institutionId, data) {
    return await CallLog.create({ ...data, institutionId });
  }

  async getCallLogs(institutionId, filters = {}) {
    return await CallLog.find({ institutionId, ...filters })
      .populate('callerId', 'firstName lastName')
      .populate('receiverId', 'firstName lastName')
      .sort({ callDate: -1 });
  }

  async getCallLogById(callId, institutionId) {
    const call = await CallLog.findOne({ _id: callId, institutionId })
      .populate('callerId', 'firstName lastName')
      .populate('receiverId', 'firstName lastName');
    if (!call) throw new Error('Call log not found');
    return call;
  }

  async updateCallLog(callId, institutionId, updates) {
    const call = await CallLog.findOneAndUpdate(
      { _id: callId, institutionId },
      { $set: updates },
      { new: true }
    );
    if (!call) throw new Error('Call log not found');
    return call;
  }

  async getCallLogsByUser(institutionId, userId) {
    return await CallLog.find({
      institutionId,
      $or: [{ callerId: userId }, { receiverId: userId }]
    }).sort({ callDate: -1 });
  }

  async getCallAnalytics(institutionId, startDate, endDate) {
    const query = { institutionId, callDate: { $gte: new Date(startDate), $lte: new Date(endDate) } };
    const [total, completed, missed] = await Promise.all([
      CallLog.countDocuments(query),
      CallLog.countDocuments({ ...query, status: 'completed' }),
      CallLog.countDocuments({ ...query, callType: 'missed' })
    ]);
    return { total, completed, missed };
  }
}

export default new CallLogService();
