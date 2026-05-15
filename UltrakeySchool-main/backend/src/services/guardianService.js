import Guardian from '../models/Guardian.js';
import Student from '../models/Student.js';

export const getAllGuardians = async (schoolId, filters = {}) => {
  const { status, search, page = 1, limit = 20 } = filters;

  const query = { schoolId };

  if (status) {
    query.status = status;
  }

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
    .populate('children.studentId', 'firstName lastName studentId classId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Guardian.countDocuments(query);

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

export const getGuardianById = async (guardianId, schoolId) => {
  const guardian = await Guardian.findOne({ guardianId, schoolId })
    .populate('children.studentId', 'firstName lastName studentId classId section avatar')
    .populate('userId', 'email roleId isActive');

  if (!guardian) {
    throw new Error('Guardian not found');
  }

  return guardian;
};

export const getGuardiansByStudentId = async (studentId, schoolId) => {
  const guardians = await Guardian.find({
    schoolId,
    'children.studentId': studentId,
    'children.isActive': true
  }).populate('children.studentId', 'firstName lastName studentId');

  return guardians;
};

export const getPrimaryGuardian = async (studentId, schoolId) => {
  const guardian = await Guardian.findOne({
    schoolId,
    'children.studentId': studentId,
    'children.relationship.isPrimary': true,
    'children.isActive': true
  }).populate('children.studentId', 'firstName lastName studentId');

  return guardian;
};

export const getEmergencyContacts = async (studentId, schoolId) => {
  const guardians = await Guardian.find({
    schoolId,
    'children.studentId': studentId,
    'children.relationship.isEmergency': true,
    'children.isActive': true
  }).populate('children.studentId', 'firstName lastName studentId');

  return guardians;
};

export const createGuardian = async (guardianData) => {
  const { schoolId } = guardianData;

  const lastGuardian = await Guardian.findOne({ schoolId })
    .sort({ createdAt: -1 })
    .select('guardianId');

  let guardianId;
  if (lastGuardian && lastGuardian.guardianId) {
    const lastNumber = parseInt(lastGuardian.guardianId.substring(1));
    guardianId = `G${String(lastNumber + 1).padStart(6, '0')}`;
  } else {
    guardianId = 'G100001';
  }

  const guardian = new Guardian({
    ...guardianData,
    guardianId
  });

  await guardian.save();

  return guardian;
};

export const updateGuardian = async (guardianId, schoolId, updateData) => {
  const guardian = await Guardian.findOneAndUpdate(
    { guardianId, schoolId },
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate('children.studentId', 'firstName lastName studentId');

  if (!guardian) {
    throw new Error('Guardian not found');
  }

  return guardian;
};

export const deleteGuardian = async (guardianId, schoolId) => {
  const guardian = await Guardian.findOneAndDelete({ guardianId, schoolId });

  if (!guardian) {
    throw new Error('Guardian not found');
  }

  return guardian;
};

export const addChildToGuardian = async (guardianId, schoolId, childData) => {
  const guardian = await Guardian.findOne({ guardianId, schoolId });

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

export const removeChildFromGuardian = async (guardianId, schoolId, studentId) => {
  const guardian = await Guardian.findOne({ guardianId, schoolId });

  if (!guardian) {
    throw new Error('Guardian not found');
  }

  guardian.children = guardian.children.filter(
    child => child.studentId.toString() !== studentId
  );

  await guardian.save();

  return guardian;
};

export const updateChildRelationship = async (guardianId, schoolId, studentId, relationshipData) => {
  const guardian = await Guardian.findOne({ guardianId, schoolId });

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

export const updateGuardianPermissions = async (guardianId, schoolId, permissions) => {
  const guardian = await Guardian.findOne({ guardianId, schoolId });

  if (!guardian) {
    throw new Error('Guardian not found');
  }

  Object.assign(guardian.permissions, permissions);

  await guardian.save();

  return guardian;
};

export const getGuardianStats = async (schoolId) => {
  const total = await Guardian.countDocuments({ schoolId });
  const active = await Guardian.countDocuments({ schoolId, status: 'active' });
  const inactive = await Guardian.countDocuments({ schoolId, status: 'inactive' });
  const suspended = await Guardian.countDocuments({ schoolId, status: 'suspended' });

  const relationshipStats = await Guardian.aggregate([
    { $match: { schoolId } },
    { $unwind: '$children' },
    { $group: { _id: '$children.relationship.type', count: { $sum: 1 } } }
  ]);

  const permissionStats = {
    canCommunicate: await Guardian.countDocuments({ schoolId, 'permissions.canCommunicateWithTeachers': true }),
    canViewGrades: await Guardian.countDocuments({ schoolId, 'permissions.canViewGrades': true }),
    canApproveLeaves: await Guardian.countDocuments({ schoolId, 'permissions.canApproveLeaves': true })
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

export const searchGuardians = async (schoolId, query) => {
  const guardians = await Guardian.find({
    schoolId,
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

export const getGuardiansWithPermission = async (schoolId, permission) => {
  const query = { schoolId };
  query[`permissions.${permission}`] = true;

  const guardians = await Guardian.find(query)
    .populate('children.studentId', 'firstName lastName studentId');

  return guardians;
};
