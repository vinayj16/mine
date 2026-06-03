import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';

interface NoticeItem {
  _id: string;
  title: string;
  description: string;
  priority: string;
  noticeDate: string;
  createdAt: string;
}

const NoticeBoardWidget = ({ limit = 3 }: { limit?: number }) => {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        let institutionId = '';
        const inst = localStorage.getItem('institutionId');
        if (inst && inst.length === 24) institutionId = inst;
        else {
          try { const u = JSON.parse(localStorage.getItem('user') || '{}'); institutionId = u.institutionId || u.institutionId || ''; } catch { /* */ }
        }
        let role = '';
        try { const u = JSON.parse(localStorage.getItem('user') || '{}'); role = u.role || ''; } catch { /* */ }
        if (!institutionId || !role) { setLoading(false); return; }
        const adminRoles = ['super_admin', 'superadmin', 'admin', 'principal', 'institution_admin', 'institution_owner'];
        const params: any = { institutionId, recipient: role, limit: 20 };
        // Only filter by academic year for non-admin roles
        if (!adminRoles.includes(role.toLowerCase())) {
          params.academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        }
        const res = await apiClient.get('/notices', { params });
        const data = res.data?.notices || res.data?.data?.notices || [];
        setNotices((Array.isArray(data) ? data : []).slice(0, limit));
      } catch { /* */ } finally { setLoading(false); }
    };
    fetchNotices();
  }, [limit]);

  const priorityBadge = (p: string) => {
    const colors: Record<string, string> = { urgent: 'danger', high: 'warning', medium: 'info', low: 'secondary' };
    return <span className={`badge bg-${colors[p] || 'info'}`}>{p}</span>;
  };

  return (
    <div className="card flex-fill">
      <div className="card-header d-flex align-items-center justify-content-between">
        <h4 className="card-title">Notice Board</h4>
        <Link to="/notice-board" className="btn btn-sm btn-outline-light">View All</Link>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="text-center py-3"><div className="spinner-border spinner-border-sm" /></div>
        ) : notices.length === 0 ? (
          <p className="text-muted text-center py-3">No notices</p>
        ) : (
          <ul className="list-group list-group-flush">
            {notices.map(n => (
              <li key={n._id} className="list-group-item px-0">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1">{n.title}</h6>
                    <small className="text-muted">{new Date(n.createdAt).toLocaleDateString()}</small>
                  </div>
                  {priorityBadge(n.priority)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NoticeBoardWidget;
