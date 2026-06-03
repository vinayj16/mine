import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import staffService from '../../services/staffService';
import apiClient from '../../api/client';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  body?: string;
  type: string;
  read: boolean;
  isRead?: boolean;
  createdAt: string;
  sender?: { name: string; photo?: string };
}

const StaffNotificationsPage: React.FC = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const list = await staffService.getNotifications(30);
      setItems(list);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load notifications');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setItems(prev => prev.map(n => (n._id === id ? { ...n, read: true, isRead: true } : n)));
    } catch { toast.error('Failed to mark as read'); }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.put('/notifications/mark-all-read');
      setItems(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed to mark all as read'); }
  };

  const isUnread = (n: NotificationItem) => n.read === false || n.isRead === false;

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    );
  }

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Notifications</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/dashboard/staff">Dashboard</Link>
              </li>
              <li className="breadcrumb-item active">Notifications</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex gap-2">
          {items.some(isUnread) && (
            <button className="btn btn-sm btn-outline-primary" onClick={markAllAsRead}>
              <i className="ti ti-check-all me-1"></i>Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="row g-3">
        {items.length === 0 ? (
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="ti ti-bell-off fs-1 text-muted mb-3"></i>
                <p className="text-muted mb-0">No notifications yet.</p>
              </div>
            </div>
          </div>
        ) : (
          items.map((n) => (
            <div key={n._id || n.id} className="col-md-6 col-lg-4">
              <div className={`card h-100 border ${isUnread(n) ? 'border-primary' : ''}`}>
                <div className="card-body">
                  <div className="d-flex align-items-start gap-3">
                    <span className="avatar avatar-md flex-shrink-0">
                      {n.sender?.photo ? (
                        <img src={n.sender.photo} alt="" className="rounded-circle" style={{ width: 40, height: 40, objectFit: 'cover' }} />
                      ) : (
                        <span className={`avatar-title rounded-circle ${isUnread(n) ? 'bg-primary' : 'bg-secondary'}`}>
                          {n.sender?.name?.charAt(0) || 'N'}
                        </span>
                      )}
                    </span>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <h6 className={`mb-0 ${isUnread(n) ? 'fw-bold' : ''}`}>
                          {n.title || n.message || 'Notification'}
                        </h6>
                        {isUnread(n) && <span className="badge bg-primary rounded-pill" style={{ width: 8, height: 8, padding: 0, minWidth: 8 }} />}
                      </div>
                      <p className="text-muted small mb-2">{(n.body || n.message || '').substring(0, 120)}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          <i className="ti ti-clock me-1"></i>
                          {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                        </small>
                        {isUnread(n) && (
                          <button className="btn btn-sm btn-outline-primary py-0 px-2" onClick={() => markAsRead(n._id)}>
                            <i className="ti ti-check me-1"></i>Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default StaffNotificationsPage;
