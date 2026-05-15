import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api';

export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'audio' | 'video';
  readBy: { userId: string; readAt: string }[];
  deliveryStatus: {
    sent: boolean;
    delivered: boolean;
    read: boolean;
    deliveredAt?: string;
    readAt?: string;
  };
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserStatus {
  userId: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface TypingData {
  userId: string;
  userName: string;
  userRole: string;
  isTyping: boolean;
  conversationId: string;
}

class ChatSocketService {
  private static instance: ChatSocketService | null = null;
  private socket: Socket | null = null;
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private messageSentCallbacks: ((message: ChatMessage) => void)[] = [];
  private messageErrorCallbacks: ((error: { error: string; details?: string }) => void)[] = [];
  private typingCallbacks: ((data: TypingData) => void)[] = [];
  private conversationCallbacks: ((conversation: any) => void)[] = [];
  private userStatusCallbacks: ((status: UserStatus) => void)[] = [];
  private messageReadCallbacks: ((data: { messageId: string; conversationId: string; readBy: string; readAt: string }) => void)[] = [];
  private userDisconnectedCallbacks: ((data: { userId: string; conversationId: string; timestamp: string }) => void)[] = [];
  private listenersSetup = false;
  private isConnecting = false;
  private currentUserId: string = '';
  private currentUserRole: string = '';
  private currentUserInstitutionCode: string = '';
  private messageQueue: any[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  // Singleton pattern
  static getInstance(): ChatSocketService {
    if (!ChatSocketService.instance) {
      ChatSocketService.instance = new ChatSocketService();
    }
    return ChatSocketService.instance;
  }

  private constructor() {}

  connect(userId: string, userRole?: string, institutionCode?: string) {
    if (this.socket?.connected) {
      console.log('✅ Chat socket already connected');
      return;
    }
    
    if (this.isConnecting) {
      console.log('⏳ Chat socket connection already in progress');
      return;
    }
    
    // Disconnect existing socket if any
    if (this.socket) {
      console.log('🔌 Disconnecting existing chat socket before reconnect');
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.currentUserId = userId;
    this.currentUserRole = userRole || '';
    this.currentUserInstitutionCode = institutionCode || '';
    this.isConnecting = true;

    // Use the base URL without /api/v1 for Socket.io connection
    let socketUrl = API_CONFIG.BASE_URL;
    if (socketUrl.includes('/api/v1')) {
      socketUrl = socketUrl.replace('/api/v1', '');
    }
    
    console.log('🔌 Connecting to chat socket at:', socketUrl);
    
    // Create chat-specific socket with namespace
    this.socket = io(`${socketUrl}/chat`, {
      transports: ['polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
      auth: {
        userId,
        userRole,
        institutionCode,
        type: 'chat'
      }
    });

    this.socket.on('connect', () => {
      this.isConnecting = false;
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      console.log('✅ Chat socket connected with ID:', this.socket?.id);
      console.log('🔌 Socket connected to chat namespace');
      
      // Join user's personal room
      this.socket?.emit('join_user', userId);
      
      // Set up listeners after connection
      this.setupListeners();
      
      // Send any queued messages
      this.sendQueuedMessages();
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnecting = false;
      console.log('🔌 Chat socket disconnected:', reason);
      console.log('🔌 Disconnect reason details:', {
        reason,
        wasServerInitiated: reason === 'io server disconnect',
        wasClientInitiated: reason === 'io client disconnect',
        wasPingTimeout: reason === 'ping timeout'
      });
      
      // Auto-reconnect with exponential backoff
      if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
        console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
          this.reconnectAttempts++;
          this.socket?.connect();
        }, delay);
      }
    });

    this.socket.on('connect_error', (error) => {
      this.isConnecting = false;
      console.error('❌ Chat socket connection error:', error);
      console.error('❌ Socket connection error details:', {
        message: error.message,
        stack: error.stack
      });
    });
  }

  private setupListeners() {
    if (!this.socket || this.listenersSetup) return;
    
    this.listenersSetup = true;
    
    // Chat message listeners
    this.socket.on('receive_message', (message: ChatMessage) => {
      this.messageCallbacks.forEach(cb => cb(message));
    });
    
    this.socket.on('message_sent', (message: ChatMessage) => {
      this.messageSentCallbacks.forEach(cb => cb(message));
    });

    // Typing indicators
    this.socket.on('user_typing', (data: TypingData) => {
      this.typingCallbacks.forEach(cb => cb(data));
    });

    // Conversation updates
    this.socket.on('conversation_updated', (conversation: any) => {
      this.conversationCallbacks.forEach(cb => cb(conversation));
    });

    // User status updates
    this.socket.on('user_status_changed', (status: UserStatus) => {
      this.userStatusCallbacks.forEach(cb => cb(status));
    });

    // Message read receipts
    this.socket.on('message_read', (data: { messageId: string; conversationId: string; readBy: string; readAt: string }) => {
      this.messageReadCallbacks.forEach(cb => cb(data));
    });

    // Message error
    this.socket.on('message_error', (error: { error: string; details?: string }) => {
      this.messageErrorCallbacks.forEach(cb => cb(error));
    });

    // User disconnected
    this.socket.on('user_disconnected', (data: { userId: string; conversationId: string; timestamp: string }) => {
      this.userDisconnectedCallbacks.forEach(cb => cb(data));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listenersSetup = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // Join a conversation room
  joinConversation(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_conversation', { conversationId });
    }
  }

  // Leave a conversation room
  leaveConversation(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_conversation', { conversationId });
    }
  }

  // Send a message
  sendMessage(data: {
    conversationId: string;
    senderId: string;
    senderName: string;
    recipientId: string;
    content: string;
    messageType?: string;
  }) {
    // Try to send immediately if connected
    if (this.socket?.connected) {
      this.socket.emit('send_message', data);
      return;
    }
    
    // Queue message if not connected
    this.queueMessage(data);
    
    // Try to reconnect if we have a user ID
    if (this.currentUserId && !this.isConnecting) {
      this.connect(this.currentUserId, this.currentUserRole, this.currentUserInstitutionCode);
    }
  }

  // Send typing indicator
  sendTyping(conversationId: string, isTyping: boolean) {
    if (this.socket?.connected) {
      this.socket.emit('typing', {
        conversationId,
        isTyping
      });
    }
  }

  private queueMessage(data: any) {
    this.messageQueue.push(data);
  }

  private sendQueuedMessages() {
    if (this.messageQueue.length > 0 && this.socket?.connected) {
      const failedMessages: any[] = [];
      
      this.messageQueue.forEach(data => {
        try {
          this.socket?.emit('send_message', data);
        } catch (error) {
          failedMessages.push(data);
        }
      });
      
      // Keep failed messages for retry
      this.messageQueue = failedMessages;
    }
  }

  // Event listeners
  onMessage(callback: (message: ChatMessage) => void) {
    this.messageCallbacks.push(callback);
    if (this.socket?.connected && !this.listenersSetup) {
      this.setupListeners();
    }
  }

  onMessageSent(callback: (message: ChatMessage) => void) {
    this.messageSentCallbacks.push(callback);
  }

  onTyping(callback: (data: TypingData) => void) {
    this.typingCallbacks.push(callback);
  }

  onConversationUpdate(callback: (conversation: any) => void) {
    this.conversationCallbacks.push(callback);
  }

  onUserStatus(callback: (status: UserStatus) => void) {
    this.userStatusCallbacks.push(callback);
  }

  onMessageRead(callback: (data: { messageId: string; conversationId: string; readBy: string; readAt: string }) => void) {
    this.messageReadCallbacks.push(callback);
  }

  onMessageError(callback: (error: { error: string; details?: string }) => void) {
    this.messageErrorCallbacks.push(callback);
  }

  onUserDisconnected(callback: (data: { userId: string; conversationId: string; timestamp: string }) => void) {
    this.userDisconnectedCallbacks.push(callback);
  }

  // Mark message as read
  markMessageAsRead(messageId: string, conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('mark_message_read', { messageId, conversationId });
    }
  }

  // Remove listeners
  offMessage(callback: (message: ChatMessage) => void) {
    this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
  }

  offMessageSent(callback: (message: ChatMessage) => void) {
    this.messageSentCallbacks = this.messageSentCallbacks.filter(cb => cb !== callback);
  }

  offTyping(callback: (data: TypingData) => void) {
    this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback);
  }

  offConversationUpdate(callback: (conversation: any) => void) {
    this.conversationCallbacks = this.conversationCallbacks.filter(cb => cb !== callback);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const chatSocketService = ChatSocketService.getInstance();
export default chatSocketService;
