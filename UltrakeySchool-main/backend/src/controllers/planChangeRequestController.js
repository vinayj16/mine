import PlanChangeRequest from '../models/PlanChangeRequest.js';
import MembershipPlan from '../models/MembershipPlan.js';
import Subscription from '../models/Subscription.js';
import logger from '../utils/logger.js';
import { successResponse, createdResponse, errorResponse, notFoundResponse } from '../utils/apiResponse.js';

export const getPlanChangeRequests = async (req, res, next) => {
  try {
    logger.info('Fetching plan change requests');
    const { institutionId, status } = req.query;
    const filter = { isDeleted: false };

    if (institutionId) filter.institutionId = institutionId;
    if (status) filter.status = status;

    const requests = await PlanChangeRequest.find(filter)
      .populate('currentPlanId', 'name displayName pricing')
      .populate('requestedPlanId', 'name displayName pricing')
      .populate('reviewedBy', 'name email')
      .populate('metadata.createdBy', 'name email')
      .sort({ createdAt: -1 });

    return successResponse(res, requests, 'Plan change requests fetched successfully');
  } catch (error) {
    logger.error('Error fetching plan change requests:', error);
    next(error);
  }
};

export const getPlanChangeRequestById = async (req, res, next) => {
  try {
    logger.info('Fetching plan change request by ID');
    const { id } = req.params;

    const request = await PlanChangeRequest.findOne({ _id: id, isDeleted: false })
      .populate('currentPlanId', 'name displayName pricing')
      .populate('requestedPlanId', 'name displayName pricing')
      .populate('reviewedBy', 'name email')
      .populate('metadata.createdBy', 'name email');

    if (!request) {
      return notFoundResponse(res, 'Plan change request not found');
    }

    return successResponse(res, request, 'Plan change request fetched successfully');
  } catch (error) {
    logger.error('Error fetching plan change request:', error);
    next(error);
  }
};

export const createPlanChangeRequest = async (req, res, next) => {
  try {
    logger.info('Creating plan change request');
    const {
      institutionId,
      currentPlanId,
      requestedPlanId,
      reason,
      effectiveDate
    } = req.body;

    institutionId = req.user.institutionId || institutionId;

    // Validate plans exist
    const [currentPlan, requestedPlan] = await Promise.all([
      MembershipPlan.findById(currentPlanId),
      MembershipPlan.findById(requestedPlanId)
    ]);

    if (!currentPlan) {
      return errorResponse(res, 'Current plan not found', 404);
    }
    if (!requestedPlan) {
      return errorResponse(res, 'Requested plan not found', 404);
    }

    // Determine change type
    let changeType = 'switch';
    const planHierarchy = { starter: 1, enterprise: 2, premium: 3, custom: 4 };
    const currentLevel = planHierarchy[currentPlan.category] || 0;
    const requestedLevel = planHierarchy[requestedPlan.category] || 0;

    if (requestedLevel > currentLevel) {
      changeType = 'upgrade';
    } else if (requestedLevel < currentLevel) {
      changeType = 'downgrade';
    }

    // Calculate pricing
    const currentPrice = currentPlan.pricing.monthly.amount;
    const newPrice = requestedPlan.pricing.monthly.amount;
    const priceDifference = newPrice - currentPrice;

    const request = await PlanChangeRequest.create({
      institutionId,
      institutionId,
      currentPlanId,
      currentPlanName: currentPlan.displayName,
      requestedPlanId,
      requestedPlanName: requestedPlan.displayName,
      changeType,
      reason,
      effectiveDate: new Date(effectiveDate),
      pricing: {
        currentPrice,
        newPrice,
        priceDifference,
        currency: 'INR'
      },
      paymentRequired: priceDifference > 0,
      metadata: {
        createdBy: req.user._id
      }
    });

    return createdResponse(res, request, 'Plan change request created successfully');
  } catch (error) {
    logger.error('Error creating plan change request:', error);
    next(error);
  }
};

