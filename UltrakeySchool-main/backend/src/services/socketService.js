/**
 * Socket.io Service
 * Provides real-time communication features
 */

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

let io = null;

// Socket events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Authentication
  AUTHENTICATE: 'authenticate',
  AUTH_SUCCESS: 'auth_success',
  AUTH_ERROR: 'auth_error',
  
  // Notifications
  NOTIFICATION: 'notification',
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  
  // Chat
  CHAT_MESSAGE: 'chat:message',
  CHAT_JOIN: 'chat:join',
  CHAT_LEAVE: 'chat:leave',
  CHAT_TYPING: 'chat:typing',
  
  // Attendance
  ATTENDANCE_UPDATE: 'attendance:update',
  ATTENDANCE_MARKED: 'attendance:marked',
  
  // Transport
  TRANSPORT_LOCATION: 'transport:location',
  TRANSPORT_UPDATE: 'transport:update',
  
  // Notice/Announcements
  NOTICE_NEW: 'notice:new',
  NOTICE_UPDATE: 'notice:update',
  
  // Exams
  EXAM_PUBLISHED: 'exam:published',
  RESULT_PUBLISHED: 'result:published',
  
  // Fees
  // Finance
  FEE_REMINDER: 'fee:reminder',
  PAYMENT_RECEIVED: 'fee:payment_received',
  PAYMENT_FAILED: 'fee:payment_failed',
  INVOICE_GENERATED: 'fee:invoice_generated',

  // HR
  LEAVE_APPROVED: 'hr:leave_approved',
  LEAVE_REJECTED: 'hr:leave_rejected',
  PAYROLL_PROCESSED: 'hr:payroll_processed',
  RECRUITMENT_UPDATE: 'hr:recruitment_update',
  TRAINING_SCHEDULED: 'hr:training_scheduled',

  // Library
  BOOK_RETURNED: 'library:book_returned',
  BOOK_OVERDUE: 'library:book_overdue',
  BOOK_RESERVED: 'library:book_reserved',

  // Transport
  ROUTE_UPDATED: 'transport:route_updated',
  VEHICLE_MAINTENANCE: 'transport:vehicle_maintenance',
  STUDENT_PICKUP: 'transport:student_pickup',
  EMERGENCY_ALERT: 'transport:emergency_alert',

  // Hostel
  ROOM_ALLOCATED: 'hostel:room_allocated',
  COMPLAINT_RESOLVED: 'hostel:complaint_resolved',
  MAINTENANCE_SCHEDULED: 'hostel:maintenance_scheduled',
  VISITOR_CHECKED_IN: 'hostel:visitor_checked_in',

  // Academic
  GRADE_UPDATED: 'academic:grade_updated',
  ATTENDANCE_MARKED: 'academic:attendance_marked',
  HOMEWORK_ASSIGNED: 'academic:homework_assigned',
  EXAM_SCHEDULED: 'academic:exam_scheduled',

  // Dashboard
  DASHBOARD_UPDATE: 'dashboard:update',
  STATISTICS_UPDATE: 'statistics:update',

  // Users
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  PROFILE_UPDATED: 'user:profile_updated',

  // System
  MAINTENANCE_MODE: 'system:maintenance_mode',
  SYSTEM_UPDATE: 'system:update',
  BACKUP_COMPLETED: 'system:backup_completed',

  // Call (Video/Voice)
  CALL_USER: 'call:user',
  CALL_INCOMING: 'call:incoming',
  CALL_ACCEPT: 'call:accept',
  CALL_REJECT: 'call:reject',
  CALL_END: 'call:end',
  CALL_BUSY: 'call:busy',

  // General
  ERROR: 'error',
  SUCCESS: 'success',
  PING: 'ping',
  PONG: 'pong'
};

// User socket mapping
const userSockets = new Map();
const socketUsers = new Map();

/**
 * Initialize Socket.io server
 * @param {http.Server} server - HTTP server instance
 */
