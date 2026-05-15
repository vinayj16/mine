import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api';

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

class CallSocketService {
  private static instance: CallSocketService | null = null;
  private socket: Socket | null = null;
  private incomingCallCallbacks: ((call: IncomingCall) => void)[] = [];
  private callAcceptedCallbacks: ((data: { signal: any; from: string }) => void)[] = [];
  private callRejectedCallbacks: ((data: { from: string }) => void)[] = [];
  private callEndedCallbacks: ((data: { from: string }) => void)[] = [];
  private callBusyCallbacks: ((data: { from: string }) => void)[] = [];
  private listenersSetup = false;
  private isConnecting = false;
  private currentUserId: string = '';

  // Singleton pattern
  static getInstance(): CallSocketService {
    if (!CallSocketService.instance) {
      CallSocketService.instance = new CallSocketService();
    }
    return CallSocketService.instance;
  }

  private constructor() {}

  connect(userId: string) {
    if (this.socket?.connected) {
      console.log('✅ Call socket already connected');
      return;
    }
    
    if (this.isConnecting) {
      console.log('⏳ Call socket connection already in progress');
      return;
    }
    
    // Disconnect existing socket if any
    if (this.socket) {
      console.log('🔌 Disconnecting existing call socket before reconnect');
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.currentUserId = userId;
    this.isConnecting = true;

    // Use the base URL without /api/v1 for Socket.io connection
    const socketUrl = API_CONFIG.BASE_URL.replace('/api/v1', '');
    
    // Create call-specific socket with namespace
    this.socket = io(`${socketUrl}/call`, {
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
        type: 'call'
      }
    });

    this.socket.on('connect', () => {
      this.isConnecting = false;
      console.log('✅ Call socket connected');
      
      // Join user's personal room
      this.socket?.emit('join_user', userId);
      
      // Set up listeners after connection
      this.setupListeners();
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnecting = false;
      console.log('🔌 Call socket disconnected:', reason);
      
      // Auto-reconnect for manual disconnections
      if (reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      this.isConnecting = false;
      console.error('❌ Call socket connection error:', error);
    });
  }

  private setupListeners() {
    if (!this.socket || this.listenersSetup) return;
    
    this.listenersSetup = true;
    
    // Call event listeners
    this.socket.on('incoming_call', (data: { signal: any; from: string; fromName: string; callType: string; roomId: string }) => {
      const call: IncomingCall = {
        signal: data.signal,
        from: data.from,
        fromName: data.fromName || 'Unknown',
        callType: (data.callType as 'video' | 'voice') || 'video',
        roomId: data.roomId
      };
      this.incomingCallCallbacks.forEach(cb => cb(call));
    });

    this.socket.on('call_accepted', (data: { signal: any; from: string }) => {
      this.callAcceptedCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('call_rejected', (data: { from: string }) => {
      this.callRejectedCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('call_ended', (data: { from: string }) => {
      this.callEndedCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('call_busy', (data: { from: string }) => {
      this.callBusyCallbacks.forEach(cb => cb(data));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listenersSetup = false;
      console.log('🔌 Call socket disconnected');
    }
  }

  // Call methods
  callUser(data: {
    to: string;
    from: string;
    fromName: string;
    signal: any;
    callType: 'video' | 'voice';
  }) {
    if (this.socket?.connected) {
      const roomId = `call_${data.from}_${data.to}_${Date.now()}`;
      this.socket.emit('call_user', {
        userToCall: data.to,
        signalData: data.signal,
        from: data.from,
        fromName: data.fromName,
        callType: data.callType,
        roomId
      });
    }
  }

  acceptCall(data: { to: string; signal: any; roomId: string }) {
    if (this.socket?.connected) {
      this.socket.emit('accept_call', data);
    }
  }

  rejectCall(data: { to: string; roomId: string }) {
    if (this.socket?.connected) {
      this.socket.emit('reject_call', data);
    }
  }

  endCall(data: { to: string; roomId: string }) {
    if (this.socket?.connected) {
      this.socket.emit('end_call', data);
    }
  }

  // Event listeners
  onIncomingCall(callback: (call: IncomingCall) => void) {
    this.incomingCallCallbacks.push(callback);
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

  onCallBusy(callback: (data: { from: string }) => void) {
    this.callBusyCallbacks.push(callback);
  }

  // Remove listeners
  offIncomingCall(callback: (call: IncomingCall) => void) {
    this.incomingCallCallbacks = this.incomingCallCallbacks.filter(cb => cb !== callback);
  }

  offCallAccepted(callback: (data: { signal: any; from: string }) => void) {
    this.callAcceptedCallbacks = this.callAcceptedCallbacks.filter(cb => cb !== callback);
  }

  offCallRejected(callback: (data: { from: string }) => void) {
    this.callRejectedCallbacks = this.callRejectedCallbacks.filter(cb => cb !== callback);
  }

  offCallEnded(callback: (data: { from: string }) => void) {
    this.callEndedCallbacks = this.callEndedCallbacks.filter(cb => cb !== callback);
  }

  offCallBusy(callback: (data: { from: string }) => void) {
    this.callBusyCallbacks = this.callBusyCallbacks.filter(cb => cb !== callback);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const callSocketService = CallSocketService.getInstance();
export default callSocketService;
