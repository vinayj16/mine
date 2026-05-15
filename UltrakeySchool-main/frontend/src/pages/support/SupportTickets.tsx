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
}

const SupportTickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = { page, limit };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await apiClient.get('/support-tickets', { params });

      if (response.data.success) {
        setTickets(response.data.data.tickets || []);
        setTotal(response.data.data.total || 0);
      }
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch tickets';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
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
      }
    } catch (error: any) {
      console.error('Failed to delete ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to delete ticket');
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const response = await apiClient.patch(`/support-tickets/${ticketId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        toast.success('Ticket status updated successfully');
        fetchTickets();
      }
    } catch (error: any) {
      console.error('Failed to update ticket status:', error);
      toast.error(error.response?.data?.message || 'Failed to update ticket status');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      open: 'badge-danger',
      'in-progress': 'badge-info',
      pending: 'badge-warning',
      resolved: 'badge-success',
      closed: 'badge-dark',
      reopened: 'badge-warning'
    };
    return classes[status] || 'badge-secondary';
  };

  const getPriorityBadgeClass = (priority: string) => {
    const classes: Record<string, string> = {
      low: 'badge-success',
      medium: 'badge-warning',
      high: 'badge-danger',
      urgent: 'badge-danger',
      critical: 'badge-danger'
    };
    return classes[priority] || 'badge-secondary';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    <div>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Support Tickets</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">Support</li>
              <li className="breadcrumb-item active" aria-current="page">
                Support Tickets
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button 
            className="btn btn-outline-light bg-white btn-icon me-2"
            onClick={fetchTickets}
            title="Refresh"
          >
            <i className="ti ti-refresh"></i>
          </button>
          <Link to="/tickets" className="btn btn-primary">
            <i className="ti ti-plus me-2"></i>
            Create Ticket
          </Link>
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
                    placeholder="Search tickets..."
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
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="reopened">Reopened</option>
              </select>
            </div>
            <div className="col-md-5 mb-2 text-end">
              <span className="text-muted">
                Showing {tickets.length} of {total} tickets
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
          <span>{error}</span>
          <button className="btn btn-sm btn-outline-danger" onClick={fetchTickets}>
            Retry
          </button>
        </div>
      )}

      {/* Tickets Table */}
      <div className="card">
        <div className="card-body p-0">
          {tickets.length === 0 ? (
            <div className="text-center p-5">
              <i className="ti ti-ticket-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <p className="text-muted mt-3">No support tickets found</p>
              <Link to="/tickets" className="btn btn-primary">
                <i className="ti ti-plus me-2"></i>
                Create First Ticket
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Ticket #</th>
                    <th>Subject</th>
                    <th>Requester</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket._id}>
                      <td>
                        <Link to={`/ticket-details/${ticket._id}`} className="text-primary">
                          {ticket.ticketNumber}
                        </Link>
                      </td>
                      <td>
                        <Link to={`/ticket-details/${ticket._id}`}>
                          {ticket.subject}
                        </Link>
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">{ticket.requester.name}</div>
                          <small className="text-muted">{ticket.requester.email}</small>
                        </div>
                      </td>
                      <td>{ticket.category.primary}</td>
                      <td>
                        <span className={`badge ${getPriorityBadgeClass(ticket.priority.level)}`}>
                          {ticket.priority.level.charAt(0).toUpperCase() + ticket.priority.level.slice(1)}
                        </span>
                      </td>
                      <td>
                        <select
                          className={`form-select form-select-sm badge ${getStatusBadgeClass(ticket.status)}`}
                          value={ticket.status}
                          onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                          style={{ width: 'auto', border: 'none' }}
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="pending">Pending</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                          <option value="reopened">Reopened</option>
                        </select>
                      </td>
                      <td>
                        {ticket.assignment?.assignedTo ? (
                          <div>
                            <div className="fw-medium">{ticket.assignment.assignedTo.name}</div>
                            <small className="text-muted">{ticket.assignment.assignedTo.email}</small>
                          </div>
                        ) : (
                          <span className="text-muted">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <small>{formatDate(ticket.timeline.updatedAt)}</small>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Link
                            to={`/ticket-details/${ticket._id}`}
                            className="btn btn-sm btn-outline-primary"
                            title="View Details"
                          >
                            <i className="ti ti-eye"></i>
                          </Link>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteTicket(ticket._id)}
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
    </div>
  );
};

export default SupportTickets;
