import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edusearch';
const OUTPUT_FILE = path.join(__dirname, 'edusearch_database_export.json');

async function exportDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('📊 Fetching all collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log(`Found ${collectionNames.length} collections`);

    const exportData = {
      metadata: {
        database: mongoose.connection.name,
        analyzedAt: new Date().toISOString(),
        totalCollections: collectionNames.length,
        totalDocuments: 0
      },
      collections: {}
    };

    for (const collectionName of collectionNames) {
      console.log(`📦 Exporting collection: ${collectionName}...`);
      const documents = await mongoose.connection.db.collection(collectionName).find({}).toArray();
      
      exportData.collections[collectionName] = {
        count: documents.length,
        documents: documents
      };
      
      exportData.metadata.totalDocuments += documents.length;
      console.log(`   → ${documents.length} documents`);
    }

    console.log('\n💾 Writing to file...');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(exportData, null, 2));

    console.log(`\n✅ Export complete!`);
    console.log(`   File: ${OUTPUT_FILE}`);
    console.log(`   Collections: ${exportData.metadata.totalCollections}`);
    console.log(`   Total Documents: ${exportData.metadata.totalDocuments}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

exportDatabase();
