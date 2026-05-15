import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * MongoDB Connection Configuration with Advanced Features
 * - Connection pooling and retry logic
 * - Performance monitoring
 * - Health checks
 * - Backup utilities
 * - Index management
 */

// Connection state tracking
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * MongoDB Connection Configuration with Optimization
 */
const connectDB = async () => {
  try {
    // Increase max listeners to prevent memory leak warning
    process.setMaxListeners(20);
    
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edusearch';
    
    const options = {
      // Connection Pool Settings
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 20, // Reduced from 100 to prevent memory issues
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 5,  // Reduced from 10
      maxIdleTimeMS: 600000, // Close idle connections after 10 minutes (was 30 seconds)
      
      // Timeout Settings
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Socket timeout
      connectTimeoutMS: 10000, // Connection timeout
      heartbeatFrequencyMS: 30000, // Heartbeat every 30 seconds (was 10 seconds)
      
      // Retry Settings
      retryWrites: true,
      retryReads: true,
      
      // Write Concern
      w: 'majority', // Wait for majority of replica set
      journal: true, // Wait for journal commit
      
      // Read Preference
      readPreference: 'primaryPreferred', // Read from primary, fallback to secondary
      
      // Compression
      compressors: ['zlib'], // Enable compression
      zlibCompressionLevel: 6, // Compression level (1-9)
      
      // Other Options
      autoIndex: process.env.NODE_ENV !== 'production', // Disable in production for performance
      autoCreate: true, // Auto-create collections
      
      // Application name for monitoring
      appName: 'EduSearch-Backend',
    };

    logger.info(`Attempting to connect to MongoDB...`);
    logger.info(`URI: ${mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`); // Hide password in logs

    const conn = await mongoose.connect(mongoURI, options);

    connectionAttempts = 0; // Reset on successful connection

    logger.info(`✅ MongoDB Connected Successfully`);
    logger.info(`   Host: ${conn.connection.host}`);
    logger.info(`   Database: ${conn.connection.name}`);
    logger.info(`   Port: ${conn.connection.port}`);
    logger.info(`   Pool Size: ${options.minPoolSize}-${options.maxPoolSize}`);
    logger.info(`   Read Preference: ${options.readPreference}`);

    // Setup event handlers
    setupEventHandlers();
    
    // Setup graceful shutdown
    setupGracefulShutdown();
    
    // Monitor connection pool in development
    if (process.env.NODE_ENV === 'development') {
      setupDebugMode();
    }

    // Create indexes after connection
    if (process.env.AUTO_CREATE_INDEXES !== 'false') {
      setTimeout(() => createIndexes().catch(err => {
        logger.warn('Index creation failed (non-critical):', err.message);
      }), 5000); // Delay to avoid startup bottleneck
    }

    return conn;
  } catch (error) {
    connectionAttempts++;
    logger.error(`❌ MongoDB connection error (attempt ${connectionAttempts}/${MAX_RETRY_ATTEMPTS}):`, error.message);
    
    // Retry connection
    if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
      logger.info(`Retrying connection in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectDB(); // Recursive retry
    } else {
      logger.error('Max connection attempts reached. Exiting...');
      process.exit(1);
    }
  }
};

/**
 * Setup connection event handlers
 */
const setupEventHandlers = () => {
  mongoose.connection.on('connected', () => {
    logger.info('📡 Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('❌ Mongoose connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('⚠️  Mongoose disconnected from MongoDB');
    
    // Attempt to reconnect
    if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
      logger.info('Attempting to reconnect...');
      setTimeout(() => connectDB(), RETRY_DELAY);
    }
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('🔄 Mongoose reconnected to MongoDB');
    connectionAttempts = 0;
  });

  mongoose.connection.on('close', () => {
    logger.info('🔌 Mongoose connection closed');
  });

  // Monitor connection pool
  mongoose.connection.on('fullsetup', () => {
    logger.info('🔗 Mongoose replica set fully connected');
  });

  mongoose.connection.on('all', () => {
    logger.info('✅ All replica set members connected');
  });
};

/**
 * Setup graceful shutdown handlers
 */
const setupGracefulShutdown = () => {
  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received. Closing MongoDB connection...`);
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed gracefully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  // Handle different termination signals
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart
  
  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    logger.error('Uncaught Exception:', error);
    await gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', async (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    await gracefulShutdown('UNHANDLED_REJECTION');
  });
};

/**
 * Setup debug mode for development
 */
const setupDebugMode = () => {
  mongoose.set('debug', (collectionName, method, query, doc, options) => {
    const logData = {
      collection: collectionName,
      method,
      query: JSON.stringify(query),
      options: options ? JSON.stringify(options) : undefined
    };
    
    // Only log if query takes longer than threshold
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      if (duration > 100) { // Log slow queries (>100ms)
        logger.warn(`🐌 Slow Query (${duration}ms):`, logData);
      } else {
        logger.debug(`Mongoose: ${collectionName}.${method}`, logData);
      }
    };
  });
};

