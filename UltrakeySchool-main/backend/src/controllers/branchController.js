import branchService from '../services/branchService.js';

const createBranch = async (req, res, next) => {
  try {
    const branch = await branchService.createBranch(req.body);
    res.status(201).json({ success: true, message: 'Branch created successfully', data: branch });
  } catch (error) {
    next(error);
  }
};

const getBranches = async (req, res, next) => {
  try {
    const { institutionId, status, page, limit, sortBy, sortOrder } = req.query;
    const filters = {};
    
    if (institutionId) filters.institutionId = institutionId;
    if (status) filters.status = status;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };

    const result = await branchService.getBranches(filters, options);
    res.json({ 
      success: true, 
      data: result.branches,
      branches: result.branches, // For frontend compatibility
      pagination: result.pagination 
    });
  } catch (error) {
    next(error);
  }
};

const getBranchById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const branch = await branchService.getBranchById(id);
    res.json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

const updateBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const branch = await branchService.updateBranch(id, req.body);
    res.json({ success: true, message: 'Branch updated successfully', data: branch });
  } catch (error) {
    next(error);
  }
};

const deleteBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const branch = await branchService.deleteBranch(id);
    res.json({ success: true, message: 'Branch deleted successfully', data: branch });
  } catch (error) {
    next(error);
  }
};

const getBranchesByInstitution = async (req, res, next) => {
  try {
    const { institutionId } = req.params;
    const branches = await branchService.getBranchesByInstitution(institutionId);
    res.json({ success: true, data: branches });
  } catch (error) {
    next(error);
  }
};

const getBranchesByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;
    const branches = await branchService.getBranchesByStatus(status);
    res.json({ success: true, data: branches });
  } catch (error) {
    next(error);
  }
};

const searchBranches = async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }
    const branches = await branchService.searchBranches(q, parseInt(limit) || 20);
    res.json({ success: true, data: branches });
  } catch (error) {
    next(error);
  }
};

const getBranchStatistics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const statistics = await branchService.getBranchStatistics(id);
    res.json({ success: true, data: statistics });
  } catch (error) {
    next(error);
  }
};

const updateBranchCounts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const branch = await branchService.updateBranchCounts(id, req.body);
    res.json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

const suspendBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const branch = await branchService.suspendBranch(id, reason);
    res.json({ success: true, message: 'Branch suspended', data: branch });
  } catch (error) {
    next(error);
  }
};

const activateBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const branch = await branchService.activateBranch(id);
    res.json({ success: true, message: 'Branch activated', data: branch });
  } catch (error) {
    next(error);
  }
};

const addTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tag } = req.body;
    const branch = await branchService.addTag(id, tag);
    res.json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

const removeTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tag } = req.body;
    const branch = await branchService.removeTag(id, tag);
    res.json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

const getBranchDashboard = async (req, res, next) => {
  try {
    const dashboard = await branchService.getBranchDashboard();
    res.json({ success: true, data: dashboard });
  } catch (error) {
    next(error);
  }
};

const bulkDelete = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Branch IDs are required' });
    }
    const result = await branchService.bulkDelete(ids);
    res.json({ success: true, message: `${result.modifiedCount} branches deleted`, data: result });
  } catch (error) {
    next(error);
  }
};


export default {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  getBranchesByInstitution,
  getBranchesByStatus,
  searchBranches,
  getBranchStatistics,
  updateBranchCounts,
  suspendBranch,
  activateBranch,
  addTag,
  removeTag,
  getBranchDashboard,
  bulkDelete
};
