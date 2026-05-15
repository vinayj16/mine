import MembershipPlan from '../models/MembershipPlan.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_PLAN_STATUSES = ['active', 'inactive', 'archived'];
const VALID_PLAN_CATEGORIES = ['basic', 'standard', 'premium', 'enterprise', 'custom'];
const VALID_BILLING_CYCLES = ['monthly', 'quarterly', 'yearly', 'lifetime'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];

// Helper function to validate MongoDB ObjectId
const validateObjectId = (id, fieldName = 'ID') => {
  if (!id) {
    return fieldName + ' is required';
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Generate unique plan ID
const generatePlanId = async () => {
  const count = await MembershipPlan.countDocuments();
  return 'PLAN-' + String(count + 1).padStart(4, '0');
};

// Get all plans
const getAllPlans = async (req, res) => {
  try {
    logger.info('Fetching all membership plans');
    
    const { status, category, page, limit, search } = req.query;
    
    // Validation
    const errors = [];
    
    if (status && !VALID_PLAN_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_PLAN_STATUSES.join(', '));
    }
    
    if (category && !VALID_PLAN_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_PLAN_CATEGORIES.join(', '));
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (pageNum - 1) * limitNum;
    
    const [plans, total] = await Promise.all([
      MembershipPlan.find(filter).sort({ sortOrder: 1, createdAt: 1 }).skip(skip).limit(limitNum),
      MembershipPlan.countDocuments(filter)
    ]);

    logger.info('Membership plans fetched successfully');
    return successResponse(res, {
      plans,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    }, 'Plans retrieved successfully');
  } catch (error) {
    logger.error('Error fetching plans:', error);
    return errorResponse(res, error.message);
  }
};


// Get plan by ID
const getPlanById = async (req, res) => {
  try {
    logger.info('Fetching membership plan by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Plan ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const plan = await MembershipPlan.findById(id);

    if (!plan) {
      return notFoundResponse(res, 'Plan not found');
    }

    logger.info('Membership plan fetched successfully:', { planId: id });
    return successResponse(res, plan, 'Plan retrieved successfully');
  } catch (error) {
    logger.error('Error fetching plan:', error);
    return errorResponse(res, error.message);
  }
};

// Create new plan
const createPlan = async (req, res) => {
  try {
    logger.info('Creating membership plan');
    
    const { name, price, duration, category, billingCycle, features } = req.body;
    
    // Validation
    const errors = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('Plan name is required');
    } else if (name.length > 200) {
      errors.push('Plan name must not exceed 200 characters');
    }
    
    if (price === undefined || price === null) {
      errors.push('Price is required');
    } else {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        errors.push('Price must be a non-negative number');
      }
    }
    
    if (duration !== undefined && duration !== null) {
      const durationNum = parseInt(duration);
      if (isNaN(durationNum) || durationNum < 1) {
        errors.push('Duration must be at least 1');
      } else if (durationNum > 3650) {
        errors.push('Duration must not exceed 3650 days');
      }
    }
    
    if (category && !VALID_PLAN_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_PLAN_CATEGORIES.join(', '));
    }
    
    if (billingCycle && !VALID_BILLING_CYCLES.includes(billingCycle)) {
      errors.push('Invalid billing cycle. Must be one of: ' + VALID_BILLING_CYCLES.join(', '));
    }
    
    if (features && !Array.isArray(features)) {
      errors.push('Features must be an array');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const planId = await generatePlanId();
    
    const planData = {
      ...req.body,
      planId
    };

    const plan = new MembershipPlan(planData);
    await plan.save();

    logger.info('Membership plan created successfully:', { planId: plan._id, name });
    return createdResponse(res, plan, 'Plan created successfully');
  } catch (error) {
    logger.error('Error creating plan:', error);
    return errorResponse(res, error.message);
  }
};

// Update plan
const updatePlan = async (req, res) => {
  try {
    logger.info('Updating membership plan');
    
    const { id } = req.params;
    const { name, price, category, status, billingCycle } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Plan ID');
    if (idError) errors.push(idError);
    
    if (name !== undefined && (!name || name.trim().length === 0)) {
      errors.push('Plan name cannot be empty');
    } else if (name && name.length > 200) {
      errors.push('Plan name must not exceed 200 characters');
    }
    
    if (price !== undefined && price !== null) {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        errors.push('Price must be a non-negative number');
      }
    }
    
    if (category && !VALID_PLAN_CATEGORIES.includes(category)) {
      errors.push('Invalid category');
    }
    
    if (status && !VALID_PLAN_STATUSES.includes(status)) {
      errors.push('Invalid status');
    }
    
    if (billingCycle && !VALID_BILLING_CYCLES.includes(billingCycle)) {
      errors.push('Invalid billing cycle');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const plan = await MembershipPlan.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return notFoundResponse(res, 'Plan not found');
    }

    logger.info('Membership plan updated successfully:', { planId: id });
    return successResponse(res, plan, 'Plan updated successfully');
  } catch (error) {
    logger.error('Error updating plan:', error);
    return errorResponse(res, error.message);
  }
};

