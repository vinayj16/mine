import mongoose from 'mongoose';
import Student from '../models/Student.js';
import School from '../models/School.js';

/**
 * Mongo filter matching institution across field naming variants (string + ObjectId).
 */
/**
 * Normalize institution id for MongoDB queries (ObjectId when valid).
 */
export function toInstitutionObjectId(institutionId) {
  if (!institutionId) return null;
  const idStr = institutionId.toString();
  if (mongoose.Types.ObjectId.isValid(idStr)) {
    return new mongoose.Types.ObjectId(idStr);
  }
  return institutionId;
}

/**
 * Match a single institution field (e.g. institution on Invoice) as string or ObjectId.
 */
export function matchInstitutionField(institutionId, field = 'institution') {
  if (!institutionId) return {};
  const idStr = institutionId.toString();
  const oid = toInstitutionObjectId(institutionId);
  if (oid && idStr !== oid.toString()) {
    return { $or: [{ [field]: oid }, { [field]: idStr }] };
  }
  return { [field]: oid || idStr };
}

export function getInstitutionFilter(institutionId) {
  if (!institutionId) return null;

  const idStr = institutionId.toString();
  const clauses = [
    { institutionId: idStr },
    { institution: idStr }
  ];

  if (mongoose.Types.ObjectId.isValid(idStr)) {
    const oid = new mongoose.Types.ObjectId(idStr);
    clauses.push(
      { institutionId: oid },
      { institution: oid }
    );
  }

  return { $or: clauses };
}

export function mapStudentRecord(student) {
  const doc = student?.toObject ? student.toObject() : { ...student };
  const fullName =
    doc.name ||
    `${doc.firstName || ''} ${doc.lastName || ''}`.trim() ||
    doc.email ||
    'Student';

  const nameParts = fullName.split(/\s+/).filter(Boolean);

  return {
    ...doc,
    firstName: doc.firstName || nameParts[0] || 'Student',
    lastName: doc.lastName || nameParts.slice(1).join(' ') || '',
    fullName,
    class: doc.classId?.name || doc.class || doc.classId,
    section: doc.sectionId?.name || doc.section || doc.sectionId
  };
}

/**
 * Resolve institutionId for fee/finance operations.
 */
export async function resolveTenantContext(req, { studentId } = {}) {
  const institutionId = req.user?.institutionId || req.tenantId || req.query?.institutionId || null;

  return {
    institutionId: institutionId?.toString() || null
  };
}

/**
 * Build MongoDB query filter for institution-scoped fee data.
 */
export function buildTenantFeeQuery(institutionId, extra = {}) {
  const tenantId = institutionId;
  if (!tenantId) {
    throw new Error('Institution context is required');
  }

  const parts = [];
  if (Object.keys(extra).length) parts.push(extra);

  parts.push({ $or: [
    { institutionId: tenantId },
    { institution: tenantId }
  ]});

  if (parts.length === 1) return parts[0];
  return { $and: parts };
}

/**
 * Normalize fee type labels from UI to schema enum values.
 */
export function normalizeFeeType(feeType) {
  if (!feeType) return 'other';
  const map = {
    tuition: 'tuition',
    examination: 'exam',
    exam: 'exam',
    library: 'library',
    transport: 'transport',
    hostel: 'hostel',
    sports: 'sports',
    lab: 'other',
    annual: 'annual',
    monthly: 'monthly',
    other: 'other'
  };
  const key = String(feeType).trim().toLowerCase();
  return map[key] || 'other';
}
