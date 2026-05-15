import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface FeeRecord {
  _id: string;
  studentId: {
    _id: string;
    admissionNo: string;
    rollNo: string;
    firstName: string;
    lastName: string;
    class: string;
    section: string;
    profileImage?: string;
  };
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'overdue' | 'partial';
  feeType?: string;
  feeGroup?: string;
}

const CollectFeesPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<FeeRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    feesGroup: '',
    feesType: '',
    amount: '',
    collectionDate: new Date().toISOString().split('T')[0],
    paymentType: '',
    referenceNo: '',
    notes: ''
  });

  const exportToCSV = () => {
    if (!feeRecords.length) { toast.error('No data to export'); return; }
    const headers = ['Admission No', 'Student Name', 'Class', 'Amount', 'Paid', 'Remaining', 'Due Date', 'Status'];
    const rows = feeRecords.map(r => [
      r.studentId?.admissionNo || '', `${r.studentId?.firstName || ''} ${r.studentId?.lastName || ''}`,
      r.studentId?.class || '', r.amount, r.paidAmount, r.remainingAmount,
      r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '', r.status
    ].map(v => `"${v}"`).join(','));
    const blob = new Blob([headers.join(',') + '\n' + rows.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fees_collect_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Exported successfully');
  };

  const exportToPDF = () => {
    if (!feeRecords.length) { toast.error('No data to export'); return; }
    const content = `<html><head><style>
      body { font-family: Arial; padding: 20px; }
      h1 { text-align: center; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background: #4CAF50; color: white; }
    </style></head><body>
      <h1>Fees Collection Report</h1>
      <p>Generated: ${new Date().toLocaleDateString()}</p>
      <table>
        <tr><th>Student</th><th>Class</th><th>Amount</th><th>Paid</th><th>Status</th></tr>
        ${feeRecords.map(r => `<tr>
          <td>${r.studentId?.firstName} ${r.studentId?.lastName}</td>
          <td>${r.studentId?.class}</td>
          <td>₹${r.amount}</td>
          <td>₹${r.paidAmount}</td>
          <td>${r.status}</td>
        </tr>`).join('')}
      </table></body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(content); win.document.close(); win.print(); }
    toast.success('PDF generated');
  };

  useEffect(() => {
    fetchPendingFees();
  }, []);

  const fetchPendingFees = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/fees/pending');
      
      if (response.data.success && response.data.data) {
        setFeeRecords(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching pending fees:', err);
      setError(err.message || 'Failed to load fee records');
      toast.error('Failed to load fee records');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent) return;
    
    try {
      setSubmitting(true);
      
      const payload = {
        feeId: selectedStudent._id,
        studentId: selectedStudent.studentId._id,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentType,
        paymentDate: formData.collectionDate,
        referenceNo: formData.referenceNo,
        notes: formData.notes,
        feeGroup: formData.feesGroup,
        feeType: formData.feesType
      };
      
      const response = await apiClient.post('/fees/collect', payload);
      
      if (response.data.success) {
        toast.success('Fee collected successfully');
        setShowCollectModal(false);
        
        // Reset form
        setFormData({
          feesGroup: '',
          feesType: '',
          amount: '',
          collectionDate: new Date().toISOString().split('T')[0],
          paymentType: '',
          referenceNo: '',
          notes: ''
        });
        
        // Refresh the fee records
        fetchPendingFees();
      }
    } catch (err: any) {
      console.error('Error collecting fee:', err);
      toast.error(err.response?.data?.message || 'Failed to collect fee');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle collect fee button click
  const handleCollectFee = (record: FeeRecord) => {
    setSelectedStudent(record);
    setFormData({
      ...formData,
      amount: record.remainingAmount.toString(),
      feesGroup: record.feeGroup || '',
      feesType: record.feeType || ''
    });
    setShowCollectModal(true);
  };

  // Handle view details button click
  const handleViewDetails = (record: FeeRecord) => {
    navigate(`/student-fees/${record.studentId._id}`, { state: { student: record } });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        <i className="ti ti-alert-circle me-2" />
        {error}
        <button className="btn btn-sm btn-danger ms-3" onClick={fetchPendingFees}>
          <i className="ti ti-refresh me-1" />Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Collect Fees</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <a href="#!">Management</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Collect Fees</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              title="Refresh"
              onClick={fetchPendingFees}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon me-1" title="Print">
              <i className="ti ti-printer"></i>
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <button className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center" data-bs-toggle="dropdown">
              <i className="ti ti-file-export me-2"></i>Export
            </button>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <button className="dropdown-item rounded-1" onClick={exportToPDF}>
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item rounded-1" onClick={exportToCSV}>
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Fees List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Fees List</h4>
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
            <div className="dropdown mb-3 me-2">
              <button 
                className="btn btn-outline-light bg-white dropdown-toggle"
                data-bs-toggle="dropdown" 
                data-bs-auto-close="outside"
              >
                <i className="ti ti-filter me-2"></i>Filter
              </button>
              <div className="dropdown-menu drop-width">
                <form>
                  <div className="d-flex align-items-center border-bottom p-3">
                    <h4>Filter</h4>
                  </div>
                  <div className="p-3 border-bottom">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Admission No</label>
                          <select className="form-select">
                            <option>Select</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Roll No</label>
                          <select className="form-select">
                            <option>Select</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Student</label>
                          <select className="form-select">
                            <option>Select</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Class</label>
                          <select className="form-select">
                            <option>Select</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Section</label>
                          <select className="form-select">
                            <option>Select</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 d-flex align-items-center justify-content-end">
                    <button type="button" className="btn btn-light me-3">Reset</button>
                    <button type="submit" className="btn btn-primary">Apply</button>
                  </div>
                </form>
              </div>
            </div>
            
            <div className="dropdown mb-3">
              <button className="btn btn-outline-light bg-white dropdown-toggle" data-bs-toggle="dropdown">
                <i className="ti ti-sort-ascending-2 me-2"></i>Sort by A-Z
              </button>
              <ul className="dropdown-menu p-3">
                <li>
                  <a href="#!" className="dropdown-item rounded-1 active">
                    Ascending
                  </a>
                </li>
                <li>
                  <a href="#!" className="dropdown-item rounded-1">
                    Descending
                  </a>
                </li>
                <li>
                  <a href="#!" className="dropdown-item rounded-1">
                    Recently Viewed
                  </a>
                </li>
                <li>
                  <a href="#!" className="dropdown-item rounded-1">
                    Recently Added
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="card-body p-0 py-3">
          <div className="table-responsive">
            <table className="table datatable">
              <thead className="thead-light">
                <tr>
                  <th className="no-sort">
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="select-all"
                      />
                    </div>
                  </th>
                  <th>Adm No</th>
                  <th>Roll No</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {feeRecords.length > 0 ? (
                  feeRecords.map((record: any) => (
                    <tr key={record._id}>
                      <td>
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td><a href="#!" className="link-primary">{record.studentId?.admissionNo || 'N/A'}</a></td>
                      <td>{record.studentId?.rollNo || 'N/A'}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <a href="#!" className="avatar avatar-md me-2">
                            <img 
                              src={record.studentId?.profileImage || '/assets/img/students/student-01.jpg'} 
                              className="img-fluid rounded-circle" 
                              alt={`${record.studentId?.firstName} ${record.studentId?.lastName}`} 
                            />
                          </a>
                          <div>
                            <p className="text-dark mb-0">
                              {record.studentId?.firstName} {record.studentId?.lastName}
                            </p>
                            <span className="text-muted small">
                              {record.studentId?.class}, {record.studentId?.section}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{record.studentId?.class || 'N/A'}</td>
                      <td>{record.studentId?.section || 'N/A'}</td>
                      <td>₹{record.remainingAmount?.toLocaleString() || record.amount?.toLocaleString() || 0}</td>
                      <td>{record.dueDate ? new Date(record.dueDate).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <span className={`badge ${
                          record.status === 'paid' ? 'bg-success' : 
                          record.status === 'overdue' ? 'bg-danger' : 
                          record.status === 'partial' ? 'bg-warning' : 
                          'bg-secondary'
                        }`}>
                          {record.status?.charAt(0).toUpperCase() + record.status?.slice(1) || 'Unpaid'}
                        </span>
                      </td>
                      <td>
                        {record.status === 'paid' ? (
                          <button 
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => handleViewDetails(record)}
                          >
                            View Details
                          </button>
                        ) : (
                          <button 
                            className="btn btn-light btn-sm"
                            onClick={() => handleCollectFee(record)}
                          >
                            Collect Fees
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="text-center py-4">
                      <p className="text-muted mb-0">No pending fee records found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Collect Fees Modal */}
      {showCollectModal && selectedStudent && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <div className="d-flex align-items-center">
                  <h4 className="modal-title">Collect Fees</h4>
                  <span className="badge bg-primary ms-2">{selectedStudent.studentId?.admissionNo}</span>
                </div>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowCollectModal(false)}
                  disabled={submitting}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="bg-light p-3 rounded mb-4">
                    <div className="row align-items-center">
                      <div className="col-lg-3 col-md-6">
                        <div className="d-flex align-items-center mb-3">
                          <a href="#!" className="avatar avatar-md me-2">
                            <img 
                              src={selectedStudent.studentId?.profileImage || '/assets/img/students/student-01.jpg'} 
                              alt={`${selectedStudent.studentId?.firstName} ${selectedStudent.studentId?.lastName}`} 
                              className="rounded"
                            />
                          </a>
                          <div>
                            <a href="#!" className="text-dark fw-medium d-block">
                              {selectedStudent.studentId?.firstName} {selectedStudent.studentId?.lastName}
                            </a>
                            <span className="text-muted small">
                              {selectedStudent.studentId?.class}, {selectedStudent.studentId?.section}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-3 col-md-6">
                        <div className="mb-3">
                          <span className="text-muted small d-block">Total Outstanding</span>
                          <p className="mb-0 fw-medium">${selectedStudent.remainingAmount?.toLocaleString() || 0}</p>
                        </div>
                      </div>
                      <div className="col-lg-3 col-md-6">
                        <div className="mb-3">
                          <span className="text-muted small d-block">Last Date</span>
                          <p className="mb-0 fw-medium">
                            {selectedStudent.dueDate ? new Date(selectedStudent.dueDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="col-lg-3 col-md-6">
                        <div className="mb-3">
                          <span className={`badge ${
                            selectedStudent.status === 'paid' ? 'bg-success' : 
                            selectedStudent.status === 'overdue' ? 'bg-danger' : 
                            'bg-secondary'
                          }`}>
                            {selectedStudent.status?.charAt(0).toUpperCase() + selectedStudent.status?.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <label className="form-label">Fees Group</label>
                        <select 
                          className="form-select"
                          name="feesGroup"
                          value={formData.feesGroup}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          <option>Class 1 General</option>
                          <option>Monthly Fees</option>
                          <option>Admission-Fees</option>
                          <option>Class 1- I Installment</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <label className="form-label">Fees Type</label>
                        <select 
                          className="form-select"
                          name="feesType"
                          value={formData.feesType}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          <option>Tuition Fees</option>
                          <option>Monthly Fees</option>
                          <option>Admission Fees</option>
                          <option>Bus Fees</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <label className="form-label">Amount</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          placeholder="Enter Amount"
                          name="amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          required
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <label className="form-label">Collection Date</label>
                        <div className="input-group">
                          <input 
                            type="date" 
                            className="form-control" 
                            name="collectionDate"
                            value={formData.collectionDate}
                            onChange={handleInputChange}
                            required
                          />
                          <span className="input-group-text">
                            <i className="ti ti-calendar"></i>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <label className="form-label">Payment Type</label>
                        <select 
                          className="form-select"
                          name="paymentType"
                          value={formData.paymentType}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          <option>Cash</option>
                          <option>Credit Card</option>
                          <option>Debit Card</option>
                          <option>Bank Transfer</option>
                          <option>UPI</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <label className="form-label">Payment Reference No</label>
                        <input 
                          type="text" 
                          className="form-control"
                          placeholder="Enter Payment Reference No"
                          name="referenceNo"
                          value={formData.referenceNo}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="mb-0">
                        <label className="form-label">Notes</label>
                        <textarea 
                          rows={3} 
                          className="form-control" 
                          placeholder="Add Notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => setShowCollectModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : (
                      'Pay Fees'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CollectFeesPage;