// Delete plan
const deletePlan = async (req, res) => {
  try {
    logger.info('Deleting membership plan');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Plan ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const plan = await MembershipPlan.findByIdAndDelete(id);

    if (!plan) {
      return notFoundResponse(res, 'Plan not found');
    }

    logger.info('Membership plan deleted successfully:', { planId: id });
    return successResponse(res, null, 'Plan deleted successfully');
  } catch (error) {
    logger.error('Error deleting plan:', error);
    return errorResponse(res, error.message);
  }
};

// Get active plans
const getActivePlans = async (req, res) => {
  try {
    logger.info('Fetching active membership plans');
    
    const plans = await MembershipPlan.find({ status: 'active' })
      .sort({ sortOrder: 1, price: 1 })
      .select('name price duration category billingCycle features description');
    
    logger.info('Active membership plans fetched successfully');
    return successResponse(res, plans, 'Active plans retrieved successfully');
  } catch (error) {
    logger.error('Error fetching active plans:', error);
    return errorResponse(res, error.message);
  }
};

// Toggle plan status
const togglePlanStatus = async (req, res) => {
  try {
    logger.info('Toggling membership plan status');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Plan ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const plan = await MembershipPlan.findById(id);
    
    if (!plan) {
      return notFoundResponse(res, 'Plan not found');
    }
    
    plan.status = plan.status === 'active' ? 'inactive' : 'active';
    await plan.save();
    
    logger.info('Plan status toggled successfully:', { planId: id, newStatus: plan.status });
    return successResponse(res, plan, 'Plan status updated successfully');
  } catch (error) {
    logger.error('Error toggling plan status:', error);
    return errorResponse(res, error.message);
  }
};

