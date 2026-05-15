import Fee from '../models/Fee.js';
import Payment from '../models/Payment.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from '../utils/dateHelpers.js';

class FeeService {
  async getFeesOverview(schoolId, period = 'this-month') {
    const { startDate, endDate } = this.getDateRangeForPeriod(period);

    const query = {
      schoolId,
      isActive: true,
      dueDate: { $gte: startDate, $lte: endDate }
    };

    const fees = await Fee.find(query);

    const totalExpected = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const totalCollected = fees.reduce((sum, fee) => sum + fee.paidAmount, 0);
    const pending = totalExpected - totalCollected;
    const collectionPercentage = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    const currency = fees.length > 0 ? fees[0].currency : 'USD';

    return {
      totalCollected,
      pending,
      totalExpected,
      collectionPercentage,
      currency,
      period,
      lastUpdated: new Date()
    };
  }

  getDateRangeForPeriod(period) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    switch (period) {
      case 'this-month':
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now)
        };

      case 'last-month':
        const lastMonth = new Date(currentYear, currentMonth - 1, 1);
        return {
          startDate: startOfMonth(lastMonth),
          endDate: endOfMonth(lastMonth)
        };

      case 'this-term':
        const currentTerm = Math.ceil((currentMonth + 1) / 4);
        const termStartMonth = (currentTerm - 1) * 4;
        return {
          startDate: new Date(currentYear, termStartMonth, 1),
          endDate: new Date(currentYear, termStartMonth + 4, 0)
        };

      case 'last-term':
        const lastTerm = Math.ceil((currentMonth + 1) / 4) - 1;
        const lastTermStartMonth = lastTerm > 0 ? (lastTerm - 1) * 4 : 8;
        const lastTermYear = lastTerm > 0 ? currentYear : currentYear - 1;
        return {
          startDate: new Date(lastTermYear, lastTermStartMonth, 1),
          endDate: new Date(lastTermYear, lastTermStartMonth + 4, 0)
        };

      case 'this-year':
        return {
          startDate: startOfYear(now),
          endDate: endOfYear(now)
        };

      default:
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now)
        };
    }
  }

  async collectFee(schoolId, feeId, paymentData) {
    const { amount, paymentMethod, transactionId, receivedBy, remarks } = paymentData;

    const fee = await Fee.findOne({ _id: feeId, schoolId });
    if (!fee) {
      throw new Error('Fee record not found');
    }

    if (fee.status === 'paid') {
      throw new Error('Fee already paid');
    }

    const paymentRecord = {
      amount,
      paymentDate: new Date(),
      paymentMethod,
      transactionId,
      receivedBy,
      remarks
    };

    fee.paymentHistory.push(paymentRecord);
    fee.paidAmount += amount;

    await fee.save();

    return fee;
  }

  async createFee(schoolId, feeData) {
    const {
      studentId,
      feeType,
      amount,
      dueDate,
      academicYear,
      term,
      currency,
      discount,
      discountReason,
      remarks
    } = feeData;

    const dueDateTime = new Date(dueDate);
    const month = dueDateTime.getMonth() + 1;
    const year = dueDateTime.getFullYear();

    const fee = new Fee({
      schoolId,
      studentId,
      feeType,
      amount,
      dueDate: dueDateTime,
      academicYear,
      term,
      month,
      year,
      currency: currency || 'USD',
      discount: discount || 0,
      discountReason,
      remarks,
      remainingAmount: amount - (discount || 0)
    });

    await fee.save();
    return fee;
  }

  async bulkCreateFees(schoolId, feesData) {
    const fees = feesData.map(feeData => {
      const dueDateTime = new Date(feeData.dueDate);
      return {
        schoolId,
        studentId: feeData.studentId,
        feeType: feeData.feeType,
        amount: feeData.amount,
        dueDate: dueDateTime,
        academicYear: feeData.academicYear,
        term: feeData.term,
        month: dueDateTime.getMonth() + 1,
        year: dueDateTime.getFullYear(),
        currency: feeData.currency || 'USD',
        discount: feeData.discount || 0,
        discountReason: feeData.discountReason,
        remarks: feeData.remarks,
        remainingAmount: feeData.amount - (feeData.discount || 0)
      };
    });

    const result = await Fee.insertMany(fees);
    return result;
  }

  async getStudentFees(schoolId, studentId, options = {}) {
    const { status, period } = options;

    const query = {
      schoolId,
      studentId,
      isActive: true
    };

    if (status) {
      query.status = status;
    }

    if (period) {
      const { startDate, endDate } = this.getDateRangeForPeriod(period);
      query.dueDate = { $gte: startDate, $lte: endDate };
    }

    const fees = await Fee.find(query).sort({ dueDate: -1 });
    return fees;
  }

  async getPendingFees(schoolId, options = {}) {
    const { limit = 100, sortBy = 'dueDate' } = options;

    const fees = await Fee.find({
      schoolId,
      status: { $in: ['pending', 'partial', 'overdue'] },
      isActive: true
    })
    .populate('studentId', 'name email')
    .sort({ [sortBy]: 1 })
    .limit(limit);

    return fees;
  }

  async sendReminders(schoolId, feeIds) {
    const now = new Date();

    const result = await Fee.updateMany(
      {
        _id: { $in: feeIds },
        schoolId,
        status: { $in: ['pending', 'partial', 'overdue'] }
      },
      {
        $inc: { remindersSent: 1 },
        $set: { lastReminderDate: now }
      }
    );

    return result;
  }

  async getFeesReport(schoolId, period, format = 'summary') {
    const { startDate, endDate } = this.getDateRangeForPeriod(period);

    const fees = await Fee.find({
      schoolId,
      isActive: true,
      dueDate: { $gte: startDate, $lte: endDate }
    }).populate('studentId', 'name email classId');

    if (format === 'summary') {
      return this.generateSummaryReport(fees, period);
    } else if (format === 'detailed') {
      return this.generateDetailedReport(fees, period);
    }

    return fees;
  }

  generateSummaryReport(fees, period) {
    const totalExpected = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const totalCollected = fees.reduce((sum, fee) => sum + fee.paidAmount, 0);
    const totalPending = totalExpected - totalCollected;

    const byStatus = fees.reduce((acc, fee) => {
      acc[fee.status] = (acc[fee.status] || 0) + 1;
      return acc;
    }, {});

    const byType = fees.reduce((acc, fee) => {
      if (!acc[fee.feeType]) {
        acc[fee.feeType] = { count: 0, amount: 0, collected: 0 };
      }
      acc[fee.feeType].count++;
      acc[fee.feeType].amount += fee.amount;
      acc[fee.feeType].collected += fee.paidAmount;
      return acc;
    }, {});

    return {
      period,
      totalExpected,
      totalCollected,
      totalPending,
      collectionPercentage: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
      totalFees: fees.length,
      byStatus,
      byType,
      generatedAt: new Date()
    };
  }

  generateDetailedReport(fees, period) {
    return {
      period,
      fees: fees.map(fee => ({
        feeId: fee._id,
        studentName: fee.studentId?.name,
        studentEmail: fee.studentId?.email,
        class: fee.studentId?.classId,
        feeType: fee.feeType,
        amount: fee.amount,
        paidAmount: fee.paidAmount,
        remainingAmount: fee.remainingAmount,
        status: fee.status,
        dueDate: fee.dueDate,
        paymentHistory: fee.paymentHistory
      })),
      generatedAt: new Date()
    };
  }

  async updateFee(schoolId, feeId, updateData) {
    const fee = await Fee.findOneAndUpdate(
      { _id: feeId, schoolId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!fee) {
      throw new Error('Fee record not found');
    }

    return fee;
  }

  async deleteFee(schoolId, feeId) {
    const fee = await Fee.findOneAndUpdate(
      { _id: feeId, schoolId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!fee) {
      throw new Error('Fee record not found');
    }

    return fee;
  }

  async applyLateFee(schoolId) {
    const now = new Date();
    
    const overdueFees = await Fee.find({
      schoolId,
      status: { $in: ['pending', 'partial'] },
      dueDate: { $lt: now },
      isActive: true
    });

    const updates = overdueFees.map(async (fee) => {
      const daysOverdue = Math.floor((now - fee.dueDate) / (1000 * 60 * 60 * 24));
      const lateFeeAmount = Math.min(daysOverdue * 10, fee.amount * 0.1);
      
      fee.lateFee = lateFeeAmount;
      fee.status = 'overdue';
      await fee.save();
      
      return fee;
    });

    return await Promise.all(updates);
  }
}

export default new FeeService();
// Razorpay configuration
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_123456789',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret123456789'
});

