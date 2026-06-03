import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import hpp from 'hpp';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import logger from './utils/logger.js';
import { connectRedis } from './config/redis.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { globalLimiter, authLimiter, writeLimiter } from './middleware/rateLimiter.js';
import aiRateLimiter from './middleware/aiRateLimiter.js';
import { cacheMiddleware, invalidateRelatedCaches, clearCache, getCacheStats } from './middleware/cacheMiddleware.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import classRoutes from './routes/classRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import syllabusRoutes from './routes/syllabusRoutes.js';
import classRoomRoutes from './routes/classRoomRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import instituteAnalyticsRoutes from './routes/instituteAnalyticsRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import examRoutes from './routes/examRoutes.js';
import guardianRoutes from './routes/guardianRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import hostelRoutes from './routes/hostelRoutes.js';
import academicReasonRoutes from './routes/academicReasonRoutes.js';
import academicEngineRoutes from './routes/academicEngineRoutes.js';
import addonRoutes from './routes/addonRoutes.js';
import adminAlertRoutes from './routes/adminAlertRoutes.js';
import admissionRoutes from './routes/admissionRoutes.js';
import advancedProctoringRoutes from './routes/advancedProctoringRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import commissionRoutes from './routes/commissionRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import transportRoutes from './routes/transportRoutes.js';
import transportRouteRoutes from './routes/transportRouteRoutes.js';
import transportReportRoutes from './routes/transportReportRoutes.js';
import transportAssignmentRoutes from './routes/transportAssignmentRoutes.js';
import transportFeeRoutes from './routes/transportFeeRoutes.js';
import hostelFeeRoutes from './routes/hostelFeeRoutes.js';
import pickupPointRoutes from './routes/pickupPointRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import vehicleMaintenanceRoutes from './routes/vehicleMaintenanceRoutes.js';
import maintenanceGuard from './middleware/maintenanceGuard.js';
import calendarRoutes from './routes/calendarRoutes.js';
import hrmRoutes from './routes/hrmRoutes.js';
import staffDocumentRoutes from './routes/staffDocumentRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import planChangeRequestRoutes from './routes/planChangeRequestRoutes.js';
import institutionRouter from './routes/institutionRoutes.js';
import schoolRouter from './routes/schoolRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userManagementRoutes from './routes/userManagementRoutes.js';
import libraryRoutes from './routes/libraryRoutes.js';
import sportsRoutes from './routes/sportsRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import supportTicketsRoutes from './routes/supportTicketsRoutes.js';
import notesRoutes from './routes/notesRoutes.js';
import filesRoutes from './routes/filesRoutes.js';
import emailsRoutes from './routes/emailsRoutes.js';
import studentAttendanceRoutes from './routes/studentAttendanceRoutes.js';
import rolesRoutes from './routes/rolesRoutes.js';
import leaveReportsRoutes from './routes/leaveReportsRoutes.js';
import resultsRoutes from './routes/resultsRoutes.js';
import gradesRoutes from './routes/gradesRoutes.js';
import examSchedulesRoutes from './routes/examSchedulesRoutes.js';
import institutionSetupRoutes from './routes/institutionSetupRoutes.js';
import institutionManagementRoutes from './routes/institutionManagementRoutes.js';
import institutionSettingsRoutes from './routes/institutionSettingsRoutes.js';
import communicationRoutes from './routes/communicationRoutes.js';
import communicationRoutesNew from './routes/communicationRoutesNew.js';
import userProfileRoutes from './routes/userProfileRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import todoRoutes from './routes/todoRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';
import callLogRoutes from './routes/callLogRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import paymentGatewayRoutes from './routes/paymentGatewayRoutes.js';
import schoolSettingsRoutes from './routes/schoolSettingsRoutes.js';
import homeworkRoutes from './routes/homeworkRoutes.js';
import contactMessagesRoutes from './routes/contactMessagesRoutes.js';
import emailSettingsRoutes from './routes/emailSettingsRoutes.js';
import ptmRoutes from './routes/ptmRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import platformConfigRoutes from './routes/platformConfigRoutes.js';
import aiChatRoutes from './routes/aiChatRoutes.js';
import { startMaintenanceScheduler } from './services/maintenanceScheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const BASE_PORT = parseInt(process.env.PORT) || 5000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Initialize server function
const initializeServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start the maintenance scheduler (auto-triggers scheduled maintenance)
    startMaintenanceScheduler();

    // Connect to Redis (non-critical — app works without it)
    try {
      const redisClient = await connectRedis();
      if (redisClient) {
        logger.info('Redis connected successfully');
      } else {
        logger.info('Cache fallback active: using in-memory cache');
      }
    } catch (err) {
      logger.warn('Redis connection failed (non-critical):', err.message);
    }

    // Middleware
    app.use(helmet({
      contentSecurityPolicy: false, // Disabled for frontend compatibility
      crossOriginEmbedderPolicy: false
    }));
    app.use(cors({
      origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'Cache-Control']
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(compression({
      level: 6,
      threshold: 1024, // Only compress responses > 1KB
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      }
    }));
    app.use(hpp());
    app.use(morgan('dev'));

    // Trust proxy for correct IP detection behind reverse proxies
    app.set('trust proxy', 1);

    // Request timeout middleware (30 seconds)
    app.use((req, res, next) => {
      res.setTimeout(30000, () => {
        logger.warn(`[Timeout] Request timed out: ${req.method} ${req.originalUrl} from ${req.ip}`);
        res.status(503).json({
          success: false,
          error: 'Request timed out. Please try again.',
          code: 'REQUEST_TIMEOUT'
        });
      });
      next();
    });

    // Serve uploaded files (profile images, documents, etc.)
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    app.use('/uploads', express.static(uploadsDir));

    // Global rate limiter — protects all API routes
    app.use(`/api/${API_VERSION}`, globalLimiter);

    // Maintenance guard (runs before all API routes, except auth and maintenance settings)
    app.use(`/api/${API_VERSION}`, (req, res, next) => {
      if (req.path.startsWith('/auth/') || req.path.startsWith('/health/') || req.path.includes('/super-admin/settings/maintenance')) {
        return next();
      }
      return maintenanceGuard(req, res, next);
    });

    // API cache middleware — caches GET responses automatically
    app.use(`/api/${API_VERSION}`, cacheMiddleware);

    // API Routes
    app.use(`/api/${API_VERSION}/health`, healthRoutes);
    app.use(`/api/${API_VERSION}/auth`, authLimiter, authRoutes);
    app.use(`/api/${API_VERSION}/admin`, adminRoutes);
    app.use(`/api/${API_VERSION}/students`, studentRoutes);
    app.use(`/api/${API_VERSION}/teachers`, teacherRoutes);
    app.use(`/api/${API_VERSION}/classes`, classRoutes);
    app.use(`/api/${API_VERSION}/classrooms`, classRoomRoutes);
    app.use(`/api/${API_VERSION}/subjects`, subjectRoutes);
    app.use(`/api/${API_VERSION}/syllabi`, syllabusRoutes);
    app.use(`/api/${API_VERSION}/dashboard`, dashboardRoutes);
    app.use(`/api/${API_VERSION}/drivers`, driverRoutes);
    app.use(`/api/${API_VERSION}/analytics`, analyticsRoutes);
    app.use(`/api/${API_VERSION}/analytics`, instituteAnalyticsRoutes);
    app.use(`/api/${API_VERSION}/finance`, financeRoutes);
    app.use(`/api/${API_VERSION}/fees`, feeRoutes);
    app.use(`/api/${API_VERSION}/attendance`, attendanceRoutes);
    app.use(`/api/${API_VERSION}/exams`, examRoutes);
    app.use(`/api/${API_VERSION}/guardians`, guardianRoutes);
    app.use(`/api/${API_VERSION}/class-timetables`, timetableRoutes);
    app.use(`/api/${API_VERSION}/reports`, reportRoutes);
    app.use(`/api/${API_VERSION}/hostel`, hostelRoutes);
    app.use(`/api/${API_VERSION}/academic-reason`, academicReasonRoutes);
    app.use(`/api/${API_VERSION}/academic-engine`, academicEngineRoutes);
    app.use(`/api/${API_VERSION}/addons`, addonRoutes);
    app.use(`/api/${API_VERSION}/admin-alerts`, adminAlertRoutes);
    app.use(`/api/${API_VERSION}/admissions`, admissionRoutes);
    app.use(`/api/${API_VERSION}/advanced-proctoring`, advancedProctoringRoutes);
    app.use(`/api/${API_VERSION}/agents`, agentRoutes);
    app.use(`/api/${API_VERSION}/super-admin`, superAdminRoutes);
    app.use(`/api/${API_VERSION}/commissions`, commissionRoutes);
    app.use(`/api/${API_VERSION}/branches`, branchRoutes);
    app.use(`/api/${API_VERSION}/transport/assignments`, transportAssignmentRoutes);
    app.use(`/api/${API_VERSION}/transport/reports`, transportReportRoutes);
    app.use(`/api/${API_VERSION}/transport/pickup-points`, pickupPointRoutes);
    app.use(`/api/${API_VERSION}/transport/routes`, transportRouteRoutes);
    app.use(`/api/${API_VERSION}/transport`, transportRoutes);
    app.use(`/api/${API_VERSION}/transport-fees`, transportFeeRoutes);
    app.use(`/api/${API_VERSION}/vehicle-maintenance`, vehicleMaintenanceRoutes);
    app.use(`/api/${API_VERSION}/hostel-fees`, hostelFeeRoutes);
    app.use(`/api/${API_VERSION}/calendar`, calendarRoutes);
    app.use(`/api/${API_VERSION}/user-profiles`, userProfileRoutes);
    app.use(`/api/${API_VERSION}/hrm`, hrmRoutes);
    app.use(`/api/${API_VERSION}/staff-documents`, staffDocumentRoutes);
    app.use(`/api/${API_VERSION}/notifications`, notificationRoutes);
    app.use(`/api/${API_VERSION}/notices`, noticeRoutes);
    app.use(`/api/${API_VERSION}/users`, userManagementRoutes);
    app.use(`/api/${API_VERSION}/library`, libraryRoutes);
    app.use(`/api/${API_VERSION}/inventory`, inventoryRoutes);
    app.use(`/api/${API_VERSION}/sports`, sportsRoutes);
    app.use(`/api/${API_VERSION}/support-tickets`, supportTicketsRoutes);
app.use(`/api/${API_VERSION}/support`, supportTicketsRoutes);
    app.use(`/api/${API_VERSION}/notes`, notesRoutes);
    app.use(`/api/${API_VERSION}/files`, filesRoutes);
    app.use(`/api/${API_VERSION}/emails`, emailsRoutes);
    app.use(`/api/${API_VERSION}/student-attendance`, studentAttendanceRoutes);
    app.use(`/api/${API_VERSION}/roles`, rolesRoutes);
    app.use(`/api/${API_VERSION}/leave-reports`, leaveReportsRoutes);
    app.use(`/api/${API_VERSION}/results`, resultsRoutes);
    app.use(`/api/${API_VERSION}/grades`, gradesRoutes);
    app.use(`/api/${API_VERSION}/exam-schedules`, examSchedulesRoutes);
    app.use(`/api/${API_VERSION}/institution-setup`, institutionSetupRoutes);
    app.use(`/api/${API_VERSION}/institution-management`, institutionManagementRoutes);
    app.use(`/api/${API_VERSION}/institutions`, institutionRouter);
    app.use(`/api/${API_VERSION}/institution`, institutionRouter);
    app.use(`/api/${API_VERSION}/institution-settings`, institutionSettingsRoutes);
    app.use(`/api/${API_VERSION}/schools`, schoolRouter);
    app.use(`/api/${API_VERSION}/school-settings`, schoolSettingsRoutes);
    app.use(`/api/${API_VERSION}/plan-change-requests`, planChangeRequestRoutes);
    app.use(`/api/${API_VERSION}/subscriptions`, subscriptionRoutes);
    app.use(`/api/${API_VERSION}/events`, eventRoutes);
    app.use(`/api/${API_VERSION}/todos`, todoRoutes);
    app.use(`/api/${API_VERSION}/communication`, communicationRoutes);
    app.use(`/api/${API_VERSION}/communications`, communicationRoutesNew);
    app.use(`/api/${API_VERSION}/upload`, uploadRoutes);
    app.use(`/api/${API_VERSION}/chat`, chatRoutes);
    app.use(`/api/${API_VERSION}/call-logs`, callLogRoutes);
    app.use(`/api/${API_VERSION}/audit`, auditRoutes);
    app.use(`/api/${API_VERSION}/testimonials`, testimonialRoutes);
    app.use(`/api/${API_VERSION}/homework`, homeworkRoutes);
    app.use(`/api/${API_VERSION}/payment-gateways`, paymentGatewayRoutes);
    app.use(`/api/${API_VERSION}/contact-messages`, contactMessagesRoutes);
    app.use(`/api/${API_VERSION}/email-settings`, emailSettingsRoutes);
    app.use(`/api/${API_VERSION}/ptm`, ptmRoutes);
    app.use(`/api/${API_VERSION}/blogs`, blogRoutes);
    app.use(`/api/${API_VERSION}/messages`, messageRoutes);
    app.use(`/api/${API_VERSION}/platform/config`, platformConfigRoutes);
    app.use(`/api/${API_VERSION}/ai`, aiRateLimiter, aiChatRoutes);

    // Backward-compatible aliases for frontend
    app.use(`/api/${API_VERSION}/user`, userProfileRoutes);
    app.use(`/api/${API_VERSION}/settings`, userProfileRoutes);
    app.use(`/api/${API_VERSION}/permissions`, userManagementRoutes);

    // Root API endpoint
    app.get(`/api/${API_VERSION}`, (req, res) => {
      res.json({
        success: true,
        message: 'EduManage API is running',
        version: API_VERSION,
        endpoints: {
          health: `/api/${API_VERSION}/health`,
          auth: `/api/${API_VERSION}/auth`,
          students: `/api/${API_VERSION}/students`,
          teachers: `/api/${API_VERSION}/teachers`,
          library: `/api/${API_VERSION}/library`,
          docs: '/api/v1/docs'
        }
      });
    });

    // Root test endpoint
    app.get(`/api/${API_VERSION}/ping`, (req, res) => {
      try {
        console.log('[Server] Ping endpoint called!');
        res.json({ success: true, message: 'Backend is running!' });
      } catch (error) {
        console.error('Ping endpoint error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.use(notFound);
    app.use(errorHandler);

    // Start server on BASE_PORT only. Do NOT fallback to other ports.
    const startServer = (port) => {
      return new Promise((resolve, reject) => {
        const httpServer = createServer(app);
        // Set up Socket.io with CORS
        const io = new Server(httpServer, {
          cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
          }
        });

        // Import and set up socket namespaces
        import('./sockets/chatSocket.js').then(module => {
          const chatSocketHandler = module.default;
          chatSocketHandler(io);
        });

        import('./sockets/callSocket.js').then(module => {
          const callSocketHandler = module.default;
          callSocketHandler(io);
        });

        // Make io accessible globally for use in routes
        global.io = io;

        httpServer.listen(port, () => {
          console.log(`[Server] Running on port ${port}`);
          console.log(`[Server] API: http://localhost:${port}/api/${API_VERSION}`);
          console.log('[Server] Socket.io ready for connections');
          resolve(httpServer);
        });

        httpServer.on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.error(`[Server] Port ${port} is already in use.`);
            httpServer.close();
            reject(new Error(`Port ${port} is already in use`));
          } else {
            reject(err);
          }
        });
      });
    };

    // Ensure frontend knows the intended backend port (no fallback behavior)
    const portFilePath = join(__dirname, '../.backend-port');
    try {
      fs.writeFileSync(portFilePath, BASE_PORT.toString());
      console.log(`[Server] Backend port file written with base port ${BASE_PORT}: ${portFilePath}`);
    } catch (err) {
      console.warn('Could not write .backend-port file:', err.message);
    }

    const server = await startServer(BASE_PORT);

    // Confirm the server address matches BASE_PORT
    const actualPort = server.address().port;
    if (actualPort !== BASE_PORT) {
      console.error(`Server started on unexpected port ${actualPort} (expected ${BASE_PORT}). Exiting.`);
      process.exit(1);
    }
    console.log(`[Server] Backend port confirmed: ${actualPort}`);

    return server;
  } catch (error) {
    console.error('Server init failed:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
};

initializeServer();

export default app;
