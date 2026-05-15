import api from './api';

export interface Participant {
  userId: string;
  role?: string;
  name?: string;
  joinedAt: string;
}

export interface Conversation {
  _id: string;
  schoolId?: string;
  participants: Participant[];
  title?: string;
  isGroup: boolean;
  groupAdmin?: string;
  lastMessage?: {
    message: string;
    senderId: string;
    senderName?: string;
    messageType?: 'text' | 'image' | 'file' | 'audio' | 'video';
    sentAt: string;
    deliveredAt?: string;
    readAt?: string;
  };
  unreadCount?: Record<string, number>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isGlobal?: boolean;
  category?: string;
}

export interface Message {
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

export interface CreateConversationData {
  schoolId: string;
  participants: {
    userId: string;
    role?: string;
    name?: string;
  }[];
  title?: string;
  isGroup: boolean;
}

export interface SendMessageData {
  senderId: string;
  senderName?: string;
  content: string;
  messageType?: string;
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
}

const chatService = {
  // Conversations
  createConversation: async (_schoolId: string, data: Omit<CreateConversationData, 'schoolId'>) => {
    const response = await api.post(`/chat/conversations`, data);
    return response.data;
  },

  createGlobalConversation: async (data: Omit<CreateConversationData, 'schoolId'>) => {
    // For global users (agents and superadmin), create conversation without schoolId
    const response = await api.post(`/chat/global-conversations`, data);
    return response.data;
  },

  getConversations: async (_schoolId: string, _userId: string) => {
    const response = await api.get(`/chat/conversations`);
    return response.data;
  },

  getAgentConversations: async (_userId: string) => {
    // For agents, use a platform-wide endpoint without schoolId
    const response = await api.get(`/chat/agent-conversations`);
    return response.data;
  },

  getConversationById: async (_schoolId: string, conversationId: string) => {
    const response = await api.get(`/chat/conversations/${conversationId}`);
    return response.data;
  },

  getMessages: async (conversationId: string, page: number = 1, limit: number = 50) => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
    return response.data;
  },

  getChatHistory: async (userId1: string, userId2: string, page: number = 1, limit: number = 50) => {
    const response = await api.get(`/chat/history/${userId1}/${userId2}?page=${page}&limit=${limit}`);
    return response.data;
  },

  getAllUserMessages: async (userId: string, page: number = 1, limit: number = 50) => {
    const response = await api.get(`/chat/user/${userId}/messages?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Messages
  sendMessage: async (conversationId: string, data: SendMessageData) => {
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, data);
    return response.data;
  },
  
  markAsRead: async (conversationId: string, userId: string) => {
    const response = await api.post(`/chat/conversations/${conversationId}/read`, { userId });
    return response.data;
  },

  deleteMessage: async (messageId: string) => {
    const response = await api.delete(`/chat/messages/${messageId}`);
    return response.data;
  },

  uploadFile: async (formData: FormData) => {
    const response = await api.post('/chat/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default chatService;
