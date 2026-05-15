import logger from '../utils/logger.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import Notification from '../models/Notification.js';

const chatSocketHandler = (io) => {
  const chatNamespace = io.of('/chat');

  chatNamespace.use((socket, next) => {
    // Authentication middleware for chat namespace
    const userId = socket.handshake.auth.userId;
    const userRole = socket.handshake.auth.userRole;
    const institutionCode = socket.handshake.auth.institutionCode;
    
    if (!userId) {
      return next(new Error('Authentication required for chat'));
    }
    
    socket.userId = userId;
    socket.userRole = userRole;
    socket.institutionCode = institutionCode;
    socket.userType = 'chat';
    next();
  });

  chatNamespace.on('connection', async (socket) => {
    logger.info(`Chat socket connected: ${socket.userId}, Role: ${socket.userRole}, Institution: ${socket.institutionCode || 'Global'}`);

    // Update user's online status and socket ID
    try {
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: true,
        socketId: socket.id,
        lastSeen: new Date()
      });
      
      // Broadcast user online status to their contacts
      socket.broadcast.emit('user_status_changed', {
        userId: socket.userId,
        isOnline: true,
        lastSeen: new Date()
      });
    } catch (error) {
      logger.error('Error updating user online status:', error);
    }

    // Join user's personal room for direct messages
    socket.on('join_user', (userId) => {
      socket.join(`user:${userId}`);
      logger.debug(`User ${userId} joined personal chat room`);
    });

    // Join institution room for non-global users
    if (socket.institutionCode && socket.userRole !== 'agent' && socket.userRole !== 'superadmin') {
      socket.join(`institution:${socket.institutionCode}`);
      logger.debug(`User ${socket.userId} joined institution room: ${socket.institutionCode}`);
    }

    // Join conversation room
    socket.on('join_conversation', ({ conversationId }) => {
      socket.join(`conversation:${conversationId}`);
      logger.debug(`User ${socket.userId} joined conversation: ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
      logger.debug(`User ${socket.userId} left conversation: ${conversationId}`);
    });

    // Send message
    socket.on('send_message', async (data) => {
      const { conversationId, senderId, recipientId, content, messageType = 'text' } = data;
      
      logger.info(`📨 Message from ${socket.userId} to ${recipientId} in conversation ${conversationId}`);
      
      try {
        // Verify user is part of the conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit('message_error', { error: 'Conversation not found' });
          return;
        }
        
        const isParticipant = conversation.participants.some(p => p.userId === socket.userId);
        if (!isParticipant) {
          socket.emit('message_error', { error: 'Not authorized to send message in this conversation' });
          return;
        }
        
        // Save message to database
        const message = new Message({
          conversationId,
          senderId: socket.userId,
          senderName: data.senderName || 'Unknown',
          recipientId,
          content,
          messageType,
          deliveryStatus: {
            sent: true,
            delivered: false,
            read: false,
            deliveredAt: null,
            readAt: null
          }
        });
        
        await message.save();
        
        // Check if recipient is online
        const recipient = await User.findById(recipientId);
        const isRecipientOnline = recipient?.isOnline;
        
        // Update delivery status if recipient is online
        if (isRecipientOnline) {
          message.deliveryStatus.delivered = true;
          message.deliveryStatus.deliveredAt = new Date();
          await message.save();
          logger.debug(`✅ Message delivered immediately to online user ${recipientId}`);
        } else {
          // Create notification for offline user
          await Notification.create({
            recipientId: recipientId,
            type: 'new_message',
            title: 'New Message',
            message: `You have a new message from ${data.senderName || 'Someone'}`,
            conversationId,
            messageId: message._id,
            senderId: socket.userId,
            institutionCode: socket.institutionCode,
            actionUrl: `/chat?conversation=${conversationId}`,
            actionText: 'View Message'
          });
          logger.debug(`📬 Notification created for offline user ${recipientId}`);
        }
        
        // Update conversation's last message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: {
            message: content,
            senderId: socket.userId,
            senderName: data.senderName || 'Unknown',
            messageType,
            sentAt: message.createdAt,
            deliveredAt: message.deliveryStatus.deliveredAt,
            readAt: message.deliveryStatus.readAt
          }
        });
        
        // Create message object for broadcasting
        const messageData = {
          _id: message._id,
          conversationId,
          senderId: socket.userId,
          senderName: data.senderName || 'Unknown',
          recipientId,
          content,
          messageType,
          deliveryStatus: message.deliveryStatus,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt
        };
        
        // Broadcast to conversation room
        chatNamespace.to(`conversation:${conversationId}`).emit('receive_message', messageData);
        logger.debug(`📡 Message broadcasted to conversation room: ${conversationId}`);

        // Check if recipient is blocked from this conversation
        const isRecipientBlocked = conversation.blockedUsers?.includes(recipientId);
        
        // Only send to recipient's personal room if they're not blocked
        if (!isRecipientBlocked) {
          chatNamespace.to(`user:${recipientId}`).emit('receive_message', messageData);
          logger.debug(`📡 Message sent to recipient's personal room: ${recipientId}`);
        } else {
          logger.debug(`🚫 Recipient ${recipientId} is blocked from this conversation - message not sent`);
        }

        // For global users, also broadcast to their institution room if applicable
        if (socket.userRole === 'agent' || socket.userRole === 'superadmin') {
          // Global users can reach anyone, so also send to recipient's institution room if they have one
          const recipientSocket = Array.from(chatNamespace.sockets.values()).find(s => s.userId === recipientId);
          if (recipientSocket?.institutionCode) {
            chatNamespace.to(`institution:${recipientSocket.institutionCode}`).emit('receive_message', messageData);
            logger.debug(`📡 Message sent to institution room: ${recipientSocket.institutionCode}`);
          }
        }

        // Send confirmation to sender
        socket.emit('message_sent', messageData);
        logger.debug(`✅ Confirmation sent to sender: ${socket.userId}`);

        logger.info(`📨 Message successfully sent from ${socket.userId} to ${recipientId}, delivered: ${isRecipientOnline}`);
      } catch (error) {
        logger.error('❌ Error sending message:', error);
        socket.emit('message_error', { error: 'Failed to send message', details: error.message });
      }
    });

    // Typing indicators
    socket.on('typing', ({ conversationId, isTyping }) => {
      logger.debug(`⌨️ ${socket.userId} is ${isTyping ? 'typing' : 'not typing'} in conversation ${conversationId}`);
      
      const typingData = {
        userId: socket.userId,
        userName: socket.handshake.auth.userName || 'User',
        userRole: socket.userRole,
        isTyping,
        conversationId
      };
      
      // Send to conversation room (excluding sender)
      socket.to(`conversation:${conversationId}`).emit('user_typing', typingData);
      
      // Also send to institution room for non-global users
      if (socket.institutionCode && socket.userRole !== 'agent' && socket.userRole !== 'superadmin') {
        socket.to(`institution:${socket.institutionCode}`).emit('user_typing', typingData);
      }
    });

    // Mark message as read
    socket.on('mark_message_read', async ({ messageId, conversationId }) => {
      logger.debug(`📖 ${socket.userId} marking message ${messageId} as read`);
      
      try {
        // Verify message exists and user is authorized to mark it as read
        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('message_error', { error: 'Message not found' });
          return;
        }
        
        // Verify user is part of the conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit('message_error', { error: 'Conversation not found' });
          return;
        }
        
        const isParticipant = conversation.participants.some(p => p.userId === socket.userId);
        if (!isParticipant) {
          socket.emit('message_error', { error: 'Not authorized to access this conversation' });
          return;
        }
        
        // Update message read status in database
        const updatedMessage = await Message.findByIdAndUpdate(
          messageId,
          {
            'deliveryStatus.read': true,
            'deliveryStatus.readAt': new Date(),
            $addToSet: {
              readBy: {
                userId: socket.userId,
                readAt: new Date()
              }
            }
          },
          { new: true }
        );
        
        if (updatedMessage) {
          // Notify sender that message was read (only if they're not the one who read it)
          if (updatedMessage.senderId !== socket.userId) {
            chatNamespace.to(`user:${updatedMessage.senderId}`).emit('message_read', {
              messageId,
              conversationId,
              readBy: socket.userId,
              readAt: new Date()
            });
            logger.debug(`📖 Read receipt sent to sender: ${updatedMessage.senderId}`);
          }
        }
      } catch (error) {
        logger.error('❌ Error marking message as read:', error);
        socket.emit('message_error', { error: 'Failed to mark message as read', details: error.message });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async (reason) => {
      logger.info(`🔌 Chat socket disconnected: ${socket.userId}, reason: ${reason}`);
      logger.debug(`🔌 Disconnect details:`, {
        reason,
        wasServerInitiated: reason === 'io server disconnect',
        wasClientInitiated: reason === 'io client disconnect',
        wasPingTimeout: reason === 'ping timeout',
        wasTransportClose: reason === 'transport close',
        wasTransportError: reason === 'transport error'
      });
      
      try {
        // Update user's offline status
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          socketId: null,
          lastSeen: new Date()
        });
        
        // Broadcast user offline status to their contacts
        socket.broadcast.emit('user_status_changed', {
          userId: socket.userId,
          isOnline: false,
          lastSeen: new Date()
        });
        
        logger.debug(`📢 Offline status broadcasted for user: ${socket.userId}`);
        
        // Notify all active conversations that user disconnected
        socket.rooms.forEach(room => {
          if (room.startsWith('conversation:')) {
            const conversationId = room.replace('conversation:', '');
            chatNamespace.to(room).emit('user_disconnected', {
              userId: socket.userId,
              conversationId,
              timestamp: new Date()
            });
            logger.debug(`📢 Notified conversation ${conversationId} about user disconnection`);
          }
        });
        
      } catch (error) {
        logger.error('❌ Error updating user offline status:', error);
      }
    });
  });

  return chatNamespace;
};

export default chatSocketHandler;
