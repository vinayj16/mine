import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const maintenanceGuard = async (req, res, next) => {
  try {
    const skipPaths = ['/auth/', '/super-admin/settings/maintenance'];
    if (skipPaths.some(p => req.path.includes(p))) {
      return next();
    }

    const db = mongoose.connection.db;
    const doc = await db.collection('platformsettings').findOne({ _id: 'maintenance' });

    if (!doc || !doc.settings || !doc.settings.enabled) {
      return next();
    }

    const settings = doc.settings;
    const now = new Date();

    // If startTime is set and in the future → scheduled, not active yet → allow
    if (settings.startTime) {
      const startDt = new Date(settings.startTime);
      if (!isNaN(startDt.getTime()) && startDt > now) {
        return next();
      }
    }

    // If endTime is set and has passed → maintenance window is over → allow
    if (settings.endTime) {
      const endDt = new Date(settings.endTime);
      if (!isNaN(endDt.getTime()) && endDt <= now) {
        return next();
      }
    }

    // Superadmin bypass — always allow superadmin through
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ultrakey_jwt_secret_2024');
        const role = (decoded.role || '').toLowerCase();
        if (role === 'superadmin' || role === 'super_admin') {
          return next();
        }
      } catch {
        // Token invalid — fall through to maintenance block
      }
    }

    return res.status(503).json({
      success: false,
      message: 'Maintenance',
      data: {
        maintenance: true,
        message: settings.message || 'System is currently under maintenance. We\'ll be back shortly.'
      }
    });
  } catch (error) {
    logger.error('Maintenance guard error:', error);
    return next();
  }
};

export default maintenanceGuard;
