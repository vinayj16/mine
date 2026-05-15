// User interface - adjust path based on your project structure
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  institutionId?: string;
}

export interface CommunicationMessage {
  read: any;
  id: string;
  from: string;
  to: string | string[];
  type: 'chat' | 'email' | 'calendar' | 'file' | 'note' | 'system';
  subject?: string;
  content: any;
  timestamp: string;
  institutionId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

export interface CommunicationChannel {
  id: string;
  name: string;
  type: 'chat' | 'email' | 'calendar' | 'file' | 'note';
  participants: string[];
  institutionId?: string;
  isActive: boolean;
  createdAt: string;
  lastActivity: string;
}

export interface UserVisibility {
  userId: string;
  isInstitution: boolean;
  institutionId?: string;
  role: string;
  isVisibleToAgents: boolean;
  isVisibleToSuperAdmin: boolean;
  visibleInstitutions: string[];
  onlineStatus: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: string;
}

class CrossApplicationCommunicationService {
  private readonly STORAGE_KEY = 'cross_app_communication';
  private readonly USER_VISIBILITY_KEY = 'user_visibility';
  private eventListeners: Map<string, Function[]> = new Map();

  // Send message between applications
  sendMessage(message: Omit<CommunicationMessage, 'id' | 'timestamp'>): string {
    const fullMessage: CommunicationMessage = {
      ...message,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };

    // Store message
    this.storeMessage(fullMessage);

    // Notify listeners
    this.notifyListeners('message', fullMessage);

    // Send to backend if it's a real message (not internal)
    if (message.type !== 'system') {
      this.sendToBackend(fullMessage);
    }

        return fullMessage.id;
  }

  // Get messages for user
  getMessages(userId: string, type?: string, institutionId?: string): CommunicationMessage[] {
    try {
      const allMessages = this.getAllStoredMessages();
      let filtered = allMessages.filter(msg => {
        const isRecipient = Array.isArray(msg.to) ? msg.to.includes(userId) : msg.to === userId;
        const isSender = msg.from === userId;
        
        if (!isRecipient && !isSender) return false;
        if (type && msg.type !== type) return false;
        if (institutionId && msg.institutionId && msg.institutionId !== institutionId) return false;
        
        return true;
      });

      return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('[CrossAppCommunication] Error getting messages:', error);
      return [];
    }
  }

  // Get communication channels
  getChannels(userId: string, institutionId?: string): CommunicationChannel[] {
    try {
      const allChannels = this.getAllStoredChannels();
      return allChannels.filter(channel => {
        const isParticipant = channel.participants.includes(userId);
        const isInstitutionChannel = !institutionId || channel.institutionId === institutionId;
        return isParticipant && isInstitutionChannel;
      });
    } catch (error) {
      console.error('[CrossAppCommunication] Error getting channels:', error);
      return [];
    }
  }

