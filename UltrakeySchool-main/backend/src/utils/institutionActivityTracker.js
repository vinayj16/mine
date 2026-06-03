import logger from './logger.js';
import Institution from '../models/Institution.js';

/**
 * Record a user login against the institution's daily activity log.
 * - Skips silently if no institution id
 * - Increments totalLogins and lastLoginAt atomically
 * - Appends user to today's bucket only if not already there
 * - Trims history to last 90 days
 * - Never throws — caller can fire-and-forget
 */
const trackInstitutionLogin = async ({ institutionId, userId, name, role }) => {
  if (!institutionId || !userId) return;
  try {
    const InstitutionModel = Institution;
    const today = new Date();
    const dayKey = today.toISOString().slice(0, 10);
    const baseOps = {
      $inc: { 'loginActivity.totalLogins': 1 },
      $set: { 'loginActivity.lastLoginAt': today }
    };
    // Case 1: today's bucket does NOT exist -> create it with this user
    await InstitutionModel.updateOne(
      { _id: institutionId.toString(), 'loginActivity.dailyLogins.date': { $ne: dayKey } },
      Object.assign({}, baseOps, {
        $push: {
          'loginActivity.dailyLogins': {
            date: dayKey,
            count: 1,
            users: [{ userId: String(userId), name, role, timestamp: today }]
          }
        }
      })
    );
    // Case 2: today's bucket exists but user is new today -> append
    await InstitutionModel.updateOne(
      { _id: institutionId.toString() },
      Object.assign({}, baseOps, {
        $push: { 'loginActivity.dailyLogins.$[day].users': { userId: String(userId), name, role, timestamp: today } },
        $inc: { 'loginActivity.dailyLogins.$[day].count': 1 }
      }),
      { arrayFilters: [{ 'day.date': dayKey, 'day.users.userId': { $ne: String(userId) } }] }
    );
    // Trim history to last 90 days
    const cutoff = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await InstitutionModel.updateOne(
      { _id: institutionId.toString() },
      { $pull: { 'loginActivity.dailyLogins': { date: { $lt: cutoff } } } }
    );
  } catch (err) {
    logger.warn('trackInstitutionLogin failed:', err.message);
  }
};

export default trackInstitutionLogin;

