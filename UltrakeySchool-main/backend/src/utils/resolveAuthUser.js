import User from '../models/User.js';
import { findAgentByAuthClaims } from './agentAuthHelpers.js';

function mapAgentPrincipal(agent) {
  const isActive = agent.status === 'Active';
  return {
    _id: agent._id,
    email: agent.email,
    name: agent.name,
    role: 'agent',
    plan: 'premium',
    permissions: ['*'],
    modules: [],
    institutionId: agent.institutionId,
    status: isActive ? 'active' : 'inactive',
    isActive
  };
}

/**
 * Resolve authenticated principal from JWT payload (User, UserCredential, Agent, Student).
 */
export async function resolveAuthenticatedUser(decoded) {
  const userId = decoded?.sub || decoded?.id;
  const email = decoded?.email;
  const tokenRole = (decoded?.role || '').toLowerCase();

  if (!userId && !email) {
    return null;
  }

  if (tokenRole === 'agent') {
    const agent = await findAgentByAuthClaims(userId, email);
    return agent ? mapAgentPrincipal(agent) : null;
  }

  let user = userId ? await User.findById(userId).select('-password').lean() : null;

  if (!user) {
    const UserCredential = (await import('../models/UserCredential.js')).default;
    user = userId
      ? await UserCredential.findOne({ _id: userId }).lean()
      : email
        ? await UserCredential.findOne({ email: email.toLowerCase() }).lean()
        : null;

    if (user) {
      user = {
        _id: user._id,
        email: user.email,
        name: user.fullName || user.name,
        role: user.role,
        plan: 'basic',
        permissions: user.permissions || [],
        modules: [],
        institutionId: user.institutionId || user.institution,
        institutionCode: user.institutionCode || user.instituteCode || user.schoolCode,
        status: user.status || 'active',
        isActive: user.status === 'active'
      };
    }
  }

  if (!user) {
    const agent = await findAgentByAuthClaims(userId, email);
    if (agent) {
      return mapAgentPrincipal(agent);
    }
  }

  if (!user) {
    const Student = (await import('../models/Student.js')).default;
    const student =
      (userId && (await Student.findById(userId))) ||
      (email && (await Student.findOne({ email: email.toLowerCase() })));

    if (student) {
      return {
        _id: student._id,
        email: student.email,
        name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        role: 'student',
        plan: 'basic',
        permissions: [],
        modules: [],
        institutionId: student.institutionId,
        status: student.status || 'active',
        isActive: true
      };
    }
  }

  return user;
}

export function attachUserToRequest(req, user, decoded) {
  req.user = {
    id: user._id?.toString?.() || user._id,
    userId: user._id?.toString?.() || user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    plan: user.plan,
    permissions: user.permissions || [],
    modules: user.modules || [],
    institutionId: user.institutionId,
    institutionCode: user.institutionCode || user.instituteCode || user.schoolCode,
    institution: decoded?.institution || user.institutionId,
    tenant: user.institutionId || decoded?.institution,
    avatar: user.avatar,
    status: user.status || (user.isActive ? 'active' : 'inactive')
  };

  if (user.institutionId || decoded?.institution) {
    req.tenantId = user.institutionId || decoded.institution;
    req.user.institution = decoded?.institution || user.institutionId;
  }
}
