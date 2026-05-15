import logger from '../utils/logger.js';

const callSocketHandler = (io) => {
  const callNamespace = io.of('/call');

  callNamespace.use((socket, next) => {
    // Authentication middleware for call namespace
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    const userId = socket.handshake.auth.userId;
    
    if (!userId) {
      return next(new Error('Authentication required for calls'));
    }
    
    socket.userId = userId;
    socket.userType = 'call';
    next();
  });

  callNamespace.on('connection', (socket) => {
    logger.info(`Call socket connected: ${socket.userId}`);

    // Join user's personal room for calls
    socket.on('join_user', (userId) => {
      socket.join(`user:${userId}`);
      logger.debug(`User ${userId} joined personal call room`);
    });

    // Initiate call
    socket.on('call_user', ({ userToCall, signalData, from, fromName, callType, roomId }) => {
      logger.info(`Call initiated from ${from} to ${userToCall}, type: ${callType}, room: ${roomId}`);
      
      // Send call to recipient
      callNamespace.to(`user:${userToCall}`).emit('incoming_call', {
        signal: signalData,
        from,
        fromName,
        callType,
        roomId
      });
    });

    // Accept call
    socket.on('accept_call', ({ to, signal, roomId }) => {
      logger.info(`Call accepted by ${socket.userId}, sending to ${to}, room: ${roomId}`);
      
      // Send acceptance to caller
      callNamespace.to(`user:${to}`).emit('call_accepted', {
        signal,
        from: socket.userId,
        roomId
      });
    });

    // Reject call
    socket.on('reject_call', ({ to, roomId }) => {
      logger.info(`Call rejected by ${socket.userId}, notifying ${to}, room: ${roomId}`);
      
      // Send rejection to caller
      callNamespace.to(`user:${to}`).emit('call_rejected', {
        from: socket.userId,
        roomId
      });
    });

    // End call
    socket.on('end_call', ({ to, roomId }) => {
      logger.info(`Call ended by ${socket.userId}, notifying ${to}, room: ${roomId}`);
      
      // Send end call to other party
      callNamespace.to(`user:${to}`).emit('call_ended', {
        from: socket.userId,
        roomId
      });
    });

    // Call busy (when user is already in another call)
    socket.on('call_busy', ({ to, roomId }) => {
      logger.info(`Call busy from ${socket.userId}, notifying ${to}, room: ${roomId}`);
      
      // Send busy signal to caller
      callNamespace.to(`user:${to}`).emit('call_busy', {
        from: socket.userId,
        roomId
      });
    });

    // WebRTC signaling
    socket.on('offer', ({ to, signal, roomId }) => {
      logger.debug(`WebRTC offer from ${socket.userId} to ${to}, room: ${roomId}`);
      callNamespace.to(`user:${to}`).emit('offer', {
        signal,
        from: socket.userId,
        roomId
      });
    });

    socket.on('answer', ({ to, signal, roomId }) => {
      logger.debug(`WebRTC answer from ${socket.userId} to ${to}, room: ${roomId}`);
      callNamespace.to(`user:${to}`).emit('answer', {
        signal,
        from: socket.userId,
        roomId
      });
    });

    socket.on('ice-candidate', ({ to, candidate, roomId }) => {
      logger.debug(`ICE candidate from ${socket.userId} to ${to}, room: ${roomId}`);
      callNamespace.to(`user:${to}`).emit('ice-candidate', {
        candidate,
        from: socket.userId,
        roomId
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Call socket disconnected: ${socket.userId}, reason: ${reason}`);
      
      // Notify all active calls that user disconnected
      socket.rooms.forEach(room => {
        if (room.startsWith('call:')) {
          callNamespace.to(room).emit('call_disconnected', {
            userId: socket.userId,
            roomId: room
          });
        }
      });
    });
  });

  return callNamespace;
};

export default callSocketHandler;
