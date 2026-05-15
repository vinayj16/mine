import { useEffect, useState, useCallback, useRef } from 'react';

// Socket server URL - get from environment or use fallback
const getSocketUrl = (): string => {
  // Prefer Vite environment variables when available
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const env = (import.meta as any).env as {
        VITE_WS_URL?: string;
      };

      if (env.VITE_WS_URL) {
        return env.VITE_WS_URL;
      }
    }
  } catch {
    // Fallback to runtime globals below
  }

  // Use window.ENV for injected environment variables in browser
  if (typeof window !== 'undefined' && (window as any).ENV?.VITE_WS_URL) {
    return (window as any).ENV.VITE_WS_URL;
  }

  // Check for global VITE_WS_URL (SSR/testing)
  if (typeof globalThis !== 'undefined' && (globalThis as any).VITE_WS_URL) {
    return (globalThis as any).VITE_WS_URL;
  }

  // Fallback to localhost
  return 'ws://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

interface UseSocketOptions {
  autoConnect?: boolean;
  onNotification?: (notification: Notification) => void;
  onAttendanceUpdate?: (data: AttendanceUpdate) => void;
  onTransportUpdate?: (data: TransportUpdate) => void;
  onNotice?: (notice: Notice) => void;
  onChatMessage?: (message: ChatMessage) => void;
}

// Types
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AttendanceUpdate {
  studentId: string;
  status: 'present' | 'absent' | 'late';
  date: string;
  classId: string;
}

export interface TransportUpdate {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  routeId: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

// Get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('token') || localStorage.getItem('accessToken');
};

export const useSocket = (options: UseSocketOptions = {}) => {
  const {
    autoConnect = true,
    onNotification,
    onAttendanceUpdate,
    onTransportUpdate,
    onNotice,
    onChatMessage
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const token = getToken();
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Event listeners storage
  const eventListeners = useRef<Map<string, ((...args: any[]) => void)[]>>(new Map());

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (!token) {
      console.warn('No auth token available for WebSocket connection');
      return;
    }

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = `${SOCKET_URL}?token=${encodeURIComponent(token)}`;
      const newSocket = new WebSocket(wsUrl);

      newSocket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      newSocket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setSocket(null);
        socketRef.current = null;

        // Auto-reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`);
            connect();
          }, 1000 * reconnectAttempts.current);
        }
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket connection error:', error);
        setIsConnected(false);
      };

      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { event: eventName, payload } = data;

          // Call registered event listeners
          const listeners = eventListeners.current.get(eventName) || [];
          listeners.forEach(listener => {
            try {
              listener(payload);
            } catch (error) {
              console.error(`Error in event listener for ${eventName}:`, error);
            }
          });

          // Call option callbacks for specific events
          switch (eventName) {
            case 'notification:new':
              onNotification?.(payload);
              break;
            case 'attendance:update':
              onAttendanceUpdate?.(payload);
              break;
            case 'transport:update':
              onTransportUpdate?.(payload);
              break;
            case 'notice:new':
              onNotice?.(payload);
              break;
            case 'chat:message':
              onChatMessage?.(payload);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socketRef.current = newSocket;
      setSocket(newSocket);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [token, onNotification, onAttendanceUpdate, onTransportUpdate, onNotice, onChatMessage]);

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    if (socketRef.current) {
      socketRef.current.close(1000, 'Client disconnect');
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  // Join chat room
  const joinChat = useCallback((roomId: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event: 'chat:join',
        payload: { roomId }
      }));
    }
  }, []);

  // Leave chat room
  const leaveChat = useCallback((roomId: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event: 'chat:leave',
        payload: { roomId }
      }));
    }
  }, []);

  // Send chat message
  const sendChatMessage = useCallback((roomId: string, message: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event: 'chat:message',
        payload: { roomId, message }
      }));
    }
  }, []);

  // Send typing indicator
  const sendTyping = useCallback((roomId: string, isTyping: boolean) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event: 'chat:typing',
        payload: { roomId, isTyping }
      }));
    }
  }, []);

  // Join class for live attendance
  const joinClass = useCallback((classId: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event: 'class:join',
        payload: { classId }
      }));
    }
  }, []);

  // Leave class
  const leaveClass = useCallback((classId: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event: 'class:leave',
        payload: { classId }
      }));
    }
  }, []);

  // Subscribe to transport
  const subscribeTransport = useCallback((routeId: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event: 'transport:subscribe',
        payload: { routeId }
      }));
    }
  }, []);

  // Emit custom event
  const emit = useCallback((event: string, data: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event,
        payload: data
      }));
    }
  }, []);

  // Listen to custom event
  const on = useCallback((event: string, callback: (...args: unknown[]) => void) => {
    if (!eventListeners.current.has(event)) {
      eventListeners.current.set(event, []);
    }
    eventListeners.current.get(event)!.push(callback);
  }, []);

  // Remove event listener
  const off = useCallback((event: string, callback?: (...args: unknown[]) => void) => {
    if (callback) {
      const listeners = eventListeners.current.get(event) || [];
      const filtered = listeners.filter(listener => listener !== callback);
      if (filtered.length === 0) {
        eventListeners.current.delete(event);
      } else {
        eventListeners.current.set(event, filtered);
      }
    } else {
      eventListeners.current.delete(event);
    }
  }, []);

  // Auto-connect on mount if token exists
  useEffect(() => {
    if (autoConnect && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, token, connect, disconnect]);

  return {
    socket,
    isConnected,
    connect,
    disconnect,
    joinChat,
    leaveChat,
    sendChatMessage,
    sendTyping,
    joinClass,
    leaveClass,
    subscribeTransport,
    emit,
    on,
    off
  };
};