export const initSocketIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      logger.warn('Socket authentication failed:', error.message);
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on(SOCKET_EVENTS.CONNECT, (socket) => {
    logger.info(`Socket connected: ${socket.id}, User: ${socket.user.id}`);
    
    // Map user to socket
    userSockets.set(socket.user.id, socket.id);
    socketUsers.set(socket.id, socket.user.id);
    
    // Emit user online
    io.emit(SOCKET_EVENTS.USER_ONLINE, { userId: socket.user.id });

    // Join user to their personal room
    socket.join(`user:${socket.user.id}`);
    
    // Join institution room
    if (socket.user.institution) {
      socket.join(`institution:${socket.user.institution}`);
    }

    // Handle authentication confirmation
    socket.emit(SOCKET_EVENTS.AUTH_SUCCESS, {
      userId: socket.user.id,
      socketId: socket.id
    });

    // Handle chat join
    socket.on(SOCKET_EVENTS.CHAT_JOIN, (roomId) => {
      socket.join(`chat:${roomId}`);
      logger.debug(`User ${socket.user.id} joined chat room: ${roomId}`);
    });

    // Handle chat leave
    socket.on(SOCKET_EVENTS.CHAT_LEAVE, (roomId) => {
      socket.leave(`chat:${roomId}`);
      logger.debug(`User ${socket.user.id} left chat room: ${roomId}`);
    });

    // Handle chat message
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (data) => {
      io.to(`chat:${data.roomId}`).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
        ...data,
        senderId: socket.user.id,
        senderName: socket.user.name,
        timestamp: new Date().toISOString()
      });
    });

    // Handle typing
    socket.on(SOCKET_EVENTS.CHAT_TYPING, (data) => {
      socket.to(`chat:${data.roomId}`).emit(SOCKET_EVENTS.CHAT_TYPING, {
        userId: socket.user.id,
        userName: socket.user.name,
        isTyping: data.isTyping
      });
    });

    // Handle outgoing call (video/voice)
    socket.on(SOCKET_EVENTS.CALL_USER, (data) => {
      const { to, signal, from, fromName, callType } = data;
      logger.info(`Call from ${socket.user.id} to ${to}, type: ${callType}`);
      
      // Check if user is online
      const userSocket = userSockets.get(to);
      if (userSocket) {
        io.to(`user:${to}`).emit(SOCKET_EVENTS.CALL_INCOMING, {
          signal,
          from: socket.user.id,
          fromName: fromName || socket.user.name,
          callType: callType || 'video',
          roomId: data.roomId
        });
      } else {
        // User offline - notify caller
        socket.emit(SOCKET_EVENTS.CALL_BUSY, { 
          message: 'User is offline',
          to 
        });
      }
    });

    // Handle call accept
    socket.on(SOCKET_EVENTS.CALL_ACCEPT, (data) => {
      const { to, signal } = data;
      io.to(`user:${to}`).emit(SOCKET_EVENTS.CALL_ACCEPT, {
        signal,
        from: socket.user.id
      });
    });

    // Handle call reject
    socket.on(SOCKET_EVENTS.CALL_REJECT, (data) => {
      const { to } = data;
      io.to(`user:${to}`).emit(SOCKET_EVENTS.CALL_REJECT, {
        from: socket.user.id
      });
    });

    // Handle call end
    socket.on(SOCKET_EVENTS.CALL_END, (data) => {
      const { to } = data;
      io.to(`user:${to}`).emit(SOCKET_EVENTS.CALL_END, {
        from: socket.user.id
      });
    });

    // Handle disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      logger.info(`Socket disconnected: ${socket.id}`);
      
      const userId = socketUsers.get(socket.id);
      if (userId) {
        userSockets.delete(userId);
        socketUsers.delete(socket.id);
        io.emit(SOCKET_EVENTS.USER_OFFLINE, { userId });
      }
    });

    // Handle ping
    socket.on(SOCKET_EVENTS.PING, () => {
      socket.emit(SOCKET_EVENTS.PONG);
    });
  });

  logger.info('Socket.io initialized successfully');
  return io;
};

/**
 * Get Socket.io instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/**
 * Send notification to specific user
 * @param {string} userId - User ID
 * @param {Object} notification - Notification data
 */
export const sendNotificationToUser = (userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION_NEW, notification);
    logger.debug(`Notification sent to user: ${userId}`);
  }
};

/**
 * Send notification to all users in institution
 * @param {string} institutionId - Institution ID
 * @param {Object} notification - Notification data
 */
export const sendNotificationToInstitution = (institutionId, notification) => {
  if (io) {
    io.to(`institution:${institutionId}`).emit(SOCKET_EVENTS.NOTIFICATION_NEW, notification);
    logger.debug(`Notification sent to institution: ${institutionId}`);
  }
};

/**
 * Send notification to all connected users
 * @param {Object} notification - Notification data
 */