/**
 * Create indexes for better query performance
 */
export const createIndexes = async () => {
  try {
    logger.info('📊 Creating database indexes...');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Helper function to safely create index
    const safeCreateIndex = async (collectionName, indexSpec, options) => {
      try {
        if (!collectionNames.includes(collectionName)) {
          logger.debug(`Collection ${collectionName} does not exist, skipping index creation`);
          return;
        }
        
        // Skip indexes that are already defined in schemas
        const skipIndexes = [
          { collection: 'users', field: 'email' },
          { collection: 'students', field: 'schoolId' },
          { collection: 'teachers', field: 'schoolId' },
          { collection: 'teachers', field: 'status' }
        ];
        
        const shouldSkip = skipIndexes.some(skip => 
          skip.collection === collectionName && 
          (indexSpec[skip.field] || Object.keys(indexSpec).includes(skip.field))
        );
        
        if (shouldSkip) {
          logger.debug(`Skipping index ${options.name || 'unnamed'} for ${collectionName} (already defined in schema)`);
          return;
        }
        
        await db.collection(collectionName).createIndex(indexSpec, options);
        logger.debug(`Created index ${options.name || 'unnamed'} for ${collectionName}`);
      } catch (error) {
        if (error.code === 85) { // Index already exists
          logger.debug(`Index ${options.name || 'unnamed'} already exists for ${collectionName}`);
        } else {
          logger.warn(`Failed to create index for ${collectionName}:`, error.message);
        }
      }
    };

    // User indexes
    await safeCreateIndex('users', { email: 1, tenant: 1 }, 
      { unique: true, background: true, name: 'email_tenant_unique' });
    await safeCreateIndex('users', { tenant: 1, role: 1, status: 1 }, 
      { background: true, name: 'tenant_role_status' });
    await safeCreateIndex('users', { createdAt: -1 }, 
      { background: true, name: 'created_at_desc' });

    // Student indexes
    await safeCreateIndex('students', { tenant: 1, admissionNumber: 1 }, 
      { unique: true, background: true, name: 'tenant_admission_unique' });
    await safeCreateIndex('students', { tenant: 1, class: 1, section: 1, status: 1 }, 
      { background: true, name: 'tenant_class_section_status' });
    await safeCreateIndex('students', { tenant: 1, status: 1, createdAt: -1 }, 
      { background: true, name: 'tenant_status_created' });

    // Teacher indexes
    await safeCreateIndex('teachers', { tenant: 1, employeeId: 1 }, 
      { unique: true, background: true, sparse: true, name: 'tenant_employee_unique' });
    await safeCreateIndex('teachers', { tenant: 1, subjects: 1, status: 1 }, 
      { background: true, name: 'tenant_subjects_status' });

    // Attendance indexes
    await safeCreateIndex('attendances', { tenant: 1, date: -1, class: 1, section: 1 }, 
      { background: true, name: 'tenant_date_class_section' });
    await safeCreateIndex('attendances', { tenant: 1, student: 1, date: -1 }, 
      { background: true, name: 'tenant_student_date' });
    await safeCreateIndex('attendances', { tenant: 1, status: 1, date: -1 }, 
      { background: true, name: 'tenant_status_date' });

    // Payment/Fee indexes
    await safeCreateIndex('payments', { tenant: 1, status: 1, createdAt: -1 }, 
      { background: true, name: 'tenant_status_created' });
    await safeCreateIndex('payments', { tenant: 1, student: 1, createdAt: -1 }, 
      { background: true, name: 'tenant_student_created' });
    await safeCreateIndex('payments', { tenant: 1, paymentMethod: 1, status: 1 }, 
      { background: true, name: 'tenant_method_status' });

    // Exam indexes
    await safeCreateIndex('exams', { tenant: 1, class: 1, date: -1 }, 
      { background: true, name: 'tenant_class_date' });
    await safeCreateIndex('exams', { tenant: 1, status: 1, date: -1 }, 
      { background: true, name: 'tenant_status_date' });

    // Session indexes with TTL
    await safeCreateIndex('sessions', { expiresAt: 1 }, 
      { expireAfterSeconds: 0, background: true, name: 'ttl_expires_at' });
    await safeCreateIndex('sessions', { userId: 1, createdAt: -1 }, 
      { background: true, name: 'user_created' });

    // Notification indexes with TTL
    await safeCreateIndex('notifications', { createdAt: 1 }, 
      { expireAfterSeconds: 2592000, background: true, name: 'ttl_30_days' });
    await safeCreateIndex('notifications', { userId: 1, read: 1, createdAt: -1 }, 
      { background: true, name: 'user_read_created' });

    // Audit log indexes with TTL
    await safeCreateIndex('auditlogs', { createdAt: 1 }, 
      { expireAfterSeconds: 7776000, background: true, name: 'ttl_90_days' });
    await safeCreateIndex('auditlogs', { tenant: 1, userId: 1, createdAt: -1 }, 
      { background: true, name: 'tenant_user_created' });

    // Text search indexes
    await safeCreateIndex('students', { firstName: 'text', lastName: 'text', email: 'text', admissionNumber: 'text' }, 
      { background: true, name: 'text_search', weights: { firstName: 10, lastName: 10, email: 5, admissionNumber: 8 } });
    await safeCreateIndex('teachers', { firstName: 'text', lastName: 'text', email: 'text', employeeId: 'text' }, 
      { background: true, name: 'text_search' });

    // Geospatial indexes (for location-based features)
    await safeCreateIndex('schools', { location: '2dsphere' }, 
      { background: true, name: 'location_geo', sparse: true });

    logger.info('✅ Database indexes created successfully');
  } catch (error) {
    logger.error('❌ Error creating indexes:', error.message);
  }
};

