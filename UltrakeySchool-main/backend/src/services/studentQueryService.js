import mongoose from 'mongoose';
import Student from '../models/Student.js';
import User from '../models/User.js';
import Section from '../models/Section.js';
import { getInstitutionFilter, mapStudentRecord } from '../utils/tenantContext.js';

/**
 * Find all students for an institution (handles legacy docs + Users collection).
 */
export async function findStudentsByInstitution(institutionId, { limit = 200 } = {}) {
  if (!institutionId) return [];

  const instFilter = getInstitutionFilter(institutionId);
  const max = parseInt(limit, 10) || 200;

  let students = await Student.find(instFilter)
    .populate('classId', 'name grade')
    .populate('sectionId', 'name')
    .sort({ createdAt: -1 })
    .limit(max)
    .lean();

  // Always fetch User records as fallback for missing name/class data
  const userFilter = {
    $and: [instFilter, { role: 'student' }]
  };
  const users = await User.find(userFilter)
    .select('firstName lastName name email admissionNumber rollNumber class section status institutionId institutionId createdAt')
    .sort({ createdAt: -1 })
    .limit(max)
    .lean();
  const userByAdmission = {};
  for (const u of users) {
    if (u.admissionNumber) userByAdmission[u.admissionNumber] = u;
  }

  if (students.length === 0) {
    try {
      const raw = await mongoose.connection.db
        .collection('students')
        .find(instFilter)
        .sort({ createdAt: -1 })
        .limit(max)
        .toArray();
      students = raw;
    } catch {
      // collection may not exist
    }
  }

  if (students.length === 0) {
    students = users;
  }

  // Merge User data into Student records to fill in missing name/class/section
  const merged = students.map((student) => {
    const doc = student?.toObject ? student.toObject() : { ...student };
    const admissionNum = doc.admissionNumber || doc.admissionNo || '';
    const user = userByAdmission[admissionNum];
    if (!user) return doc;

    const hasName = !!(doc.firstName || doc.lastName || doc.name || doc.fullName);
    const hasClass = !!(doc.classId?.name || doc.class || doc.classId);
    const hasSection = !!(doc.sectionId?.name || doc.section || doc.sectionId);

    if (!hasName) {
      const nameParts = (user.name || '').split(/\s+/).filter(Boolean);
      doc.firstName = nameParts[0] || 'Student';
      doc.lastName = nameParts.slice(1).join(' ') || '';
    }
    if (!hasClass && user.class) {
      doc.class = user.class;
    }
    if (!hasSection && user.section) {
      doc.section = user.section;
    }
    return doc;
  });

  return merged.map(mapStudentRecord);
}
