import mongoose from 'mongoose';
import logger from '../utils/logger.js';

let schedulerInterval = null;
const POLL_INTERVAL_MS = 15_000; // check every 15 seconds for faster detection

/**
 * Start the maintenance scheduler.
 * It runs every POLL_INTERVAL_MS and checks BOTH:
 * 1. The `maintenance` settings document for startTime/endTime auto-trigger
 * 2. The `scheduled_maintenance` document for schedule-based auto-trigger
 */
export const startMaintenanceScheduler = () => {
  if (schedulerInterval) {
    logger.warn('[MaintenanceScheduler] Already running — clearing and restarting');
    clearInterval(schedulerInterval);
  }

  logger.info('[MaintenanceScheduler] Starting — polling every 15s');

  schedulerInterval = setInterval(async () => {
    try {
      await processMaintenanceCheck();
    } catch (err) {
      logger.error('[MaintenanceScheduler] Error processing:', err.message);
    }
  }, POLL_INTERVAL_MS);

  // Also run immediately on start
  processMaintenanceCheck().catch(err => {
    logger.error('[MaintenanceScheduler] Initial run error:', err.message);
  });
};

/**
 * Stop the maintenance scheduler.
 */
export const stopMaintenanceScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info('[MaintenanceScheduler] Stopped');
  }
};

/**
 * Core logic — runs on each tick:
 * PATH A: Check `maintenance` settings for startTime/endTime auto-trigger
 * PATH B: Check `scheduled_maintenance` entries for schedule-based auto-trigger
 */
async function processMaintenanceCheck() {
  const db = mongoose.connection.db;
  if (!db) {
    logger.warn('[MaintenanceScheduler] DB not ready yet');
    return;
  }

  const now = new Date();
  logger.debug(`[MaintenanceScheduler] Tick at ${now.toISOString()}`);

  // ════════════════════════════════════════════════
  // PATH A: Check `maintenance` settings
  // ════════════════════════════════════════════════
  const maintDoc = await db.collection('platformsettings').findOne({ _id: 'maintenance' });
  if (maintDoc?.settings) {
    const s = maintDoc.settings;

    // A1: Auto-START — only if startTime just arrived (within 5 min window)
    // This prevents re-enabling when the user manually disables maintenance
    // after startTime has already passed.
    if (!s.enabled && s.startTime) {
      const startDt = new Date(s.startTime);
      const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
      if (!isNaN(startDt.getTime()) && startDt >= fiveMinAgo && startDt <= now) {
        logger.info(
          `[MaintenanceScheduler] ⏰ Auto-starting maintenance — startTime ${s.startTime} just arrived`
        );
        await setMaintenanceEnabled(true, s.message || 'System is currently under scheduled maintenance.');
      }
    }

    // A2: Auto-STOP — if enabled but endTime has passed
    if (s.enabled && s.endTime) {
      const endDt = new Date(s.endTime);
      if (!isNaN(endDt.getTime()) && endDt <= now) {
        logger.info(
          `[MaintenanceScheduler] ⏰ Auto-stopping maintenance — endTime ${s.endTime} reached`
        );
        await setMaintenanceEnabled(false);
      }
    }
  }

  // ════════════════════════════════════════════════
  // PATH B: Check `scheduled_maintenance` entries
  // ════════════════════════════════════════════════
  const schedDoc = await db.collection('platformsettings').findOne({ _id: 'scheduled_maintenance' });
  if (!schedDoc || !schedDoc.schedules || schedDoc.schedules.length === 0) {
    return; // no scheduled maintenance entries
  }

  let needsSave = false;
  const updatedSchedules = [...schedDoc.schedules]; // shallow copy

  // B1: Auto-START — 'scheduled' items whose start time has arrived
  for (let i = 0; i < updatedSchedules.length; i++) {
    const schedule = updatedSchedules[i];
    if (schedule.status !== 'scheduled') continue;

    const startDateTime = new Date(`${schedule.startDate}T${schedule.startTime}:00`);
    if (isNaN(startDateTime.getTime()) || startDateTime > now) continue;

    logger.info(
      `[MaintenanceScheduler] ⏰ Auto-starting schedule "${schedule.title || schedule._id}" — ${schedule.startDate}T${schedule.startTime}`
    );

    await setMaintenanceEnabled(true, schedule.description || schedule.title || 'Scheduled maintenance');

    updatedSchedules[i] = {
      ...schedule,
      status: 'in-progress',
      startedAt: now,
      updatedAt: now
    };
    needsSave = true;
  }

  // B2: Auto-STOP — 'in-progress' items whose end time has passed
  for (let i = 0; i < updatedSchedules.length; i++) {
    const schedule = updatedSchedules[i];
    if (schedule.status !== 'in-progress') continue;

    const endDateTime = new Date(`${schedule.startDate}T${schedule.endTime}:00`);
    if (isNaN(endDateTime.getTime()) || endDateTime > now) continue;

    logger.info(
      `[MaintenanceScheduler] ⏰ Auto-stopping schedule "${schedule.title || schedule._id}" — end ${schedule.startDate}T${schedule.endTime}`
    );

    await setMaintenanceEnabled(false);

    updatedSchedules[i] = {
      ...schedule,
      status: 'completed',
      completedAt: now,
      updatedAt: now
    };
    needsSave = true;
  }

  if (needsSave) {
    await db.collection('platformsettings').updateOne(
      { _id: 'scheduled_maintenance' },
      { $set: { schedules: updatedSchedules, updatedAt: now } }
    );
    logger.info('[MaintenanceScheduler] Schedule status changes saved');
  }
}

/**
 * Set maintenance mode enabled/disabled in the platform settings.
 * Preserves all existing settings fields.
 */
async function setMaintenanceEnabled(enabled, message) {
  const db = mongoose.connection.db;
  const currentDoc = await db.collection('platformsettings').findOne({ _id: 'maintenance' });
  const currentSettings = currentDoc?.settings || {};

  const updatedSettings = {
    ...currentSettings,
    enabled,
    updatedAt: new Date()
  };

  if (enabled && message) {
    updatedSettings.message = message;
  }

  await db.collection('platformsettings').updateOne(
    { _id: 'maintenance' },
    { $set: { settings: updatedSettings } },
    { upsert: true }
  );

  logger.info(`[MaintenanceScheduler] ✅ Maintenance ${enabled ? 'ENABLED' : 'DISABLED'} via scheduler`);
}

export default {
  startMaintenanceScheduler,
  stopMaintenanceScheduler
};
