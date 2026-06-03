import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'react-toastify';
import apiClient from '../../../api/client';
import { exportToPDF, exportToExcel, type ExportColumn } from '../../../utils/exportUtils';

interface StaffMember {
  _id: string;
  employeeId?: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  department?: string;
  designation?: string;
  joiningDate?: string;
  status?: string;
  role?: string;
}

const AdminStaffPage = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch from /users endpoint (users collection) filtered to staff roles
      const response = await apiClient.get('/users', { params: { limit: 200 } });

      if (response.data.success) {
        const allUsers = Array.isArray(response.data.data)
          ? response.data.data
          : response.data.data?.users || response.data?.users || [];
        // Filter to only show staff/staff_member roles
        const staffUsers = allUsers.filter((u: any) => {
          const role = (u.role || '').toLowerCase();
          return role === 'staff' || role === 'staff_member';
        });
        // Map users to StaffMember interface
        const mapped = staffUsers.map((u: any) => ({
          _id: u._id || u.id,
          employeeId: u.employeeId || '',
          name: u.name || u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown',
          email: u.email || '',
          phone: u.phone || '',
          avatar: u.avatar || '',
          department: u.department || 'General',
          designation: u.designation || '',
          joiningDate: u.joiningDate || u.createdAt || '',
          status: u.status || 'active',
          role: u.role || 'staff'
        }));
        setStaff(mapped);
      }
    } catch (err: any) {
      console.error('Error fetching staff:', err);
      const msg = err.response?.data?.message || 'Failed to load staff members';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Compute stats
  const stats = useMemo(() => {
    const total = staff.length;
    const active = staff.filter(s => s.status === 'active' || !s.status).length;
    const departments = new Map<string, number>();
    staff.forEach(s => {
      const dept = s.department || 'General';
      departments.set(dept, (departments.get(dept) || 0) + 1);
    });
    return { total, active, inactive: total - active, departments };
  }, [staff]);

  const departmentData = useMemo(() => {
    const deptCounts = new Map<string, number>();
    staff.forEach(s => {
      const d = s.department || 'General';
      deptCounts.set(d, (deptCounts.get(d) || 0) + 1);
    });
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    return Array.from(deptCounts.entries()).map(([name, count], i) => ({
      name,
      count,
      color: colors[i % colors.length]
    }));
  }, [staff]);

  const filteredStaff = useMemo(() => {
    return staff.filter(s => {
      const matchesDept = selectedDepartment === 'all' || (s.department || 'General') === selectedDepartment;
      const matchesSearch = !searchTerm ||
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.designation?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [staff, selectedDepartment, searchTerm]);

  const uniqueDepartments = useMemo(() => {
    const depts = new Set(staff.map(s => s.department || 'General'));
    return Array.from(depts).sort();
  }, [staff]);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportColumns: ExportColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'department', label: 'Department', format: (v) => v || 'General' },
    { key: 'designation', label: 'Designation', format: (v) => v || '-' },
    { key: 'status', label: 'Status', format: (v) => v || 'Active' },
    { key: 'joiningDate', label: 'Date of Join', format: (v) => v ? formatDate(v) : 'N/A' },
  ];

  const handleExport = (type: 'pdf' | 'excel') => {
    const data = filteredStaff;
    if (!data.length) { toast.error('No data to export'); return; }
    if (type === 'pdf') {
      exportToPDF(data, 'staff-list', exportColumns, 'Staff List');
    } else {
      exportToExcel(data, 'staff-list', exportColumns);
    }
  };

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
          <h3 className="page-title mb-1">Staff</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/admin">Dashboard</Link></li>
              <li className="breadcrumb-item active">Staff</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchStaff} title="Refresh">
            <i className="ti ti-refresh"></i>
          </button>
          <div className="dropdown me-2 mb-2">
            <button className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center" data-bs-toggle="dropdown">
              <i className="ti ti-file-export me-2"></i>Export
            </button>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <button className="dropdown-item rounded-1" onClick={() => handleExport('pdf')}>
                  <i className="ti ti-file-type-pdf me-2"></i>Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item rounded-1" onClick={() => handleExport('excel')}>
                  <i className="ti ti-file-type-xls me-2"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          <i className="ti ti-alert-circle me-2"></i>{error}
          <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchStaff}>
            <i className="ti ti-refresh me-1"></i>Retry
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-xl-4 col-md-4">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{stats.total}</h4>
                  <p className="mb-0">Total Staff</p>
                  <small>All registered staff</small>
                </div>
                <i className="ti ti-users fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-4">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{stats.active}</h4>
                  <p className="mb-0">Active Staff</p>
                  <small>Currently active</small>
                </div>
                <i className="ti ti-user-check fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-4">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{stats.departments.size}</h4>
                  <p className="mb-0">Departments</p>
                  <small>Unique departments</small>
                </div>
                <i className="ti ti-building fs-24"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {departmentData.length > 0 && (
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Staff by Department</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, count }) => `${name}: ${count}`}
                      outerRadius={80}
                      dataKey="count"
                    >
                      {departmentData.map((entry, index) => (
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
                <h5 className="card-title mb-0">Department Distribution</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={departmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff List */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="card-title mb-0">Staff List</h5>
          <div className="d-flex gap-2 flex-wrap">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search staff..."
              style={{ width: '200px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="form-select form-select-sm"
              style={{ width: '150px' }}
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="all">All Departments</option>
              {uniqueDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="thead-light">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Date of Join</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      {searchTerm || selectedDepartment !== 'all'
                        ? 'No staff match your search criteria.'
                        : 'No staff members found.'}
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((member) => (
                    <tr key={member._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm bg-primary text-white rounded-circle me-2 d-flex align-items-center justify-content-center">
                            {member.name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div>
                            <span className="fw-medium">{member.name}</span>
                            {member.employeeId && (
                              <small className="d-block text-muted">ID: {member.employeeId}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{member.email}</td>
                      <td>{member.department || 'General'}</td>
                      <td>{member.designation || '-'}</td>
                      <td>{member.phone || '-'}</td>
                      <td>
                        <span className={`badge ${(member.status === 'active' || !member.status) ? 'bg-success' : 'bg-danger'}`}>
                          {member.status || 'Active'}
                        </span>
                      </td>
                      <td>{formatDate(member.joiningDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer text-muted small">
          Showing {filteredStaff.length} of {staff.length} staff members
        </div>
      </div>
    </div>
  );
};

export default AdminStaffPage;
