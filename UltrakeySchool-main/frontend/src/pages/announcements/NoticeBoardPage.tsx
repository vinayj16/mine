import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import noticeService, { type Notice, type NoticeFormData } from '../../services/noticeService';

const NoticeBoardPage: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNotices, setSelectedNotices] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState<Notice | null>(null);
  const [showEditModal, setShowEditModal] = useState<Notice | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<NoticeFormData>({
    title: '',
    description: '',
    noticeDate: '',
    publishDate: '',
    recipients: [],
    priority: 'medium',
    status: 'published',
    academicYear: '2024-2025',
    institutionId: ''
  });

  // Filter state
  const [filterRecipient, setFilterRecipient] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    const institutionId = localStorage.getItem('institutionId');
    if (institutionId) {
      setFormData(prev => ({ ...prev, institutionId }));
      fetchNotices();
    }
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const institutionId = localStorage.getItem('institutionId');
      const params: any = {
        academicYear: '2024-2025'
      };
      
      if (institutionId && institutionId.length === 24) {
        params.institutionId = institutionId;
      }

      if (filterRecipient) params.recipient = filterRecipient;
      if (filterDate) params.startDate = filterDate;

      const response = await noticeService.getAll(params);
      // Handle both wrapped and unwrapped responses
      const noticesData = response?.data?.notices || response?.notices || response?.data || [];
      setNotices(Array.isArray(noticesData) ? noticesData : []);
    } catch (error: any) {
      console.error('Error fetching notices:', error);
      setNotices([]);
      toast.error(error.response?.data?.message || 'Failed to fetch notices');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRecipientChange = (recipient: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.includes(recipient)
        ? prev.recipients.filter(r => r !== recipient)
        : [...prev.recipients, recipient]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.noticeDate || !formData.publishDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.recipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    try {
      setSaving(true);
      if (showEditModal) {
        await noticeService.update(showEditModal._id, formData);
        toast.success('Notice updated successfully');
        setShowEditModal(null);
      } else {
        await noticeService.create(formData);
        toast.success('Notice created successfully');
        setShowAddModal(false);
      }
      resetForm();
      fetchNotices();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save notice');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      if (selectedNotices.length > 0) {
        await noticeService.bulkDelete(selectedNotices);
        toast.success(`${selectedNotices.length} notice(s) deleted successfully`);
        setSelectedNotices([]);
      }
      setShowDeleteModal(false);
      fetchNotices();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete notice(s)');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    const institutionId = localStorage.getItem('institutionId');
    setFormData({
      title: '',
      description: '',
      noticeDate: '',
      publishDate: '',
      recipients: [],
      priority: 'medium',
      status: 'published',
      academicYear: '2024-2025',
      institutionId: institutionId || ''
    });
  };

  const openEditModal = (notice: Notice) => {
    setFormData({
      title: notice.title,
      description: notice.description,
      noticeDate: notice.noticeDate.split('T')[0],
      publishDate: notice.publishDate.split('T')[0],
      recipients: notice.recipients,
      priority: notice.priority,
      status: notice.status,
      academicYear: notice.academicYear,
      institutionId: notice.institutionId
    });
    setShowEditModal(notice);
  };

  const toggleNoticeSelection = (id: string) => {
    setSelectedNotices(prev =>
      prev.includes(id) ? prev.filter(noticeId => noticeId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedNotices(notices.map(notice => notice._id));
    } else {
      setSelectedNotices([]);
    }
  };

  const handleFilterApply = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotices();
  };

  const handleFilterReset = () => {
    setFilterRecipient('');
    setFilterDate('');
    fetchNotices();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const recipientOptions = [
    'student',
    'parent',
    'teacher',
    'admin',
    'accountant',
    'librarian',
    'receptionist',
    'superadmin',
    'staff'
  ];

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Notice Board</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">Announcement</li>
              <li className="breadcrumb-item active" aria-current="page">
                Notice Board
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchNotices}
              title="Refresh"
              disabled={loading}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={() => window.print()}
              title="Print"
            >
              <i className="ti ti-printer"></i>
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <button
              className="btn btn-light fw-medium d-inline-flex align-items-center"
              data-bs-toggle="dropdown"
            >
              <i className="ti ti-file-export me-2"></i>Export
            </button>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <button className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>
          <div className="mb-2">
            <button
              className="btn btn-primary d-flex align-items-center"
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
            >
              <i className="ti ti-square-rounded-plus me-2"></i>Add Message
            </button>
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-end flex-wrap mb-2">
        <div className="form-check me-2 mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            checked={selectedNotices.length === notices.length && notices.length > 0}
            onChange={toggleSelectAll}
          />
          <span className="checkmarks">Mark & Delete All</span>
        </div>
        {selectedNotices.length > 0 && (
          <button
            className="btn btn-danger btn-sm me-2 mb-3"
            onClick={() => setShowDeleteModal(true)}
          >
            <i className="ti ti-trash me-1"></i>Delete Selected ({selectedNotices.length})
          </button>
        )}
        <div className="d-flex align-items-center flex-wrap">
          <div className="input-icon-start mb-3 me-2 position-relative">
            <span className="icon-addon">
              <i className="ti ti-calendar"></i>
            </span>
            <input
              type="text"
              className="form-control date-range bookingrange"
              placeholder="Select"
              value="Academic Year : 2024 / 2025"
              readOnly
            />
          </div>
          <div className="dropdown mb-3">
            <button
              className="btn btn-outline-light bg-white dropdown-toggle"
              data-bs-toggle="dropdown"
            >
              <i className="ti ti-filter me-2"></i>Filter
            </button>
            <div className="dropdown-menu drop-width">
              <form onSubmit={handleFilterApply}>
                <div className="d-flex align-items-center border-bottom p-3">
                  <h4>Filter</h4>
                </div>
                <div className="p-3 border-bottom pb-0">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Message to</label>
                        <select
                          className="form-select"
                          value={filterRecipient}
                          onChange={e => setFilterRecipient(e.target.value)}
                        >
                          <option value="">All</option>
                          {recipientOptions.map(option => (
                            <option key={option} value={option}>
                              {option.charAt(0).toUpperCase() + option.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Added Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={filterDate}
                          onChange={e => setFilterDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 d-flex align-items-center justify-content-end">
                  <button
                    type="button"
                    className="btn btn-light me-3"
                    onClick={handleFilterReset}
                  >
                    Reset
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Apply
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Notice Board List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : notices.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="ti ti-notification fs-1 text-muted mb-3"></i>
            <p className="text-muted">No notices found</p>
          </div>
        </div>
      ) : (
        notices.map(notice => (
          <div key={notice._id} className="card board-hover mb-3">
            <div className="card-body d-md-flex align-items-center justify-content-between pb-1">
              <div className="d-flex align-items-center mb-3">
                <div className="form-check form-check-md me-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={selectedNotices.includes(notice._id)}
                    onChange={() => toggleNoticeSelection(notice._id)}
                  />
                </div>
                <span className="bg-soft-primary text-primary avatar avatar-md me-2 br-5 flex-shrink-0">
                  <i className="ti ti-notification fs-16"></i>
                </span>
                <div>
                  <h6 className="mb-1 fw-semibold">
                    <a
                      href="#"
                      onClick={e => {
                        e.preventDefault();
                        setShowViewModal(notice);
                      }}
                    >
                      {notice.title}
                    </a>
                  </h6>
                  <p>
                    <i className="ti ti-calendar me-1"></i>Added on : {formatDate(notice.createdAt)}
                  </p>
                  <div>
                    {notice.recipients.map(recipient => (
                      <span key={recipient} className="badge badge-soft-primary me-1">
                        {recipient}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="d-flex align-items-center board-action mb-3">
                <button
                  className="text-primary border rounded p-1 badge me-1 primary-btn-hover"
                  onClick={() => openEditModal(notice)}
                >
                  <i className="ti ti-edit-circle fs-16"></i>
                </button>
                <button
                  className="text-danger border rounded p-1 badge danger-btn-hover"
                  onClick={() => {
                    setSelectedNotices([notice._id]);
                    setShowDeleteModal(true);
                  }}
                >
                  <i className="ti ti-trash-x fs-16"></i>
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Add/Edit Message Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">
                  {showEditModal ? 'Edit Message' : 'Add New Message'}
                </h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(null);
                    resetForm();
                  }}
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Title *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="Enter Title"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Notice Date *</label>
                        <input
                          type="date"
                          className="form-control"
                          name="noticeDate"
                          value={formData.noticeDate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Publish On *</label>
                        <input
                          type="date"
                          className="form-control"
                          name="publishDate"
                          value={formData.publishDate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Priority</label>
                        <select
                          className="form-select"
                          name="priority"
                          value={formData.priority}
                          onChange={handleInputChange}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Message *</label>
                        <textarea
                          className="form-control"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={4}
                          placeholder="Enter message"
                          required
                        ></textarea>
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Message To *</label>
                        <div className="row">
                          <div className="col-md-6">
                            {recipientOptions.slice(0, 5).map(recipient => (
                              <div key={recipient} className="form-check form-check-md mb-1">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`recipient-${recipient}`}
                                  checked={formData.recipients.includes(recipient)}
                                  onChange={() => handleRecipientChange(recipient)}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor={`recipient-${recipient}`}
                                >
                                  {recipient.charAt(0).toUpperCase() + recipient.slice(1)}
                                </label>
                              </div>
                            ))}
                          </div>
                          <div className="col-md-6">
                            {recipientOptions.slice(5).map(recipient => (
                              <div key={recipient} className="form-check form-check-md mb-1">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`recipient-${recipient}`}
                                  checked={formData.recipients.includes(recipient)}
                                  onChange={() => handleRecipientChange(recipient)}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor={`recipient-${recipient}`}
                                >
                                  {recipient.charAt(0).toUpperCase() + recipient.slice(1)}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light me-2"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(null);
                      resetForm();
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : showEditModal ? 'Update Message' : 'Add Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">{showViewModal.title}</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => setShowViewModal(null)}
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <div className="modal-body pb-0">
                <div className="mb-3">
                  <p>{showViewModal.description}</p>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Notice Date</label>
                      <p className="d-flex align-items-center">
                        <i className="ti ti-calendar me-1"></i>
                        {formatDate(showViewModal.noticeDate)}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Publish On</label>
                      <p className="d-flex align-items-center">
                        <i className="ti ti-calendar me-1"></i>
                        {formatDate(showViewModal.publishDate)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Priority</label>
                  <p>
                    <span
                      className={`badge ${
                        showViewModal.priority === 'urgent'
                          ? 'badge-danger'
                          : showViewModal.priority === 'high'
                          ? 'badge-warning'
                          : 'badge-info'
                      }`}
                    >
                      {showViewModal.priority.toUpperCase()}
                    </span>
                  </p>
                </div>
                {showViewModal.attachments && showViewModal.attachments.length > 0 && (
                  <div className="mb-3">
                    <div className="bg-light p-3 pb-2 rounded">
                      <div className="mb-0">
                        <label className="form-label">Attachments</label>
                        {showViewModal.attachments.map((attachment, index) => (
                          <p key={index} className="text-primary">
                            <i className="ti ti-file me-1"></i>
                            {attachment.fileName}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label d-block">Message To</label>
                  {showViewModal.recipients.map(recipient => (
                    <span key={recipient} className="badge badge-soft-primary me-2">
                      {recipient.charAt(0).toUpperCase() + recipient.slice(1)}
                    </span>
                  ))}
                </div>
                <div className="border-top pt-3">
                  <div className="d-flex align-items-center flex-wrap">
                    <div className="d-flex align-items-center me-4 mb-3">
                      <span className="avatar avatar-sm bg-light me-1">
                        <i className="ti ti-calendar text-default fs-14"></i>
                      </span>
                      Added on: {formatDate(showViewModal.createdAt)}
                    </div>
                    <div className="d-flex align-items-center mb-3">
                      <span className="avatar avatar-sm bg-light me-1">
                        <i className="ti ti-eye text-default fs-14"></i>
                      </span>
                      Views: {showViewModal.views}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <span className="delete-icon">
                  <i className="ti ti-trash-x"></i>
                </span>
                <h4>Confirm Deletion</h4>
                <p>
                  You want to delete{' '}
                  {selectedNotices.length > 1
                    ? `${selectedNotices.length} notices`
                    : 'this notice'}
                  . This can't be undone once you delete.
                </p>
                <div className="d-flex justify-content-center">
                  <button
                    type="button"
                    className="btn btn-light me-3"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    {saving ? 'Deleting...' : 'Yes, Delete'}
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

export default NoticeBoardPage;