// Notification hook
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  const { isConnected, on, off } = useSocket({
    onNotification: handleNotification,
    autoConnect: false
  });

  useEffect(() => {
    if (isConnected) {
      on('notification:new', (payload: unknown) => handleNotification(payload as Notification));
    }
    return () => {
      off('notification:new', (payload: unknown) => handleNotification(payload as Notification));
    };
  }, [isConnected, handleNotification, on, off]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    clearNotifications,
    markAsRead,
    markAllAsRead,
    isConnected,
    on,
    off
  };
};

// Chat hook
export const useChat = (roomId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleMessage = useCallback((message: ChatMessage) => {
    if (message.roomId === roomId) {
      setMessages(prev => [...prev, message]);
    }
  }, [roomId]);

  const handleTypingCallback = useCallback((data: { userId: string; userName: string; isTyping: boolean; roomId: string }) => {
    if (data.roomId === roomId) {
      if (data.isTyping) {
        setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
      } else {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    }
  }, [roomId]);

  const { joinChat, leaveChat, sendChatMessage, sendTyping, on, off, isConnected } = useSocket({
    onChatMessage: handleMessage,
    autoConnect: false
  });

  useEffect(() => {
    if (isConnected && roomId) {
      joinChat(roomId);
      on('chat:message', (payload: unknown) => handleMessage(payload as ChatMessage));
      on('chat:typing', (payload: unknown) => handleTypingCallback(payload as { userId: string; userName: string; isTyping: boolean; roomId: string }));
    }

    return () => {
      if (roomId) {
        leaveChat(roomId);
      }
      off('chat:message', (payload: unknown) => handleMessage(payload as ChatMessage));
      off('chat:typing', (payload: unknown) => handleTypingCallback(payload as { userId: string; userName: string; isTyping: boolean; roomId: string }));
    };
  }, [isConnected, roomId, joinChat, leaveChat, on, off, handleMessage, handleTypingCallback]);

  const sendMessage = useCallback((message: string) => {
    sendChatMessage(roomId, message);
  }, [roomId, sendChatMessage]);

  const sendTypingIndicator = useCallback((typing: boolean) => {
    setIsTyping(typing);
    sendTyping(roomId, typing);
  }, [roomId, sendTyping]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    typingUsers,
    isTyping,
    sendMessage,
    sendTypingIndicator,
    clearMessages,
    isConnected
  };
};

// Live Attendance hook
export const useLiveAttendance = (classId: string) => {
  const [attendanceUpdates, setAttendanceUpdates] = useState<AttendanceUpdate[]>([]);
  const [isLive, setIsLive] = useState(false);

  const handleAttendanceUpdate = useCallback((update: AttendanceUpdate) => {
    if (update.classId === classId) {
      setAttendanceUpdates(prev => {
        const existing = prev.findIndex(a => a.studentId === update.studentId && a.date === update.date);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = update;
          return updated;
        }
        return [...prev, update];
      });
    }
  }, [classId]);

  const { joinClass, leaveClass, on, off, isConnected } = useSocket({
    onAttendanceUpdate: handleAttendanceUpdate,
    autoConnect: false
  });

  useEffect(() => {
    if (isConnected && classId) {
      joinClass(classId);
      on('attendance:update', (payload: unknown) => handleAttendanceUpdate(payload as AttendanceUpdate));
      setIsLive(true);
    }

    return () => {
      if (classId) {
        leaveClass(classId);
      }
      off('attendance:update', (payload: unknown) => handleAttendanceUpdate(payload as AttendanceUpdate));
      setIsLive(false);
    };
  }, [isConnected, classId, joinClass, leaveClass, on, off, handleAttendanceUpdate]);

  const updateStudentAttendance = useCallback((studentId: string, status: 'present' | 'absent' | 'late', date: string) => {
    const update: AttendanceUpdate = { studentId, status, date, classId };
    setAttendanceUpdates(prev => {
      const existing = prev.findIndex(a => a.studentId === studentId && a.date === date);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = update;
        return updated;
      }
      return [...prev, update];
    });
  }, []);

  const clearUpdates = useCallback(() => {
    setAttendanceUpdates([]);
  }, []);

  return {
    attendanceUpdates,
    isLive,
    updateStudentAttendance,
    clearUpdates,
    isConnected
  };
};

// Transport tracking hook
export const useTransportTracking = (routeId: string) => {
  const [vehicles, setVehicles] = useState<Map<string, TransportUpdate>>(new Map());

  const handleTransportUpdate = useCallback((update: TransportUpdate) => {
    if (update.routeId === routeId) {
      setVehicles(prev => {
        const updated = new Map(prev);
        updated.set(update.vehicleId, update);
        return updated;
      });
    }
  }, [routeId]);

  const { subscribeTransport, on, off, isConnected } = useSocket({
    onTransportUpdate: handleTransportUpdate,
    autoConnect: false
  });

  useEffect(() => {
    if (isConnected && routeId) {
      subscribeTransport(routeId);
      on('transport:update', (payload: unknown) => handleTransportUpdate(payload as TransportUpdate));
    }

    return () => {
      off('transport:update', (payload: unknown) => handleTransportUpdate(payload as TransportUpdate));
    };
  }, [isConnected, routeId, subscribeTransport, on, off, handleTransportUpdate]);

  const getVehicleLocation = useCallback((vehicleId: string) => {
    return vehicles.get(vehicleId);
  }, [vehicles]);

  return {
    vehicles: Array.from(vehicles.values()),
    getVehicleLocation,
    isConnected
  };
};

export default useSocket;