export const broadcastNotification = (notification) => {
  if (io) {
    io.emit(SOCKET_EVENTS.NOTIFICATION_NEW, notification);
    logger.debug('Notification broadcasted');
  }
};

/**
 * Emit attendance update
 * @param {string} institutionId - Institution ID
 * @param {Object} data - Attendance data
 */
export const emitAttendanceUpdate = (institutionId, data) => {
  if (io) {
    io.to(`institution:${institutionId}`).emit(SOCKET_EVENTS.ATTENDANCE_UPDATE, data);
  }
};

/**
 * Emit transport location update
 * @param {string} institutionId - Institution ID
 * @param {Object} data - Transport location data
 */
export const emitTransportUpdate = (institutionId, data) => {
  if (io) {
    io.to(`institution:${institutionId}`).emit(SOCKET_EVENTS.TRANSPORT_UPDATE, data);
  }
};

/**
 * Emit new notice
 * @param {string} institutionId - Institution ID
 * @param {Object} notice - Notice data
 */
export const emitNewNotice = (institutionId, notice) => {
  if (io) {
    io.to(`institution:${institutionId}`).emit(SOCKET_EVENTS.NOTICE_NEW, notice);
  }
};

/**
 * Emit exam published
 * @param {string} institutionId - Institution ID
 * @param {Object} examData - Exam data
 */
export const emitExamPublished = (institutionId, examData) => {
  if (io) {
    io.to(`institution:${institutionId}`).emit(SOCKET_EVENTS.EXAM_PUBLISHED, examData);
  }
};

/**
 * Emit result published
 * @param {string} institutionId - Institution ID
 * @param {Object} resultData - Result data
 */
export function emitResultPublished(institutionId, resultData) {
  if (io) {
    io.to(`institution:${institutionId}`).emit(SOCKET_EVENTS.RESULT_PUBLISHED, resultData);
  }
};

/**
 * Emit fee reminder
 * @param {string} userId - User ID
 * @param {Object} feeData - Fee data
 */
export const emitFeeReminder = (userId, feeData) => {
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.FEE_REMINDER, feeData);
  }
};

/**
 * Emit payment received
 * @param {string} userId - User ID
 * @param {Object} paymentData - Payment data
 */
export const emitPaymentReceived = (userId, paymentData) => {
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.PAYMENT_RECEIVED, paymentData);
  }
};

/**
 * Emit invoice generated
 * @param {string} userId - User ID
 * @param {Object} invoiceData - Invoice data
 */
export const emitInvoiceGenerated = (userId, invoiceData) => {
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.INVOICE_GENERATED, invoiceData);
  }
};

/**
 * Emit leave approved
 * @param {string} userId - User ID
 * @param {Object} leaveData - Leave data
 */
export const emitLeaveApproved = (userId, leaveData) => {
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.LEAVE_APPROVED, leaveData);
  }
};

/**
 * Emit leave rejected
 * @param {string} userId - User ID
 * @param {Object} leaveData - Leave data
 */
export const emitLeaveRejected = (userId, leaveData) => {
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.LEAVE_REJECTED, leaveData);
  }
};

/**
 * Emit payroll processed
 * @param {string} userId - User ID
 * @param {Object} payrollData - Payroll data
 */
export const emitPayrollProcessed = (userId, payrollData) => {
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.PAYROLL_PROCESSED, payrollData);
  }
};

/**
 * Emit book returned
 * @param {string} userId - User ID
 * @param {Object} bookData - Book return data
 */
export const emitBookReturned = (userId, bookData) => {
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.BOOK_RETURNED, bookData);
  }
};

/**
 * Emit book overdue
 * @param {string} userId - User ID
 * @param {Object} bookData - Overdue book data
 */
export const emitBookOverdue = (userId, bookData) => {
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.BOOK_OVERDUE, bookData);
  }
};

/**
 * Emit room allocated
 * @param {string} userId - User ID
 * @param {Object} allocationData - Room allocation data
 */
export const emitRoomAllocated = (userId, allocationData) => {
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.ROOM_ALLOCATED, allocationData);
  }
};

/**
 * Emit complaint resolved
 * @param {string} userId - User ID
 * @param {Object} complaintData - Complaint resolution data
 */
export const emitComplaintResolved = (userId, complaintData) => {
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.COMPLAINT_RESOLVED, complaintData);
  }
};

/**
 * Emit grade updated
 * @param {string} userId - User ID
 * @param {Object} gradeData - Grade update data
 */