/**
 * Create invoice
 */
async function createInvoice(schoolId, invoiceData) {
  const { studentId, items = [], dueDate, notes } = invoiceData;
  const invoiceItems = Array.isArray(items) ? items : [];

  const totalAmount = invoiceItems.reduce((sum, item) => sum + item.amount + (item.tax || 0), 0);
  const dueDateTime = new Date(dueDate);
  const year = dueDateTime.getFullYear();
  const month = dueDateTime.getMonth() + 1;
  const academicYear = `${year}-${year + 1}`;

  const invoice = await Fee.create({
    schoolId,
    studentId,
    invoiceNumber: `INV-${Date.now()}`,
    items: invoiceItems,
    totalAmount,
    amount: totalAmount,
    month,
    year,
    academicYear,
    term: 'annual',
    dueDate: new Date(dueDate),
    currency: invoiceData.currency || 'INR',
    payments: [],
    notes,
    status: 'pending',
    currency: invoiceData.currency || 'INR'
  });

  return invoice;
}

/**
 * Get invoices
 */
async function getInvoices(schoolId, options = {}) {
  const { studentId, status, page = 1, limit = 20 } = options;

  const query = { schoolId };
  if (studentId) query.studentId = studentId;
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const [invoices, total] = await Promise.all([
    Fee.find(query)
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Fee.countDocuments(query)
  ]);

  return {
    invoices,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Initiate payment for invoice
 */
async function initiatePayment(schoolId, invoiceId, paymentData) {
  const { paymentMethod, amount } = paymentData;

  const invoice = await Fee.findOne({ _id: invoiceId, schoolId });
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.status === 'paid') {
    throw new Error('Invoice already paid');
  }

  // Generate order ID
  const orderId = `ORD-${Date.now()}`;

  // Create Razorpay order
  const options = {
    amount: Math.round(amount * 100), // Convert to paise
    currency: 'INR',
    receipt: invoiceId,
    payment_capture: 1
  };

  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.create(options);
  } catch (error) {
    throw new Error(`Payment gateway error: ${error.message}`);
  }

  const paymentDoc = await Payment.create({
    paymentId: razorpayOrder.id,
    orderId,
    invoiceId: invoice._id,
    studentId: invoice.studentId,
    schoolId,
    amount,
    currency: invoice.currency || 'INR',
    paymentMethod,
    status: 'created',
    paymentUrl: razorpayOrder.short_url || razorpayOrder.notes?.link || '',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    responsePayload: razorpayOrder
  });

  invoice.payments.push({
    paymentId: paymentDoc.paymentId,
    orderId: paymentDoc.orderId,
    amount: paymentDoc.amount,
    paymentMethod,
    status: paymentDoc.status,
    paymentUrl: paymentDoc.paymentUrl,
    expiresAt: paymentDoc.expiresAt
  });
  await invoice.save();

  return {
    payment_id: paymentDoc.paymentId,
    order_id: paymentDoc.orderId,
    payment_url: payment.paymentUrl,
    expires_at: payment.expiresAt
  };
}

