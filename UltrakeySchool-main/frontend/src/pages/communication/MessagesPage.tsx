import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { apiClient } from '../../api/client';
import ConfirmModal from '../../components/common/ConfirmModal';

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
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [composeForm, setComposeForm] = useState({ recipient: '', subject: '', message: '' });
  const [replyForm, setReplyForm] = useState({ message: '' });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
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
    setDeleteTarget(messageId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      const response = await apiClient.delete(`/chat/messages/${deleteTarget}`);

      if (response.data.success) {
        setMessages(prev => prev.filter(msg => msg.id !== deleteTarget));
        toast.success('Message deleted successfully');
      }
    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to delete message');
    }
    setShowDeleteModal(false);
    setDeleteTarget(null);
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

        {/* Compose Modal */}
        {showComposeModal && (
          <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Compose Message</h5>
                  <button type="button" className="btn-close" onClick={() => setShowComposeModal(false)} disabled={sendingMessage} />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Recipient</label>
                    <input type="text" className="form-control" placeholder="Recipient email or user ID"
                      value={composeForm.recipient} onChange={(e) => setComposeForm(f => ({ ...f, recipient: e.target.value }))} disabled={sendingMessage} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <input type="text" className="form-control" placeholder="Subject"
                      value={composeForm.subject} onChange={(e) => setComposeForm(f => ({ ...f, subject: e.target.value }))} disabled={sendingMessage} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Message</label>
                    <textarea className="form-control" rows={5} placeholder="Type your message..."
                      value={composeForm.message} onChange={(e) => setComposeForm(f => ({ ...f, message: e.target.value }))} disabled={sendingMessage} required />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowComposeModal(false)} disabled={sendingMessage}>Cancel</button>
                  <button type="button" className="btn btn-primary" disabled={sendingMessage} onClick={async () => {
                    if (!composeForm.recipient || !composeForm.subject || !composeForm.message) {
                      toast.error('Please fill all fields');
                      return;
                    }
                    try {
                      setSendingMessage(true);
                      const res = await apiClient.post('/chat/messages', composeForm);
                      if (res.data.success) {
                        toast.success('Message sent successfully');
                        setShowComposeModal(false);
                        setComposeForm({ recipient: '', subject: '', message: '' });
                        fetchMessages();
                      }
                    } catch (err: any) {
                      toast.error(err.response?.data?.message || 'Failed to send message');
                    } finally {
                      setSendingMessage(false);
                    }
                  }}>
                    {sendingMessage ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }} onConfirm={handleDeleteConfirm} message="Are you sure you want to delete this message?" />

        {/* Reply Modal */}
        {showReplyModal && selectedMessage && (
          <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Reply to {selectedMessage.sender}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowReplyModal(false)} disabled={sendingMessage} />
                </div>
                <div className="modal-body">
                  <div className="border rounded p-3 mb-3 bg-light">
                    <p className="mb-1"><strong>{selectedMessage.sender}</strong> wrote:</p>
                    <p className="mb-0 text-muted">{selectedMessage.message.substring(0, 200)}</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Your Reply</label>
                    <textarea className="form-control" rows={5} placeholder="Type your reply..."
                      value={replyForm.message} onChange={(e) => setReplyForm(f => ({ ...f, message: e.target.value }))} disabled={sendingMessage} required />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowReplyModal(false)} disabled={sendingMessage}>Cancel</button>
                  <button type="button" className="btn btn-primary" disabled={sendingMessage || !replyForm.message} onClick={async () => {
                    if (!replyForm.message) {
                      toast.error('Please enter a reply');
                      return;
                    }
                    try {
                      setSendingMessage(true);
                      const res = await apiClient.post('/chat/messages/reply', {
                        parentMessageId: selectedMessage.id,
                        message: replyForm.message,
                        recipient: selectedMessage.sender,
                      });
                      if (res.data.success) {
                        toast.success('Reply sent successfully');
                        setShowReplyModal(false);
                        setReplyForm({ message: '' });
                        fetchMessages();
                      }
                    } catch (err: any) {
                      toast.error(err.response?.data?.message || 'Failed to send reply');
                    } finally {
                      setSendingMessage(false);
                    }
                  }}>
                    {sendingMessage ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
export default MessagesPage;
