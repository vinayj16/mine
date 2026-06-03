import Subscription from '../models/Subscription.js';
import Transaction from '../models/Transaction.js';
import School from '../models/School.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import MembershipPlan from '../models/MembershipPlan.js';

const PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 29,
    studentLimit: 100,
    userLimit: 5,
    features: ['Core dashboards', 'Student management', 'Teacher management', 'Basic academic management'],
    enabledModules: ['dashboards', 'students', 'teachers', 'academics', 'attendance', 'communication', 'reports', 'users', 'settings']
  },
  medium: {
    id: 'medium',
    name: 'Medium',
    price: 79,
    studentLimit: 500,
    userLimit: 20,
    features: ['Everything in Basic', 'Parent management', 'Exams & results', 'Fees management', 'Library management'],
    enabledModules: ['dashboards', 'students', 'parents', 'teachers', 'academics', 'attendance', 'exams', 'fees', 'accounts', 'library', 'communication', 'reports', 'users', 'settings']
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 199,
    studentLimit: 2000,
    userLimit: 100,
    features: ['Everything in Medium', 'Transport management', 'Hostel management', 'HR & payroll', 'Advanced reporting', 'API access'],
    enabledModules: ['dashboards', 'students', 'parents', 'teachers', 'academics', 'attendance', 'exams', 'fees', 'accounts', 'library', 'transport', 'hostel', 'hr', 'communication', 'reports', 'users', 'settings']
  }
};

export const getSchoolSubscription = async (institutionId) => {
  const subscription = await Subscription.findOne({ 
    institutionId, 
    status: { $in: ['active', 'trial'] } 
  }).sort({ createdAt: -1 });
  
  if (!subscription) {
    return null;
  }

  const studentCount = await Student.countDocuments({ institutionId });
  const userCount = await User.countDocuments({ institutionId });

  subscription.usage = {
    studentCount,
    userCount
  };
  await subscription.save();

  return subscription;
};

export const getAllPlans = async () => {
  // First try to get from database
  const dbPlans = await MembershipPlan.find({ status: 'active' }).sort({ sortOrder: 1 });
  
  if (dbPlans && dbPlans.length > 0) {
    // Transform database plans to match expected format
    return dbPlans.map(plan => {
      // Calculate storage based on plan category
      let storageGB = 50;
      if (plan.category === 'premium') storageGB = 200;
      if (plan.category === 'enterprise') storageGB = 1000;
      
      // Build modules array from features
      const featuresList = plan.features || [];
      const modulesList = featuresList.map((f, idx) => ({
        id: f.name?.toLowerCase().replace(/\s+/g, '-') || `module-${idx}`,
        name: f.name || 'Feature',
        enabled: f.isEnabled !== false,
        description: f.description || '',
        icon: 'ti ti-package',
        mandatory: f.isMandatory || false,
        isBeta: f.isBeta || false,
        dependencyModules: []
      }));
      
      const maxStudents = plan.limits?.students?.isUnlimited ? 999999 : (plan.limits?.students?.value || 0);
      const price = plan.pricing?.monthly?.amount || 0;
      const maxUsers = plan.limits?.teachers?.isUnlimited ? 999 : (plan.limits?.teachers?.value || 10);

      return {
        id: plan.planId,
        name: plan.displayName || plan.name,
        displayName: plan.displayName,
        description: plan.description,
        status: plan.status === 'active' ? 'Active' : 'Disabled',
        price,
        monthlyPrice: price,
        yearlyPrice: plan.pricing?.yearly?.amount || 0,
        currency: plan.pricing?.monthly?.currency || 'INR',
        studentLimit: maxStudents,
        maxStudents,
        userLimit: maxUsers,
        maxBranches: plan.maxSchools || 0,
        storageLimit: storageGB,
        trialDays: plan.trialDays || 14,
        discountYearly: 17,
        features: featuresList.map(f => f.name).filter(Boolean),
        enabledModules: plan.enabledModules || [],
        modules: modulesList,
        isRecommended: plan.isRecommended || false,
        isPopular: plan.isPopular || false,
        category: plan.category
      };
    });
  }
  
  // Fallback to hardcoded plans
  return Object.values(PLANS);
};

