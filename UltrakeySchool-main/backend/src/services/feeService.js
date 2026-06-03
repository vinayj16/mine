import Fee from '../models/Fee.js';
import Payment from '../models/Payment.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import HostelFee from '../models/hostelFee.js';
import TransportFee from '../models/TransportFee.js';
import Student from '../models/Student.js';
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from '../utils/dateHelpers.js';
import { buildTenantFeeQuery, getInstitutionFilter } from '../utils/tenantContext.js';

class FeeService {
  async getFeesOverview(institutionId, period = 'this-month') {
    const { startDate, endDate } = this.getDateRangeForPeriod(period);

    const query = buildTenantFeeQuery(institutionId, {
      isActive: true,
      dueDate: { $gte: startDate, $lte: endDate }
    });

    const fees = await Fee.find(query);

    const totalExpected = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const totalCollected = fees.reduce((sum, fee) => sum + fee.paidAmount, 0);
    const pending = totalExpected - totalCollected;
    const collectionPercentage = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    const currency = fees.length > 0 ? fees[0].currency : 'INR';

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

  async collectFee(institutionId, feeId, paymentData) {
    const { amount, paymentMethod, transactionId, receivedBy, remarks } = paymentData;

    const feeQuery = buildTenantFeeQuery(institutionId, { _id: feeId });
    const fee = await Fee.findOne(feeQuery);
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

  async createFee(institutionId, feeData) {
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
      institutionId,
      studentId,
      feeType,
      amount,
      dueDate: dueDateTime,
      academicYear,
      term,
      month,
      year,
      currency: currency || 'INR',
      discount: discount || 0,
      discountReason,
      remarks,
      remainingAmount: amount - (discount || 0)
    });

    await fee.save();
    return fee;
  }

  async bulkCreateFees(institutionId, feesData) {
    const fees = feesData.map(feeData => {
      const dueDateTime = new Date(feeData.dueDate);
      return {
        institutionId,
        studentId: feeData.studentId,
        feeType: feeData.feeType,
        amount: feeData.amount,
        dueDate: dueDateTime,
        academicYear: feeData.academicYear,
        term: feeData.term,
        month: dueDateTime.getMonth() + 1,
        year: dueDateTime.getFullYear(),
        currency: feeData.currency || 'INR',
        discount: feeData.discount || 0,
        discountReason: feeData.discountReason,
        remarks: feeData.remarks,
        remainingAmount: feeData.amount - (feeData.discount || 0)
      };
    });

    const result = await Fee.insertMany(fees);
    return result;
  }

