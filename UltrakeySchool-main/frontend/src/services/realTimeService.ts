export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  readBy: { userId: string; readAt: string }[];
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RealTimeMessage {
  type: 'new_message' | 'message_read' | 'typing' | 'user_online' | 'user_offline';
  data: any;
}

class RealTimeService {
  private userId: string | null = null;
  private messageCallbacks: ((message: Message) => void)[] = [];
  private typingCallbacks: ((data: { userId: string; conversationId: string; isTyping: boolean }) => void)[] = [];
  private onlineStatusCallbacks: ((data: { userId: string; isOnline: boolean }) => void)[] = [];
  private isPolling = false;
  private pollInterval: number | null = null;

  // Public getters for debugging
  get connectedUserId() { return this.userId; }
  get hasCallbacks() { return this.messageCallbacks.length > 0; }
  get pollingActive() { return this.isPolling; }

  connect(userId: string) {
    this.userId = userId;
    
    // Use polling for real-time updates
    if (!this.isPolling) {
      this.startPolling();
    }
    
    // Listen for storage events for cross-tab communication
    this.listenForStorageEvents();
  }

  disconnect() {
    this.stopPolling();
    
    // Remove storage event listener
    if (this.storageEventListener) {
      window.removeEventListener('storage', this.storageEventListener);
      this.storageEventListener = null;
    }
    
    this.userId = null;
  }

  private startPolling() {
    if (this.isPolling) return;
    
    this.isPolling = true;
    this.pollInterval = window.setInterval(() => {
      this.checkForNewMessages();
    }, 500); // Check every 500ms to reduce console spam
  }

  private stopPolling() {
    if (this.pollInterval) {
      window.clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
  }

  private storageEventListener: ((event: StorageEvent) => void) | null = null;
  private processedMessageIds: Set<string> = new Set();

  private listenForStorageEvents() {
    this.storageEventListener = (event: StorageEvent) => {
      if (event.key === 'realtime_global_messages' || 
          event.key?.startsWith('realtime_messages_') || 
          event.key?.startsWith('realtime_trigger_')) {
        // Immediately check for new messages on storage change
        this.checkForNewMessages();
      }
    };
    
    window.addEventListener('storage', this.storageEventListener);
  }

  
  private async checkForNewMessages() {
    // Clean up old processed message IDs (keep only last 30)
    if (this.processedMessageIds.size > 30) {
      const idsArray = Array.from(this.processedMessageIds);
      this.processedMessageIds = new Set(idsArray.slice(-15));
    }
    
    // Check global message pool for new messages
    const globalKey = 'realtime_global_messages';
    const globalMessages = JSON.parse(localStorage.getItem(globalKey) || '[]');
    
    // Process ALL unprocessed messages (not just recent ones)
    const unprocessedMessages = globalMessages.filter((msg: any) => 
      msg.senderId !== this.userId && !this.processedMessageIds.has(msg._id)
    );
    
    console.log('Processing messages:', unprocessedMessages.length, 'Total messages:', globalMessages.length);
    
    unprocessedMessages.forEach((message: Message) => {
      this.processedMessageIds.add(message._id);
      this.messageCallbacks.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in message callback:', error);
        }
      });
    });
  }

  sendMessage(message: Omit<Message, '_id' | 'createdAt' | 'updatedAt'>) {
    // Create full message with ID and timestamps
    const fullMessage: Message = {
      ...message,
      _id: `msg_${Date.now()}_${Math.random()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Sending message:', fullMessage);
    
    // Store in global message pool for any user to receive
    const globalKey = 'realtime_global_messages';
    let globalMessages = JSON.parse(localStorage.getItem(globalKey) || '[]');
    
    // Clean up old messages (keep only last 50)
    globalMessages = globalMessages.filter((msg: any) => 
      Date.now() - msg.timestamp < 60000 // Keep only last 60 seconds
    );
    
    globalMessages.push({
      ...fullMessage,
      timestamp: Date.now()
    });
    
    // Keep only last 50 messages to prevent memory bloat
    if (globalMessages.length > 50) {
      globalMessages = globalMessages.slice(-50);
    }
    
    localStorage.setItem(globalKey, JSON.stringify(globalMessages));
    
    // Store in conversation-specific storage
    const storageKey = `realtime_messages_${message.conversationId}`;
    const existingMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existingMessages.push(fullMessage);
    localStorage.setItem(storageKey, JSON.stringify(existingMessages));
    
    // Trigger storage event for immediate delivery to all tabs
    // Use a temporary key change to trigger the storage event
    const tempKey = 'realtime_trigger_' + Date.now();
    localStorage.setItem(tempKey, JSON.stringify(globalMessages));
    localStorage.removeItem(tempKey);
    
    // Immediately check for new messages to ensure delivery
    setTimeout(() => {
      this.checkForNewMessages();
    }, 100);
  }

  markMessageAsRead(_messageId: string, _conversationId: string) {
    // Mark message as read functionality
  }

  sendTyping(conversationId: string, isTyping: boolean) {
    this.typingCallbacks.forEach(callback => {
      callback({ userId: this.userId || 'unknown', conversationId, isTyping });
    });
  }

  onNewMessage(callback: (message: Message) => void) {
    // Check if callback already exists to prevent duplicates
    if (!this.messageCallbacks.includes(callback)) {
      this.messageCallbacks.push(callback);
    }
  }

  onTyping(callback: (data: { userId: string; conversationId: string; isTyping: boolean }) => void) {
    // Check if callback already exists to prevent duplicates
    if (!this.typingCallbacks.some(cb => cb.toString() === callback.toString())) {
      this.typingCallbacks.push(callback);
    }
  }

  onOnlineStatus(callback: (data: { userId: string; isOnline: boolean }) => void) {
    // Check if callback already exists to prevent duplicates
    if (!this.onlineStatusCallbacks.includes(callback)) {
      this.onlineStatusCallbacks.push(callback);
    }
  }

  removeMessageCallback(callback: (message: Message) => void) {
    this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
  }

  removeTypingCallback(callback: (data: { userId: string; conversationId: string; isTyping: boolean }) => void) {
    this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback);
  }

  removeOnlineStatusCallback(callback: (data: { userId: string; isOnline: boolean }) => void) {
    this.onlineStatusCallbacks = this.onlineStatusCallbacks.filter(cb => cb !== callback);
  }

  isConnected(): boolean {
    return this.isPolling;
  }
}

export const realTimeService = new RealTimeService();
export default realTimeService;