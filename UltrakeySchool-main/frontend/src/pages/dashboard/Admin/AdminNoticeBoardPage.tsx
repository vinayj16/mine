import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface NoticeBoardData {
  overview: {
    totalNotices: number;
    activeNotices: number;
    expiredNotices: number;
    thisMonthNotices: number;
  };
  notices: {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
    targetAudience: string[];
    postedDate: string;
    expiryDate: string;
    postedBy: string;
    status: 'active' | 'expired' | 'draft';
    attachments: number;
    views: number;
  }[];
  categories: {
    name: string;
    count: number;
    color: string;
  }[];
  monthlyTrend: {
    month: string;
    notices: number;
    views: number;
  }[];
}

const AdminNoticeBoardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [noticeData, setNoticeData] = useState<NoticeBoardData | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchNoticeData();
  }, [selectedCategory, searchTerm]);

  const fetchNoticeData = async () => {
    try {
      setLoading(true);
      // Set sample data for now
      setNoticeData({
        overview: {
          totalNotices: 0,
          activeNotices: 0,
          expiredNotices: 0,
          thisMonthNotices: 0
        },
        notices: [],
        categories: [
          { name: 'Academic', count: 0, color: '#3b82f6' },
          { name: 'Events', count: 0, color: '#10b981' },
          { name: 'Examinations', count: 0, color: '#f59e0b' },
          { name: 'Holidays', count: 0, color: '#ef4444' },
          { name: 'General', count: 0, color: '#8b5cf6' }
        ],
        monthlyTrend: [
          { month: 'Jan', notices: 0, views: 0 },
          { month: 'Feb', notices: 0, views: 0 },
          { month: 'Mar', notices: 0, views: 0 },
          { month: 'Apr', notices: 0, views: 0 },
          { month: 'May', notices: 0, views: 0 },
          { month: 'Jun', notices: 0, views: 0 }
        ]
      });
    } catch (error) {
      console.error('Error fetching notice board data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotice = () => {
    // Handle notice creation logic
    console.log('Creating new notice...');
  };

  const filteredNotices = noticeData?.notices.filter(notice => {
    const matchesCategory = selectedCategory === 'all' || notice.category === selectedCategory;
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          notice.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];

  const statusData = noticeData ? [
    { name: 'Active', value: noticeData.overview.activeNotices, color: '#10b981' },
    { name: 'Expired', value: noticeData.overview.expiredNotices, color: '#ef4444' },
    { name: 'This Month', value: noticeData.overview.thisMonthNotices, color: '#f59e0b' }
  ] : [];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Notice Board</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">Announcements</li>
              <li className="breadcrumb-item active">Notice Board</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchNoticeData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary" onClick={handleCreateNotice}>
            <i className="ti ti-plus me-2"></i>Create Notice
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{noticeData?.overview.totalNotices}</h4>
                  <p className="mb-0">Total Notices</p>
                  <small>All time</small>
                </div>
                <i className="ti ti-bell fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{noticeData?.overview.activeNotices}</h4>
                  <p className="mb-0">Active Notices</p>
                  <small>Currently visible</small>
                </div>
                <i className="ti ti-bell-ringing fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{noticeData?.overview.expiredNotices}</h4>
                  <p className="mb-0">Expired Notices</p>
                  <small>No longer active</small>
                </div>
                <i className="ti ti-bell-off fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{noticeData?.overview.thisMonthNotices}</h4>
                  <p className="mb-0">This Month</p>
                  <small>New notices</small>
                </div>
                <i className="ti ti-calendar fs-24"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="row">
        {/* Left Sidebar */}
        <div className="col-xl-3 col-md-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Notice Sections</h5>
              <div className="nav flex-column nav-pills">
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'overview' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('overview')}
                >
                  <i className="ti ti-chart-pie me-2"></i>
                  Overview
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'notices' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('notices')}
                >
                  <i className="ti ti-list me-2"></i>
                  All Notices
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'create' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('create')}
                >
                  <i className="ti ti-plus me-2"></i>
                  Create Notice
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'archive' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('archive')}
                >
                  <i className="ti ti-archive me-2"></i>
                  Archive
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="col-xl-9 col-md-12">
          {/* Overview */}
          {selectedSection === 'overview' && (
            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Notice Status</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Notice Categories</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={noticeData?.categories || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Monthly Notice Trend</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={noticeData?.monthlyTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="notices" fill="#10b981" />
                        <Bar dataKey="views" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Notices */}
          {selectedSection === 'notices' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">All Notices</h5>
                <div className="d-flex gap-2">
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    placeholder="Search notices..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <select 
                    className="form-select form-select-sm"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="Academic">Academic</option>
                    <option value="Events">Events</option>
                    <option value="Examinations">Examinations</option>
                    <option value="Holidays">Holidays</option>
                    <option value="General">General</option>
                  </select>
                  <button className="btn btn-primary btn-sm">
                    <i className="ti ti-filter me-1"></i>Filter
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Priority</th>
                        <th>Target Audience</th>
                        <th>Posted Date</th>
                        <th>Expiry Date</th>
                        <th>Status</th>
                        <th>Views</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNotices.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="text-center text-muted">
                            No notices found. Click "Create Notice" to publish your first notice.
                          </td>
                        </tr>
                      ) : (
                        filteredNotices.map((notice) => (
                          <tr key={notice.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className={`avatar avatar-sm bg-${
                                  notice.priority === 'high' ? 'danger' :
                                  notice.priority === 'medium' ? 'warning' : 'info'
                                } text-white rounded-circle me-2`}>
                                  <i className="ti ti-bell"></i>
                                </div>
                                <div>
                                  <h6 className="mb-0">{notice.title}</h6>
                                  <small className="text-muted">{notice.description.substring(0, 50)}...</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-primary">{notice.category}</span>
                            </td>
                            <td>
                              <span className={`badge bg-${
                                notice.priority === 'high' ? 'danger' :
                                notice.priority === 'medium' ? 'warning' : 'info'
                              }`}>
                                {notice.priority.charAt(0).toUpperCase() + notice.priority.slice(1)}
                              </span>
                            </td>
                            <td>{notice.targetAudience.join(', ')}</td>
                            <td>{notice.postedDate}</td>
                            <td>{notice.expiryDate}</td>
                            <td>
                              <span className={`badge ${
                                notice.status === 'active' ? 'bg-success' :
                                notice.status === 'expired' ? 'bg-danger' : 'bg-secondary'
                              }`}>
                                {notice.status.charAt(0).toUpperCase() + notice.status.slice(1)}
                              </span>
                            </td>
                            <td>{notice.views}</td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary" title="View">
                                  <i className="ti ti-eye"></i>
                                </button>
                                <button className="btn btn-outline-warning" title="Edit">
                                  <i className="ti ti-edit"></i>
                                </button>
                                <button className="btn btn-outline-danger" title="Delete">
                                  <i className="ti ti-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Create Notice */}
          {selectedSection === 'create' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Create New Notice</h5>
              </div>
              <div className="card-body">
                <form>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Notice Title</label>
                        <input type="text" className="form-control" placeholder="Enter notice title" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Category</label>
                        <select className="form-select" required>
                          <option value="">Select Category</option>
                          <option value="Academic">Academic</option>
                          <option value="Events">Events</option>
                          <option value="Examinations">Examinations</option>
                          <option value="Holidays">Holidays</option>
                          <option value="General">General</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Priority</label>
                        <select className="form-select" required>
                          <option value="">Select Priority</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Target Audience</label>
                        <select className="form-select" multiple>
                          <option value="students">Students</option>
                          <option value="teachers">Teachers</option>
                          <option value="parents">Parents</option>
                          <option value="staff">Staff</option>
                          <option value="all">All</option>
                        </select>
                        <small className="text-muted">Hold Ctrl/Cmd to select multiple</small>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Notice Description</label>
                    <textarea className="form-control" rows={4} placeholder="Enter notice description" required></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Posted Date</label>
                        <input type="date" className="form-control" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Expiry Date</label>
                        <input type="date" className="form-control" />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Attachments</label>
                    <input type="file" className="form-control" multiple />
                    <small className="text-muted">Upload supporting documents (PDF, DOC, Images)</small>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary">Cancel</button>
                    <button type="button" className="btn btn-outline-primary">
                      <i className="ti ti-eye me-1"></i>Preview
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <i className="ti ti-send me-1"></i>Publish Notice
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Archive */}
          {selectedSection === 'archive' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Archived Notices</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Posted Date</th>
                        <th>Archived Date</th>
                        <th>Views</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={8} className="text-center text-muted">
                          No archived notices found.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNoticeBoardPage;
