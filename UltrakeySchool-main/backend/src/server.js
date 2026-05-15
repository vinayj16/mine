// Load environment variables FIRST - before any other imports
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
import { errorHandler, notFound } from './middleware/errorHandler.js';
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
import advancedAttendanceRoutes from './routes/advancedAttendanceRoutes.js';
import advancedProctoringRoutes from './routes/advancedProctoringRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import commissionRoutes from './routes/commissionRoutes.js';
import apiKeyRoutes from './routes/apiKeyRoutes.js';
import bannedIPRoutes from './routes/bannedIPRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import transportRoutes from './routes/transportRoutes.js';
import transportRouteRoutes from './routes/transportRouteRoutes.js';
import transportReportRoutes from './routes/transportReportRoutes.js';
import transportAssignmentRoutes from './routes/transportAssignmentRoutes.js';
import transportFeeRoutes from './routes/transportFeeRoutes.js';
import pickupPointRoutes from './routes/pickupPointRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import hrmRoutes from './routes/hrmRoutes.js';
import staffDocumentRoutes from './routes/staffDocumentRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import institutionRouter from './routes/institutionRoutes.js';
import schoolRouter from './routes/schoolRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userManagementRoutes from './routes/userManagementRoutes.js';
import libraryRoutes from './routes/libraryRoutesFallback.js';
import sportsRoutes from './routes/sportsRoutes.js';
import supportTicketsRoutes from './routes/supportTicketsRoutes.js';
import notesRoutes from './routes/notesRoutes.js';
import filesRoutes from './routes/filesRoutes.js';
import emailsRoutes from './routes/emailsRoutes.js';
import studentAttendanceRoutes from './routes/studentAttendanceRoutes.js';
import rolesRoutes from './routes/rolesRoutes.js';
import leaveReportsRoutes from './routes/leaveReportsRoutes.js';
import resultsRoutes from './routes/resultsRoutes.js';
import examsRoutes from './routes/examsRoutes.js';
import gradesRoutes from './routes/gradesRoutes.js';
import examSchedulesRoutes from './routes/examSchedulesRoutes.js';
import institutionSetupRoutes from './routes/institutionSetupRoutes.js';
import institutionManagementRoutes from './routes/institutionManagementRoutes.js';
import communicationRoutes from './routes/communicationRoutes.js';
import communicationRoutesNew from './routes/communicationRoutesNew.js';
import userProfileRoutes from './routes/userProfileRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import todoRoutes from './routes/todoRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';

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

    // Middleware
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(compression());
    app.use(hpp());
    app.use(morgan('dev'));

    // API Routes
    app.use(`/api/${API_VERSION}/health`, healthRoutes);
    app.use(`/api/${API_VERSION}/auth`, authRoutes);
    app.use(`/api/${API_VERSION}/admin`, adminRoutes);
    app.use(`/api/${API_VERSION}/students`, studentRoutes);
    app.use(`/api/${API_VERSION}/teachers`, teacherRoutes);
    app.use(`/api/${API_VERSION}/classes`, classRoutes);
    app.use(`/api/${API_VERSION}/classrooms`, classRoomRoutes);
    app.use(`/api/${API_VERSION}/subjects`, subjectRoutes);
    app.use(`/api/${API_VERSION}/syllabi`, syllabusRoutes);
    app.use(`/api/${API_VERSION}/dashboard`, dashboardRoutes);
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
    app.use(`/api/${API_VERSION}/advanced-attendance`, advancedAttendanceRoutes);
    app.use(`/api/${API_VERSION}/advanced-proctoring`, advancedProctoringRoutes);
    app.use(`/api/${API_VERSION}/agents`, agentRoutes);
    app.use(`/api/${API_VERSION}/agent`, agentRoutes); // Add singular agent route for settings
    app.use(`/api/${API_VERSION}/super-admin`, superAdminRoutes); // Mount all super-admin routes under /api/v1/super-admin
    app.use(`/api/${API_VERSION}/commissions`, commissionRoutes);
    app.use(`/api/${API_VERSION}/api-keys`, apiKeyRoutes);
    app.use(`/api/${API_VERSION}/banned-ips`, bannedIPRoutes);
    app.use(`/api/${API_VERSION}/blogs`, blogRoutes);
    app.use(`/api/${API_VERSION}/branches`, branchRoutes);
    app.use(`/api/${API_VERSION}/transport`, transportRoutes);
    app.use(`/api/${API_VERSION}/transport-routes`, transportRouteRoutes);
    app.use(`/api/${API_VERSION}/transport-reports`, transportReportRoutes);
    app.use(`/api/${API_VERSION}/transport-assignments`, transportAssignmentRoutes);
    app.use(`/api/${API_VERSION}/transport-fees`, transportFeeRoutes);
    app.use(`/api/${API_VERSION}/calendar`, calendarRoutes);
    app.use(`/api/${API_VERSION}/user-profiles`, userProfileRoutes);
    app.use(`/api/${API_VERSION}/profile`, userProfileRoutes); // Add profile route to match frontend expectations
    app.use(`/api/${API_VERSION}/hrm`, hrmRoutes);
    app.use(`/api/${API_VERSION}/staff`, hrmRoutes);
    app.use(`/api/${API_VERSION}/staff-documents`, staffDocumentRoutes);
    app.use(`/api/${API_VERSION}/super-admin`, superAdminRoutes);
    app.use(`/api/${API_VERSION}/notifications`, notificationRoutes);
    app.use(`/api/${API_VERSION}/notices`, noticeRoutes);
    app.use(`/api/${API_VERSION}/users`, userManagementRoutes);
    app.use(`/api/${API_VERSION}/user-management`, userManagementRoutes);
    app.use(`/api/${API_VERSION}/library`, libraryRoutes);
    app.use(`/api/${API_VERSION}/sports`, sportsRoutes);
    app.use(`/api/${API_VERSION}/support-tickets`, supportTicketsRoutes);
    app.use(`/api/${API_VERSION}/notes`, notesRoutes);
    app.use(`/api/${API_VERSION}/files`, filesRoutes);
    app.use(`/api/${API_VERSION}/emails`, emailsRoutes);
    app.use(`/api/${API_VERSION}/student-attendance`, studentAttendanceRoutes);
    app.use(`/api/${API_VERSION}/roles`, rolesRoutes);
    app.use(`/api/${API_VERSION}/leave-reports`, leaveReportsRoutes);
    app.use(`/api/${API_VERSION}/results`, resultsRoutes);
    app.use(`/api/${API_VERSION}/exams`, examsRoutes);
    app.use(`/api/${API_VERSION}/grades`, gradesRoutes);
    app.use(`/api/${API_VERSION}/exam-schedules`, examSchedulesRoutes);
    app.use(`/api/${API_VERSION}/institution-setup`, institutionSetupRoutes);
    app.use(`/api/${API_VERSION}/institution-management`, institutionManagementRoutes);
    app.use(`/api/${API_VERSION}/institutions`, institutionRouter);
    app.use(`/api/${API_VERSION}/schools`, schoolRouter);
    app.use(`/api/${API_VERSION}/subscriptions`, subscriptionRoutes);
    app.use(`/api/${API_VERSION}/events`, eventRoutes);
    app.use(`/api/${API_VERSION}/todos`, todoRoutes);
    app.use(`/api/${API_VERSION}/communication`, communicationRoutes);
    app.use(`/api/${API_VERSION}/communications`, communicationRoutesNew);
    app.use(`/api/${API_VERSION}/chat`, chatRoutes);
    app.use(`/api/${API_VERSION}/audit`, auditRoutes);
    app.use(`/api/${API_VERSION}/testimonials`, testimonialRoutes);
    
    // Simple test endpoint (no auth required)
    app.get(`/api/${API_VERSION}/audit-test`, (req, res) => {
      console.log('🧪 Audit test endpoint called!');
      res.json({ success: true, message: 'Audit endpoint reachable!' });
    });
    
    // Root test endpoint
    app.get(`/api/${API_VERSION}/ping`, (req, res) => {
      try {
        console.log('🏓 Ping endpoint called!');
        res.json({ success: true, message: 'Backend is running!' });
      } catch (error) {
        console.error('Ping endpoint error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Institutions working endpoint for analytics
    app.get(`/api/${API_VERSION}/institutions/working`, async (req, res) => {
      try {
        const Institution = (await import('./src/models/Institution.js')).default;
        const institutions = await Institution.find({ status: 'active' }).lean();
        
        res.json({
          success: true,
          data: {
            institutions: institutions.map(inst => ({
              _id: inst._id,
              name: inst.name,
              type: inst.type || 'School',
              status: inst.status || 'Active',
              code: inst.code || inst.instituteCode || '',
              subscription: {
                plan: inst.subscription?.planName || 'Basic',
                expiry: inst.subscription?.endDate || '2024-12-31'
              }
            }))
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    app.use(notFound);
    app.use(errorHandler);

    // Try to start server on BASE_PORT, fallback to dynamic port if in use
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
          console.log(`✅ Server running on port ${port}`);
          console.log(`📡 API: http://localhost:${port}/api/${API_VERSION}`);
          console.log(`🔌 Socket.io ready for connections`);
          resolve(httpServer);
        });

        httpServer.on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`⚠️  Port ${port} is busy, trying next port...`);
            httpServer.close();
            resolve(startServer(port + 1));
          } else {
            reject(err);
          }
        });
      });
    };

    const server = await startServer(BASE_PORT);
    
    // Write the actual port to a file so frontend can detect it
    const portFilePath = join(__dirname, '../.backend-port');
    const actualPort = server.address().port;
    fs.writeFileSync(portFilePath, actualPort.toString());
    console.log(`📝 Backend port written to: ${portFilePath}`);
    
    return server;
  } catch (error) {
    console.error('Server init failed:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
};

initializeServer();

export default app;