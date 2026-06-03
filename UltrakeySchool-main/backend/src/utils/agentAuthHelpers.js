import mongoose from 'mongoose';

/**
 * Find agent by JWT claims. DB may store _id as ObjectId while the schema uses String.
 */
export async function findAgentByAuthClaims(userId, email) {
  const Agent = (await import('../models/Agent.js')).default;
  const or = [];

  if (email) {
    or.push({ email: String(email).toLowerCase() });
  }

  if (userId) {
    const idStr = String(userId);
    or.push({ _id: idStr });
    if (mongoose.Types.ObjectId.isValid(idStr)) {
      or.push({ _id: new mongoose.Types.ObjectId(idStr) });
    }
  }

  if (!or.length) {
    return null;
  }

  return Agent.findOne({ $or: or }).lean();
}

export function buildAgentIdFilter(userId) {
  if (!userId) return null;
  const idStr = String(userId);
  const or = [{ _id: idStr }];
  if (mongoose.Types.ObjectId.isValid(idStr)) {
    or.push({ _id: new mongoose.Types.ObjectId(idStr) });
  }
  return { $or: or };
}
