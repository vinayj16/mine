import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import chatService, { type Conversation, type Message } from '../../services/chatService';
import userCommunicationService from '../../services/userCommunicationService';
import chatSocketService from '../../services/chatSocketService';
import { createConversationObject, findConversationBetweenUsers } from '../../utils/conversationUtils';
import { apiClient } from '../../api/client';

const Chat: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<Map<string, Message[]>>(new Map());
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [, setBlockedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showUserList, setShowUserList] = useState(false);
  const [userListPage] = useState(1);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [userStatuses, setUserStatuses] = useState<Map<string, { isOnline: boolean; lastSeen: string }>>(new Map());
  const [messagePage, setMessagePage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const usersPerPage = 20;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationUpdateTimeoutRef = useRef<number | null>(null);

  const currentUserId = localStorage.getItem('userId') || '';
  const currentUserName = localStorage.getItem('userName') || 'User';
  const currentUserEmail = localStorage.getItem('userEmail') || '';

  // Fetch conversations on mount and when dependencies change
  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
    }
  }, [currentUserId]); // Re-fetch when user changes

  // Fetch all users for global users (agents and superadmin)
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'agent' || userRole === 'superadmin') {
      userCommunicationService.getAllUsers()
        .then(users => {
          // Remove duplicates based on email
          const uniqueUsers = users.filter((user, index, self) => 
            index === self.findIndex((u) => u.email === user.email)
          );
          setAllUsers(uniqueUsers);
        })
        .catch(err => {
          console.error('Failed to fetch all users:', err);
        });
    }
  }, []);

  // Initialize chat socket when component mounts
  useEffect(() => {
    if (currentUserId) {
      const userRole = localStorage.getItem('userRole');
      const institutionCode = localStorage.getItem('institutionCode');
      
      // Request browser notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
      chatSocketService.connect(currentUserId, userRole || '', institutionCode || '');
      
      // Set up message listeners
      chatSocketService.onMessage((message) => {
        console.log('📨 Received message via socket:', message);
        
        // Ensure message has unique ID
        if (!message._id) {
          message._id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        }
        
        // Store message in conversation-specific map
        setMessagesByConversation(prev => {
          const newMap = new Map(prev);
          const conversationMessages = newMap.get(message.conversationId) || [];
          newMap.set(message.conversationId, [...conversationMessages, message]);
          return newMap;
        });

        // Add message to current conversation if it matches by ID or participants
        console.log('🔎 Message received - selectedConversation:', selectedConversation ? 'exists' : 'null');
        if (selectedConversation) {
          // Check if conversation ID matches
          if (message.conversationId === selectedConversation._id) {
            console.log('✅ Conversation ID match - adding message');
            setMessages(prev => [...prev, message]);
          } else {
            // Check if message is from the same participants (handles duplicate backend conversations)
            const messageParticipants = [message.senderId, message.recipientId].sort();
            const selectedParticipants = selectedConversation.participants?.map((p: any) => p.userId).sort();
            
            console.log('🔍 Participant check:', {
              messageParticipants,
              selectedParticipants,
              match: JSON.stringify(messageParticipants) === JSON.stringify(selectedParticipants)
            });
            
            if (JSON.stringify(messageParticipants) === JSON.stringify(selectedParticipants)) {
              // Message is from the same participants, add it to the chat
              console.log('✅ Participant match - adding message');
              setMessages(prev => [...prev, message]);
            } else {
              console.log('❌ No match - message not added to current view');
            }
          }
        } else {
          console.log('⚠️ No conversation selected - auto-selecting matching conversation');
          // Auto-select the conversation if it exists in the list
          const messageParticipants = [message.senderId, message.recipientId].sort();
          const matchingConversation = conversations.find(conv => {
            const convParticipants = conv.participants?.map((p: any) => p.userId).sort();
            return JSON.stringify(convParticipants) === JSON.stringify(messageParticipants);
          });
          
          if (matchingConversation) {
            console.log('🎯 Auto-selecting conversation:', matchingConversation.title);
            setSelectedConversation(matchingConversation);
            
            // Load ALL messages from Map for these participants (full chat history)
            const messageParticipants = [message.senderId, message.recipientId].sort();
            let allMessages: Message[] = [];
            const seenMessageIds = new Set<string>();
            
            messagesByConversation.forEach((msgs) => {
              msgs.forEach(msg => {
                const msgParticipants = [msg.senderId, msg.recipientId].sort();
                const matchesParticipants = JSON.stringify(msgParticipants) === JSON.stringify(messageParticipants);
                
                if (matchesParticipants && !seenMessageIds.has(msg._id)) {
                  allMessages.push(msg);
                  seenMessageIds.add(msg._id);
                }
              });
            });
            
            // Sort by timestamp
            allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            
            console.log(`🎯 Loaded ${allMessages.length} messages from chat history (auto-select)`);
            setMessages(allMessages);
          } else {
            console.log('⚠️ No matching conversation found - creating temporary conversation');
            // Create temporary conversation
            const tempConversation: Conversation = {
              _id: message.conversationId,
              title: message.senderId === currentUserId ? message.recipientId : message.senderName,
              participants: [
                { userId: message.senderId, name: message.senderName, joinedAt: new Date().toISOString() },
                { userId: message.recipientId, name: message.recipientId === currentUserId ? currentUserName : 'Unknown', joinedAt: new Date().toISOString() }
              ],
              lastMessage: {
                message: message.content,
                senderId: message.senderId,
                senderName: message.senderName,
                sentAt: message.createdAt
              },
              isGroup: false,
              isGlobal: true,
              unreadCount: {} as Record<string, number>,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            console.log('🎯 Creating temporary conversation:', tempConversation.title);
            setConversations(prev => [tempConversation, ...prev]);
            setSelectedConversation(tempConversation);
            
            // Load ALL messages from Map for these participants (full chat history)
            const messageParticipants = [message.senderId, message.recipientId].sort();
            let allMessages: Message[] = [];
            const seenMessageIds = new Set<string>();
            
            messagesByConversation.forEach((msgs) => {
              msgs.forEach(msg => {
                const msgParticipants = [msg.senderId, msg.recipientId].sort();
                const matchesParticipants = JSON.stringify(msgParticipants) === JSON.stringify(messageParticipants);
                
                if (matchesParticipants && !seenMessageIds.has(msg._id)) {
                  allMessages.push(msg);
                  seenMessageIds.add(msg._id);
                }
              });
            });
            
            // Sort by timestamp
            allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            
            console.log(`📜 Loaded ${allMessages.length} messages from chat history (temp conversation)`);
            setMessages(allMessages);
            
            // Fetch real conversations from server
            fetchConversations();
          }
        }
        
        // Show notification for received message (only if not from current user)
        if (message.senderId !== currentUserId) {
          console.log('🔔 Showing notification for message from:', message.senderName);
          console.log('🔔 Notification permission:', Notification.permission);
          
          // Show toast notification with message preview
          toast.info(`📩 ${message.senderName}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`, {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
          });
          console.log('🔔 Toast notification shown');
          
          // Request browser notification permission and show it
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Message from ${message.senderName}`, {
              body: message.content,
              icon: '/favicon.ico'
            });
            console.log('🔔 Browser notification shown');
          } else if ('Notification' in window && Notification.permission === 'default') {
            console.log('🔔 Requesting notification permission...');
            Notification.requestPermission();
          } else {
            console.log('🔔 Browser notifications not available or denied');
          }
        } else {
          console.log('🔔 Message from self - no notification needed');
        }
        
        // Update conversation list locally without API call
        setConversations(prev => {
          // Check if conversation exists by ID
          const convExists = prev.some(conv => conv._id === message.conversationId);
          
          if (convExists) {
            // Update the conversation and move it to the top
            const updatedConversations = prev.map(conv => 
              conv._id === message.conversationId 
                ? { ...conv, lastMessage: { message: message.content, senderId: message.senderId, senderName: message.senderName, sentAt: message.createdAt } }
                : conv
            );
            // Move updated conversation to top
            const updatedConv = updatedConversations.find(conv => conv._id === message.conversationId);
            const otherConvs = updatedConversations.filter(conv => conv._id !== message.conversationId);
            return updatedConv ? [updatedConv, ...otherConvs] : updatedConversations;
          } else {
            // Check if there's a conversation with the same participants (merge duplicates)
            const existingConvWithSameParticipants = findConversationBetweenUsers(
              prev,
              message.senderId,
              message.recipientId
            );
            
            if (existingConvWithSameParticipants) {
              // Update the existing conversation with the new message and move to top
              const updatedConversations = prev.map(conv => 
                conv._id === existingConvWithSameParticipants._id 
                  ? { ...conv, lastMessage: { message: message.content, senderId: message.senderId, senderName: message.senderName, sentAt: message.createdAt } }
                  : conv
              );
              const updatedConv = updatedConversations.find(conv => conv._id === existingConvWithSameParticipants._id);
              const otherConvs = updatedConversations.filter(conv => conv._id !== existingConvWithSameParticipants._id);
              return updatedConv ? [updatedConv, ...otherConvs] : updatedConversations;
            } else {
              // If conversation doesn't exist in list, create a temporary conversation from message data
              const tempConversation: Conversation = {
                _id: message.conversationId,
                title: message.senderId === currentUserId ? 'Unknown' : message.senderName,
                participants: [
                  { userId: message.senderId, name: message.senderName, joinedAt: new Date().toISOString() },
                  { userId: currentUserId, name: currentUserName, joinedAt: new Date().toISOString() }
                ],
                lastMessage: {
                  message: message.content,
                  senderId: message.senderId,
                  senderName: message.senderName,
                  sentAt: message.createdAt
                },
                isGroup: false,
                isGlobal: true,
                unreadCount: {} as Record<string, number>,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              
              // Add temporary conversation at top and fetch real conversations
              fetchConversations();
              return [tempConversation, ...prev];
            }
          }
        });
      });

      // Set up message sent listener for our own messages
      chatSocketService.onMessageSent((message) => {
        console.log('📤 Message sent confirmation via socket:', message);
        
        // Store message in conversation-specific map
        setMessagesByConversation(prev => {
          const newMap = new Map(prev);
          const conversationMessages = newMap.get(message.conversationId) || [];
          newMap.set(message.conversationId, [...conversationMessages, message]);
          return newMap;
        });

        // Add our own message to current conversation if it matches by ID or participants
        if (selectedConversation) {
          // Check if conversation ID matches
          if (message.conversationId === selectedConversation._id) {
            console.log('📤 Conversation ID match - adding own message');
            setMessages(prev => [...prev, message]);
          } else {
            // Check if message is from the same participants (handles duplicate backend conversations)
            const messageParticipants = [message.senderId, message.recipientId].sort();
            const selectedParticipants = selectedConversation.participants?.map((p: any) => p.userId).sort();
            
            console.log('📤 Participant check (own message):', {
              messageParticipants,
              selectedParticipants,
              match: JSON.stringify(messageParticipants) === JSON.stringify(selectedParticipants)
            });
            
            if (JSON.stringify(messageParticipants) === JSON.stringify(selectedParticipants)) {
              // Message is from the same participants, add it to the chat
              console.log('📤 Participant match - adding own message');
              setMessages(prev => [...prev, message]);
            } else {
              console.log('📤 No match - own message not added to current view');
            }
          }
        } else {
          console.log('📤 No conversation selected - auto-selecting matching conversation');
          // Auto-select the conversation if it exists in the list
          const messageParticipants = [message.senderId, message.recipientId].sort();
          const matchingConversation = conversations.find(conv => {
            const convParticipants = conv.participants?.map((p: any) => p.userId).sort();
            return JSON.stringify(convParticipants) === JSON.stringify(messageParticipants);
          });
          
          if (matchingConversation) {
            console.log('📤 Auto-selecting conversation:', matchingConversation.title);
            setSelectedConversation(matchingConversation);
            
            // Load ALL messages from Map for these participants (full chat history)
            const messageParticipants = [message.senderId, message.recipientId].sort();
            let allMessages: Message[] = [];
            const seenMessageIds = new Set<string>();
            
            messagesByConversation.forEach((msgs) => {
              msgs.forEach(msg => {
                const msgParticipants = [msg.senderId, msg.recipientId].sort();
                const matchesParticipants = JSON.stringify(msgParticipants) === JSON.stringify(messageParticipants);
                
                if (matchesParticipants && !seenMessageIds.has(msg._id)) {
                  allMessages.push(msg);
                  seenMessageIds.add(msg._id);
                }
              });
            });
            
            // Sort by timestamp
            allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            
            console.log(`📤 Loaded ${allMessages.length} messages from chat history (auto-select)`);
            setMessages(allMessages);
          } else {
            console.log('📤 No matching conversation found - creating temporary conversation');
            // Create temporary conversation
            const tempConversation: Conversation = {
              _id: message.conversationId,
              title: message.senderId === currentUserId ? message.recipientId : message.senderName,
              participants: [
                { userId: message.senderId, name: message.senderName, joinedAt: new Date().toISOString() },
                { userId: message.recipientId, name: message.recipientId === currentUserId ? currentUserName : 'Unknown', joinedAt: new Date().toISOString() }
              ],
              lastMessage: {
                message: message.content,
                senderId: message.senderId,
                senderName: message.senderName,
                sentAt: message.createdAt
              },
              isGroup: false,
              isGlobal: true,
              unreadCount: {} as Record<string, number>,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            console.log('📤 Creating temporary conversation:', tempConversation.title);
            setConversations(prev => [tempConversation, ...prev]);
            setSelectedConversation(tempConversation);
            
            // Load ALL messages from Map for these participants (full chat history)
            const messageParticipants = [message.senderId, message.recipientId].sort();
            let allMessages: Message[] = [];
            const seenMessageIds = new Set<string>();
            
            messagesByConversation.forEach((msgs) => {
              msgs.forEach(msg => {
                const msgParticipants = [msg.senderId, msg.recipientId].sort();
                const matchesParticipants = JSON.stringify(msgParticipants) === JSON.stringify(messageParticipants);
                
                if (matchesParticipants && !seenMessageIds.has(msg._id)) {
                  allMessages.push(msg);
                  seenMessageIds.add(msg._id);
                }
              });
            });
            
            // Sort by timestamp
            allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            
            console.log(`📤 Loaded ${allMessages.length} messages from chat history (temp conversation)`);
            setMessages(allMessages);
            
            // Fetch real conversations from server
            fetchConversations();
          }
        }
        
        // Update conversation list locally
        setConversations(prev => {
          // Check if conversation exists by ID
          const convExists = prev.some(conv => conv._id === message.conversationId);
          
          if (convExists) {
            // Update the conversation and move it to the top
            const updatedConversations = prev.map(conv => 
              conv._id === message.conversationId 
                ? { ...conv, lastMessage: { message: message.content, senderId: message.senderId, senderName: message.senderName, sentAt: message.createdAt } }
                : conv
            );
            // Move updated conversation to top
            const updatedConv = updatedConversations.find(conv => conv._id === message.conversationId);
            const otherConvs = updatedConversations.filter(conv => conv._id !== message.conversationId);
            return updatedConv ? [updatedConv, ...otherConvs] : updatedConversations;
          } else {
            // Check if there's a conversation with the same participants (merge duplicates)
            const existingConvWithSameParticipants = findConversationBetweenUsers(
              prev,
              message.senderId,
              message.recipientId
            );
            
            if (existingConvWithSameParticipants) {
              // Update the existing conversation with the new message and move to top
              const updatedConversations = prev.map(conv => 
                conv._id === existingConvWithSameParticipants._id 
                  ? { ...conv, lastMessage: { message: message.content, senderId: message.senderId, senderName: message.senderName, sentAt: message.createdAt } }
                  : conv
              );
              const updatedConv = updatedConversations.find(conv => conv._id === existingConvWithSameParticipants._id);
              const otherConvs = updatedConversations.filter(conv => conv._id !== existingConvWithSameParticipants._id);
              return updatedConv ? [updatedConv, ...otherConvs] : updatedConversations;
            } else {
              // If conversation doesn't exist in list, create a temporary conversation from message data
              const tempConversation: Conversation = {
                _id: message.conversationId,
                title: message.senderId === currentUserId ? 'Unknown' : message.senderName,
                participants: [
                  { userId: message.senderId, name: message.senderName, joinedAt: new Date().toISOString() },
                  { userId: currentUserId, name: currentUserName, joinedAt: new Date().toISOString() }
                ],
                lastMessage: {
                  message: message.content,
                  senderId: message.senderId,
                  senderName: message.senderName,
                  sentAt: message.createdAt
                },
                isGroup: false,
                isGlobal: true,
                unreadCount: {} as Record<string, number>,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              
              // Add temporary conversation at top and fetch real conversations
              fetchConversations();
              return [tempConversation, ...prev];
            }
          }
        });
      });

      // Set up conversation update listener for real-time updates
      chatSocketService.onConversationUpdate((conversation) => {
        // Update conversation in list and move to top
        setConversations(prev => {
          const updatedConversations = prev.map(conv => 
            conv._id === conversation._id ? conversation : conv
          );
          // Move updated conversation to top
          const updatedConv = updatedConversations.find(conv => conv._id === conversation._id);
          const otherConvs = updatedConversations.filter(conv => conv._id !== conversation._id);
          return updatedConv ? [updatedConv, ...otherConvs] : updatedConversations;
        });
        
        // Update selected conversation if it matches
        if (selectedConversation && selectedConversation._id === conversation._id) {
          setSelectedConversation(conversation);
        }
      });

      // Set up typing listeners
      chatSocketService.onTyping((data) => {
        if (selectedConversation && data.conversationId === selectedConversation._id) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (data.isTyping) {
              newSet.add(data.userId);
            } else {
              newSet.delete(data.userId);
            }
            return newSet;
          });
        }
      });

      // Set up user status listeners
      chatSocketService.onUserStatus((status) => {
        setUserStatuses(prev => new Map(prev.set(status.userId, { 
          isOnline: status.isOnline, 
          lastSeen: status.lastSeen 
        })));
        
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          if (status.isOnline) {
            newSet.add(status.userId);
          } else {
            newSet.delete(status.userId);
          }
          return newSet;
        });
      });

      // Set up message read listeners
      chatSocketService.onMessageRead((data) => {
        // Update message read status in UI
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId 
            ? { ...msg, deliveryStatus: { ...msg.deliveryStatus, read: true, readAt: data.readAt } }
            : msg
        ));
      });

      // Set up message error listeners
      chatSocketService.onMessageError((error) => {
        console.error('❌ Message error:', error);
        toast.error(error.error || 'Message sending failed');
      });

      // Set up message read receipt listeners
      chatSocketService.onMessageRead((data) => {
        // Update message read status in UI
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId 
            ? { ...msg, deliveryStatus: { ...msg.deliveryStatus, read: true, readAt: data.readAt } }
            : msg
        ));
      });

      // Set up user disconnected listeners
      chatSocketService.onUserDisconnected((data) => {
        console.log(`🔌 User ${data.userId} disconnected from conversation ${data.conversationId}`);
        // Update user status if they're the other participant
        if (selectedConversation) {
          const otherParticipant = getOtherParticipant(selectedConversation);
          if (otherParticipant?.userId === data.userId) {
            setUserStatuses(prev => new Map(prev.set(data.userId, { 
              isOnline: false, 
              lastSeen: data.timestamp 
            })));
            
            setOnlineUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.userId);
              return newSet;
            });
          }
        }
      });

      return () => {
        chatSocketService.disconnect();
        // Cleanup conversation update timeout
        if (conversationUpdateTimeoutRef.current) {
          clearTimeout(conversationUpdateTimeoutRef.current);
        }
      };
    }
  }, [currentUserId]);

  // Join conversation when selected
  useEffect(() => {
    if (selectedConversation) {
      const conversationId = selectedConversation._id;
      if (conversationId) {
        chatSocketService.joinConversation(conversationId);
      }
    }
  }, [selectedConversation]);

  // Load more messages
  const loadMoreMessages = async () => {
    if (!selectedConversation || !hasMoreMessages || messagesLoading) return;
    
    try {
      const nextPage = messagePage + 1;
      const response = await chatService.getMessages(selectedConversation._id, nextPage, 50);
      const newMessages = (response as any).data || [];
      
      if (newMessages.length === 0) {
        setHasMoreMessages(false);
      } else {
        setMessages(prev => [...newMessages, ...prev]);
        setMessagePage(nextPage);
      }
    } catch (error: any) {
      console.error('Error loading more messages:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const institutionCode = localStorage.getItem('institutionCode');
      const userRole = localStorage.getItem('userRole');
      
      if (!currentUserId) {
        toast.error('User ID not found');
        return;
      }

      let response;
      if (userRole === 'agent' || userRole === 'superadmin') {
        // For global users (agents and superadmin), get agent conversations
        response = await chatService.getAgentConversations(currentUserId);
      } else {
        // For institution users, get conversations with schoolId
        response = await chatService.getConversations(institutionCode || '', currentUserId);
      }
      
      let conversations = (response as any).data || [];
      
      // Deduplicate conversations by merging those with the same participants
      const deduplicatedConversations: Conversation[] = [];
      const seenParticipants = new Set<string>();
      
      conversations.forEach((conv: any) => {
        const participants = conv.participants || [];
        const participantIds = participants.map((p: any) => p.userId).sort().join('-');
        
        if (!seenParticipants.has(participantIds)) {
          seenParticipants.add(participantIds);
          deduplicatedConversations.push(conv);
        } else {
          // If duplicate, keep the one with the most recent message
          const existingIndex = deduplicatedConversations.findIndex(c => {
            const existingParticipants = c.participants || [];
            const existingIds = existingParticipants.map((p: any) => p.userId).sort().join('-');
            return existingIds === participantIds;
          });
          
          if (existingIndex !== -1) {
            const existingConv = deduplicatedConversations[existingIndex];
            const newConvLastMessage = conv.lastMessage?.sentAt || conv.updatedAt;
            const existingConvLastMessage = existingConv.lastMessage?.sentAt || existingConv.updatedAt;
            
            if (newConvLastMessage > existingConvLastMessage) {
              deduplicatedConversations[existingIndex] = conv;
            }
          }
        }
      });
      
      setConversations(deduplicatedConversations);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch conversations');
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      // Fetch all messages at once to ensure old chats are visible
      const response = await chatService.getMessages(conversationId, 1, 10000);
      const newMessages = (response as any).data || [];
      
      // Store messages in conversation-specific map
      setMessagesByConversation(prev => {
        const newMap = new Map(prev);
        newMap.set(conversationId, newMessages);
        return newMap;
      });
      
      // Display all messages
      setMessages(newMessages);
    } catch (error: any) {
      console.error('❌ Error fetching messages:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      const errorMessage = error.response?.data?.message || 'Failed to fetch messages';
      toast.error(errorMessage);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Start conversation with user
  const createConversationWithUser = async (user: any) => {
    try {
      const userRole = localStorage.getItem('userRole');
      const currentUserInstitutionCode = localStorage.getItem('institutionCode');
      
      if (userRole === 'agent' || userRole === 'superadmin') {
        // Check if conversation already exists
        // Check if conversation already exists in local state
        let existingConversation = findConversationBetweenUsers(conversations, currentUserId, user.id);
        
        if (!existingConversation) {
          // If not found locally, refresh conversations from server to check if other user created it
          await fetchConversations();
          // Check again after refresh
          existingConversation = findConversationBetweenUsers(conversations, currentUserId, user.id);
        }
        
        if (existingConversation) {
          // Select existing conversation
          setSelectedConversation(existingConversation);
          fetchMessages(existingConversation._id);
          toast.success(`Continuing conversation with ${user.name}`);
        } else {
          // Check if there's a conversation on the server that we don't have locally
          // This can happen if the other user created the conversation
          try {
            const allConversationsResponse = await chatService.getAgentConversations(currentUserId) as any;
            const allConversations = allConversationsResponse.data || [];
            const serverConversation = findConversationBetweenUsers(allConversations, currentUserId, user.id);
            
            if (serverConversation) {
              // Found on server, use it
              setConversations(prev => [serverConversation, ...prev]);
              setSelectedConversation(serverConversation);
              fetchMessages(serverConversation._id);
              toast.success(`Found conversation with ${user.name}`);
              return;
            }
          } catch (error) {
            console.error('Error checking server for existing conversation:', error);
          }
          
          // Still not found, create new conversation
          // Create new conversation with consistent ID
          const conversationData = createConversationObject(
            { id: currentUserId, name: currentUserName, email: currentUserEmail, role: userRole, institutionCode: currentUserInstitutionCode || undefined },
            { id: user.id, name: user.name, email: user.email, role: user.role, institutionCode: user.institutionCode || undefined },
            false, // isGroup
            true  // isGlobal
          );
          
          const response = await chatService.createGlobalConversation(conversationData) as any;
          const newConversation = response.data || response;
          
          console.log('📝 New conversation created:', newConversation);
          
          if (!newConversation || !newConversation._id) {
            console.error('❌ Invalid conversation response:', newConversation);
            toast.error('Invalid conversation response from server');
            return;
          }
          
          // Refresh conversations to get the latest list (including the new one)
          await fetchConversations();
          
          // Find and select the newly created conversation from the refreshed list
          const refreshedConversation = findConversationBetweenUsers(conversations, currentUserId, user.id);
          if (refreshedConversation) {
            setSelectedConversation(refreshedConversation);
            fetchMessages(refreshedConversation._id);
          } else {
            // Fallback: use the created conversation directly
            setConversations(prev => [newConversation, ...prev]);
            setSelectedConversation(newConversation);
            fetchMessages(newConversation._id);
          }
          
          toast.success(`Started conversation with ${user.name}`);
        }
      }
    } catch (error: any) {
      console.error('❌ Error creating conversation:', error);
      console.error('❌ Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to create conversation');
    }
  };

  // Start call with user (placeholder for future implementation)

  const handleSelectConversation = async (conversation: Conversation) => {
    console.log('🎯 Selected conversation:', {
      id: conversation._id,
      title: conversation.title,
      participants: conversation.participants?.map((p: any) => p.userId)
    });
    setSelectedConversation(conversation);
    
    // Get participant IDs for this conversation
    const conversationParticipants = conversation.participants?.map((p: any) => p.userId).sort();
    
    // Load ALL messages from Map for this conversation and any other conversations with same participants
    // This ensures we show the complete chat history even with duplicate backend conversation IDs
    let allMessages: Message[] = [];
    const seenMessageIds = new Set<string>();
    
    messagesByConversation.forEach((msgs) => {
      msgs.forEach(msg => {
        const msgParticipants = [msg.senderId, msg.recipientId].sort();
        const matchesParticipants = JSON.stringify(msgParticipants) === JSON.stringify(conversationParticipants);
        
        // Add message if it matches participants and we haven't seen it before
        if (matchesParticipants && !seenMessageIds.has(msg._id)) {
          allMessages.push(msg);
          seenMessageIds.add(msg._id);
        }
      });
    });
    
    // Sort messages by timestamp to show in chronological order
    allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    console.log(`📜 Loaded ${allMessages.length} messages from chat history`);
    setMessages(allMessages);
    
    // Fetch all messages from server to ensure we have the latest data
    await fetchMessages(conversation._id);
  };

  const getOtherParticipant = (conversation: Conversation) => {
    if (!conversation || !conversation.participants) {
      return null;
    }
    return conversation.participants.find((p: any) => p.userId !== currentUserId);
  };

  const getUnreadCount = (conversation: Conversation) => {
    if (!conversation || !conversation.unreadCount) {
      return 0;
    }
    return conversation.unreadCount;
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatLastSeen = (dateString?: string) => {
    if (!dateString || dateString === 'Never') return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredConversations = conversations.filter((conversation: Conversation) => {
    if (!conversation || !searchQuery) return !!conversation;
    const otherParticipant = getOtherParticipant(conversation);
    return (
      conversation.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 100) {
      // Near bottom, load more messages
      if (hasMoreMessages && !messagesLoading) {
        loadMoreMessages();
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const otherParticipant = selectedConversation.participants?.find((p: any) => p.userId !== currentUserId);
    
    const tempId = Date.now().toString() + Math.random().toString(36).substr(2, 9); // Temporary ID for UI
    
    const messageData = {
      conversationId: selectedConversation._id,
      senderId: currentUserId,
      senderName: currentUserName,
      recipientId: otherParticipant?.userId || '',
      content: newMessage.trim(),
      messageType: 'text',
      createdAt: new Date().toISOString(), // Add timestamp for immediate UI update
      deliveryStatus: {
        sent: true,
        delivered: false,
        read: false
      }
    };

    try {
      setSending(true);
      
      // 1. Add to local state immediately (Optimistic Update) with temporary ID
      const optimisticMessage = { ...messageData, _id: tempId } as Message;
      setMessages((prev: Message[]) => [...prev, optimisticMessage]);
      
      // Store in Map
      setMessagesByConversation(prev => {
        const newMap = new Map(prev);
        const conversationMessages = newMap.get(selectedConversation._id) || [];
        newMap.set(selectedConversation._id, [...conversationMessages, optimisticMessage]);
        return newMap;
      });
      
      setNewMessage('');

      // 2. Emit via Socket (Real-time)
      chatSocketService.sendMessage(messageData);
      
      // 3. Persist to Database (MongoDB will generate real ObjectId)
      const response = await chatService.sendMessage(selectedConversation._id, messageData) as any;
      const savedMessage = response.data || response;
      
      // 4. Replace temporary message with saved message (with real MongoDB _id) in both state and Map
      setMessages((prev: Message[]) => 
        prev.map(msg => msg._id === tempId ? savedMessage : msg)
      );
      
      setMessagesByConversation(prev => {
        const newMap = new Map(prev);
        const conversationMessages = newMap.get(selectedConversation._id) || [];
        newMap.set(selectedConversation._id, 
          conversationMessages.map(msg => msg._id === tempId ? savedMessage : msg)
        );
        return newMap;
      });
    } catch (error: any) {
      // Remove optimistic message if save failed
      setMessages((prev: Message[]) => prev.filter(msg => msg._id !== tempId));
      toast.error('Failed to save message to history');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (selectedConversation) {
      const conversationId = selectedConversation._id;
      if (conversationId) {
        chatSocketService.sendTyping(conversationId, isTyping);
      }
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (!selectedConversation) return;
    
    try {
      setBlocking(true);
      await apiClient.post(`/chat/conversations/${selectedConversation._id}/block`, {
        userIdToBlock: userId
      });
      toast.success('User blocked successfully');
      setBlockedUsers(prev => [...prev, userId]);
      fetchConversations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to block user');
    } finally {
      setBlocking(false);
    }
  };

  return (
    <div className="content">
      <div className="container-fluid">
        <div className="row">
          {/* Left Sidebar - Conversations List */}
          <div className="col-lg-4 col-md-5">
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between">
                <h5 className="mb-0">Messages</h5>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setShowUserList(!showUserList)}
                  >
                    <i className="ti ti-users"></i>
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-success"
                    onClick={() => fetchConversations()}
                  >
                    <i className="ti ti-refresh"></i>
                  </button>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="card-body p-2">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Conversations List or Users List */}
              <div className="card-body p-0" style={{ height: '600px', overflowY: 'auto' }}>
                {showUserList ? (
                  /* Users List */
                  <div>
                    <div className="p-3 border-bottom">
                      <h6 className="text-muted mb-0">All Users</h6>
                      <div className="input-group mt-2">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search users..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    {allUsers
                      .filter(user => user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()))
                      .slice(0, userListPage * usersPerPage)
                      .slice((userListPage - 1) * usersPerPage)
                      .map(user => {
                        const isOnline = onlineUsers.has(user.id);
                        const userStatus = userStatuses.get(user.id);
                        return (
                          <div
                            key={user.id}
                            className="list-group-item list-group-item-action d-flex align-items-center"
                            onClick={() => createConversationWithUser(user)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="avatar avatar-sm me-3">
                              <span className={`avatar-title rounded-circle ${isOnline ? 'bg-success' : 'bg-secondary'}`}>
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                              {isOnline && (
                                <span className="avatar-status bg-success"></span>
                              )}
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{user.name}</h6>
                              <small className="text-muted">
                                {user.role} • {isOnline ? 'Online' : `Last seen ${formatLastSeen(userStatus?.lastSeen || 'Never')}`}
                              </small>
                            </div>
                            <div className={`badge ${user.role === 'student' ? 'bg-primary' : user.role === 'teacher' ? 'bg-success' : user.role === 'parent' ? 'bg-info' : 'bg-warning'}`}>
                              {user.role}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  /* Conversations List */
                  filteredConversations.map(conversation => {
                    const otherParticipant = getOtherParticipant(conversation);
                    const unreadCount = getUnreadCount(conversation);
                    const isSelected = selectedConversation?._id === conversation._id;
                    const isParticipantOnline = otherParticipant ? onlineUsers.has(otherParticipant.userId) : false;
                    
                    return (
                      <button
                        key={conversation._id}
                        className={`list-group-item list-group-item-action w-100 text-start ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSelectConversation(conversation)}
                      >
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-md me-3">
                            <span className="avatar-title rounded-circle bg-primary">
                              {conversation.isGroup
                                ? <i className="ti ti-users"></i>
                                : otherParticipant?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                            {isParticipantOnline && !conversation.isGroup && (
                              <span className="avatar-status bg-success"></span>
                            )}
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1">
                                  {conversation.isGroup
                                    ? conversation.title || 'Group Chat'
                                    : otherParticipant?.name || 'Unknown User'}
                                </h6>
                                <small className="text-muted d-block">
                                  {conversation.isGroup 
                                    ? `${conversation.participants?.length || 0} participants`
                                    : otherParticipant?.role || 'User'
                                  }
                                  {isParticipantOnline && ' • Online'}
                                </small>
                              </div>
                              <div className="text-end">
                                <small className="text-muted d-block">
                                  {formatTime(conversation.lastMessage?.sentAt || conversation.updatedAt)}
                                </small>
                                {typeof unreadCount === 'number' && unreadCount > 0 && (
                                  <span className="badge bg-danger rounded-pill">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                            {conversation.lastMessage && (
                              <div className="text-truncate">
                                <small className={typeof unreadCount === 'number' && unreadCount > 0 ? 'text-primary fw-bold' : 'text-muted'}>
                                  {conversation.lastMessage.senderName}: {conversation.lastMessage.message}
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  }))}
                </div>
              </div>
            </div>

          {/* Right Side - Chat Area */}
          <div className="col-lg-8 col-md-7">
            {selectedConversation ? (
              <div className="card h-100">
                {/* Chat Header */}
                <div className="card-header d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div className="avatar avatar-md me-3">
                      <span className="avatar-title rounded-circle bg-primary">
                        {selectedConversation.isGroup
                          ? <i className="ti ti-users"></i>
                          : getOtherParticipant(selectedConversation)?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <h6 className="mb-0">
                        {selectedConversation.isGroup
                          ? selectedConversation.title || 'Group Chat'
                          : getOtherParticipant(selectedConversation)?.name || 'Unknown User'}
                      </h6>
                      <small className="text-muted">
                        {selectedConversation.isGroup
                          ? `${selectedConversation.participants?.length || 0} participants`
                          : `${getOtherParticipant(selectedConversation)?.role || 'User'} • ${
                              (() => {
                                const participant = getOtherParticipant(selectedConversation);
                                return participant && onlineUsers.has(participant.userId) 
                                  ? 'Online' 
                                  : 'Offline';
                              })()
                            }`
                        }
                      </small>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-light"
                      onClick={() => setShowInfo(!showInfo)}
                    >
                      <i className="ti ti-info-circle"></i>
                    </button>
                    {!selectedConversation.isGroup && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => {
                          const otherParticipant = getOtherParticipant(selectedConversation);
                          if (otherParticipant) {
                            handleBlockUser(otherParticipant.userId);
                          }
                        }}
                        disabled={blocking}
                      >
                        <i className="ti ti-ban"></i>
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Area */}
                <div 
                  className="card-body" 
                  style={{ height: '450px', overflowY: 'auto' }}
                  onScroll={handleScroll}
                >
                  {messagesLoading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="ti ti-message-off fs-1 text-muted mb-3"></i>
                      <p className="text-muted">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <div>
                      {messages.map(message => {
                        const isOwnMessage = message.senderId === currentUserId;
                        
                        return (
                          <div
                            key={message._id}
                            className={`d-flex mb-3 ${isOwnMessage ? 'justify-content-end' : 'justify-content-start'}`}
                          >
                            <div className={`position-relative ${isOwnMessage ? 'order-1' : 'order-0'}`}>
                              {!isOwnMessage && (
                                <div className="avatar avatar-sm me-2">
                                  <span className="avatar-title rounded-circle bg-secondary">
                                    {message.senderName?.charAt(0).toUpperCase() || 'U'}
                                  </span>
                                </div>
                              )}
                              <div
                                className={`message-bubble ${isOwnMessage ? 'bg-primary text-white' : 'bg-light'} 
                                  ${isOwnMessage ? 'rounded-start' : 'rounded-end'}`}
                                style={{
                                  maxWidth: '300px',
                                  padding: '10px 15px',
                                  borderRadius: '18px',
                                  position: 'relative'
                                }}
                              >
                                <div className="small fw-bold">{message.senderName}</div>
                                <div>{message.content}</div>
                                <div className="d-flex justify-content-between align-items-center mt-1">
                                  <small className={`${isOwnMessage ? 'text-white-50' : 'text-muted'}`}>
                                    {formatTime(message.createdAt)}
                                  </small>
                                  {isOwnMessage && (
                                    <div className="d-flex align-items-center gap-1">
                                      {message.deliveryStatus?.sent && (
                                        <i className="ti ti-check text-muted fs-6"></i>
                                      )}
                                      {message.deliveryStatus?.delivered && (
                                        <i className="ti ti-check-double text-muted fs-6"></i>
                                      )}
                                      {message.deliveryStatus?.read && (
                                        <i className="ti ti-check-double text-primary fs-6"></i>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {isOwnMessage && (
                                <div className="avatar avatar-sm ms-2">
                                  <span className="avatar-title rounded-circle bg-primary">
                                    {currentUserName?.charAt(0).toUpperCase() || 'U'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Typing Indicator */}
                      {typingUsers.size > 0 && (
                        <div className="typing-indicator">
                          <small className="text-muted">
                            <i className="ti ti-loader"></i>
                            {typingUsers.size === 1 
                              ? ' Someone is typing...' 
                              : `${typingUsers.size} people are typing...`}
                          </small>
                        </div>
                      )}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="card-footer">
                  <form onSubmit={handleSendMessage}>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          handleTyping(true); // Trigger "User is typing..."
                          
                          // Stop typing indicator after 2 seconds of no activity
                          if (conversationUpdateTimeoutRef.current) clearTimeout(conversationUpdateTimeoutRef.current);
                          conversationUpdateTimeoutRef.current = window.setTimeout(() => {
                            handleTyping(false);
                          }, 2000);
                        }}
                        onFocus={() => handleTyping(true)}
                        onBlur={() => handleTyping(false)}
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={sending || !newMessage.trim()}
                      >
                        {sending ? (
                          <div className="spinner-border spinner-border-sm text-white" role="status">
                            <span className="visually-hidden">Sending...</span>
                          </div>
                        ) : (
                          <i className="ti ti-send"></i>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="card h-100">
                <div className="card-body d-flex align-items-center justify-content-center">
                  <div className="text-center">
                    <i className="ti ti-message-off fs-1 text-muted mb-3"></i>
                    <h5 className="text-muted">Select a conversation to start chatting</h5>
                    <p className="text-muted">Choose from your existing conversations or start a new one</p>
                  </div>
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
    </div>
  );
};
export default Chat;