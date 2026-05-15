import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Ticket {
  _id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'pending' | 'resolved' | 'closed' | 'reopened';
  priority: {
    level: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  };
  category: {
    primary: string;
  };
  requester: {
    name: string;
    email: string;
  };
  assignment?: {
    assignedTo?: {
      _id: string;
      name: string;
      email: string;
    };
  };
  timeline: {
    createdAt: Date;
    updatedAt: Date;
  };
  messages?: any[];
}

interface Statistics {
  total: number;
  open: number;
  inProgress: number;
  pending: number;
  resolved: number;
  closed: number;
  reopened: number;
  byPriority: { _id: string; count: number }[];
  byCategory: { _id: string; count: number }[];
}

const TicketGrid: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchTickets();
    fetchStatistics();
  }, [statusFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params: any = { page: 1, limit: 50 };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await apiClient.get('/support-tickets', { params });

      if (response.data.success) {
        setTickets(response.data.data.tickets || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch tickets:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await apiClient.get('/support-tickets/statistics');

      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleAddTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const formData = new FormData(e.currentTarget);
      
      const ticketData = {
        subject: formData.get('title') as string,
        description: formData.get('description') as string,
        category: {
          primary: formData.get('category') as string
        },
        priority: {
          level: (formData.get('priority') as string).toLowerCase()
        },
        requester: {
          name: 'Current User',
          email: 'user@example.com'
        }
      };

      const response = await apiClient.post('/support-tickets', ticketData);

      if (response.data.success) {
        toast.success('Ticket created successfully');
        setShowAddModal(false);
        fetchTickets();
        fetchStatistics();
      }
    } catch (error: any) {
      console.error('Failed to create ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/support-tickets/${ticketId}`);

      if (response.data.success) {
        toast.success('Ticket deleted successfully');
        fetchTickets();
        fetchStatistics();
      }
    } catch (error: any) {
      console.error('Failed to delete ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to delete ticket');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      open: 'bg-outline-danger',
      'in-progress': 'bg-outline-info',
      pending: 'bg-outline-warning',
      resolved: 'bg-outline-success',
      closed: 'bg-outline-dark',
      reopened: 'bg-outline-warning'
    };
    return classes[status] || 'bg-outline-secondary';
  };

  const getPriorityBadgeClass = (priority: string) => {
    const classes: Record<string, string> = {
      low: 'bg-success',
      medium: 'bg-warning',
      high: 'bg-danger',
      urgent: 'bg-danger',
      critical: 'bg-danger'
    };
    return classes[priority] || 'bg-secondary';
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return `${hours} hours ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  if (loading && tickets.length === 0) {
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
      <div className="row">
        {/* Page Header */}
        <div className="col-md-12">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Tickets</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to="/">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">Support</li>
                  <li className="breadcrumb-item active" aria-current="page">Tickets</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="pe-1 mb-2">
                <button 
                  className="btn btn-outline-light bg-white btn-icon me-1"
                  onClick={fetchTickets}
                  title="Refresh"
                >
                  <i className="ti ti-refresh"></i>
                </button>
              </div>
              <div className="mb-2">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddModal(true)}
                >
                  <i className="ti ti-square-rounded-plus me-2"></i>Add New Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="d-flex align-items-center justify-content-between flex-wrap p-3 bg-white pb-0 mb-4">
        <div className="dropdown me-2 mb-3">
          <button 
            className="dropdown-toggle text-default fw-medium d-inline-flex align-items-center p-1 border-0 fs-18 fw-semibold" 
            data-bs-toggle="dropdown"
          >
            {statusFilter === 'all' ? 'All Tickets' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
          </button>
          <ul className="dropdown-menu p-3">
            <li>
              <button 
                className="dropdown-item rounded-1"
                onClick={() => setStatusFilter('all')}
              >
                All Tickets
              </button>
            </li>
            <li>
              <button 
                className="dropdown-item rounded-1"
                onClick={() => setStatusFilter('open')}
              >
                Open
              </button>
            </li>
            <li>
              <button 
                className="dropdown-item rounded-1"
                onClick={() => setStatusFilter('in-progress')}
              >
                In Progress
              </button>
            </li>
            <li>
              <button 
                className="dropdown-item rounded-1"
                onClick={() => setStatusFilter('closed')}
              >
                Closed
              </button>
            </li>
          </ul>
        </div>
        <div className="d-flex align-items-center flex-wrap">
          <div className="d-flex align-items-center bg-white border rounded-2 p-1 mb-3 me-2">
            <Link to="/tickets" className="btn btn-icon bg-light btn-sm me-1 primary-hover">
              <i className="ti ti-list-tree"></i>
            </Link>
            <Link to="/ticket-grid" className="btn btn-icon btn-sm primary-hover active">
              <i className="ti ti-grid-dots"></i>
            </Link>
          </div>
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="row">
        <div className="col-xl-9">
          <div className="row">
            {tickets.length === 0 ? (
              <div className="col-12">
                <div className="card">
                  <div className="card-body text-center py-5">
                    <i className="ti ti-ticket-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
                    <p className="text-muted mt-3">No tickets found</p>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                      <i className="ti ti-plus me-2"></i>
                      Create First Ticket
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div key={ticket._id} className="col-xxl-4 col-xl-6 col-md-6">
                  <div className="card mb-3">
                    <div className="card-header d-flex align-items-center justify-content-between p-3 pb-2">
                      <h6 className="text-primary mb-0">{ticket.category.primary}</h6>
                      <span className={`badge ${getPriorityBadgeClass(ticket.priority.level)} d-inline-flex align-items-center`}>
                        <i className="ti ti-circle-filled fs-5 me-1"></i>
                        {ticket.priority.level.charAt(0).toUpperCase() + ticket.priority.level.slice(1)}
                      </span>
                    </div>
                    <div className="card-body p-3">
                      <span className="badge bg-pending rounded-pill mb-2">{ticket.ticketNumber}</span>
                      <h5 className="fw-semibold mb-2">
                        <Link to={`/ticket-details/${ticket._id}`}>{ticket.subject}</Link>
                      </h5>
                      <div className="d-flex align-items-center mb-2">
                        <span className={`badge ${getStatusBadgeClass(ticket.status)} d-flex align-items-center`}>
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('-', ' ')}
                        </span>
                      </div>
                      <div className="mb-2">
                        {ticket.assignment?.assignedTo && (
                          <p className="d-flex align-items-center mb-1 text-sm">
                            <i className="ti ti-user me-1"></i>
                            <span className="text-muted">Assigned to:</span>
                            <span className="text-dark ms-1">{ticket.assignment.assignedTo.name}</span>
                          </p>
                        )}
                        <p className="d-flex align-items-center text-muted mb-1 text-sm">
                          <i className="ti ti-calendar-bolt me-1"></i>
                          Updated {formatDate(ticket.timeline.updatedAt)}
                        </p>
                        <p className="d-flex align-items-center text-muted mb-0 text-sm">
                          <i className="ti ti-message-share me-1"></i>
                          {ticket.messages?.length || 0} Comments
                        </p>
                      </div>
                    </div>
                    <div className="card-footer p-3 pt-0">
                      <button 
                        className="btn btn-outline-danger btn-sm w-100"
                        onClick={() => handleDeleteTicket(ticket._id)}
                      >
                        <i className="ti ti-trash-x me-1"></i>Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Statistics Sidebar */}
        <div className="col-xl-3">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Ticket Statistics</h5>
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <i className="ti ti-ticket me-2 text-primary"></i>
                    <span>All Tickets</span>
                  </div>
                  <span className="badge bg-primary rounded-pill">{statistics?.total || 0}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <i className="ti ti-alert-circle me-2 text-danger"></i>
                    <span>Open</span>
                  </div>
                  <span className="badge bg-danger rounded-pill">{statistics?.open || 0}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <i className="ti ti-clock me-2 text-info"></i>
                    <span>In Progress</span>
                  </div>
                  <span className="badge bg-info rounded-pill">{statistics?.inProgress || 0}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <i className="ti ti-check me-2 text-success"></i>
                    <span>Resolved</span>
                  </div>
                  <span className="badge bg-success rounded-pill">{statistics?.resolved || 0}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <i className="ti ti-x me-2 text-dark"></i>
                    <span>Closed</span>
                  </div>
                  <span className="badge bg-dark rounded-pill">{statistics?.closed || 0}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Categories */}
          {statistics?.byCategory && statistics.byCategory.length > 0 && (
            <div className="card mt-3">
              <div className="card-header p-3">
                <h5 className="mb-0">Categories</h5>
              </div>
              <div className="card-body p-0">
                <div className="d-flex flex-column">
                  {statistics.byCategory.map((category, index) => (
                    <div key={index} className="d-flex align-items-center justify-content-between border-bottom p-3">
                      <span className="text-dark">{category._id}</span>
                      <span className="badge bg-primary-transparent">{category.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Ticket Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Ticket</h4>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <form onSubmit={handleAddTicket}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Title</label>
                        <input
                          type="text"
                          name="title"
                          className="form-control"
                          placeholder="Enter Title"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Category</label>
                        <select name="category" className="form-select" required>
                          <option value="">Select</option>
                          <option value="IT Support">IT Support</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Transportation">Transportation</option>
                          <option value="Library">Library</option>
                          <option value="Academic">Academic</option>
                          <option value="Finance">Finance</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Priority</label>
                        <select name="priority" className="form-select" required>
                          <option value="">Select Priority</option>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          name="description"
                          className="form-control"
                          rows={4}
                          placeholder="Enter ticket description"
                          required
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light me-2"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Creating...' : 'Add Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TicketGrid;
