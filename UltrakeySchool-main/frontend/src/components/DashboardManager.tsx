import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MessageCircle, 
  Mail, 
  Folder, 
  Edit3, 
  CheckSquare, 
  Users,
  Settings,
  Plus
} from 'lucide-react';
import applicationPersistenceService from '../services/applicationPersistenceService';
import crossAppCommunicationService from '../services/crossApplicationCommunicationService';

// User interface - adjust based on your auth system
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  institutionId?: string;
}

interface DashboardManagerProps {
  user: User;
  onApplicationClick: (app: any) => void;
}

const DashboardManager: React.FC<DashboardManagerProps> = ({ user, onApplicationClick }) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [visibleUsers, setVisibleUsers] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);

  // Load applications on mount
  useEffect(() => {
    const loadedApps = applicationPersistenceService.loadApplicationState(user);
    setApplications(loadedApps);

    // Update user visibility
    crossAppCommunicationService.updateUserVisibility(user, {
      onlineStatus: 'online',
      lastSeen: new Date().toISOString()
    });

    // Get visible users
    const visible = crossAppCommunicationService.getVisibleUsers(user);
    setVisibleUsers(visible);

    // Count unread messages
    const messages = crossAppCommunicationService.getMessages(user.id);
    const unread = messages.filter(msg => 
      msg.to === user.id && !msg.metadata?.read
    ).length;
    setUnreadMessages(unread);

  }, [user]);

  // Listen for communication events
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.to === user.id && !message.metadata?.read) {
        setUnreadMessages(prev => prev + 1);
      }
    };

    const handleVisibility = (visibility: any) => {
      const visible = crossAppCommunicationService.getVisibleUsers(user);
      setVisibleUsers(visible);
    };

    crossAppCommunicationService.addEventListener('message', handleMessage);
    crossAppCommunicationService.addEventListener('visibility', handleVisibility);

    return () => {
      crossAppCommunicationService.removeEventListener('message', handleMessage);
      crossAppCommunicationService.removeEventListener('visibility', handleVisibility);
    };
  }, [user]);

  // Save applications when they change
  const saveApplications = useCallback((updatedApps: any[]) => {
    applicationPersistenceService.saveApplicationState(user, updatedApps);
    setApplications(updatedApps);
  }, [user]);

  // Handle application click
  const handleApplicationClick = useCallback((app: any) => {
    applicationPersistenceService.updateLastAccessed(user, app.id);
    onApplicationClick(app);
  }, [user, onApplicationClick]);

  // Get icon component
  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      calendar: <Calendar className="w-6 h-6" />,
      chat: <MessageCircle className="w-6 h-6" />,
      mail: <Mail className="w-6 h-6" />,
      folder: <Folder className="w-6 h-6" />,
      'edit-3': <Edit3 className="w-6 h-6" />,
      'check-square': <CheckSquare className="w-6 h-6" />,
      users: <Users className="w-6 h-6" />
    };
    return icons[iconName] || <Settings className="w-6 h-6" />;
  };

  // Add new application
  const addApplication = () => {
    const newApp = {
      id: `custom_${Date.now()}`,
      name: 'New Application',
      type: 'custom',
      icon: 'plus',
      url: '/dashboard/custom',
      isActive: true,
      lastAccessed: new Date().toISOString(),
      position: { x: 0, y: 0 },
      size: { width: 1, height: 1 }
    };

    const updatedApps = [...applications, newApp];
    saveApplications(updatedApps);
  };

  // Toggle application active state
  const toggleApplication = (appId: string) => {
    const updatedApps = applications.map(app => 
      app.id === appId ? { ...app, isActive: !app.isActive } : app
    );
    saveApplications(updatedApps);
  };

  // Remove application
  const removeApplication = (appId: string) => {
    const updatedApps = applications.filter(app => app.id !== appId);
    saveApplications(updatedApps);
  };

  // Start chat with user
  const startChat = (targetUser: any) => {
    const channelId = crossAppCommunicationService.createChannel({
      name: `Chat with ${targetUser.name}`,
      type: 'chat',
      participants: [user.id, targetUser.userId],
      institutionId: user.institutionId
    });

    // Send initial message
    crossAppCommunicationService.sendMessage({
      from: user.id,
      to: targetUser.userId,
      type: 'chat',
      content: { text: 'Hello!', channelId }
    });

    // Open chat application
    const chatApp = applications.find(app => app.type === 'chat');
    if (chatApp) {
      handleApplicationClick(chatApp);
    }
  };

  // Get application status badge
  const getStatusBadge = (app: any) => {
    if (app.type === 'chat' && unreadMessages > 0) {
      return <Badge variant="destructive" className="ml-2">{unreadMessages}</Badge>;
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name}! 
            {user.institutionId && ` • Institution: ${user.institutionId}`}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            <Settings className="w-4 h-4 mr-2" />
            {isEditMode ? 'Done' : 'Edit'}
          </Button>
          <Button onClick={addApplication}>
            <Plus className="w-4 h-4 mr-2" />
            Add App
          </Button>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {applications.map((app) => (
          <Card 
            key={app.id} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              app.isActive ? 'border-primary' : 'border-muted opacity-60'
            } ${isEditMode ? 'ring-2 ring-primary' : ''}`}
            onClick={() => !isEditMode && handleApplicationClick(app)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  {getIcon(app.icon)}
                  <CardTitle className="text-lg">{app.name}</CardTitle>
                  {getStatusBadge(app)}
                </div>
                {isEditMode && (
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleApplication(app.id);
                      }}
                    >
                      {app.isActive ? 'Hide' : 'Show'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeApplication(app.id);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Last accessed: {new Date(app.lastAccessed).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Visible Users */}
      {visibleUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Available for Communication
              <Badge variant="secondary" className="ml-2">
                {visibleUsers.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleUsers.map((visibleUser) => (
                <div 
                  key={visibleUser.userId}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      visibleUser.onlineStatus === 'online' ? 'bg-green-500' :
                      visibleUser.onlineStatus === 'away' ? 'bg-yellow-500' :
                      visibleUser.onlineStatus === 'busy' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`} />
                    <div>
                      <div className="font-medium">{visibleUser.userId}</div>
                      <div className="text-sm text-muted-foreground">
                        {visibleUser.role}
                        {visibleUser.institutionId && ` • ${visibleUser.institutionId}`}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => startChat(visibleUser)}
                    disabled={!crossAppCommunicationService.canCommunicate(user, {
                      id: visibleUser.userId,
                      role: visibleUser.role,
                      institutionId: visibleUser.institutionId
                    })}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Chat
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Communication Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadMessages}</div>
            <div className="text-sm text-muted-foreground">Unread messages</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {visibleUsers.filter(u => u.onlineStatus === 'online').length}
            </div>
            <div className="text-sm text-muted-foreground">Online now</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.filter(a => a.isActive).length}
            </div>
            <div className="text-sm text-muted-foreground">Active apps</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardManager;