/**
 * Verify payment
 */
async function verifyPayment(schoolId, paymentId, verificationData) {
  const { razorpayOrderId, razorpaySignature } = verificationData;

  const payment = await Payment.findOne({ paymentId, schoolId });
  if (!payment) {
    throw new Error('Payment not found');
  }

  // Verify Razorpay signature
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'secret')
    .update(`${razorpayOrderId}|${paymentId}`)
    .digest('hex');

  if (generatedSignature !== razorpaySignature) {
    throw new Error('Invalid payment signature');
  }

  // Update payment status
  payment.status = 'completed';
  payment.razorpayOrderId = razorpayOrderId;
  payment.verifiedAt = new Date();
  await payment.save();

  // Update invoice status
  const invoice = await Fee.findById(payment.invoiceId);
  if (invoice) {
    invoice.status = 'paid';
    invoice.paidAmount = payment.amount;
    await invoice.save();
  }

  return {
    success: true,
    message: 'Payment verified successfully',
    data: { payment, invoice }
  };
}

/**
 * Get payment receipt
 */
async function getPaymentReceipt(schoolId, paymentId) {
  const payment = await Payment.findOne({ _id: paymentId, schoolId })
    .populate('invoiceId')
    .populate('studentId', 'name email');

  if (!payment) {
    throw new Error('Payment not found');
  }

  const receipt = {
    paymentId: payment.paymentId,
    orderId: payment.orderId,
    amount: payment.amount,
    status: payment.status,
    paymentMethod: payment.paymentMethod,
    createdAt: payment.createdAt,
    invoice: payment.invoiceId,
    student: payment.studentId
  };

  return receipt;
}

// Add methods to the FeeService class
FeeService.prototype.createInvoice = createInvoice;
FeeService.prototype.getInvoices = getInvoices;
FeeService.prototype.initiatePayment = initiatePayment;
FeeService.prototype.verifyPayment = verifyPayment;
FeeService.prototype.getPaymentReceipt = getPaymentReceipt;
FeeService.prototype.applyLateFees = FeeService.prototype.applyLateFee;
