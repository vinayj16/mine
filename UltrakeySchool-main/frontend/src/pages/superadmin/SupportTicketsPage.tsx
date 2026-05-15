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
}

const SupportTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchTickets();
    fetchStatistics();
  }, [page, statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (priorityFilter !== 'all') {
        params.priority = priorityFilter;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await apiClient.get('/support-tickets', { params });

      if (response.data && response.data.success) {
        const ticketsData = response.data.data;
        setTickets(Array.isArray(ticketsData) ? ticketsData : []);
        setTotal(response.data.pagination?.total || 0);
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
        const stats = response.data.data || {};
        setStatistics({
          total: stats.total || 0,
          open: stats.open || 0,
          inProgress: stats.inProgress || 0,
          pending: 0,
          resolved: stats.resolved || 0,
          closed: stats.closed || 0
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const response = await apiClient.patch(`/support-tickets/${ticketId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        toast.success('Ticket status updated successfully');
        fetchTickets();
        fetchStatistics();
      }
    } catch (error: any) {
      console.error('Failed to update ticket status:', error);
      toast.error(error.response?.data?.message || 'Failed to update ticket status');
    }
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      open: 'bg-danger',
      'in-progress': 'bg-info',
      pending: 'bg-warning',
      resolved: 'bg-success',
      closed: 'bg-dark',
      reopened: 'bg-warning'
    };
    return classes[status] || 'bg-secondary';
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
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Support Tickets</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/super-admin/dashboard">Dashboard</Link>
              </li>
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
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="row mb-3">
          <div className="col-md-2">
            <div className="card">
              <div className="card-body text-center">
                <h3 className="mb-0">{statistics.total}</h3>
                <small className="text-muted">Total</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card border-danger">
              <div className="card-body text-center">
                <h3 className="mb-0 text-danger">{statistics.open}</h3>
                <small className="text-muted">Open</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card border-info">
              <div className="card-body text-center">
                <h3 className="mb-0 text-info">{statistics.inProgress}</h3>
                <small className="text-muted">In Progress</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card border-warning">
              <div className="card-body text-center">
                <h3 className="mb-0 text-warning">{statistics.pending}</h3>
                <small className="text-muted">Pending</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card border-success">
              <div className="card-body text-center">
                <h3 className="mb-0 text-success">{statistics.resolved}</h3>
                <small className="text-muted">Resolved</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card border-dark">
              <div className="card-body text-center">
                <h3 className="mb-0 text-dark">{statistics.closed}</h3>
                <small className="text-muted">Closed</small>
              </div>
            </div>
          </div>
        </div>
      )}

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
              </select>
            </div>
            <div className="col-md-3 mb-2">
              <select
                className="form-select"
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="col-md-2 mb-2 text-end">
              <span className="text-muted">
                {tickets.length} of {total}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="card">
        <div className="card-body p-0">
          {tickets.length === 0 ? (
            <div className="text-center p-5">
              <i className="ti ti-ticket-off" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <p className="text-muted mt-3">No support tickets found</p>
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
                        <button
                          className="btn btn-link text-primary p-0"
                          onClick={() => handleViewTicket(ticket)}
                        >
                          {ticket.ticketNumber}
                        </button>
                      </td>
                      <td>
                        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ticket.subject}
                        </div>
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
                          className={`form-select form-select-sm ${getStatusBadgeClass(ticket.status)}`}
                          value={ticket.status}
                          onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                          style={{ width: 'auto', border: 'none', color: 'white' }}
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="pending">Pending</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
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
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleViewTicket(ticket)}
                          title="View Details"
                        >
                          <i className="ti ti-eye"></i>
                        </button>
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

      {/* Ticket Details Modal */}
      {showTicketModal && selectedTicket && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Ticket Details - {selectedTicket.ticketNumber}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowTicketModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted">Subject</label>
                    <div className="fw-medium">{selectedTicket.subject}</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted">Status</label>
                    <div>
                      <span className={`badge ${getStatusBadgeClass(selectedTicket.status)}`}>
                        {selectedTicket.status.charAt(0).toUpperCase() + selectedTicket.status.slice(1).replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted">Priority</label>
                    <div>
                      <span className={`badge ${getPriorityBadgeClass(selectedTicket.priority.level)}`}>
                        {selectedTicket.priority.level.charAt(0).toUpperCase() + selectedTicket.priority.level.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted">Category</label>
                    <div className="fw-medium">{selectedTicket.category.primary}</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted">Requester</label>
                    <div>
                      <div className="fw-medium">{selectedTicket.requester.name}</div>
                      <small className="text-muted">{selectedTicket.requester.email}</small>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted">Assigned To</label>
                    <div>
                      {selectedTicket.assignment?.assignedTo ? (
                        <>
                          <div className="fw-medium">{selectedTicket.assignment.assignedTo.name}</div>
                          <small className="text-muted">{selectedTicket.assignment.assignedTo.email}</small>
                        </>
                      ) : (
                        <span className="text-muted">Unassigned</span>
                      )}
                    </div>
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label text-muted">Description</label>
                    <div className="p-3 bg-light rounded">{selectedTicket.description}</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted">Created</label>
                    <div>{formatDate(selectedTicket.timeline.createdAt)}</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted">Last Updated</label>
                    <div>{formatDate(selectedTicket.timeline.updatedAt)}</div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowTicketModal(false)}
                >
                  Close
                </button>
                <Link 
                  to={`/ticket-details/${selectedTicket._id}`}
                  className="btn btn-primary"
                >
                  View Full Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupportTicketsPage;