// Duplicate plan
const duplicatePlan = async (req, res) => {
  try {
    logger.info('Duplicating membership plan');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Plan ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const originalPlan = await MembershipPlan.findById(id);
    
    if (!originalPlan) {
      return notFoundResponse(res, 'Plan not found');
    }
    
    const planId = await generatePlanId();
    
    const duplicatedPlan = new MembershipPlan({
      name: originalPlan.name + ' (Copy)',
      planId,
      price: originalPlan.price,
      duration: originalPlan.duration,
      category: originalPlan.category,
      billingCycle: originalPlan.billingCycle,
      features: originalPlan.features,
      description: originalPlan.description,
      status: 'inactive'
    });
    
    await duplicatedPlan.save();
    
    logger.info('Plan duplicated successfully:', { originalId: id, newId: duplicatedPlan._id });
    return createdResponse(res, duplicatedPlan, 'Plan duplicated successfully');
  } catch (error) {
    logger.error('Error duplicating plan:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk update plans
const bulkUpdatePlans = async (req, res) => {
  try {
    logger.info('Bulk updating membership plans');
    
    const { planIds, updates } = req.body;
    
    // Validation
    const errors = [];
    
    if (!planIds || !Array.isArray(planIds) || planIds.length === 0) {
      errors.push('Plan IDs array is required and must not be empty');
    } else if (planIds.length > 100) {
      errors.push('Cannot update more than 100 plans at once');
    }
    
    if (!updates || typeof updates !== 'object') {
      errors.push('Updates object is required');
    }
    
    if (updates?.status && !VALID_PLAN_STATUSES.includes(updates.status)) {
      errors.push('Invalid status in updates');
    }
    
    if (updates?.category && !VALID_PLAN_CATEGORIES.includes(updates.category)) {
      errors.push('Invalid category in updates');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await MembershipPlan.updateMany(
      { _id: { $in: planIds } },
      { $set: updates }
    );
    
    logger.info('Bulk plan update completed:', { count: result.modifiedCount });
    return successResponse(res, { modifiedCount: result.modifiedCount }, 'Plans updated successfully');
  } catch (error) {
    logger.error('Error in bulk plan update:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete plans
const bulkDeletePlans = async (req, res) => {
  try {
    logger.info('Bulk deleting membership plans');
    
    const { planIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!planIds || !Array.isArray(planIds) || planIds.length === 0) {
      errors.push('Plan IDs array is required and must not be empty');
    } else if (planIds.length > 100) {
      errors.push('Cannot delete more than 100 plans at once');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await MembershipPlan.deleteMany({
      _id: { $in: planIds }
    });
    
    logger.info('Bulk plan deletion completed:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Plans deleted successfully');
  } catch (error) {
    logger.error('Error in bulk plan deletion:', error);
    return errorResponse(res, error.message);
  }
};

// Export plans
const exportPlans = async (req, res) => {
  try {
    logger.info('Exporting membership plans');
    
    const { format, status, category } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (status && !VALID_PLAN_STATUSES.includes(status)) {
      errors.push('Invalid status');
    }
    
    if (category && !VALID_PLAN_CATEGORIES.includes(category)) {
      errors.push('Invalid category');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    
    const plans = await MembershipPlan.find(filter)
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
    
    const exportData = {
      format: format.toLowerCase(),
      data: plans,
      count: plans.length
    };
    
    logger.info('Plans exported successfully:', { format });
    return successResponse(res, exportData, 'Plans exported successfully');
  } catch (error) {
    logger.error('Error exporting plans:', error);
    return errorResponse(res, error.message);
  }
};

// Get plan statistics
const getPlanStatistics = async (req, res) => {
  try {
    logger.info('Fetching membership plan statistics');
    
    const [totalPlans, activePlans, inactivePlans, plansByCategory, avgPrice] = await Promise.all([
      MembershipPlan.countDocuments(),
      MembershipPlan.countDocuments({ status: 'active' }),
      MembershipPlan.countDocuments({ status: 'inactive' }),
      MembershipPlan.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      MembershipPlan.aggregate([
        { $group: { _id: null, avgPrice: { $avg: '$price' } } }
      ])
    ]);
    
    const statistics = {
      totalPlans,
      activePlans,
      inactivePlans,
      plansByCategory: plansByCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      averagePrice: avgPrice[0]?.avgPrice ? parseFloat(avgPrice[0].avgPrice.toFixed(2)) : 0
    };
    
    logger.info('Plan statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching plan statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Compare plans
const comparePlans = async (req, res) => {
  try {
    logger.info('Comparing membership plans');
    
    const { planIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!planIds || !Array.isArray(planIds) || planIds.length === 0) {
      errors.push('Plan IDs array is required and must not be empty');
    } else if (planIds.length > 5) {
      errors.push('Cannot compare more than 5 plans at once');
    } else {
      for (let i = 0; i < planIds.length; i++) {
        const idError = validateObjectId(planIds[i], 'Plan ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const plans = await MembershipPlan.find({ _id: { $in: planIds } })
      .select('name price duration category billingCycle features description status');
    
    if (plans.length !== planIds.length) {
      return notFoundResponse(res, 'One or more plans not found');
    }
    
    logger.info('Plans compared successfully:', { count: plans.length });
    return successResponse(res, plans, 'Plans comparison retrieved successfully');
  } catch (error) {
    logger.error('Error comparing plans:', error);
    return errorResponse(res, error.message);
  }
};

// Update plan sort order
const updatePlanSortOrder = async (req, res) => {
  try {
    logger.info('Updating plan sort order');
    
    const { planOrders } = req.body;
    
    // Validation
    const errors = [];
    
    if (!planOrders || !Array.isArray(planOrders) || planOrders.length === 0) {
      errors.push('Plan orders array is required and must not be empty');
    } else {
      for (let i = 0; i < planOrders.length; i++) {
        const order = planOrders[i];
        if (!order.planId || !order.sortOrder) {
          errors.push('Each plan order must have planId and sortOrder');
          break;
        }
        const idError = validateObjectId(order.planId, 'Plan ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
        if (isNaN(parseInt(order.sortOrder)) || parseInt(order.sortOrder) < 0) {
          errors.push('Sort order must be a non-negative number');
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const updatePromises = planOrders.map(order =>
      MembershipPlan.findByIdAndUpdate(order.planId, { sortOrder: order.sortOrder })
    );
    
    await Promise.all(updatePromises);
    
    logger.info('Plan sort order updated successfully');
    return successResponse(res, null, 'Sort order updated successfully');
  } catch (error) {
    logger.error('Error updating plan sort order:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  getActivePlans,
  togglePlanStatus,
  duplicatePlan,
  bulkUpdatePlans,
  bulkDeletePlans,
  exportPlans,
  getPlanStatistics,
  comparePlans,
  updatePlanSortOrder
};
