import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const updateDatabaseExportFile = async () => {
  try {
    logger.info('[UpdateExport] Initiating database export and document counts analysis...');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    const deprecatedCollections = [
      'scholarships',
      'scholarshipapplications',
      'bannedips',
      'uservisibilities',
      'oauthaccounts',
      'otps',
      'apikeys',
      'widgettemplates',
      'connectedapps',
      'teacherlibraries',
      'logincredentials',
      'studentlibraries',
      'superadminmenuitems'
    ].map(name => name.toLowerCase());

    const activeCollectionNames = collectionNames.filter(name => !deprecatedCollections.includes(name.toLowerCase()));

    const exportData = {};
    let totalDocs = 0;
    const statsList = [];

    for (const name of activeCollectionNames) {
      const documents = await db.collection(name).find({}).toArray();
      exportData[name] = documents;
      totalDocs += documents.length;
      statsList.push({ name, count: documents.length });
    }

    // Sort stats by count descending
    statsList.sort((a, b) => b.count - a.count);

    logger.debug(`Database statistics:`);
    statsList.forEach(stat => {
      logger.debug(`   Collection: ${stat.name.padEnd(35)} → ${stat.count} documents`);
    });
    logger.info(`[UpdateExport] Database export: ${activeCollectionNames.length} collections, ${totalDocs} documents total.`);

    const exportFilePath = path.join(__dirname, '..', '..', 'edusearch_database_export.json');
    fs.writeFileSync(exportFilePath, JSON.stringify(exportData, null, 2));
    logger.info(`[UpdateExport] Successfully wrote updated database export to: ${exportFilePath}`);
  } catch (error) {
    logger.error('[UpdateExport] Failed to update database export file:', error);
  }
};
