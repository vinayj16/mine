import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import Commission from '../models/Commission.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get commissions for current agent (Agent dashboard)
router.get('/agent/me', async (req, res) => {
  try {
    const agentId = req.user.id;
    
    const commissions = await Commission.find({ agentId })
      .sort({ createdAt: -1 })
      .lean();
    
    // Calculate totals
    const totalCommission = commissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const pending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const approved = commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const paid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    
    res.json({
      success: true,
      data: {
        commissions,
        summary: {
          totalCommission,
          pending,
          approved,
          paid,
          totalCount: commissions.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching agent commissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commissions',
      error: error.message
    });
  }
});

// Get commissions by agent ID (for frontend that uses agentId in URL)
router.get('/agent/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    
    const commissions = await Commission.find({ agentId })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      data: commissions
    });
  } catch (error) {
    console.error('Error fetching agent commissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commissions',
      error: error.message
    });
  }
});

// Get commission summary for agent by ID
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
      data: {
        totalCommission,
        pendingCommission: pending,
        approvedCommission: approved,
        paidCommission: paid,
        currentMonthCommission: 0,
        commissionRate: 10
      }
    });
  } catch (error) {
    console.error('Error fetching commission summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commission summary',
      error: error.message
    });
  }
});

// Get commission summary for current agent
router.get('/agent/me/summary', async (req, res) => {
  try {
    const agentId = req.user.id;
    
    const commissions = await Commission.find({ agentId }).lean();
    
    const totalCommission = commissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const pending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const approved = commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const paid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    
    // Get unique institutions count
    const institutionIds = [...new Set(commissions.map(c => c.institutionId.toString()))];
    
    res.json({
      success: true,
      data: {
        totalCommission,
        pending,
        approved,
        paid,
        institutionCount: institutionIds.length,
        totalCount: commissions.length
      }
    });
  } catch (error) {
    console.error('Error fetching commission summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commission summary',
      error: error.message
    });
  }
});

// Get all commissions (Super Admin)
router.get('/admin/all', authorize(['superadmin']), async (req, res) => {
  try {
    const { status, agentId, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (agentId) query.agentId = agentId;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [commissions, total] = await Promise.all([
      Commission.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('agentId', 'name email phone')
        .populate('institutionId', 'name type status')
        .lean(),
      Commission.countDocuments(query)
    ]);
    
    // Group by agent
    const agentMap = {};
    commissions.forEach(c => {
      const agentIdStr = c.agentId?._id?.toString() || c.agentId?.toString();
      if (!agentMap[agentIdStr]) {
        agentMap[agentIdStr] = {
          agentId: c.agentId?._id || c.agentId,
          agentName: c.agentId?.name || 'Unknown',
          agentEmail: c.agentId?.email || '',
          agentPhone: c.agentId?.phone || '',
          totalCommission: 0,
          pending: 0,
          approved: 0,
          paid: 0,
          institutionCount: 0,
          institutions: []
        };
      }
      agentMap[agentIdStr].totalCommission += c.commissionAmount || 0;
      if (c.status === 'pending') agentMap[agentIdStr].pending += c.commissionAmount || 0;
      if (c.status === 'approved') agentMap[agentIdStr].approved += c.commissionAmount || 0;
      if (c.status === 'paid') agentMap[agentIdStr].paid += c.commissionAmount || 0;
      agentMap[agentIdStr].institutionCount += 1;
      
      if (c.institutionId) {
        agentMap[agentIdStr].institutions.push({
          _id: c.institutionId._id,
          name: c.institutionId.name,
          type: c.institutionId.type,
          status: c.institutionId.status
        });
      }
    });
    
    const agentCommissions = Object.values(agentMap);
    
    res.json({
      success: true,
      data: {
        commissions,
        agentCommissions,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching all commissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commissions',
      error: error.message
    });
  }
});

// Get commissions by agent ID (Super Admin)
router.get('/admin/agent/:agentId', authorize(['superadmin']), async (req, res) => {
  try {
    const { agentId } = req.params;
    
    // Validate agentId is a proper MongoDB ObjectId (24 hex characters)
    const isValidObjectId = mongoose.Types.ObjectId.isValid(agentId) && 
      /^[a-fA-F0-9]{24}$/.test(agentId);
    
    if (!isValidObjectId) {
      return res.json({
        success: true,
        data: {
          commissions: [],
          summary: {
            totalCommission: 0,
            pending: 0,
            approved: 0,
            paid: 0,
            institutionCount: 0,
            totalCount: 0
          }
        }
      });
    }
    
    const commissions = await Commission.find({ agentId: new mongoose.Types.ObjectId(agentId) })
      .sort({ createdAt: -1 })
      .populate('institutionId', 'name type status')
      .lean();
    
    const totalCommission = commissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const pending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const approved = commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const paid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    
    const institutionIds = [...new Set(commissions.map(c => c.institutionId?._id?.toString()).filter(Boolean))];
    
    res.json({
      success: true,
      data: {
        commissions,
        summary: {
          totalCommission,
          pending,
          approved,
          paid,
          institutionCount: institutionIds.length,
          totalCount: commissions.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching agent commissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent commissions',
      error: error.message
    });
  }
});

// Update commission status (Super Admin)
router.patch('/:id/status', authorize(['superadmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentDate, paymentMethod, paymentReference } = req.body;
    
    const commission = await Commission.findById(id);
    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission not found'
      });
    }
    
    commission.status = status;
    if (paymentDate) commission.paymentDate = paymentDate;
    if (paymentMethod) commission.paymentMethod = paymentMethod;
    if (paymentReference) commission.paymentReference = paymentReference;
    
    await commission.save();
    
    res.json({
      success: true,
      data: commission,
      message: 'Commission status updated'
    });
  } catch (error) {
    console.error('Error updating commission status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update commission status',
      error: error.message
    });
  }
});

export default router;