export const approvePlanChangeRequest = async (req, res, next) => {
  try {
    logger.info('Approving plan change request');
    const { id } = req.params;
    const { reviewNotes, waivePayment } = req.body;

    const request = await PlanChangeRequest.findOne({ _id: id, isDeleted: false });
    if (!request) {
      return notFoundResponse(res, 'Plan change request not found');
    }

    if (request.status !== 'pending') {
      return errorResponse(res, 'Request is not in pending status', 400);
    }

    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.reviewNotes = reviewNotes;

    if (waivePayment) {
      request.paymentStatus = 'waived';
    }

    await request.save();

    return successResponse(res, request, 'Plan change request approved successfully');
  } catch (error) {
    logger.error('Error approving plan change request:', error);
    next(error);
  }
};

export const rejectPlanChangeRequest = async (req, res, next) => {
  try {
    logger.info('Rejecting plan change request');
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const request = await PlanChangeRequest.findOne({ _id: id, isDeleted: false });
    if (!request) {
      return notFoundResponse(res, 'Plan change request not found');
    }

    if (request.status !== 'pending') {
      return errorResponse(res, 'Request is not in pending status', 400);
    }

    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.rejectionReason = rejectionReason;

    await request.save();

    return successResponse(res, request, 'Plan change request rejected successfully');
  } catch (error) {
    logger.error('Error rejecting plan change request:', error);
    next(error);
  }
};

export const completePlanChangeRequest = async (req, res, next) => {
  try {
    logger.info('Completing plan change request');
    const { id } = req.params;

    const request = await PlanChangeRequest.findOne({ _id: id, isDeleted: false });
    if (!request) {
      return notFoundResponse(res, 'Plan change request not found');
    }

    if (request.status !== 'approved') {
      return errorResponse(res, 'Request must be approved before completion', 400);
    }

    if (request.paymentRequired && request.paymentStatus !== 'paid' && request.paymentStatus !== 'waived') {
      return errorResponse(res, 'Payment required before completion', 400);
    }

    // Update subscription
    const subscription = await Subscription.findOne({ institutionId: request.institutionId });
    if (subscription) {
      subscription.planId = request.requestedPlanId;
      subscription.planName = request.requestedPlanName;
      subscription.price = request.pricing.newPrice;
      subscription.startDate = request.effectiveDate;
      
      // Calculate new end date based on billing cycle
      const billingCycle = subscription.billingCycle || 'monthly';
      const duration = billingCycle === 'yearly' ? 365 : 30;
      subscription.endDate = new Date(request.effectiveDate.getTime() + duration * 24 * 60 * 60 * 1000);
      
      await subscription.save();
    }

    request.status = 'completed';
    request.completedAt = new Date();
    await request.save();

    return successResponse(res, request, 'Plan change completed successfully');
  } catch (error) {
    logger.error('Error completing plan change request:', error);
    next(error);
  }
};

export const cancelPlanChangeRequest = async (req, res, next) => {
  try {
    logger.info('Cancelling plan change request');
    const { id } = req.params;

    const request = await PlanChangeRequest.findOne({ _id: id, isDeleted: false });
    if (!request) {
      return notFoundResponse(res, 'Plan change request not found');
    }

    if (request.status !== 'pending' && request.status !== 'approved') {
      return errorResponse(res, 'Cannot cancel request in current status', 400);
    }

    request.status = 'cancelled';
    request.metadata.updatedBy = req.user._id;
    await request.save();

    return successResponse(res, request, 'Plan change request cancelled successfully');
  } catch (error) {
    logger.error('Error cancelling plan change request:', error);
    next(error);
  }
};

export default {
  getPlanChangeRequests,
  getPlanChangeRequestById,
  createPlanChangeRequest,
  approvePlanChangeRequest,
  rejectPlanChangeRequest,
  completePlanChangeRequest,
  cancelPlanChangeRequest
};