export const createPlan = async (planData) => {
  const plan = new MembershipPlan(planData);
  await plan.save();
  return plan;
};

export const updatePlan = async (planId, planData) => {
  const plan = await MembershipPlan.findOneAndUpdate(
    { planId },
    { $set: planData },
    { new: true, runValidators: true }
  );
  return plan;
};

export const deletePlan = async (planId) => {
  const plan = await MembershipPlan.findOneAndDelete({ planId });
  return plan;
};

export const getPlanById = async (planId) => {
  const dbPlan = await MembershipPlan.findOne({ planId });
  if (dbPlan) {
    return {
      id: dbPlan.planId,
      name: dbPlan.displayName || dbPlan.name,
      price: dbPlan.pricing.monthly.amount,
      studentLimit: dbPlan.limits.students.value || 1000,
      userLimit: dbPlan.limits.teachers.value || 100,
      features: (dbPlan.features || []).map(f => f.name),
      enabledModules: dbPlan.enabledModules || []
    };
  }
  return PLANS[planId] || null;
};

export const createSubscription = async (subscriptionData) => {
  const { institutionId, planId, billingCycle = 'monthly', paymentMethod, discount } = subscriptionData;

  let plan = PLANS[planId];
  const dbPlan = await MembershipPlan.findOne({ planId });
  if (dbPlan) {
    plan = {
      id: dbPlan.planId,
      name: dbPlan.displayName || dbPlan.name,
      price: dbPlan.pricing.monthly.amount,
      studentLimit: dbPlan.limits.students.value || 1000,
      userLimit: dbPlan.limits.teachers.value || 100,
      features: (dbPlan.features || []).map(f => f.name),
      enabledModules: dbPlan.enabledModules || []
    };
  }
  if (!plan) {
    throw new Error('Invalid plan ID');
  }

  const school = await School.findById(institutionId);
  if (!school) {
    throw new Error('School not found');
  }

  const startDate = new Date();
  const endDate = new Date();
  if (billingCycle === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  let price = plan.price;
  if (billingCycle === 'yearly') {
    price = price * 12 * 0.85;
  }

  if (discount) {
    if (discount.percentage) {
      price = price * (1 - discount.percentage / 100);
    } else if (discount.amount) {
      price = price - discount.amount;
    }
  }

  const subscription = new Subscription({
    institutionId,
    planId,
    planName: plan.name,
    status: 'pending',
    approvalStatus: 'pending',
    billingCycle,
    price,
    currency: 'INR',
    startDate,
    endDate,
    features: plan.features,
    enabledModules: plan.enabledModules,
    limits: {
      studentLimit: plan.studentLimit,
      userLimit: plan.userLimit
    },
    paymentMethod,
    discount
  });

  await subscription.save();

  // Don't activate school subscription until superadmin approves
  // school.subscriptionPlan = planId;
  // school.subscriptionExpiry = endDate;
  // await school.save();

  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const invoiceId = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  const transaction = new Transaction({
    transactionId,
    institutionId,
    subscriptionId: subscription._id,
    invoiceId,
    type: 'subscription',
    description: `${billingCycle === 'yearly' ? 'Annual' : 'Monthly'} subscription - ${plan.name} Plan`,
    amount: price,
    currency: 'INR',
    status: 'completed',
    paymentMethod: paymentMethod.type,
    paymentDetails: {
      cardBrand: paymentMethod.brand,
      lastFour: paymentMethod.lastFour
    },
    metadata: {
      planId,
      planName: plan.name,
      billingCycle
    },
    processedAt: new Date()
  });

  await transaction.save();

  return { subscription, transaction };
};

export const upgradeSubscription = async (institutionId, targetPlanId, userId) => {
  const currentSubscription = await Subscription.findOne({ 
    institutionId, 
    status: 'active' 
  }).sort({ createdAt: -1 });

  if (!currentSubscription) {
    throw new Error('No active subscription found');
  }

  if (!currentSubscription.canUpgradeTo(targetPlanId)) {
    throw new Error('Cannot upgrade to this plan');
  }

  let targetPlan = PLANS[targetPlanId];
  const dbPlan = await MembershipPlan.findOne({ planId: targetPlanId });
  if (dbPlan) {
    targetPlan = {
      id: dbPlan.planId,
      name: dbPlan.displayName || dbPlan.name,
      price: dbPlan.pricing.monthly.amount,
      studentLimit: dbPlan.limits.students.value || 1000,
      userLimit: dbPlan.limits.teachers.value || 100,
      features: (dbPlan.features || []).map(f => f.name),
      enabledModules: dbPlan.enabledModules || []
    };
  }
  if (!targetPlan) {
    throw new Error('Invalid target plan');
  }

  currentSubscription.status = 'cancelled';
  currentSubscription.cancelledAt = new Date();
  currentSubscription.cancelReason = `Upgraded to ${targetPlan.name}`;
  await currentSubscription.save();

  const remainingDays = Math.ceil((currentSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24));
  const proratedCredit = (currentSubscription.price / 30) * remainingDays;

  const newPrice = targetPlan.price - proratedCredit;

  const startDate = new Date();
  const endDate = new Date(currentSubscription.endDate);

  const newSubscription = new Subscription({
    institutionId,
    planId: targetPlanId,
    planName: targetPlan.name,
    status: 'active',
    billingCycle: currentSubscription.billingCycle,
    price: targetPlan.price,
    currency: 'INR',
    startDate,
    endDate,
    features: targetPlan.features,
    enabledModules: targetPlan.enabledModules,
    limits: {
      studentLimit: targetPlan.studentLimit,
      userLimit: targetPlan.userLimit
    },
    paymentMethod: currentSubscription.paymentMethod
  });

  await newSubscription.save();

  const school = await School.findById(institutionId);
  school.subscriptionPlan = targetPlanId;
  await school.save();

  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const invoiceId = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  const transaction = new Transaction({
    transactionId,
    institutionId,
    subscriptionId: newSubscription._id,
    invoiceId,
    type: 'upgrade',
    description: `Upgrade from ${currentSubscription.planName} to ${targetPlan.name} Plan`,
    amount: newPrice,
    currency: 'INR',
    status: 'completed',
    paymentMethod: currentSubscription.paymentMethod.type,
    metadata: {
      planId: targetPlanId,
      planName: targetPlan.name,
      previousPlanId: currentSubscription.planId,
      billingCycle: currentSubscription.billingCycle,
      proratedCredit
    },
    createdBy: userId,
    processedAt: new Date()
  });

  await transaction.save();

  return { subscription: newSubscription, transaction };
};

export const cancelSubscription = async (institutionId, reason, userId) => {
  const subscription = await Subscription.findOne({ 
    institutionId, 
    status: 'active' 
  }).sort({ createdAt: -1 });

  if (!subscription) {
    throw new Error('No active subscription found');
  }

  subscription.status = 'cancelled';
  subscription.cancelledAt = new Date();
  subscription.cancelReason = reason;
  subscription.autoRenew = false;
  await subscription.save();

  return subscription;
};

export const renewSubscription = async (institutionId) => {
  const subscription = await Subscription.findOne({ 
    institutionId, 
    status: 'active' 
  }).sort({ createdAt: -1 });

  if (!subscription) {
    throw new Error('No active subscription found');
  }

  if (!subscription.autoRenew) {
    throw new Error('Auto-renewal is disabled');
  }

  let plan = PLANS[subscription.planId];
  const dbPlan = await MembershipPlan.findOne({ planId: subscription.planId });
  if (dbPlan) {
    plan = {
      id: dbPlan.planId,
      name: dbPlan.displayName || dbPlan.name,
      price: dbPlan.pricing.monthly.amount,
      studentLimit: dbPlan.limits.students.value || 1000,
      userLimit: dbPlan.limits.teachers.value || 100,
      features: (dbPlan.features || []).map(f => f.name),
      enabledModules: dbPlan.enabledModules || []
    };
  }
  const startDate = new Date(subscription.endDate);
  const endDate = new Date(startDate);
  
  if (subscription.billingCycle === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  const newSubscription = new Subscription({
    institutionId,
    planId: subscription.planId,
    planName: subscription.planName,
    status: 'active',
    billingCycle: subscription.billingCycle,
    price: subscription.price,
    currency: subscription.currency,
    startDate,
    endDate,
    features: subscription.features,
    enabledModules: subscription.enabledModules,
    limits: subscription.limits,
    paymentMethod: subscription.paymentMethod
  });

  await newSubscription.save();

  const school = await School.findById(institutionId);
  school.subscriptionExpiry = endDate;
  await school.save();

  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const invoiceId = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  const transaction = new Transaction({
    transactionId,
    institutionId,
    subscriptionId: newSubscription._id,
    invoiceId,
    type: 'subscription',
    description: `${subscription.billingCycle === 'yearly' ? 'Annual' : 'Monthly'} subscription renewal - ${plan.name} Plan`,
    amount: subscription.price,
    currency: subscription.currency,
    status: 'completed',
    paymentMethod: subscription.paymentMethod.type,
    metadata: {
      planId: subscription.planId,
      planName: subscription.planName,
      billingCycle: subscription.billingCycle
    },
    processedAt: new Date()
  });

  await transaction.save();

  return { subscription: newSubscription, transaction };
};

// Approve or reject a subscription (superadmin action)
export const approveSubscription = async (subscriptionId, action, notes) => {
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  if (action === 'approve') {
    subscription.status = 'active';
    subscription.approvalStatus = 'approved';
    subscription.notes = notes || 'Approved by SuperAdmin';
    await subscription.save();

    // Activate the school/institution subscription
    try {
      const School = (await import('../models/School.js')).default;
      const school = await School.findById(subscription.institutionId);
      if (school) {
        school.subscriptionPlan = subscription.planId;
        school.subscriptionExpiry = subscription.endDate;
        await school.save();
      }
    } catch {
      // School model might not exist or be accessible
    }

    return { subscription, status: 'active' };
  } else {
    subscription.status = 'rejected';
    subscription.approvalStatus = 'rejected';
    subscription.notes = notes || 'Rejected by SuperAdmin';
    await subscription.save();
    return { subscription, status: 'rejected' };
  }
};

export const getExpiringSubscriptions = async (days = 7) => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const subscriptions = await Subscription.find({
    status: 'active',
    endDate: { $lte: futureDate, $gte: new Date() }
  }).populate('institutionId', 'name code contact');

  return subscriptions;
};

export const getSubscriptionStats = async () => {
  const activeCount = await Subscription.countDocuments({ status: 'active' });
  const suspendedCount = await Subscription.countDocuments({ status: 'suspended' });
  const expiredCount = await Subscription.countDocuments({ status: 'expired' });
  const trialCount = await Subscription.countDocuments({ status: 'trial' });

  const planDistribution = await Subscription.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$planId', count: { $sum: 1 } } }
  ]);

  const totalRevenue = await Transaction.aggregate([
    { $match: { status: 'completed', type: { $in: ['subscription', 'upgrade'] } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  return {
    active: activeCount,
    suspended: suspendedCount,
    expired: expiredCount,
    trial: trialCount,
    planDistribution,
    totalRevenue: totalRevenue[0]?.total || 0
  };
};

export const checkSubscriptionLimits = async (institutionId) => {
  const subscription = await getSchoolSubscription(institutionId);
  
  if (!subscription) {
    return { valid: false, message: 'No active subscription' };
  }

  const warnings = [];
  
  if (subscription.usage.studentCount >= subscription.limits.studentLimit) {
    warnings.push(`Student limit reached (${subscription.limits.studentLimit})`);
  }
  
  if (subscription.usage.userCount >= subscription.limits.userLimit) {
    warnings.push(`User limit reached (${subscription.limits.userLimit})`);
  }

  if (subscription.isExpiringSoon(7)) {
    warnings.push('Subscription expiring soon');
  }

  return {
    valid: warnings.length === 0,
    warnings,
    usage: subscription.usage,
    limits: subscription.limits
  };
};
