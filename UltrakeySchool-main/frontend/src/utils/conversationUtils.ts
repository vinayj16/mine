// Utility functions for generating consistent conversation IDs

/**
 * Generate a consistent conversation ID between two users
 * Uses emails if available (more stable than user IDs)
 * Format: email1-email2 (sorted alphabetically)
 */
export const generateConversationId = (
  userId1: string, 
  userId2: string, 
  email1?: string, 
  email2?: string
): string => {
  // Use emails if available (more stable than user IDs)
  if (email1 && email2) {
    return [email1, email2].sort().join('-');
  }
  // Fallback to user IDs
  return [userId1, userId2].sort().join('-');
};

/**
 * Generate a fixed conversation ID for global users (agents and superadmin)
 * This ensures consistent conversation IDs across the platform
 */
export const generateGlobalConversationId = (
  user1: { id: string; email: string },
  user2: { id: string; email: string }
): string => {
  return generateConversationId(user1.id, user2.id, user1.email, user2.email);
};

/**
 * Create a conversation object with consistent ID
 */
export const createConversationObject = (
  currentUser: { id: string; name: string; email: string; role: string; institutionCode?: string },
  otherUser: { id: string; name: string; email: string; role: string; institutionCode?: string },
  isGroup: boolean = false,
  isGlobal: boolean = false
) => {
  const conversationId = generateGlobalConversationId(currentUser, otherUser);
  
  return {
    title: otherUser.name,
    participants: [
      {
        userId: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        email: currentUser.email,
        institutionCode: currentUser.institutionCode,
        joinedAt: new Date().toISOString()
      },
      {
        userId: otherUser.id,
        name: otherUser.name,
        role: otherUser.role,
        email: otherUser.email,
        institutionCode: otherUser.institutionCode,
        joinedAt: new Date().toISOString()
      }
    ],
    lastMessage: {
      message: 'Start a conversation!',
      senderId: 'system',
      sentAt: new Date().toISOString()
    },
    unreadCount: {
      [currentUser.id]: 0,
      [otherUser.id]: 0
    },
    isGroup,
    isGlobal,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

/**
 * Check if a conversation exists between two users
 */
export const findConversationBetweenUsers = (
  conversations: any[],
  userId1: string,
  userId2: string
): any | null => {
  return conversations.find(conv => {
    const participants = conv.participants || [];
    const hasUser1 = participants.some((p: any) => p.userId === userId1);
    const hasUser2 = participants.some((p: any) => p.userId === userId2);
    return hasUser1 && hasUser2 && !conv.isGroup;
  }) || null;
};

/**
 * Get the other participant in a conversation
 */
export const getOtherParticipant = (
  conversation: any,
  currentUserId: string
): any | null => {
  const participants = conversation.participants || [];
  return participants.find((p: any) => p.userId !== currentUserId) || null;
};

/**
 * Filter users based on search query
 */
export const filterUsers = (
  users: any[],
  searchQuery: string
): any[] => {
  if (!searchQuery.trim()) return users;
  
  const query = searchQuery.toLowerCase();
  return users.filter(user => 
    user.name?.toLowerCase().includes(query) ||
    user.email?.toLowerCase().includes(query) ||
    user.role?.toLowerCase().includes(query)
  );
};
