import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import { toast } from 'react-toastify';

interface EmailLog {
  _id: string;
  sender: {
    name: string;
    email: string;
  };
  recipients: Array<{
    name: string;
    email: string;
  }>;
  subject: string;
  content: string;
  htmlContent?: string;
  status: 'sent' | 'failed' | 'sending' | 'delivered';
  createdAt: string;
}

const HREmailLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response: any = await apiClient.get('/hr/emails');
      setLogs(response.data?.data?.emails || response.data?.emails || []);
    } catch (error: any) {
      toast.error('Failed to load system email logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const viewEmailDetails = (log: EmailLog) => {
    setSelectedEmail(log);
    setShowModal(true);
  };

  const filteredLogs = logs.filter(log => {
    const query = searchQuery.toLowerCase();
    const recipientEmail = log.recipients?.[0]?.email || '';
    const subject = log.subject || '';
    return recipientEmail.toLowerCase().includes(query) || subject.toLowerCase().includes(query);
  });

  const totalSent = logs.filter(l => l.status === 'sent' || l.status === 'delivered').length;
  const totalFailed = logs.filter(l => l.status === 'failed').length;

  return (
    <div className="container-fluid py-4" style={{ minHeight: '85vh' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em' }}>System Notification Logs</h2>
          <p className="text-muted mb-0">Monitor all system emails, credentials alerts, results publishes, and payment notices.</p>
        </div>
        <button 
          className="btn btn-outline-primary d-flex align-items-center gap-2 px-4 py-2 shadow-sm"
          style={{ borderRadius: '10px', fontWeight: 500 }}
          onClick={fetchLogs}
        >
          <i className="ti ti-refresh fs-5"></i> Refresh Logs
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: '16px' }}>
            <span className="text-secondary fw-semibold fs-7 uppercase d-block mb-1">Total Emails Dispatched</span>
            <h3 className="fw-bold mb-0 text-dark">{logs.length}</h3>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: '16px' }}>
            <span className="text-secondary fw-semibold fs-7 uppercase d-block mb-1">Successful Deliveries</span>
            <h3 className="fw-bold mb-0 text-success">{totalSent}</h3>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: '16px' }}>
            <span className="text-secondary fw-semibold fs-7 uppercase d-block mb-1">Bounced / Failed</span>
            <h3 className="fw-bold mb-0 text-danger">{totalFailed}</h3>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
        <div className="card-body p-3">
          <div className="input-group border-light-soft bg-light-soft px-3 py-1.5" style={{ borderRadius: '12px' }}>
            <span className="input-group-text bg-transparent border-0 text-muted">
              <i className="ti ti-search fs-5"></i>
            </span>
            <input 
              type="text" 
              placeholder="Search by recipient email or subject line..."
              className="form-control bg-transparent border-0 py-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table List */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-secondary uppercase fs-7">
              <tr>
                <th className="px-4 py-3">Recipient</th>
                <th className="py-3">Subject</th>
                <th className="py-3">Sent At</th>
                <th className="py-3">Status</th>
                <th className="px-4 py-3 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted mb-0">Loading mail logs...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    <i className="ti ti-mail-opened fs-1 d-block mb-3 opacity-40"></i>
                    No email notifications dispatched yet.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id}>
                    <td className="px-4 fw-semibold text-dark">
                      {log.recipients?.[0]?.email || 'N/A'}
                    </td>
                    <td className="text-dark fw-medium" style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.subject}
                    </td>
                    <td className="text-secondary fs-7">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      {log.status === 'failed' ? (
                        <span className="badge bg-danger-soft text-danger px-3 py-1.5 rounded-pill fs-7">Failed</span>
                      ) : (
                        <span className="badge bg-success-soft text-success px-3 py-1.5 rounded-pill fs-7">Delivered</span>
                      )}
                    </td>
                    <td className="px-4 text-end">
                      <button 
                        className="btn btn-sm btn-light-soft text-primary px-3 py-1.5"
                        style={{ borderRadius: '8px', fontWeight: 500 }}
                        onClick={() => viewEmailDetails(log)}
                      >
                        View Content
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showModal && selectedEmail && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header border-0 bg-light py-3 px-4 d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="modal-title fw-bold text-dark">{selectedEmail.subject}</h5>
                  <span className="text-muted fs-7">To: {selectedEmail.recipients?.[0]?.email}</span>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-4 bg-white" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {selectedEmail.htmlContent ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }} 
                    style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', backgroundColor: '#f8fafc' }}
                  />
                ) : (
                  <div className="p-3 bg-light rounded text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedEmail.content}
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 bg-light p-3 px-4 d-flex justify-content-end">
                <button type="button" className="btn btn-light shadow-sm px-4 py-2 border" style={{ borderRadius: '10px' }} onClick={() => setShowModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HREmailLogsPage;
