import Guardian from '../models/Guardian.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

export const getAllGuardians = async (institutionId, filters = {}) => {
  const { status, search, page = 1, limit = 20 } = filters;

  const query = { institutionId };
  if (status) query.status = status;

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  const guardians = await Guardian.find(query)
    .populate('children.studentId', 'firstName lastName studentId classId section avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Guardian.countDocuments(query);

  const mapped = guardians.map(g => ({
    _id: g._id,
    guardianId: g.guardianId,
    userId: g.userId,
    firstName: g.firstName,
    lastName: g.lastName,
    email: g.email,
    phone: g.phone,
    avatar: g.avatar || '',
    status: g.status || 'active',
    createdAt: g.createdAt,
    children: (g.children || []).map(c => ({
      studentId: c.studentId?._id,
      studentName: c.studentId ? `${c.studentId.firstName} ${c.studentId.lastName}` : 'Unknown',
      relationship: c.relationship?.type || 'guardian',
      isPrimary: c.relationship?.isPrimary || false,
      isActive: c.isActive
    })),
    institutionId: g.institutionId,
  }));

  return {
    guardians: mapped,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getGuardianById = async (guardianId, institutionId) => {
  const guardian = await Guardian.findOne({ guardianId, institutionId })
    .populate('children.studentId', 'firstName lastName studentId classId section avatar')
    .populate('userId', 'email roleId isActive');

  if (!guardian) {
    throw new Error('Guardian not found');
  }

  return guardian;
};

export const getGuardiansByStudentId = async (studentId, institutionId) => {
  const guardians = await Guardian.find({
    institutionId,
    'children.studentId': studentId,
    'children.isActive': true
  }).populate('children.studentId', 'firstName lastName studentId');

  return guardians;
};

export const getPrimaryGuardian = async (studentId, institutionId) => {
  const guardian = await Guardian.findOne({
    institutionId,
    'children.studentId': studentId,
    'children.relationship.isPrimary': true,
    'children.isActive': true
  }).populate('children.studentId', 'firstName lastName studentId');

  return guardian;
};

export const getEmergencyContacts = async (studentId, institutionId) => {
  const guardians = await Guardian.find({
    institutionId,
    'children.studentId': studentId,
    'children.relationship.isEmergency': true,
    'children.isActive': true
  }).populate('children.studentId', 'firstName lastName studentId');

  return guardians;
};

export const createGuardian = async (guardianData) => {
  const { institutionId, firstName, lastName, email, phone } = guardianData;

  const lastGuardian = await Guardian.findOne({ institutionId })
    .sort({ createdAt: -1 })
    .select('guardianId');

  let guardianId;
  if (lastGuardian && lastGuardian.guardianId) {
    const lastNumber = parseInt(lastGuardian.guardianId.substring(1));
    guardianId = `G${String(lastNumber + 1).padStart(6, '0')}`;
  } else {
    guardianId = 'G100001';
  }

  let user = await User.findOne({ email });
  if (!user) {
    const defaultPassword = 'Parent@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    user = await User.create({
      name: `${firstName} ${lastName}`,
      email,
      phone,
      password: hashedPassword,
      role: 'parent',
      institutionId,
      status: 'active'
    });
  }

  const guardian = new Guardian({
    ...guardianData,
    guardianId,
    userId: user._id
  });

  await guardian.save();

  const populated = await Guardian.findById(guardian._id)
    .populate('children.studentId', 'firstName lastName studentId classId section avatar');

  return {
    ...populated.toObject(),
    credentials: {
      email: user.email,
      password: 'Parent@123'
    }
  };
};

export const updateGuardian = async (guardianId, institutionId, updateData) => {
  const guardian = await Guardian.findOneAndUpdate(
    { guardianId, institutionId },
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate('children.studentId', 'firstName lastName studentId');

  if (!guardian) {
    throw new Error('Guardian not found');
  }

  return guardian;
};

export const deleteGuardian = async (guardianId, institutionId) => {
  const guardian = await Guardian.findOneAndDelete({ guardianId, institutionId });

  if (!guardian) {
    throw new Error('Guardian not found');
  }

  return guardian;
};

export const addChildToGuardian = async (guardianId, institutionId, childData) => {
  const guardian = await Guardian.findOne({ guardianId, institutionId });

  if (!guardian) {
    throw new Error('Guardian not found');
  }

  const student = await Student.findById(childData.studentId);
  if (!student) {
    throw new Error('Student not found');
  }

  const existingChild = guardian.children.find(
    child => child.studentId.toString() === childData.studentId
  );

  if (existingChild) {
    throw new Error('Child already linked to this guardian');
  }

  guardian.children.push({
    ...childData,
    enrollmentDate: childData.enrollmentDate || new Date()
  });

  await guardian.save();

  return guardian;
};

export const removeChildFromGuardian = async (guardianId, institutionId, studentId) => {
  const guardian = await Guardian.findOne({ guardianId, institutionId });

  if (!guardian) {
    throw new Error('Guardian not found');
  }

  guardian.children = guardian.children.filter(
    child => child.studentId.toString() !== studentId
  );

  await guardian.save();

  return guardian;
};

export const updateChildRelationship = async (guardianId, institutionId, studentId, relationshipData) => {
  const guardian = await Guardian.findOne({ guardianId, institutionId });

  if (!guardian) {
    throw new Error('Guardian not found');
  }

  const child = guardian.children.find(
    c => c.studentId.toString() === studentId
  );

  if (!child) {
    throw new Error('Child not found in guardian record');
  }

  Object.assign(child.relationship, relationshipData);

  await guardian.save();

  return guardian;
};

export const updateGuardianPermissions = async (guardianId, institutionId, permissions) => {
  const guardian = await Guardian.findOne({ guardianId, institutionId });

  if (!guardian) {
    throw new Error('Guardian not found');
  }

  Object.assign(guardian.permissions, permissions);

  await guardian.save();

  return guardian;
};

export const getGuardianStats = async (institutionId) => {
  const total = await Guardian.countDocuments({ institutionId });
  const active = await Guardian.countDocuments({ institutionId, status: 'active' });
  const inactive = await Guardian.countDocuments({ institutionId, status: 'inactive' });
  const suspended = await Guardian.countDocuments({ institutionId, status: 'suspended' });

  const relationshipStats = await Guardian.aggregate([
    { $match: { institutionId } },
    { $unwind: '$children' },
    { $group: { _id: '$children.relationship.type', count: { $sum: 1 } } }
  ]);

  const permissionStats = {
    canCommunicate: await Guardian.countDocuments({ institutionId, 'permissions.canCommunicateWithTeachers': true }),
    canViewGrades: await Guardian.countDocuments({ institutionId, 'permissions.canViewGrades': true }),
    canApproveLeaves: await Guardian.countDocuments({ institutionId, 'permissions.canApproveLeaves': true })
  };

  return {
    total,
    active,
    inactive,
    suspended,
    byRelationship: relationshipStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    permissions: permissionStats
  };
};

export const searchGuardians = async (institutionId, query) => {
  const guardians = await Guardian.find({
    institutionId,
    $or: [
      { firstName: { $regex: query, $options: 'i' } },
      { lastName: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { phone: { $regex: query, $options: 'i' } }
    ]
  }).populate('children.studentId', 'firstName lastName studentId')
    .limit(20);

  return guardians;
};

export const getGuardiansWithPermission = async (institutionId, permission) => {
  const query = { institutionId };
  query[`permissions.${permission}`] = true;

  const guardians = await Guardian.find(query)
    .populate('children.studentId', 'firstName lastName studentId');

  return guardians;
};

export const bulkUpdateStatus = async (institutionId, guardianIds, status) => {
  const result = await Guardian.updateMany(
    { _id: { $in: guardianIds }, institutionId },
    { $set: { status } }
  );
  return result;
};

export const exportGuardians = async (institutionId, format, filters = {}) => {
  const query = { institutionId };
  if (filters.status) query.status = filters.status;
  if (filters.relationship) {
    query['children.relationship.type'] = filters.relationship;
  }

  const guardians = await Guardian.find(query)
    .populate('children.studentId', 'firstName lastName studentId classId section')
    .lean();

  return { count: guardians.length, format, data: guardians };
};

export const getGuardiansByRelationship = async (institutionId, relationship, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const query = {
    institutionId,
    'children.relationship.type': relationship
  };
  const skip = (page - 1) * limit;

  const [guardians, total] = await Promise.all([
    Guardian.find(query)
      .populate('children.studentId', 'firstName lastName studentId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Guardian.countDocuments(query)
  ]);

  return {
    guardians,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