  // Create communication channel
  createChannel(channel: Omit<CommunicationChannel, 'id' | 'createdAt' | 'lastActivity'>): string {
    const fullChannel: CommunicationChannel = {
      ...channel,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    this.storeChannel(fullChannel);
    this.notifyListeners('channel', fullChannel);

        return fullChannel.id;
  }

  // Update user visibility
  updateUserVisibility(user: User, visibility: Partial<UserVisibility>): void {
    const updatedVisibility: UserVisibility = {
      userId: user.id,
      isInstitution: !!user.institutionId,
      institutionId: user.institutionId,
      role: user.role,
      isVisibleToAgents: true,
      isVisibleToSuperAdmin: true,
      visibleInstitutions: user.institutionId ? [user.institutionId] : [],
      onlineStatus: 'online',
      lastSeen: new Date().toISOString(),
      ...visibility
    };

    this.storeUserVisibility(updatedVisibility);
    this.notifyListeners('visibility', updatedVisibility);

    // Send to backend
    this.sendVisibilityToBackend(updatedVisibility);
  }

  // Get user visibility
  getUserVisibility(userId: string): UserVisibility | null {
    try {
      const allVisibility = this.getAllStoredVisibility();
      return allVisibility[userId] || null;
    } catch (error) {
      console.error('[CrossAppCommunication] Error getting user visibility:', error);
      return null;
    }
  }

  // Get visible users for communication
  getVisibleUsers(currentUser: User, institutionId?: string): UserVisibility[] {
    try {
      const allVisibility = this.getAllStoredVisibility();
      
      return Object.values(allVisibility).filter(user => {
        // Don't show self
        if (user.userId === currentUser.id) return false;

        // Super admin can see everyone
        if (currentUser.role === 'super_admin') return true;

        // Agent can see everyone
        if (currentUser.role === 'agent') return true;

        // Institution users can see users in same institution
        if (currentUser.institutionId && user.institutionId) {
          if (institutionId) {
            return user.institutionId === institutionId;
          }
          return user.institutionId === currentUser.institutionId;
        }

        // Check visibility settings
        if (currentUser.role === 'admin' && !user.isVisibleToSuperAdmin) return false;
        if (currentUser.role === 'agent' && !user.isVisibleToAgents) return false;

        return false;
      });
    } catch (error) {
      console.error('[CrossAppCommunication] Error getting visible users:', error);
      return [];
    }
  }

  // Check if users can communicate
  canCommunicate(user1: User, user2: User): boolean {
    // Super admin can communicate with anyone
    if (user1.role === 'super_admin') return true;
    
    // Agent can communicate with anyone
    if (user1.role === 'agent') return true;

    // Users in same institution can communicate
    if (user1.institutionId && user2.institutionId) {
      return user1.institutionId === user2.institutionId;
    }

    return false;
  }

  // Add event listener
  addEventListener(event: 'message' | 'channel' | 'visibility', callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  // Remove event listener
  removeEventListener(event: 'message' | 'channel' | 'visibility', callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Notify listeners
  private notifyListeners(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Storage methods
  private storeMessage(message: CommunicationMessage): void {
    try {
      const messages = this.getAllStoredMessages();
      messages.push(message);
      
      // Keep only last 1000 messages
      if (messages.length > 1000) {
        messages.splice(0, messages.length - 1000);
      }
      
      localStorage.setItem(`${this.STORAGE_KEY}_messages`, JSON.stringify(messages));
    } catch (error) {
      console.error('[CrossAppCommunication] Error storing message:', error);
    }
  }

  private getAllStoredMessages(): CommunicationMessage[] {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_messages`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[CrossAppCommunication] Error parsing stored messages:', error);
      return [];
    }
  }

  private storeChannel(channel: CommunicationChannel): void {
    try {
      const channels = this.getAllStoredChannels();
      const existingIndex = channels.findIndex(c => c.id === channel.id);
      
      if (existingIndex !== -1) {
        channels[existingIndex] = channel;
      } else {
        channels.push(channel);
      }
      
      localStorage.setItem(`${this.STORAGE_KEY}_channels`, JSON.stringify(channels));
    } catch (error) {
      console.error('[CrossAppCommunication] Error storing channel:', error);
    }
  }

  private getAllStoredChannels(): CommunicationChannel[] {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_channels`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[CrossAppCommunication] Error parsing stored channels:', error);
      return [];
    }
  }

  private storeUserVisibility(visibility: UserVisibility): void {
    try {
      const allVisibility = this.getAllStoredVisibility();
      allVisibility[visibility.userId] = visibility;
      localStorage.setItem(this.USER_VISIBILITY_KEY, JSON.stringify(allVisibility));
    } catch (error) {
      console.error('[CrossAppCommunication] Error storing user visibility:', error);
    }
  }

  private getAllStoredVisibility(): Record<string, UserVisibility> {
    try {
      const stored = localStorage.getItem(this.USER_VISIBILITY_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('[CrossAppCommunication] Error parsing stored visibility:', error);
      return {};
    }
  }

  // Backend communication
  private async sendToBackend(message: CommunicationMessage): Promise<void> {
    try {
      const response = await fetch('/api/v1/communications/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

          } catch (error) {
      console.error('[CrossAppCommunication] Error sending to backend:', error);
    }
  }

  private async sendVisibilityToBackend(visibility: UserVisibility): Promise<void> {
    try {
      const response = await fetch('/api/v1/communications/visibility', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(visibility)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

          } catch (error) {
      console.error('[CrossAppCommunication] Error sending visibility to backend:', error);
    }
  }

  // Utility methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Clear all data
  clearAllData(): void {
    try {
      localStorage.removeItem(`${this.STORAGE_KEY}_messages`);
      localStorage.removeItem(`${this.STORAGE_KEY}_channels`);
      localStorage.removeItem(this.USER_VISIBILITY_KEY);
          } catch (error) {
      console.error('[CrossAppCommunication] Error clearing data:', error);
    }
  }
}

export default new CrossApplicationCommunicationService();
