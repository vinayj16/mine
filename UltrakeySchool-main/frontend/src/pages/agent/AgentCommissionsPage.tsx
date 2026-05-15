import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import commissionService, { type Commission, type CommissionSummary } from '../../services/commissionService';
import { useAuth } from '../../store/authStore';

const AgentCommissionsPage = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'paid'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const itemsPerPage = 10;

  const { user } = useAuth();
  const agentId = localStorage.getItem('userId') || user?.id || '';

  useEffect(() => {
    if (agentId) {
      fetchData();
    } else {
      setLoading(false);
      toast.error('Agent ID not found. Please log in again.');
    }
  }, [agentId, filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [commissionsData, summaryData] = await Promise.all([
        commissionService.getByAgent(agentId, filter !== 'all' ? { status: filter } : undefined),
        commissionService.getSummary(agentId)
      ]);
      
      setCommissions(commissionsData);
      setSummary(summaryData);
    } catch (error: any) {
      toast.error('Failed to load commission data');
      console.error('Error fetching commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStatement = async () => {
    try {
      await commissionService.downloadStatement(agentId, {
        status: filter !== 'all' ? filter : undefined,
        format: 'pdf'
      });
      toast.success('Statement downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading statement:', error);
      toast.error('Failed to download statement');
    }
  };

  const handleViewDetails = (commission: Commission) => {
    setSelectedCommission(commission);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedCommission(null);
  };

  const handleDownloadReceipt = async (commission: Commission) => {
    try {
      await commissionService.downloadReceipt(commission._id);
      toast.success(`Receipt downloaded for ${commission.institutionName}`);
    } catch (error: any) {
      console.error('Error downloading receipt:', error);
      toast.error(`Failed to download receipt for ${commission.institutionName}`);
    }
  };

  // Filter commissions
  const filteredCommissions = commissions.filter(commission => {
    if (filter === 'all') return true;
    return commission.status === filter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCommissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCommissions = filteredCommissions.slice(startIndex, endIndex);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning';
      case 'approved': return 'bg-info';
      case 'paid': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'paid': return 'Paid';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="container-fluid">
        <div className="alert alert-warning">
          <i className="ti ti-alert-triangle me-2" />
          Unable to load commission data. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold">My Commissions</h4>
          <p className="text-muted mb-0">Track and manage your commission earnings</p>
        </div>
        <button className="btn btn-primary" onClick={handleDownloadStatement}>
          <i className="ti ti-download me-2" />Download Statement
        </button>
      </div>

      {/* Commission Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-0 bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">Total Commission</h5>
                  <h3 className="mb-0">₹{summary.totalCommission.toLocaleString()}</h3>
                  <small className="text-white-50">All time earnings</small>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-currency-rupee fs-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">Pending</h5>
                  <h3 className="mb-0">₹{summary.pendingCommission.toLocaleString()}</h3>
                  <small className="text-white-50">Awaiting approval</small>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-clock fs-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">Approved</h5>
                  <h3 className="mb-0">₹{summary.approvedCommission.toLocaleString()}</h3>
                  <small className="text-white-50">Ready for payment</small>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-check fs-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-0">Paid</h5>
                  <h3 className="mb-0">₹{summary.paidCommission.toLocaleString()}</h3>
                  <small className="text-white-50">Received payments</small>
                </div>
                <div className="avatar avatar-md bg-white bg-opacity-20 rounded-circle">
                  <i className="ti ti-cash fs-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Rate Info */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h6 className="mb-1">Current Commission Rate</h6>
              <p className="text-muted mb-0">You earn {summary.commissionRate}% commission on all institution revenue</p>
            </div>
            <div className="col-md-4 text-end">
              <div className="display-6 text-primary">{summary.commissionRate}%</div>
              <small className="text-muted">Commission Rate</small>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card mb-4">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            {[
              { key: 'all', label: 'All Commissions', count: commissions.length },
              { key: 'pending', label: 'Pending', count: commissions.filter(c => c.status === 'pending').length },
              { key: 'approved', label: 'Approved', count: commissions.filter(c => c.status === 'approved').length },
              { key: 'paid', label: 'Paid', count: commissions.filter(c => c.status === 'paid').length }
            ].map(tab => (
              <li key={tab.key} className="nav-item">
                <button
                  className={`nav-link ${filter === tab.key ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentPage(1);
                    setFilter(tab.key as any);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="badge bg-primary ms-2">{tab.count}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Institution Name</th>
                  <th>Type</th>
                  <th>Revenue</th>
                  <th>Commission Rate</th>
                  <th>Commission Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Payment Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentCommissions.map((commission) => (
                  <tr key={commission._id}>
                    <td className="fw-semibold">{commission.institutionName}</td>
                    <td>{commission.institutionType}</td>
                    <td>₹{commission.revenue.toLocaleString()}</td>
                    <td>{commission.commissionRate}%</td>
                    <td className="fw-semibold">₹{commission.commissionAmount.toLocaleString()}</td>
                    <td>{formatDate(commission.createdAt)}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(commission.status)} text-white`}>
                        {getStatusText(commission.status)}
                      </span>
                    </td>
                    <td>{formatDate(commission.paymentDate)}</td>
                    <td>
                      <div className="dropdown">
                        <button 
                          className="btn btn-sm btn-outline-secondary dropdown-toggle" 
                          type="button" 
                          data-bs-toggle="dropdown"
                        >
                          <i className="ti ti-dots-vertical" />
                        </button>
                        <ul className="dropdown-menu">
                          <li>
                            <button 
                              className="dropdown-item"
                              onClick={() => handleViewDetails(commission)}
                            >
                              <i className="ti ti-eye me-2" />View Details
                            </button>
                          </li>
                          <li>
                            <button 
                              className="dropdown-item"
                              onClick={() => handleDownloadReceipt(commission)}
                            >
                              <i className="ti ti-download me-2" />Download Receipt
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

          {/* Empty State */}
          {currentCommissions.length === 0 && (
            <div className="text-center py-5">
              <i className="ti ti-receipt-off fs-48 text-muted mb-3 d-block" />
              <h5 className="text-muted">No commissions found</h5>
              <p className="text-muted">
                {filter === 'all' 
                  ? 'Start adding institutions to earn commissions'
                  : `No ${filter} commissions found`
                }
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredCommissions.length)} of {filteredCommissions.length} commissions
              </div>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="ti ti-chevron-left" />
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    return (
                      <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </li>
                    );
                  })}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="ti ti-chevron-right" />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Institution Details Modal */}
      {showDetailsModal && selectedCommission && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <i className="ti ti-building me-2" />
                  Institution Details
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal} />
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small">Institution Name</label>
                    <p className="fw-semibold">{selectedCommission.institutionName}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small">Type</label>
                    <p className="fw-semibold">{selectedCommission.institutionType}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small">Revenue</label>
                    <p className="fw-semibold">₹{selectedCommission.revenue.toLocaleString()}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small">Commission Rate</label>
                    <p className="fw-semibold">{selectedCommission.commissionRate}%</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small">Commission Amount</label>
                    <p className="fw-semibold text-primary">₹{selectedCommission.commissionAmount.toLocaleString()}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small">Status</label>
                    <p>
                      <span className={`badge ${getStatusBadgeClass(selectedCommission.status)} text-white`}>
                        {getStatusText(selectedCommission.status)}
                      </span>
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small">Date</label>
                    <p className="fw-semibold">{formatDate(selectedCommission.createdAt)}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small">Payment Date</label>
                    <p className="fw-semibold">{formatDate(selectedCommission.paymentDate)}</p>
                  </div>
                  {selectedCommission.notes && (
                    <div className="col-12 mb-3">
                      <label className="form-label text-muted small">Notes</label>
                      <p>{selectedCommission.notes}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={handleCloseModal}>
                  Close
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    handleCloseModal();
                    handleDownloadReceipt(selectedCommission);
                  }}
                >
                  <i className="ti ti-download me-2" />Download Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentCommissionsPage;
