import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api';

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  readBy: { userId: string; readAt: string }[];
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CallSignal {
  type: string;
  sdp: string;
}

export interface IncomingCall {
  signal: CallSignal;
  from: string;
  fromName: string;
  callType: 'video' | 'voice';
  roomId: string;
}

class SocketService {
  private static instance: SocketService | null = null;
  private socket: Socket | null = null;
  private messageCallbacks: ((message: Message) => void)[] = [];
  private messageSentCallbacks: ((message: Message) => void)[] = [];
  private incomingCallCallbacks: ((call: IncomingCall) => void)[] = [];
  private callAcceptedCallbacks: ((data: { signal: any; from: string }) => void)[] = [];
  private callRejectedCallbacks: ((data: { from: string }) => void)[] = [];
  private callEndedCallbacks: ((data: { from: string }) => void)[] = [];
  private listenersSetup = false;
  private isConnecting = false;
  private currentUserId: string = '';

  // Singleton pattern
  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  private constructor() {}

  connect(userId: string) {
    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return;
    }
    
    if (this.isConnecting) {
      console.log('⏳ Socket connection already in progress');
      return;
    }
    
    // Disconnect existing socket if any
    if (this.socket) {
      console.log('🔌 Disconnecting existing socket before reconnect');
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.currentUserId = userId;
    this.isConnecting = true;

    // Use the base URL without /api/v1 for Socket.io connection
    const socketUrl = API_CONFIG.BASE_URL.replace('/api/v1', '');
    
    // Use polling as primary transport for more reliable connection
    this.socket = io(socketUrl, {
      transports: ['polling'], // Use polling as primary transport for reliability
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      this.isConnecting = false;
      
      // Join user's personal room
      this.socket?.emit('join_user', userId);
      
      // Set up message listeners after connection
      this.setupListeners();
      
      // Send any queued messages
      this.sendQueuedMessages();
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnecting = false;
      
      // Auto-reconnect for manual disconnections
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, reconnect manually
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', () => {
      this.isConnecting = false;
      
      // Let Socket.io handle reconnection automatically
    });
  }

  private setupListeners() {
    if (!this.socket || this.listenersSetup) return;
    
    this.listenersSetup = true;
    
    // Chat listeners
    this.socket.on('receive_message', (message) => {
      this.messageCallbacks.forEach(cb => cb(message));
    });
    this.socket.on('message_sent', (message) => {
      this.messageSentCallbacks.forEach(cb => cb(message));
    });

    // ── Call listeners (match backend event names) ──────────────────────────
    // Backend emits 'incomingCall' when someone calls
    this.socket.on('incomingCall', (data: { signal: any; from: string; name: string; type: string }) => {
      const call: IncomingCall = {
        signal: data.signal,
        from: data.from,
        fromName: data.name || 'Unknown',
        callType: (data.type as 'video' | 'voice') || 'video',
        roomId: `room_${data.from}`,
      };
      this.incomingCallCallbacks.forEach(cb => cb(call));
    });

    // Backend emits 'callAccepted' when callee answers
    this.socket.on('callAccepted', (signal: any) => {
      this.callAcceptedCallbacks.forEach(cb => cb({ signal, from: '' }));
    });

    // Backend emits 'callRejected'
    this.socket.on('callRejected', () => {
      this.callRejectedCallbacks.forEach(cb => cb({ from: '' }));
    });

    // Backend emits 'callEnded'
    this.socket.on('callEnded', () => {
      this.callEndedCallbacks.forEach(cb => cb({ from: '' }));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listenersSetup = false;
    }
  }

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
    
    // Try to reconnect if we have a user ID
    if (this.currentUserId) {
      
      // Don't try to reconnect if already connecting
      if (!this.isConnecting) {
        this.connect(this.currentUserId);
      }
      
      // Wait for connection and retry
      let retryCount = 0;
      const maxRetries = 5;
      const retryInterval = setInterval(() => {
        retryCount++;
        
        if (this.socket?.connected) {
          this.socket.emit('send_message', data);
          clearInterval(retryInterval);
        } else if (retryCount >= maxRetries) {
          this.queueMessage(data);
          clearInterval(retryInterval);
        }
      }, 1000);
    } else {
      this.queueMessage(data);
    }
  }

  // Queue messages for retry when socket reconnects
  private messageQueue: any[] = [];

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

  onMessage(callback: (message: Message) => void) {
    this.messageCallbacks.push(callback);
    
    // If socket is already connected, set up listener immediately
    if (this.socket?.connected) {
      this.setupListeners();
    }
  }

  onMessageSent(callback: (message: Message) => void) {
    this.messageSentCallbacks.push(callback);
    
    // If socket is already connected, set up listener immediately
    if (this.socket?.connected) {
      this.setupListeners();
    }
  }

  onTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  // Call methods — event names match backend handlers
  callUser(data: {
    to: string;
    from: string;
    fromName: string;
    signal: any;
    callType: 'video' | 'voice';
    roomId: string;
  }) {
    if (this.socket?.connected) {
      // Backend listens on 'callUser' with { userToCall, signalData, from, name, type }
      this.socket.emit('callUser', {
        userToCall: data.to,
        signalData: data.signal,
        from: data.from,
        name: data.fromName,
        type: data.callType,
      });
    }
  }

  onIncomingCall(callback: (call: IncomingCall) => void) {
    this.incomingCallCallbacks.push(callback);
    // If already connected, wire up listeners now (listenersSetup guard handles dedup)
    if (this.socket?.connected && !this.listenersSetup) {
      this.setupListeners();
    }
  }

  onCallAccepted(callback: (data: { signal: any; from: string }) => void) {
    this.callAcceptedCallbacks.push(callback);
  }

  onCallRejected(callback: (data: { from: string }) => void) {
    this.callRejectedCallbacks.push(callback);
  }

  onCallEnded(callback: (data: { from: string }) => void) {
    this.callEndedCallbacks.push(callback);
  }

  acceptCall(data: { to: string; signal: any }) {
    if (this.socket?.connected) {
      // Backend listens on 'answerCall' with { to, signal }
      this.socket.emit('answerCall', data);
    }
  }

  rejectCall(data: { to: string }) {
    if (this.socket?.connected) {
      // Backend listens on 'rejectCall' with { to }
      this.socket.emit('rejectCall', data);
    }
  }

  endCall(data: { to: string }) {
    if (this.socket?.connected) {
      // Backend listens on 'endCall' with { to }
      this.socket.emit('endCall', data);
    }
  }

  
  offMessage(callback: (message: Message) => void) {
    this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
  }

  offMessageSent(callback: (message: Message) => void) {
    this.messageSentCallbacks = this.messageSentCallbacks.filter(cb => cb !== callback);
  }

  // Generic emit method
  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  // Generic on method
  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Generic off method
  off(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = SocketService.getInstance();
export default socketService;