/**
 * Drop all indexes (use with caution!)
 */
export const dropAllIndexes = async () => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      await mongoose.connection.db.collection(collection.name).dropIndexes();
      logger.info(`Dropped indexes for collection: ${collection.name}`);
    }
    
    logger.info('All indexes dropped successfully');
  } catch (error) {
    logger.error('Error dropping indexes:', error);
  }
};

/**
 * Get database statistics
 */
export const getDBStats = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    return {
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      collections: collections.length,
      dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
      storageSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`,
      indexes: stats.indexes,
      indexSize: `${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`,
      avgObjSize: `${(stats.avgObjSize / 1024).toFixed(2)} KB`,
      documents: stats.objects,
      views: stats.views || 0,
      freeStorageSize: stats.freeStorageSize ? `${(stats.freeStorageSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'
    };
  } catch (error) {
    logger.error('Error getting DB stats:', error);
    return null;
  }
};

/**
 * Get collection statistics
 */
export const getCollectionStats = async (collectionName) => {
  try {
    const stats = await mongoose.connection.db.collection(collectionName).stats();
    
    return {
      collection: collectionName,
      count: stats.count,
      size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      storageSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`,
      indexes: stats.nindexes,
      indexSize: `${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`,
      avgObjSize: `${(stats.avgObjSize / 1024).toFixed(2)} KB`
    };
  } catch (error) {
    logger.error(`Error getting stats for collection ${collectionName}:`, error);
    return null;
  }
};

/**
 * Health check for database
 */
export const checkDBHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    // Perform a simple query to verify connection
    if (state === 1) {
      await mongoose.connection.db.admin().ping();
    }

    return {
      status: states[state],
      healthy: state === 1,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Get connection pool stats
 */
export const getPoolStats = () => {
  try {
    const pool = mongoose.connection.client?.topology?.s?.pool;
    
    if (!pool) {
      return { available: 'N/A', message: 'Pool stats not available' };
    }

    return {
      totalConnections: pool.totalConnectionCount || 0,
      availableConnections: pool.availableConnectionCount || 0,
      pendingRequests: pool.waitQueueSize || 0,
      maxPoolSize: pool.options?.maxPoolSize || 0,
      minPoolSize: pool.options?.minPoolSize || 0
    };
  } catch (error) {
    logger.error('Error getting pool stats:', error);
    return { error: error.message };
  }
};

/**
 * Optimize database (compact and reindex)
 */
export const optimizeDatabase = async () => {
  try {
    logger.info('Starting database optimization...');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      // Compact collection
      await mongoose.connection.db.command({
        compact: collection.name,
        force: true
      });
      
      // Reindex collection
      await mongoose.connection.db.collection(collection.name).reIndex();
      
      logger.info(`Optimized collection: ${collection.name}`);
    }
    
    logger.info('Database optimization completed');
    return { success: true, message: 'Database optimized successfully' };
  } catch (error) {
    logger.error('Error optimizing database:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Backup database (export to JSON)
 */
export const backupDatabase = async (outputPath = './backup') => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    for (const collection of collections) {
      const data = await mongoose.connection.db.collection(collection.name).find({}).toArray();
      const filename = path.join(outputPath, `${collection.name}_${timestamp}.json`);
      
      fs.writeFileSync(filename, JSON.stringify(data, null, 2));
      logger.info(`Backed up collection: ${collection.name} (${data.length} documents)`);
    }
    
    logger.info(`Database backup completed: ${outputPath}`);
    return { success: true, path: outputPath, timestamp };
  } catch (error) {
    logger.error('Error backing up database:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clear all collections (use with extreme caution!)
 */
export const clearDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot clear database in production!');
  }
  
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      await mongoose.connection.db.collection(collection.name).deleteMany({});
      logger.info(`Cleared collection: ${collection.name}`);
    }
    
    logger.info('Database cleared successfully');
    return { success: true, message: 'Database cleared' };
  } catch (error) {
    logger.error('Error clearing database:', error);
    return { success: false, error: error.message };
  }
};

export default connectDB;
