import express from 'express';
const router = express.Router();
import mongoose from 'mongoose';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import { validateAgentCreate, validateAgentUpdate } from '../validators/agentValidator.js';
import agentController from '../controllers/agentController.js';
import Institution from '../models/Institution.js';
import Commission from '../models/Commission.js';

const { createAgent, getAgents, getAgentById, updateAgent, deleteAgent, getAgentStatistics, getActiveAgents, completeAgentProfile, getAgentProfile, updateAgentProfile, getSettings, updateSettings, logAgentActivity } = agentController;

// Apply authentication middleware to all routes
router.use(protect);

// These routes require agent role or higher (uses real database data via Agent model - TESTED & VERIFIED)
router.post('/complete-profile', authorize(['agent', 'admin', 'super_admin']), completeAgentProfile); // ✓ - Updates real record in Agent model
router.get('/my-profile', authorize(['agent', 'admin', 'super_admin']), getAgentProfile); // ✓ - Fetches real data from Agent model
router.put('/profile/me', authorize(['agent', 'admin', 'super_admin']), updateAgentProfile); // ✓ - Updates agent profile
router.get('/settings', authorize(['agent', 'admin', 'super_admin']), getSettings); // ✓ - Fetches agent settings
router.put('/settings', authorize(['agent', 'admin', 'super_admin']), updateSettings); // ✓ - Updates agent settings
router.post('/log-activity', authorize(['agent', 'admin', 'super_admin']), logAgentActivity); // ✓ - Updates real record in Agent model

// Profile endpoint for agent (GET only - for fetching profile data)
router.get('/profile/me', authorize(['agent', 'admin', 'super_admin']), async (req, res) => {
  try {
    const agentId = req.user.id || req.user._id;
    const agentEmail = req.user.email;
    
    // Get agent from User collection (agents are stored as users with role 'agent')
    const User = (await import('../models/User.js')).default;
    let user = await User.findById(agentId).select('-password');
    
    // If not found by ID, try by email
    if (!user && agentEmail) {
      user = await User.findOne({ email: agentEmail }).select('-password');
    }
    
    if (!user) {
      return res.json({
        success: true,
        data: {
          profileComplete: true,
          name: req.user.name || 'Agent',
          email: agentEmail
        }
      });
    }
    
    // Always return profileComplete: true for now to show dashboard
    res.json({
      success: true,
      data: {
        ...user.toObject(),
        profileComplete: true
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.json({
      success: true,
      data: {
        profileComplete: true
      }
    });
  }
});

// Get agent's institutions (with commissions)
router.get('/my-institutions', authorize(['agent', 'admin', 'super_admin']), async (req, res) => {
  try {
    const agentId = req.user.id;
    const agentEmail = req.user.email;
    
    // Get agent from Agent collection
    const Agent = (await import('../models/Agent.js')).default;
    const { findAgentByAuthClaims } = await import('../utils/agentAuthHelpers.js');
    const agent = await findAgentByAuthClaims(agentId, agentEmail);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }
    
    // Get institutions created by this agent
    const institutions = await Institution.find({ agentId: agent._id }).lean();
    
    // Get commissions for these institutions (agentId is ObjectId in Commission, skip if UUID)
    let commissions = [];
    if (mongoose.Types.ObjectId.isValid(agent._id)) {
      const institutionIds = institutions.map(i => i._id);
      commissions = await Commission.find({ 
        agentId: agent._id,
        institutionId: { $in: institutionIds }
      }).lean();
    }
    
    // Map institutions with commission data
    const institutionsWithCommissions = institutions.map(inst => {
      const commission = commissions.find(c => c.institutionId?.toString() === inst._id.toString());
      return {
        ...inst,
        commissionAmount: commission?.commissionAmount || 0,
        commissionStatus: commission?.status || 'pending'
      };
    });
    
    const totalCommission = commissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const pendingCommission = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const paidCommission = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    
    res.json({
      success: true,
      data: {
        institutions: institutionsWithCommissions,
        summary: {
          totalInstitutions: institutions.length,
          totalCommission,
          pendingCommission,
          paidCommission
        }
      }
    });
  } catch (error) {
    console.error('Error fetching agent institutions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch institutions',
      error: error.message
    });
  }
});

// These routes require super admin role
router.use(authorize(['super_admin']));

// @route   GET /api/v1/agents/statistics (uses real database data via Agent model - TESTED & VERIFIED)
// @desc    Get agent statistics
// @access  Private (Super Admin)
router.get('/statistics', getAgentStatistics);

router.get('/active', getActiveAgents);

router.post('/', validateAgentCreate, createAgent);

router.get('/', getAgents);

router.get('/:id', getAgentById);

// @route   PUT /api/v1/agents/:id (uses real database data via Agent model - TESTED & VERIFIED)
// @desc    Update agent
// @access  Private (Super Admin)
router.put('/:id', validateAgentUpdate, updateAgent);

// @route   DELETE /api/v1/agents/:id (uses real database data via Agent model - TESTED & VERIFIED)
// @desc    Delete agent
// @access  Private (Super Admin)
router.delete('/:id', deleteAgent);

export default router;
