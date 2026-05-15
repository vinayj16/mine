import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface FeesReportData {
  overview: {
    totalFees: number;
    collectedFees: number;
    pendingFees: number;
    overdueFees: number;
    collectionRate: number;
    thisMonthCollection: number;
  };
  feeCollection: {
    month: string;
    collected: number;
    pending: number;
    overdue: number;
    total: number;
  }[];
  classWiseFees: {
    className: string;
    totalFees: number;
    collectedFees: number;
    pendingFees: number;
    collectionRate: number;
  }[];
  feeTypeDistribution: {
    feeType: string;
    amount: number;
    students: number;
    collectionRate: number;
  }[];
  paymentMethods: {
    method: string;
    amount: number;
    percentage: number;
  }[];
  overdueStudents: {
    studentName: string;
    className: string;
    totalFees: number;
    paidAmount: number;
    pendingAmount: number;
    overdueDays: number;
  }[];
}

const AdminFeesReportPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<FeesReportData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedFeeType, setSelectedFeeType] = useState<string>('all');

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod, selectedClass, selectedFeeType]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Set sample data for now
      setReportData({
        overview: {
          totalFees: 0,
          collectedFees: 0,
          pendingFees: 0,
          overdueFees: 0,
          collectionRate: 0,
          thisMonthCollection: 0
        },
        feeCollection: [
          { month: 'Jan', collected: 0, pending: 0, overdue: 0, total: 0 },
          { month: 'Feb', collected: 0, pending: 0, overdue: 0, total: 0 },
          { month: 'Mar', collected: 0, pending: 0, overdue: 0, total: 0 },
          { month: 'Apr', collected: 0, pending: 0, overdue: 0, total: 0 },
          { month: 'May', collected: 0, pending: 0, overdue: 0, total: 0 },
          { month: 'Jun', collected: 0, pending: 0, overdue: 0, total: 0 }
        ],
        classWiseFees: [
          { className: 'Grade 1-A', totalFees: 0, collectedFees: 0, pendingFees: 0, collectionRate: 0 },
          { className: 'Grade 2-A', totalFees: 0, collectedFees: 0, pendingFees: 0, collectionRate: 0 },
          { className: 'Grade 3-A', totalFees: 0, collectedFees: 0, pendingFees: 0, collectionRate: 0 },
          { className: 'Grade 4-A', totalFees: 0, collectedFees: 0, pendingFees: 0, collectionRate: 0 },
          { className: 'Grade 5-A', totalFees: 0, collectedFees: 0, pendingFees: 0, collectionRate: 0 }
        ],
        feeTypeDistribution: [
          { feeType: 'Tuition Fee', amount: 0, students: 0, collectionRate: 0 },
          { feeType: 'Transport Fee', amount: 0, students: 0, collectionRate: 0 },
          { feeType: 'Library Fee', amount: 0, students: 0, collectionRate: 0 },
          { feeType: 'Lab Fee', amount: 0, students: 0, collectionRate: 0 },
          { feeType: 'Exam Fee', amount: 0, students: 0, collectionRate: 0 }
        ],
        paymentMethods: [
          { method: 'Cash', amount: 0, percentage: 0 },
          { method: 'Bank Transfer', amount: 0, percentage: 0 },
          { method: 'Credit Card', amount: 0, percentage: 0 },
          { method: 'Online Payment', amount: 0, percentage: 0 }
        ],
        overdueStudents: []
      });
    } catch (error) {
      console.error('Error fetching fees report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const collectionStatusData = reportData ? [
    { name: 'Collected', value: reportData.overview.collectedFees, color: '#10b981' },
    { name: 'Pending', value: reportData.overview.pendingFees, color: '#f59e0b' },
    { name: 'Overdue', value: reportData.overview.overdueFees, color: '#ef4444' }
  ] : [];

  const handleExportReport = () => {
    // Handle export logic
    console.log('Exporting fees report...');
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
          <h3 className="page-title mb-1">Fees Report</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">Reports</li>
              <li className="breadcrumb-item active">Fees Report</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchReportData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary" onClick={handleExportReport}>
            <i className="ti ti-download me-2"></i>Export Report
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">₹{reportData?.overview.collectedFees.toLocaleString()}</h4>
                  <p className="mb-0">Collected Fees</p>
                  <small>Total collected</small>
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
                  <h4 className="mb-1">₹{reportData?.overview.pendingFees.toLocaleString()}</h4>
                  <p className="mb-0">Pending Fees</p>
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
                  <h4 className="mb-1">₹{reportData?.overview.overdueFees.toLocaleString()}</h4>
                  <p className="mb-0">Overdue Fees</p>
                  <small>Payment overdue</small>
                </div>
                <i className="ti ti-alert-circle fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{reportData?.overview.collectionRate}%</h4>
                  <p className="mb-0">Collection Rate</p>
                  <small>Overall rate</small>
                </div>
                <i className="ti ti-chart-pie fs-24"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-3">
              <label className="form-label">Period</label>
              <select 
                className="form-select"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Class</label>
              <select 
                className="form-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="all">All Classes</option>
                <option value="grade1">Grade 1</option>
                <option value="grade2">Grade 2</option>
                <option value="grade3">Grade 3</option>
                <option value="grade4">Grade 4</option>
                <option value="grade5">Grade 5</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Fee Type</label>
              <select 
                className="form-select"
                value={selectedFeeType}
                onChange={(e) => setSelectedFeeType(e.target.value)}
              >
                <option value="all">All Fee Types</option>
                <option value="tuition">Tuition Fee</option>
                <option value="transport">Transport Fee</option>
                <option value="library">Library Fee</option>
                <option value="lab">Lab Fee</option>
                <option value="exam">Exam Fee</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">&nbsp;</label>
              <button className="btn btn-primary w-100">Apply Filters</button>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="row mb-4">
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
                    label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}
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
              <h5 className="card-title mb-0">Monthly Collection Trend</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={reportData?.feeCollection || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="overdue" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Class-wise Fees */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title mb-0">Class-wise Fee Collection</h5>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData?.classWiseFees || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="className" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalFees" fill="#3b82f6" />
              <Bar dataKey="collectedFees" fill="#10b981" />
              <Bar dataKey="pendingFees" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fee Type Distribution */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title mb-0">Fee Type Distribution</h5>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData?.feeTypeDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="feeType" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title mb-0">Payment Methods</h5>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData?.paymentMethods || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="amount"
              >
                {reportData?.paymentMethods.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Overdue Students */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Overdue Students</h5>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-warning btn-sm">
              <i className="ti ti-bell me-1"></i>Send Reminders
            </button>
            <button className="btn btn-outline-primary btn-sm">
              <i className="ti ti-download me-1"></i>Export List
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Total Fees</th>
                  <th>Paid Amount</th>
                  <th>Pending Amount</th>
                  <th>Overdue Days</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reportData?.overdueStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted">
                      No overdue students found. All fees are up to date.
                    </td>
                  </tr>
                ) : (
                  reportData?.overdueStudents.map((student, index) => (
                    <tr key={index}>
                      <td>{student.studentName}</td>
                      <td>{student.className}</td>
                      <td>₹{student.totalFees.toLocaleString()}</td>
                      <td>
                        <span className="badge bg-success">₹{student.paidAmount.toLocaleString()}</span>
                      </td>
                      <td>
                        <span className="badge bg-warning">₹{student.pendingAmount.toLocaleString()}</span>
                      </td>
                      <td>
                        <span className="badge bg-danger">{student.overdueDays} days</span>
                      </td>
                      <td>
                        <span className="badge bg-danger">Overdue</span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-primary" title="Send Reminder">
                            <i className="ti ti-bell"></i>
                          </button>
                          <button className="btn btn-outline-info" title="View Details">
                            <i className="ti ti-eye"></i>
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
    </div>
  );
};

export default AdminFeesReportPage;
