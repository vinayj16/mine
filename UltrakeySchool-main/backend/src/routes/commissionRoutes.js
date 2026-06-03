import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import Commission from '../models/Commission.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ==== Agent-facing routes (uses JWT user id to scope) ====

router.get('/agent/me', async (req, res) => {
  try {
    const agentId = req.user.id;
    const commissions = await Commission.find({ agentId }).sort({ createdAt: -1 }).lean();
    const totalCommission = commissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const pending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const approved = commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const paid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    res.json({
      success: true,
      data: { commissions, summary: { totalCommission, pending, approved, paid, totalCount: commissions.length } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch commissions', error: error.message });
  }
});

router.get('/agent/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const commissions = await Commission.find({ agentId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: commissions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch commissions', error: error.message });
  }
});

router.get('/agent/:agentId/summary', async (req, res) => {
  try {
    const { agentId } = req.params;
    const commissions = await Commission.find({ agentId }).lean();
    const totalCommission = commissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const pending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const approved = commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const paid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    res.json({
      success: true,
      data: { totalCommission, pendingCommission: pending, approvedCommission: approved, paidCommission: paid, currentMonthCommission: 0, commissionRate: req.user?.commissionRate || 10 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch commission summary', error: error.message });
  }
});

router.get('/agent/me/summary', async (req, res) => {
  try {
    const agentId = req.user.id;
    const commissions = await Commission.find({ agentId }).lean();
    const totalCommission = commissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const pending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const approved = commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const paid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const institutionIds = [...new Set(commissions.map(c => c.institutionId.toString()))];
    res.json({
      success: true,
      data: { totalCommission, pending, approved, paid, institutionCount: institutionIds.length, totalCount: commissions.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch commission summary', error: error.message });
  }
});

router.get('/agent/:agentId/download', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { startDate, endDate, status } = req.query;
    const query = { agentId };
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    const commissions = await Commission.find(query).sort({ createdAt: -1 }).populate('institutionId', 'name type').lean();
    let text = 'Commission Statement\n' + '='.repeat(50) + '\n\n';
    text += `Generated: ${new Date().toISOString().split('T')[0]}\n`;
    text += `Agent ID: ${agentId}\n`;
    if (startDate) text += `From: ${startDate}\n`;
    if (endDate) text += `To: ${endDate}\n`;
    text += '\n' + '-'.repeat(50) + '\n\n';
    let totalAmount = 0;
    commissions.forEach((c, i) => {
      text += `${i + 1}. ${c.institutionId?.name || 'Unknown Institution'}\n`;
      text += `   Amount: ₹${c.commissionAmount || 0}\n`;
      text += `   Rate: ${c.commissionRate || 0}%\n`;
      text += `   Status: ${c.status}\n`;
      text += `   Date: ${new Date(c.createdAt).toISOString().split('T')[0]}\n\n`;
      totalAmount += c.commissionAmount || 0;
    });
    text += '-'.repeat(50) + '\n';
    text += `Total Commissions: ₹${totalAmount}\n`;
    text += `Total Transactions: ${commissions.length}\n`;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=commission-statement-${new Date().toISOString().split('T')[0]}.txt`);
    res.send(text);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to download commission statement', error: error.message });
  }
});

// ==== Super Admin routes ====

router.get('/', authorize(['super_admin']), async (req, res) => {
  try {
    const { agentId, status, startDate, endDate, page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = {};
    if (agentId) query.agentId = agentId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const [commissions, total] = await Promise.all([
      Commission.find(query).sort(sort).skip(skip).limit(parseInt(limit)).populate('agentId', 'name email phone').populate('institutionId', 'name type status').lean(),
      Commission.countDocuments(query)
    ]);
    res.json({ success: true, data: { commissions, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch commissions', error: error.message });
  }
});

// Static admin routes MUST be defined before /:id to avoid param collision
router.get('/admin/all', authorize(['super_admin']), async (req, res) => {
  try {
    const { status, agentId, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (agentId) query.agentId = agentId;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [commissions, total] = await Promise.all([
      Commission.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).populate('agentId', 'name email phone').populate('institutionId', 'name type status').lean(),
      Commission.countDocuments(query)
    ]);
    const agentMap = {};
    commissions.forEach(c => {
      const agentIdStr = c.agentId?._id?.toString() || c.agentId?.toString();
      if (!agentMap[agentIdStr]) {
        agentMap[agentIdStr] = { agentId: c.agentId?._id || c.agentId, agentName: c.agentId?.name || 'Unknown', agentEmail: c.agentId?.email || '', agentPhone: c.agentId?.phone || '', totalCommission: 0, pending: 0, approved: 0, paid: 0, institutionCount: 0, institutions: [] };
      }
      agentMap[agentIdStr].totalCommission += c.commissionAmount || 0;
      if (c.status === 'pending') agentMap[agentIdStr].pending += c.commissionAmount || 0;
      if (c.status === 'approved') agentMap[agentIdStr].approved += c.commissionAmount || 0;
      if (c.status === 'paid') agentMap[agentIdStr].paid += c.commissionAmount || 0;
      agentMap[agentIdStr].institutionCount += 1;
      if (c.institutionId) {
        agentMap[agentIdStr].institutions.push({ _id: c.institutionId._id, name: c.institutionId.name, type: c.institutionId.type, status: c.institutionId.status });
      }
    });
    res.json({ success: true, data: { commissions, agentCommissions: Object.values(agentMap), pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch commissions', error: error.message });
  }
});

router.get('/admin/agent/:agentId', authorize(['super_admin']), async (req, res) => {
  try {
    const { agentId } = req.params;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(agentId) && /^[a-fA-F0-9]{24}$/.test(agentId);
    if (!isValidObjectId) {
      return res.json({ success: true, data: { commissions: [], summary: { totalCommission: 0, pending: 0, approved: 0, paid: 0, institutionCount: 0, totalCount: 0 } } });
    }
    const commissions = await Commission.find({ agentId: new mongoose.Types.ObjectId(agentId) }).sort({ createdAt: -1 }).populate('institutionId', 'name type status').lean();
    const totalCommission = commissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const pending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const approved = commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const paid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const institutionIds = [...new Set(commissions.map(c => c.institutionId?._id?.toString()).filter(Boolean))];
    res.json({ success: true, data: { commissions, summary: { totalCommission, pending, approved, paid, institutionCount: institutionIds.length, totalCount: commissions.length } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch agent commissions', error: error.message });
  }
});

router.get('/:id', authorize(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const commission = await Commission.findById(id).populate('agentId', 'name email phone').populate('institutionId', 'name type status');
    if (!commission) return res.status(404).json({ success: false, message: 'Commission not found' });
    res.json({ success: true, data: commission });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch commission', error: error.message });
  }
});

router.post('/', authorize(['super_admin']), async (req, res) => {
  try {
    const { agentId, institutionId, revenue, commissionRate, commissionAmount, currency, status, notes } = req.body;
    const commission = await Commission.create({
      agentId, institutionId, revenue, commissionRate, commissionAmount,
      currency: currency || 'INR', status: status || 'pending', notes
    });
    res.status(201).json({ success: true, data: commission, message: 'Commission created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create commission', error: error.message });
  }
});

router.put('/:id', authorize(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const commission = await Commission.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!commission) return res.status(404).json({ success: false, message: 'Commission not found' });
    res.json({ success: true, data: commission, message: 'Commission updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update commission', error: error.message });
  }
});

router.delete('/:id', authorize(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const commission = await Commission.findByIdAndDelete(id);
    if (!commission) return res.status(404).json({ success: false, message: 'Commission not found' });
    res.json({ success: true, message: 'Commission deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete commission', error: error.message });
  }
});

router.patch('/:id/status', authorize(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentData } = req.body;
    const commission = await Commission.findById(id);
    if (!commission) return res.status(404).json({ success: false, message: 'Commission not found' });
    commission.status = status;
    if (paymentData) {
      if (paymentData.paymentDate) commission.paymentDate = paymentData.paymentDate;
      if (paymentData.paymentMethod) commission.paymentMethod = paymentData.paymentMethod;
      if (paymentData.paymentReference) commission.paymentReference = paymentData.paymentReference;
    }
    await commission.save();
    res.json({ success: true, data: commission, message: 'Commission status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update commission status', error: error.message });
  }
});

router.get('/:id/receipt', authorize(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const commission = await Commission.findById(id).populate('agentId', 'name email phone').populate('institutionId', 'name type').lean();
    if (!commission) return res.status(404).json({ success: false, message: 'Commission not found' });
    const lines = [
      'Commission Receipt',
      '='.repeat(50), '',
      'Receipt ID: ' + commission._id,
      'Date: ' + new Date(commission.createdAt).toISOString().split('T')[0],
      'Status: ' + commission.status, '',
      'Agent Details:',
      '  Name: ' + (commission.agentId?.name || 'Unknown'),
      '  Email: ' + (commission.agentId?.email || 'N/A'),
      '  Phone: ' + (commission.agentId?.phone || 'N/A'), '',
      'Institution Details:',
      '  Name: ' + (commission.institutionId?.name || 'Unknown'),
      '  Type: ' + (commission.institutionId?.type || 'N/A'), '',
      'Commission Details:',
      '  Amount: \u20b9' + (commission.commissionAmount || 0),
      '  Rate: ' + (commission.commissionRate || 0) + '%',
      '  Revenue: \u20b9' + (commission.revenue || 0),
      '  Currency: ' + (commission.currency || 'INR'), '',
      commission.paymentDate ? 'Payment Date: ' + new Date(commission.paymentDate).toISOString().split('T')[0] : '',
      commission.paymentMethod ? 'Payment Method: ' + commission.paymentMethod : '',
      commission.paymentReference ? 'Payment Reference: ' + commission.paymentReference : '',
      commission.notes ? '\nNotes: ' + commission.notes : '', '',
      '-'.repeat(50),
      'Generated by EduSearch'
    ].filter(Boolean).join('\n');
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=commission-receipt-' + id + '.txt');
    res.send(lines);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to download commission receipt', error: error.message });
  }
});

export default router;
