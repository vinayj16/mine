import HostelFee from '../models/hostelFee.js';

class HostelFeeService {
  async createFee({ institutionId, studentId, description, amount, dueDate }) {
    const fee = await HostelFee.create({
      institution: institutionId,
      student: studentId,
      description,
      amount,
      dueDate
    });

    return fee;
  }

  async listFees(institutionId, filters = {}) {
    const query = { institution: institutionId };

    if (filters.studentId) query.student = filters.studentId;
    if (filters.status) query.status = filters.status;
    if (filters.fromDate) query.dueDate = { ...(query.dueDate || {}), $gte: new Date(filters.fromDate) };
    if (filters.toDate) query.dueDate = { ...(query.dueDate || {}), $lte: new Date(filters.toDate) };

    return HostelFee.find(query)
      .populate('student', 'firstName lastName rollNumber')
      .sort({ dueDate: 1 });
  }

  async markPaid(feeId, transactionReference) {
    const fee = await HostelFee.findById(feeId);
    if (!fee) {
      throw new Error('Hostel fee record not found');
    }

    fee.status = 'paid';
    fee.paidAt = new Date();
    fee.transactionReference = transactionReference || fee.transactionReference;
    await fee.save();

    return fee;
  }
}

export default new HostelFeeService();
