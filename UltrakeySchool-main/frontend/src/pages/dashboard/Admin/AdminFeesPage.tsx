import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import apiClient from '../../../api/client';

interface FeesData {
  overview: {
    totalFees: number;
    collectedFees: number;
    pendingFees: number;
    overdueFees: number;
    collectionRate: number;
  };
  feeGroups: {
    tuition: number;
    transport: number;
    hostel: number;
    library: number;
    lab: number;
    other: number;
  };
  monthlyCollection: {
    month: string;
    amount: number;
    target: number;
  }[];
  recentTransactions: {
    id: string;
    studentName: string;
    amount: number;
    date: string;
    status: 'paid' | 'pending' | 'overdue';
    paymentMethod: string;
  }[];
}

const AdminFeesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [feesData, setFeesData] = useState<FeesData | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('overview');

  useEffect(() => {
    fetchFeesData();
  }, []);

  const fetchFeesData = async () => {
    try {
      setLoading(true);
      
      // Get schoolId from localStorage or use default
      const userStr = localStorage.getItem('user');
      const schoolId = userStr ? JSON.parse(userStr)?.schoolId || '507f1f77bcf86cd799439011' : '507f1f77bcf86cd799439011';
      
      const response = await apiClient.get('/fees', { params: { schoolId } });
      
      if (response.data?.data) {
        const fees = response.data.data;
        const totalFees = fees.reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
        const paidFees = fees.filter((f: any) => f.status === 'paid').reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
        const pendingFees = fees.filter((f: any) => f.status === 'pending').reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
        const overdueFees = fees.filter((f: any) => f.status === 'overdue').reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
        
        const typeGroups: Record<string, number> = {};
        fees.forEach((fee: any) => {
          const type = fee.feeType || 'other';
          typeGroups[type] = (typeGroups[type] || 0) + (fee.amount || 0);
        });
        
        setFeesData({
          overview: {
            totalFees,
            collectedFees: paidFees,
            pendingFees,
            overdueFees,
            collectionRate: totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 0
          },
          feeGroups: {
            tuition: typeGroups['tuition'] || 0,
            transport: typeGroups['transport'] || 0,
            hostel: typeGroups['hostel'] || 0,
            library: typeGroups['library'] || 0,
            lab: typeGroups['lab'] || 0,
            other: typeGroups['other'] || 0
          },
          monthlyCollection: [
            { month: 'Jan', amount: paidFees * 0.1, target: totalFees * 0.15 },
            { month: 'Feb', amount: paidFees * 0.15, target: totalFees * 0.15 },
            { month: 'Mar', amount: paidFees * 0.2, target: totalFees * 0.15 },
            { month: 'Apr', amount: paidFees * 0.15, target: totalFees * 0.15 },
            { month: 'May', amount: paidFees * 0.2, target: totalFees * 0.2 },
            { month: 'Jun', amount: paidFees * 0.2, target: totalFees * 0.2 }
          ],
          recentTransactions: fees.slice(0, 10).map((f: any) => ({
            id: f._id,
            studentName: f.studentId?.firstName + ' ' + f.studentId?.lastName || 'N/A',
            amount: f.amount || 0,
            date: f.dueDate || f.createdAt,
            status: f.status || 'pending',
            paymentMethod: f.paymentMethod || 'N/A'
          }))
        });
      }
    } catch (error) {
      console.error('Error fetching fees data:', error);
      setFeesData({
        overview: {
          totalFees: 0,
          collectedFees: 0,
          pendingFees: 0,
          overdueFees: 0,
          collectionRate: 0
        },
        feeGroups: {
          tuition: 0,
          transport: 0,
          hostel: 0,
          library: 0,
          lab: 0,
          other: 0
        },
        monthlyCollection: [
          { month: 'Jan', amount: 0, target: 0 },
          { month: 'Feb', amount: 0, target: 0 },
          { month: 'Mar', amount: 0, target: 0 },
          { month: 'Apr', amount: 0, target: 0 },
          { month: 'May', amount: 0, target: 0 },
          { month: 'Jun', amount: 0, target: 0 }
        ],
        recentTransactions: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const feeGroupsData = feesData ? [
    { name: 'Tuition', value: feesData.feeGroups.tuition, color: '#3b82f6' },
    { name: 'Transport', value: feesData.feeGroups.transport, color: '#10b981' },
    { name: 'Hostel', value: feesData.feeGroups.hostel, color: '#f59e0b' },
    { name: 'Library', value: feesData.feeGroups.library, color: '#8b5cf6' },
    { name: 'Lab', value: feesData.feeGroups.lab, color: '#ef4444' },
    { name: 'Other', value: feesData.feeGroups.other, color: '#6b7280' }
  ] : [];

  const collectionStatusData = feesData ? [
    { name: 'Collected', value: feesData.overview.collectedFees, color: '#10b981' },
    { name: 'Pending', value: feesData.overview.pendingFees, color: '#f59e0b' },
    { name: 'Overdue', value: feesData.overview.overdueFees, color: '#ef4444' }
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
          <h3 className="page-title mb-1">Fees Management</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item active">Fees</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchFeesData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary">
            <i className="ti ti-receipt me-2"></i>Collect Fees
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{formatCurrency(feesData?.overview.totalFees || 0)}</h4>
                  <p className="mb-0">Total Fees</p>
                  <small>This academic year</small>
                </div>
                <i className="ti ti-cash fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{formatCurrency(feesData?.overview.collectedFees || 0)}</h4>
                  <p className="mb-0">Collected</p>
                  <small>{feesData?.overview.collectionRate || 0}% rate</small>
                </div>
                <i className="ti ti-cash fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{formatCurrency(feesData?.overview.pendingFees || 0)}</h4>
                  <p className="mb-0">Pending</p>
                  <small>Awaiting payment</small>
                </div>
                <i className="ti ti-clock fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{formatCurrency(feesData?.overview.overdueFees || 0)}</h4>
                  <p className="mb-0">Overdue</p>
                  <small>Late payments</small>
                </div>
                <i className="ti ti-alert-circle fs-24"></i>
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
              <h5 className="card-title">Fees Sections</h5>
              <div className="nav flex-column nav-pills">
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'overview' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('overview')}
                >
                  <i className="ti ti-chart-pie me-2"></i>
                  Overview
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'groups' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('groups')}
                >
                  <i className="ti ti-list me-2"></i>
                  Fee Groups
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'collect' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('collect')}
                >
                  <i className="ti ti-cash me-2"></i>
                  Collect Fees
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'transactions' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('transactions')}
                >
                  <i className="ti ti-receipt me-2"></i>
                  Transactions
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'reports' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('reports')}
                >
                  <i className="ti ti-chart-bar me-2"></i>
                  Fee Reports
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'reminders' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('reminders')}
                >
                  <i className="ti ti-bell me-2"></i>
                  Reminders
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
                    <h5 className="card-title mb-0">Collection Status</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={collectionStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {collectionStatusData.map((entry, index) => (
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
                    <h5 className="card-title mb-0">Fee Groups Distribution</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={feeGroupsData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {feeGroupsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Monthly Collection Trend</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={feesData?.monthlyCollection || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="amount" fill="#10b981" />
                        <Bar dataKey="target" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fee Groups */}
          {selectedSection === 'groups' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Fee Groups</h5>
                <button className="btn btn-primary btn-sm">
                  <i className="ti ti-plus me-1"></i>Add Fee Group
                </button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Fee Group</th>
                        <th>Amount</th>
                        <th>Frequency</th>
                        <th>Students</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={6} className="text-center text-muted">
                          No fee groups configured yet. Click "Add Fee Group" to create your first fee group.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Collect Fees */}
          {selectedSection === 'collect' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Collect Fees</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Search Student</label>
                      <input type="text" className="form-control" placeholder="Enter student name or ID" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Select Class</label>
                      <select className="form-select">
                        <option value="">All Classes</option>
                        <option value="1">Grade 1</option>
                        <option value="2">Grade 2</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>
                          <input type="checkbox" className="form-check-input" />
                        </th>
                        <th>Student Name</th>
                        <th>Class</th>
                        <th>Pending Fees</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={7} className="text-center text-muted">
                          No pending fees found. All students are up to date with their payments.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Transactions */}
          {selectedSection === 'transactions' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Recent Transactions</h5>
                <button className="btn btn-primary btn-sm">
                  <i className="ti ti-download me-1"></i>Export
                </button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Student Name</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Payment Method</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={7} className="text-center text-muted">
                          No transactions found. Fee collection transactions will appear here once payments are made.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Fee Reports */}
          {selectedSection === 'reports' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Fee Reports</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-file-text fs-24 text-primary mb-2"></i>
                        <h6>Collection Report</h6>
                        <p className="text-muted small">Detailed fee collection analysis</p>
                        <button className="btn btn-primary btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-chart-bar fs-24 text-success mb-2"></i>
                        <h6>Monthly Report</h6>
                        <p className="text-muted small">Month-wise fee collection</p>
                        <button className="btn btn-success btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-user-check fs-24 text-warning mb-2"></i>
                        <h6>Student Wise Report</h6>
                        <p className="text-muted small">Individual fee status</p>
                        <button className="btn btn-warning btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reminders */}
          {selectedSection === 'reminders' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Fee Reminders</h5>
                <button className="btn btn-primary btn-sm">
                  <i className="ti ti-bell-plus me-1"></i>Send Reminder
                </button>
              </div>
              <div className="card-body">
                <p className="text-muted">Configure and send fee payment reminders to parents and students.</p>
                <div className="row">
                  <div className="col-md-6">
                    <div className="card border">
                      <div className="card-body">
                        <h6>Upcoming Due Dates</h6>
                        <p className="text-muted mb-0">No upcoming fee due dates found.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card border">
                      <div className="card-body">
                        <h6>Overdue Payments</h6>
                        <p className="text-muted mb-0">No overdue payments found.</p>
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

export default AdminFeesPage;
