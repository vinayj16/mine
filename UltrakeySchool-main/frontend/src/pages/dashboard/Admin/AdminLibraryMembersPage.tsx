import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface LibraryMemberData {
  overview: {
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    newMembersThisMonth: number;
    studentMembers: number;
    teacherMembers: number;
    staffMembers: number;
  };
  members: {
    id: string;
    memberId: string;
    name: string;
    type: 'student' | 'teacher' | 'staff';
    grade?: string;
    department?: string;
    email: string;
    phone: string;
    joinDate: string;
    expiryDate: string;
    status: 'active' | 'inactive' | 'expired';
    booksIssued: number;
    booksOverdue: number;
    fineAmount: number;
  }[];
  memberTypes: {
    type: string;
    count: number;
    color: string;
  }[];
  monthlyTrend: {
    month: string;
    newMembers: number;
    activeMembers: number;
  }[];
}

const AdminLibraryMembersPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState<LibraryMemberData | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    memberType: 'student',
    name: '',
    email: '',
    phone: '',
    memberId: ''
  });

  useEffect(() => {
    fetchMemberData();
  }, [selectedType, searchTerm]);

  // Mock members storage
const [mockMembers, setMockMembers] = useState<LibraryMemberData['members']>([
    { 
      id: '1', 
      memberId: 'MEM-001',
      name: 'Test Student 1', 
      email: 'test1@test.com', 
      phone: '1234567890', 
      type: 'student', 
      status: 'active', 
      joinDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
      booksIssued: 0,
      booksOverdue: 0,
      fineAmount: 0
    }
  ]);
  
  const fetchMemberData = async () => {
    try {
      setLoading(true);
      // Use functional update pattern to get latest members
      setMemberData(_prev => {
        const currentMembers = mockMembers; // Get fresh ref
        return {
          overview: {
            totalMembers: currentMembers.length,
            activeMembers: currentMembers.filter(m => m.status === 'active').length,
            inactiveMembers: currentMembers.filter(m => m.status === 'inactive').length,
            newMembersThisMonth: 1,
            studentMembers: currentMembers.filter(m => m.type === 'student').length,
            teacherMembers: currentMembers.filter(m => m.type === 'teacher').length,
            staffMembers: currentMembers.filter(m => m.type === 'staff').length
          },
          members: currentMembers,
          memberTypes: [
            { type: 'Students', count: mockMembers.filter(m => m.type === 'student').length, color: '#3b82f6' },
            { type: 'Teachers', count: mockMembers.filter(m => m.type === 'teacher').length, color: '#10b981' },
            { type: 'Staff', count: mockMembers.filter(m => m.type === 'staff').length, color: '#f59e0b' }
          ],
          monthlyTrend: [
            { month: 'Jan', newMembers: 0, activeMembers: 0 },
            { month: 'Feb', newMembers: 0, activeMembers: 0 },
            { month: 'Mar', newMembers: 0, activeMembers: 0 },
            { month: 'Apr', newMembers: mockMembers.length, activeMembers: mockMembers.filter(m => m.status === 'active').length },
            { month: 'May', newMembers: 0, activeMembers: 0 },
            { month: 'Jun', newMembers: 0, activeMembers: 0 }
          ]
        };
      });
    } catch (error) {
      console.error('Error fetching library member data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    try {
      setSaving(true);
      console.log('Adding member with data:', formData);
      
      // Mock success
      const mockData = {
        success: true,
        data: {
          id: 'MEM-' + Date.now(),
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.memberType,
          status: 'active',
          membershipDate: new Date().toISOString()
        },
        message: 'Member added successfully'
      };
      
      // Add to mock members
      setMockMembers(prev => [...prev, {
        id: mockData.data.id,
        memberId: 'MEM-' + Date.now(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        type: formData.memberType as 'student' | 'teacher' | 'staff',
        status: 'active',
        joinDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
        booksIssued: 0,
        booksOverdue: 0,
        fineAmount: 0
      }]);
      
      console.log('Member added:', mockData);
      
      // Reset form
      setFormData({ memberType: 'student', name: '', email: '', phone: '', memberId: '' });
      
      // Switch back to overview  
      setSelectedSection('overview');
      
      // Force refresh after short delay
      setTimeout(() => {
        fetchMemberData();
        alert('Member added successfully!');
      }, 100);
    } catch (error: any) {
      console.error('Error adding member:', error);
      alert(error.message || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const filteredMembers = memberData?.members.filter(member => {
    const matchesType = selectedType === 'all' || member.type === selectedType;
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          member.memberId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  }) || [];

  const statusData = memberData ? [
    { name: 'Active', value: memberData.overview.activeMembers, color: '#10b981' },
    { name: 'Inactive', value: memberData.overview.inactiveMembers, color: '#ef4444' },
    { name: 'New This Month', value: memberData.overview.newMembersThisMonth, color: '#3b82f6' }
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
          <h3 className="page-title mb-1">Library Members</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">Library</li>
              <li className="breadcrumb-item active">Members</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchMemberData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary" onClick={handleAddMember}>
            <i className="ti ti-user-plus me-2"></i>Add Member
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
                  <h4 className="mb-1">{memberData?.overview.totalMembers}</h4>
                  <p className="mb-0">Total Members</p>
                  <small>All members</small>
                </div>
                <i className="ti ti-users fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{memberData?.overview.activeMembers}</h4>
                  <p className="mb-0">Active Members</p>
                  <small>Currently active</small>
                </div>
                <i className="ti ti-user-check fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{memberData?.overview.studentMembers}</h4>
                  <p className="mb-0">Student Members</p>
                  <strong>{memberData?.overview.teacherMembers}</strong> Teachers
                </div>
                <i className="ti ti-graduation-cap fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{memberData?.overview.newMembersThisMonth}</h4>
                  <p className="mb-0">New Members</p>
                  <small>This month</small>
                </div>
                <i className="ti ti-user-plus fs-24"></i>
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
              <h5 className="card-title">Member Sections</h5>
              <div className="nav flex-column nav-pills">
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'overview' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('overview')}
                >
                  <i className="ti ti-chart-pie me-2"></i>
                  Overview
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'members' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('members')}
                >
                  <i className="ti ti-list me-2"></i>
                  All Members
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'add' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('add')}
                >
                  <i className="ti ti-user-plus me-2"></i>
                  Add Member
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'expired' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('expired')}
                >
                  <i className="ti ti-clock me-2"></i>
                  Expired Cards
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'reports' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('reports')}
                >
                  <i className="ti ti-file-text me-2"></i>
                  Reports
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
                    <h5 className="card-title mb-0">Member Status</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : '0'}%`}
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
                    <h5 className="card-title mb-0">Member Types</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={memberData?.memberTypes || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
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
                    <h5 className="card-title mb-0">Monthly Member Trend</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={memberData?.monthlyTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="newMembers" fill="#10b981" />
                        <Bar dataKey="activeMembers" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Members */}
          {selectedSection === 'members' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">All Members</h5>
                <div className="d-flex gap-2">
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    placeholder="Search members..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <select 
                    className="form-select form-select-sm"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="student">Students</option>
                    <option value="teacher">Teachers</option>
                    <option value="staff">Staff</option>
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
                        <th>Member ID</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Grade/Department</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Join Date</th>
                        <th>Expiry Date</th>
                        <th>Books Issued</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="text-center text-muted">
                            No members found. Click "Add Member" to register your first library member.
                          </td>
                        </tr>
                      ) : (
                        filteredMembers.map((member) => (
                          <tr key={member.id}>
                            <td>
                              <span className="badge bg-primary">{member.memberId}</span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className={`avatar avatar-sm bg-${
                                  member.type === 'student' ? 'primary' :
                                  member.type === 'teacher' ? 'success' : 'warning'
                                } text-white rounded-circle me-2`}>
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                                {member.name}
                              </div>
                            </td>
                            <td>
                              <span className={`badge bg-${
                                member.type === 'student' ? 'primary' :
                                member.type === 'teacher' ? 'success' : 'warning'
                              }`}>
                                {member.type.charAt(0).toUpperCase() + member.type.slice(1)}
                              </span>
                            </td>
                            <td>{member.grade || member.department || '-'}</td>
                            <td>{member.email}</td>
                            <td>{member.phone}</td>
                            <td>{member.joinDate}</td>
                            <td>{member.expiryDate}</td>
                            <td>
                              <span className="badge bg-info">{member.booksIssued}</span>
                              {member.booksOverdue > 0 && (
                                <span className="badge bg-danger ms-1">{member.booksOverdue} Overdue</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${
                                member.status === 'active' ? 'bg-success' :
                                member.status === 'inactive' ? 'bg-warning' : 'bg-danger'
                              }`}>
                                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary" title="View Details">
                                  <i className="ti ti-eye"></i>
                                </button>
                                <button className="btn btn-outline-warning" title="Edit">
                                  <i className="ti ti-edit"></i>
                                </button>
                                <button className="btn btn-outline-info" title="Renew">
                                  <i className="ti ti-refresh"></i>
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

          {/* Add Member */}
          {selectedSection === 'add' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Add New Member</h5>
              </div>
              <div className="card-body">
                <form onSubmit={(e) => { e.preventDefault(); handleAddMember(); }}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Member Type</label>
                        <select 
                          className="form-select" 
                          required
                          value={formData.memberType}
                          onChange={(e) => handleInputChange('memberType', e.target.value)}
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="staff">Staff</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Member ID</label>
                        <input type="text" className="form-control" placeholder="Auto-generated" disabled />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Full Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Enter full name" 
                          required
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Email Address</label>
                        <input 
                          type="email" 
                          className="form-control" 
                          placeholder="Enter email address" 
                          required
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Phone Number</label>
                        <input 
                          type="tel" 
                          className="form-control" 
                          placeholder="Enter phone number" 
                          required
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Grade/Department</label>
                        <input type="text" className="form-control" placeholder="Enter grade or department" />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Join Date</label>
                        <input type="date" className="form-control" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Membership Expiry</label>
                        <input type="date" className="form-control" />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <textarea className="form-control" rows={3} placeholder="Enter address"></textarea>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      <i className="ti ti-user-plus me-1"></i>{saving ? 'Adding...' : 'Add Member'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Expired Cards */}
          {selectedSection === 'expired' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Expired Membership Cards</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Member ID</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Expiry Date</th>
                        <th>Days Expired</th>
                        <th>Books Issued</th>
                        <th>Fine Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={10} className="text-center text-muted">
                          No expired memberships found.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Reports */}
          {selectedSection === 'reports' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Member Reports</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-users fs-24 text-primary mb-2"></i>
                        <h6>Member List Report</h6>
                        <p className="text-muted small">Complete member directory</p>
                        <button className="btn btn-primary btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-calendar fs-24 text-success mb-2"></i>
                        <h6>Membership Report</h6>
                        <p className="text-muted small">Membership statistics</p>
                        <button className="btn btn-success btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-alert-circle fs-24 text-danger mb-2"></i>
                        <h6>Expired Members Report</h6>
                        <p className="text-muted small">Expired memberships</p>
                        <button className="btn btn-danger btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLibraryMembersPage;