export const emitGradeUpdated = (userId, gradeData) => {
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.GRADE_UPDATED, gradeData);
  }
};

/**
 * Emit attendance marked
 * @param {string} userId - User ID
 * @param {Object} attendanceData - Attendance data
 */
export const emitAttendanceMarked = (userId, attendanceData) => {
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.ATTENDANCE_MARKED, attendanceData);
  }
};

/**
 * Emit dashboard update
 * @param {string} userId - User ID
 * @param {Object} dashboardData - Dashboard data
 */
export const emitDashboardUpdate = (userId, dashboardData) => {
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.DASHBOARD_UPDATE, dashboardData);
  }
};

/**
 * Emit dashboard update to institution
 * @param {string} institutionId - Institution ID
 * @param {Object} dashboardData - Dashboard data
 */
export const emitInstitutionDashboardUpdate = (institutionId, dashboardData) => {
  if (io) {
    io.to(`institution:${institutionId}`).emit(SOCKET_EVENTS.DASHBOARD_UPDATE, dashboardData);
  }
};

/**
 * Emit statistics update
 * @param {string} userId - User ID
 * @param {Object} statsData - Statistics data
 */
export const emitStatisticsUpdate = (userId, statsData) => {
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.STATISTICS_UPDATE, statsData);
  }
};

/**
 * Emit profile updated
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data
 */
export const emitProfileUpdated = (userId, profileData) => {
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.PROFILE_UPDATED, profileData);
  }
};

/**
 * Emit maintenance mode
 * @param {Object} maintenanceData - Maintenance data
 */
export const emitMaintenanceMode = (maintenanceData) => {
  if (io) {
    io.emit(SOCKET_EVENTS.MAINTENANCE_MODE, maintenanceData);
  }
};

/**
 * Emit system update
 * @param {Object} updateData - Update data
 */
export const emitSystemUpdate = (updateData) => {
  if (io) {
    io.emit(SOCKET_EVENTS.SYSTEM_UPDATE, updateData);
  }
};

/**
 * Get online users count
 * @returns {number} Number of connected users
 */
export function getOnlineUsers() {
  if (io) {
    return io.engine.clientsCount;
  }
  return 0;
};

/**
 * Check if user is online
 * @param {string} userId - User ID
 * @returns {boolean} Whether user is online
 */
export function isUserOnline(userId) {
  if (io) {
    const sockets = io.sockets.adapter.rooms.get(`user:${userId}`);
    return sockets ? sockets.size > 0 : false;
  }
  return false;
};

/**
 * Send message to specific socket
 * @param {string} socketId - Socket ID
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
export const sendToSocket = (socketId, event, data) => {
  if (io) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, data);
    }
  }
};

/**
 * Send real-time notification to institution
 * @param {string} institutionId - Institution ID
 * @param {Object} notification - Notification data
 */
export const sendRealtimeNotification = (userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION_NEW, {
      ...notification,
      timestamp: new Date().toISOString(),
      type: 'realtime'
    });
    logger.debug(`Real-time notification sent to user: ${userId}`);
  }
};

export const sendRealtimeNotificationToInstitution = (institutionId, notification) => {
  if (io) {
    io.to(`institution:${institutionId}`).emit(SOCKET_EVENTS.NOTIFICATION_NEW, {
      ...notification,
      timestamp: new Date().toISOString(),
      type: 'realtime'
    });
  }
};

const socketService = {
  initialize: initSocketIO, // Add initialize as an alias
  initSocketIO,
  getIO,
  sendNotificationToUser,
  sendNotificationToInstitution,
  broadcastNotification,
  emitAttendanceUpdate,
  emitTransportUpdate,
  emitNewNotice,
  emitExamPublished,
  emitResultPublished,
  emitFeeReminder,
  emitPaymentReceived,
  emitInvoiceGenerated,
  emitLeaveApproved,
  emitLeaveRejected,
  emitPayrollProcessed,
  emitBookReturned,
  emitBookOverdue,
  emitRoomAllocated,
  emitComplaintResolved,
  emitGradeUpdated,
  emitAttendanceMarked,
  emitDashboardUpdate,
  emitInstitutionDashboardUpdate,
  emitStatisticsUpdate,
  emitProfileUpdated,
  emitMaintenanceMode,
  emitSystemUpdate,
  sendRealtimeNotification,
  sendRealtimeNotificationToInstitution,
  getOnlineUsers,
  isUserOnline,
  sendToSocket,
  SOCKET_EVENTS
};

export default socketService;