  async getStudentFees(institutionId, studentId, options = {}) {
    const { status, period } = options;

    const query = buildTenantFeeQuery(institutionId, {
      studentId,
      isActive: true
    });

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

  async getPendingFees(institutionId, options = {}) {
    const { limit = 100, sortBy = 'dueDate' } = options;

    const query = buildTenantFeeQuery(institutionId, {
      status: { $in: ['pending', 'partial', 'overdue'] },
      isActive: true
    });
    const fees = await Fee.find(query)
    .populate('studentId', 'firstName lastName name email')
    .sort({ [sortBy]: 1 })
    .limit(limit);

    return fees;
  }

  async getAllFees(institutionId, options = {}) {
    const { limit = 200, status } = options;
    const query = buildTenantFeeQuery(institutionId, { isActive: true });
    if (status) query.status = status;

    const fees = await Fee.find(query)
      .populate('studentId', 'name email rollNumber admissionNumber')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Collect IDs for a separate Student lookup (to get class info)
    const studentUserIds = fees
      .map((f) => (f.studentId?._id || f.studentId)?.toString())
      .filter(Boolean);
    let studentClassMap = {};
    if (studentUserIds.length > 0) {
      const students = await Student.find({ userId: { $in: studentUserIds } })
        .select('userId classId')
        .populate('classId', 'name')
        .lean();
      for (const s of students) {
        if (s.userId) studentClassMap[s.userId.toString()] = s.classId?.name || '';
      }
    }

    return fees.map((fee) => {
      const studentData = fee.studentId;
      const studentName =
        typeof studentData === 'object' && studentData?.name
          ? studentData.name
          : 'Unknown';
      const userId = studentData?._id?.toString() || '';
      return {
        ...fee,
        studentName,
        class: studentClassMap[userId] || fee.class || ''
      };
    });
  }

  async getAccountantDashboard(institutionId) {
    const feeQuery = buildTenantFeeQuery(institutionId, { isActive: true });
    const [fees, hostelFees, transportFees, recentPayments] = await Promise.all([
      Fee.find(feeQuery).lean(),
      institutionId
        ? HostelFee.find(getInstitutionFilter(institutionId) || { institution: institutionId }).lean()
        : [],
      institutionId || institutionId
        ? TransportFee.find(
            institutionId
              ? getInstitutionFilter(institutionId) || { institutionId }
              : { institutionId }
          ).lean()
        : [],
      Payment.find(
        buildTenantFeeQuery(institutionId, { status: 'completed' })
      )
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    ]);

    const sumAmount = (items, field = 'amount') =>
      items.reduce((sum, item) => sum + (item[field] || item.feeAmount || 0), 0);

    const pendingGeneral = fees.filter((f) => ['pending', 'partial', 'overdue'].includes(f.status));
    const paidGeneral = fees.filter((f) => f.status === 'paid');
    const pendingHostel = hostelFees.filter((f) => f.status !== 'paid');
    const paidHostel = hostelFees.filter((f) => f.status === 'paid');
    const pendingTransport = transportFees.filter((f) => f.paymentStatus !== 'paid');
    const paidTransport = transportFees.filter((f) => f.paymentStatus === 'paid');

    return {
      overview: {
        totalRevenue:
          sumAmount(paidGeneral, 'paidAmount') +
          sumAmount(paidHostel) +
          sumAmount(paidTransport, 'paidAmount'),
        pendingFees:
          sumAmount(pendingGeneral, 'remainingAmount') +
          sumAmount(pendingHostel) +
          sumAmount(pendingTransport, 'feeAmount'),
        collectedFees:
          sumAmount(paidGeneral, 'paidAmount') +
          sumAmount(paidHostel) +
          sumAmount(paidTransport, 'paidAmount'),
        tuitionFees: { total: fees.length, pending: pendingGeneral.length, collected: paidGeneral.length },
        hostelFees: { total: hostelFees.length, pending: pendingHostel.length, collected: paidHostel.length },
        transportFees: { total: transportFees.length, pending: pendingTransport.length, collected: paidTransport.length }
      },
      recentFees: fees.slice(0, 10),
      recentPayments,
      hostelFees: hostelFees.slice(0, 10),
      transportFees: transportFees.slice(0, 10)
    };
  }

  async sendReminders(institutionId, feeIds) {
    const now = new Date();

    const query = {
      _id: { $in: feeIds },
      institutionId,
      status: { $in: ['pending', 'partial', 'overdue'] }
    };
    const result = await Fee.updateMany(query,
      {
        $inc: { remindersSent: 1 },
        $set: { lastReminderDate: now }
      }
    );

    return result;
  }

  async getFeesReport(institutionId, period, format = 'summary') {
    const query = {
      institutionId,
      isActive: true
    };

    if (period) {
      const { startDate, endDate } = this.getDateRangeForPeriod(period);
      query.dueDate = { $gte: startDate, $lte: endDate };
    }

    const fees = await Fee.find(query).populate('studentId', 'name admissionNumber email');

    if (format === 'summary') {
      return this.generateSummaryReport(fees, period);
    } else if (format === 'detailed') {
      return {
        period,
        fees: fees.map(fee => ({
          _id: fee._id,
          feeId: fee._id,
          studentId: fee.studentId,
          feeType: fee.feeType,
          feeGroup: fee.feeGroup,
          amount: fee.amount,
          paidAmount: fee.paidAmount,
          dueDate: fee.dueDate,
          status: fee.status === 'overdue' || fee.status === 'pending' || fee.status === 'waived' ? 'unpaid' : fee.status,
          balance: fee.remainingAmount,
          discount: fee.discount || 0,
          fine: fee.lateFee || 0,
          paymentDate: fee.paymentHistory?.[fee.paymentHistory.length - 1]?.paymentDate,
          paymentMode: fee.paymentHistory?.[fee.paymentHistory.length - 1]?.paymentMethod,
          transactionId: fee.paymentHistory?.[fee.paymentHistory.length - 1]?.transactionId,
          createdAt: fee.createdAt
        })),
        generatedAt: new Date()
      };
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

  async updateFee(institutionId, feeId, updateData) {
    const query = { _id: feeId, institutionId };
    const fee = await Fee.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!fee) {
      throw new Error('Fee record not found');
    }

    return fee;
  }

  async deleteFee(institutionId, feeId) {
    const query = { _id: feeId, institutionId };
    const fee = await Fee.findOneAndUpdate(
      query,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!fee) {
      throw new Error('Fee record not found');
    }

    return fee;
  }

  async applyLateFee(institutionId) {
    const now = new Date();
    
    const query = {
      institutionId,
      status: { $in: ['pending', 'partial'] },
      dueDate: { $lt: now },
      isActive: true
    };
    const overdueFees = await Fee.find(query);

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

async function getInstitutionRazorpay(institutionId) {
  const InstitutionModel = (await import('../models/Institution.js')).default;
  try {
    const inst = await InstitutionModel.findById(institutionId).select('settings.payment-gateway').lean();
    const pgSettings = inst?.settings?.['payment-gateway'];
    if (pgSettings?.enabled && pgSettings?.provider === 'razorpay') {
      const keyId = pgSettings.razorpay?.keyId || pgSettings.apiKey || pgSettings.merchantId;
      const keySecret = pgSettings.razorpay?.keySecret || pgSettings.apiSecret;
      if (keyId && keySecret) {
        return { razorpay: new Razorpay({ key_id: keyId, key_secret: keySecret }), keyId };
      }
    }
  } catch {}
  return { razorpay: new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_123456789', key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret123456789' }), keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_123456789' };
}

/**
 * Create invoice
 */
async function createInvoice(institutionId, invoiceData) {
  const { studentId, items = [], dueDate, notes } = invoiceData;
  const invoiceItems = Array.isArray(items) ? items : [];

  const totalAmount = invoiceItems.reduce((sum, item) => sum + item.amount + (item.tax || 0), 0);
  const dueDateTime = new Date(dueDate);
  const year = dueDateTime.getFullYear();
  const month = dueDateTime.getMonth() + 1;
  const academicYear = `${year}-${year + 1}`;

  const invoice = await Fee.create({
    institutionId,
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
    status: 'pending'
  });

  return invoice;
}

/**
 * Get invoices
 */
async function getInvoices(institutionId, options = {}) {
  const { studentId, status, page = 1, limit = 20 } = options;

  const query = { institutionId };
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
async function initiatePayment(institutionId, invoiceId, paymentData) {
  const { paymentMethod, amount } = paymentData;

  // Auto-detect fee type and student details
  let feeType = 'general';
  let studentId = null;
  let currency = 'INR';

  const feeQuery = { _id: invoiceId, institutionId };
  let feeDoc = await Fee.findOne(feeQuery);
  if (feeDoc) {
    if (feeDoc.status === 'paid') {
      throw new Error('Fee already paid');
    }
    studentId = feeDoc.studentId;
    currency = feeDoc.currency || 'INR';
  } else {
    feeDoc = await HostelFee.findOne({ _id: invoiceId, institution: institutionId });
    if (feeDoc) {
      if (feeDoc.status === 'paid') {
        throw new Error('Fee already paid');
      }
      feeType = 'hostel';
      studentId = feeDoc.student;
      currency = 'INR';
    } else {
      feeDoc = await TransportFee.findOne({ _id: invoiceId, institutionId });
      if (feeDoc) {
        if (feeDoc.paymentStatus === 'paid') {
          throw new Error('Fee already paid');
        }
        feeType = 'transport';
        studentId = feeDoc.studentId;
        currency = feeDoc.currency || 'INR';
      }
    }
  }

  if (!feeDoc) {
    throw new Error('Fee record not found');
  }

  // Generate order ID
  const orderId = `ORD-${Date.now()}`;

  // Create Razorpay order with institution-specific keys
  const { razorpay: instRazorpay, keyId: razorpayKeyId } = await getInstitutionRazorpay(institutionId);
  let razorpayOrder;
  const validKey = razorpayKeyId && razorpayKeyId !== 'rzp_test_123456789';
  if (validKey) {
    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: invoiceId,
      payment_capture: 1
    };
    try {
      razorpayOrder = await instRazorpay.orders.create(options);
    } catch (error) {
      throw new Error('Payment gateway error: ' + (error.message || error.error?.description || 'Razorpay not configured'));
    }
  }

  const paymentId = razorpayOrder?.id || 'mock_' + Date.now();
  const paymentDoc = await Payment.create({
    paymentId,
    orderId,
    invoiceId: invoiceId,
    studentId: studentId,
    institutionId,
    amount,
    currency,
    paymentMethod,
    status: validKey ? 'created' : 'mock',
    paymentUrl: razorpayOrder?.short_url || razorpayOrder?.notes?.link || '',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    responsePayload: razorpayOrder || { id: paymentId, amount, currency },
    metadata: { feeType }
  });

  if (feeType === 'general') {
    feeDoc.payments.push({
      paymentId: paymentDoc.paymentId,
      orderId: paymentDoc.orderId,
      amount: paymentDoc.amount,
      paymentMethod,
      status: paymentDoc.status,
      paymentUrl: paymentDoc.paymentUrl,
      expiresAt: paymentDoc.expiresAt
    });
    await feeDoc.save();
  }

  return {
    payment_id: paymentId,
    order_id: paymentDoc.orderId,
    razorpay_order_id: paymentId,
    razorpay_key: validKey ? razorpayKeyId : 'rzp_test_123456789',
    payment_url: paymentDoc.paymentUrl,
    expires_at: paymentDoc.expiresAt
  };
}

/**
 * Verify payment
 */
async function verifyPayment(institutionId, paymentId, verificationData) {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = verificationData;

  const paymentQuery = { paymentId, ...buildTenantFeeQuery(institutionId, {}) };
  const payment = await Payment.findOne(paymentQuery);
  if (!payment) {
    throw new Error('Payment not found');
  }

  // Mock payments skip Razorpay verification
  if (payment.status === 'mock') {
    payment.status = 'completed';
    payment.verifiedAt = new Date();
    await payment.save();

    let feeRecord = null;
    const invoice = await Fee.findOne({ _id: payment.invoiceId, institutionId });
    if (invoice) {
      invoice.status = 'paid';
      invoice.paidAmount = payment.amount;
      await invoice.save();
      feeRecord = invoice;
    }

    return {
      success: true,
      message: 'Payment verified successfully',
      data: { payment, invoice: feeRecord }
    };
  }

  const orderId = razorpayOrderId || paymentId;
  const razorpayPayment = razorpayPaymentId || verificationData.razorpay_payment_id;
  if (!razorpayPayment) {
    throw new Error('Razorpay payment id is required');
  }

  // Verify Razorpay signature using institution-specific keys
  const { razorpay: instRazorpay } = await getInstitutionRazorpay(institutionId);
  const generatedSignature = crypto
    .createHmac('sha256', instRazorpay.key_secret)
    .update(`${orderId}|${razorpayPayment}`)
    .digest('hex');

  if (generatedSignature !== razorpaySignature) {
    throw new Error('Invalid payment signature');
  }

  // Update payment status
  payment.status = 'completed';
  payment.razorpayOrderId = razorpayOrderId;
  payment.verifiedAt = new Date();
  await payment.save();

  // Update fee status based on type
  const feeType = payment.metadata?.feeType || 'general';
  let feeRecord = null;

  if (feeType === 'hostel') {
    const hostelFee = await HostelFee.findOne({ _id: payment.invoiceId, institution: institutionId });
    if (hostelFee) {
      hostelFee.status = 'paid';
      hostelFee.paidAt = new Date();
      hostelFee.transactionReference = paymentId;
      await hostelFee.save();
      feeRecord = hostelFee;
    }
  } else if (feeType === 'transport') {
    const transportFee = await TransportFee.findOne({ _id: payment.invoiceId, institutionId });
    if (transportFee) {
      transportFee.paymentStatus = 'paid';
      transportFee.paidDate = new Date();
      transportFee.paymentReference = paymentId;
      transportFee.paidAmount = payment.amount;
      await transportFee.save();
      feeRecord = transportFee;
    }
  } else {
    const invoice = await Fee.findOne({ _id: payment.invoiceId, institutionId });
    if (invoice) {
      invoice.status = 'paid';
      invoice.paidAmount = payment.amount;
      await invoice.save();
      feeRecord = invoice;
    }
  }

  return {
    success: true,
    message: 'Payment verified successfully',
    data: { payment, invoice: feeRecord }
  };
}

/**
 * Get payment receipt
 */  async function getPaymentReceipt(institutionId, paymentId) {
  const paymentQuery = { _id: paymentId, institutionId };
  const payment = await Payment.findOne(paymentQuery)
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
