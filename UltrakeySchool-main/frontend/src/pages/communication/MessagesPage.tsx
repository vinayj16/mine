import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { apiClient } from '../../api/client';

interface Message {
  id: string;
  sender: string;
  senderAvatar: string;
  subject: string;
  message: string;
  date: string;
  time: string;
  isRead: boolean;
  type: 'teacher' | 'admin' | 'system';
}

const MessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'teacher' | 'admin' | 'system'>('all');

  // Fetch messages from backend
  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const response = await apiClient.get(`/chat/messages?userId=${userId}`);
      
      if (response.data.success && response.data.data) {
        setMessages(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || message.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const markAsRead = async (messageId: string) => {
    try {
      const response = await apiClient.patch(`/chat/messages/${messageId}/read`);
      
      if (response.data.success) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        ));
        toast.success('Message marked as read');
      }
    } catch (error: any) {
      console.error('Error marking message as read:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to mark message as read');
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/chat/messages/${messageId}`);
      
      if (response.data.success) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        toast.success('Message deleted successfully');
      }
    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to delete message');
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'teacher':
        return 'bg-info';
      case 'admin':
        return 'bg-warning';
      case 'system':
        return 'bg-secondary';
      default:
        return 'bg-primary';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Messages</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">Communication</li>
              <li className="breadcrumb-item active" aria-current="page">
                Messages
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button 
            className="btn btn-primary d-flex align-items-center mb-2"
            onClick={() => toast.info('Compose feature coming soon')}
          >
            <i className="ti ti-message-plus me-2" />
            Compose
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap">
          <h4 className="card-title">Teacher Communication</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start me-2">
              <span className="icon-addon">
                <i className="ti ti-search" />
              </span>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="form-select me-2" 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
            >
              <option value="all">All Messages</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admin</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
        <div className="card-body p-0">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-inbox" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <p className="text-muted mt-3">No messages found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" />
                      </div>
                    </th>
                    <th>Sender</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.map((message) => (
                    <tr key={message.id} className={!message.isRead ? 'bg-light' : ''}>
                      <td>
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="avatar avatar-md me-2">
                            <img 
                              src={message.senderAvatar || '/assets/img/users/user-01.jpg'} 
                              className="img-fluid rounded-circle" 
                              alt={message.sender}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/img/users/user-01.jpg';
                              }}
                            />
                          </span>
                          <div>
                            <p className="mb-0 fw-medium">{message.sender}</p>
                            <small className="text-muted">{message.time}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="mb-0 text-truncate" style={{ maxWidth: '200px' }}>
                            {message.subject}
                          </p>
                          <small className="text-muted text-truncate" style={{ maxWidth: '200px' }}>
                            {message.message.substring(0, 50)}...
                          </small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="mb-0">{message.date}</p>
                          <small className="text-muted">{message.time}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getTypeBadge(message.type)}`}>
                          {message.type}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${message.isRead ? 'bg-success' : 'bg-warning'}`}>
                          {message.isRead ? 'Read' : 'Unread'}
                        </span>
                      </td>
                      <td>
                        <div className="dropdown">
                          <button className="btn btn-white btn-icon btn-sm" data-bs-toggle="dropdown">
                            <i className="ti ti-dots-vertical" />
                          </button>
                          <ul className="dropdown-menu">
                            <li>
                              <button 
                                className="dropdown-item" 
                                onClick={() => {
                                  setSelectedMessage(message);
                                  setShowViewModal(true);
                                  if (!message.isRead) {
                                    markAsRead(message.id);
                                  }
                                }}
                              >
                                <i className="ti ti-eye me-2" />
                                View
                              </button>
                            </li>
                            {!message.isRead && (
                              <li>
                                <button 
                                  className="dropdown-item" 
                                  onClick={() => markAsRead(message.id)}
                                >
                                  <i className="ti ti-mail me-2" />
                                  Mark as Read
                                </button>
                              </li>
                            )}
                            <li>
                              <button 
                                className="dropdown-item"
                                onClick={() => toast.info('Reply feature coming soon')}
                              >
                                <i className="ti ti-reply me-2" />
                                Reply
                              </button>
                            </li>
                            <li>
                              <button 
                                className="dropdown-item text-danger" 
                                onClick={() => deleteMessage(message.id)}
                              >
                                <i className="ti ti-trash me-2" />
                                Delete
                              </button>
                            </li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Message Modal */}
      {showViewModal && selectedMessage && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Message Details</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowViewModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="d-flex align-items-center mb-3">
                  <span className="avatar avatar-lg me-3">
                    <img 
                      src={selectedMessage.senderAvatar || '/assets/img/users/user-01.jpg'} 
                      className="img-fluid rounded-circle" 
                      alt={selectedMessage.sender}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/img/users/user-01.jpg';
                      }}
                    />
                  </span>
                  <div>
                    <h6 className="mb-1">{selectedMessage.sender}</h6>
                    <small className="text-muted">
                      {selectedMessage.date} at {selectedMessage.time}
                    </small>
                  </div>
                </div>
                <div className="mb-3">
                  <h6 className="mb-2">{selectedMessage.subject}</h6>
                  <span className={`badge ${getTypeBadge(selectedMessage.type)}`}>
                    {selectedMessage.type}
                  </span>
                </div>
                <div className="border rounded p-3">
                  <p className="mb-0">{selectedMessage.message}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => toast.info('Reply feature coming soon')}
                >
                  <i className="ti ti-reply me-2" />
                  Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MessagesPage;
