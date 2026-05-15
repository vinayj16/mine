import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

interface ContactMessage {
  _id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  subject?: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchMessages();
  }, [page, statusFilter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);

      const params: any = { page, limit };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      // TODO: Replace with actual API endpoint when backend is ready
      // const response = await apiClient.get('/contact-messages', { params });
      
      // Mock data for now
      const mockMessages: ContactMessage[] = [
        {
          _id: '1',
          name: 'Teresa Johnson',
          phone: '+1 82392 37359',
          email: 'teresa@example.com',
          subject: 'Staff Meeting Reminder',
          message: 'Reminder: Staff meeting tomorrow at 10 AM in the main conference room.',
          status: 'read',
          createdAt: new Date('2024-03-25'),
          updatedAt: new Date('2024-03-25')
        },
        {
          _id: '2',
          name: 'Aaron Smith',
          phone: '+1 26267 80542',
          email: 'aaron@example.com',
          subject: 'Missing Assignment',
          message: 'You have a missing assignment for Math class. Please submit by end of week.',
          status: 'unread',
          createdAt: new Date('2024-07-10'),
          updatedAt: new Date('2024-07-10')
        }
      ];

      setMessages(mockMessages);
      setTotal(mockMessages.length);

      // When backend is ready:
      // if (response.data.success) {
      //   setMessages(response.data.data.messages || []);
      //   setTotal(response.data.data.total || 0);
      // }
    } catch (error: any) {
      console.error('Failed to fetch contact messages:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch contact messages');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      toast.success('Contact message added successfully');
      setShowAddModal(false);
      fetchMessages();

    } catch (error: any) {
      console.error('Failed to add contact message:', error);
      toast.error(error.response?.data?.message || 'Failed to add contact message');
    } finally {
      setSaving(false);
    }
  };

  const handleEditMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMessage) return;
    
    try {
      setSaving(true);
      

      // TODO: Replace with actual API call when backend is ready
      // const response = await apiClient.put(`/contact-messages/${selectedMessage._id}`, messageData);
      
      toast.success('Contact message updated successfully');
      setShowEditModal(false);
      fetchMessages();

      // When backend is ready:
      // if (response.data.success) {
      //   toast.success('Contact message updated successfully');
      //   setShowEditModal(false);
      //   fetchMessages();
      // }
    } catch (error: any) {
      console.error('Failed to update contact message:', error);
      toast.error(error.response?.data?.message || 'Failed to update contact message');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;

    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await apiClient.delete(`/contact-messages/${selectedMessage._id}`);
      
      toast.success('Contact message deleted successfully');
      setShowDeleteModal(false);
      fetchMessages();

      // When backend is ready:
      // if (response.data.success) {
      //   toast.success('Contact message deleted successfully');
      //   setShowDeleteModal(false);
      //   fetchMessages();
      // }
    } catch (error: any) {
      console.error('Failed to delete contact message:', error);
      toast.error(error.response?.data?.message || 'Failed to delete contact message');
    }
  };

  const handleMarkAsRead = async (_id: string) => {
    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await apiClient.patch(`/contact-messages/${messageId}/status`, { status: 'read' });
      
      toast.success('Message marked as read');
      fetchMessages();

      // When backend is ready:
      // if (response.data.success) {
      //   toast.success('Message marked as read');
      //   fetchMessages();
      // }
    } catch (error: any) {
      console.error('Failed to update message status:', error);
      toast.error(error.response?.data?.message || 'Failed to update message status');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMessages();
  };

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      unread: 'badge-warning',
      read: 'badge-success',
      replied: 'badge-info'
    };
    return classes[status] || 'badge-secondary';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && messages.length === 0) {
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
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Contact Messages</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">Support</li>
              <li className="breadcrumb-item active" aria-current="page">
                Contact Messages
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchMessages}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="mb-2">
            <button 
              className="btn btn-primary d-flex align-items-center"
              onClick={() => setShowAddModal(true)}
            >
              <i className="ti ti-square-rounded-plus me-2"></i>Add Message
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-4 mb-2">
              <form onSubmit={handleSearch}>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="btn btn-primary" type="submit">
                    <i className="ti ti-search"></i>
                  </button>
                </div>
              </form>
            </div>
            <div className="col-md-3 mb-2">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
              </select>
            </div>
            <div className="col-md-5 mb-2 text-end">
              <span className="text-muted">
                Showing {messages.length} of {total} messages
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Table */}
      <div className="card">
        <div className="card-body p-0">
          {messages.length === 0 ? (
            <div className="text-center p-5">
              <i className="ti ti-mail-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <p className="text-muted mt-3">No contact messages found</p>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                <i className="ti ti-plus me-2"></i>
                Add First Message
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Subject</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((message) => (
                    <tr key={message._id} className={message.status === 'unread' ? 'table-warning' : ''}>
                      <td>
                        <div className="fw-medium">{message.name}</div>
                      </td>
                      <td>
                        <a href={`mailto:${message.email}`}>{message.email}</a>
                      </td>
                      <td>{message.phone}</td>
                      <td>{message.subject || 'No subject'}</td>
                      <td>
                        <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {message.message}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(message.status)}`}>
                          {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <small>{formatDate(message.createdAt)}</small>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          {message.status === 'unread' && (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleMarkAsRead(message._id)}
                              title="Mark as Read"
                            >
                              <i className="ti ti-check"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              setSelectedMessage(message);
                              setShowEditModal(true);
                            }}
                            title="Edit"
                          >
                            <i className="ti ti-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              setSelectedMessage(message);
                              setShowDeleteModal(true);
                            }}
                            title="Delete"
                          >
                            <i className="ti ti-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="card-footer">
            <div className="d-flex justify-content-between align-items-center">
              <button
                className="btn btn-outline-primary"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <i className="ti ti-chevron-left me-1"></i>
                Previous
              </button>
              <span className="text-muted">
                Page {page} of {Math.ceil(total / limit)}
              </span>
              <button
                className="btn btn-outline-primary"
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(total / limit)}
              >
                Next
                <i className="ti ti-chevron-right ms-1"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Message Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Contact Message</h4>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleAddMessage}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input type="text" name="name" className="form-control" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" name="email" className="form-control" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone</label>
                    <input type="tel" name="phone" className="form-control" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <input type="text" name="subject" className="form-control" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Message</label>
                    <textarea name="message" className="form-control" rows={4} required></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light me-2" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Adding...' : 'Add Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Message Modal */}
      {showEditModal && selectedMessage && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Contact Message</h4>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleEditMessage}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input type="text" name="name" className="form-control" defaultValue={selectedMessage.name} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" name="email" className="form-control" defaultValue={selectedMessage.email} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone</label>
                    <input type="tel" name="phone" className="form-control" defaultValue={selectedMessage.phone} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <input type="text" name="subject" className="form-control" defaultValue={selectedMessage.subject} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Message</label>
                    <textarea name="message" className="form-control" rows={4} required defaultValue={selectedMessage.message}></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light me-2" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center p-5">
                <div className="text-danger mb-4" style={{ fontSize: '3rem' }}>
                  <i className="ti ti-trash-x"></i>
                </div>
                <h4>Confirm Deletion</h4>
                <p>Are you sure you want to delete this message? This action cannot be undone.</p>
                <div className="d-flex justify-content-center gap-2">
                  <button className="btn btn-light" onClick={() => setShowDeleteModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-danger" onClick={handleDeleteMessage}>
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContactMessagesPage;
