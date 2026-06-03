import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../../api/client';
import { exportToPDF, exportToExcel } from '../../../utils/exportUtils';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  class?: string;
  classId?: { name?: string };
  email: string;
}

interface Fee {
  _id: string;
  studentName: string;
  feeType: string;
  amount: number;
  status: string;
  dueDate: string;
}

const FeeCollectionPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    studentId: '',
    feeType: 'Tuition',
    amount: '',
    dueDate: '',
    description: ''
  });

  useEffect(() => {
    fetchStudents();
    fetchFees();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await apiClient.get('/students/institution', {
        params: { limit: 200 }
      });
      console.debug('API /students/institution response:', response);
      if (response.data.success) {
        const payload = response.data.data;
        // Support both array response and object-with-students shape
        const list = Array.isArray(payload)
          ? payload
          : (payload && (payload.students || payload.data)) || [];
        setStudents(list);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    }
  };

  const fetchFees = async () => {
    try {
      const response = await apiClient.get('/fees');
      if (response.data.success) {
        setFees(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching fees:', error);
      toast.error('Failed to load fees');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await apiClient.post('/fees/create', {
        studentId: formData.studentId,
        feeType: formData.feeType,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate,
        description: formData.description,
        remarks: formData.description
      });

      if (response.data.success) {
        setMessage('Fee created successfully! Student will see it on their dashboard.');
        toast.success('Fee created and assigned to student');
        setFormData({
          studentId: '',
          feeType: 'Tuition',
          amount: '',
          dueDate: '',
          description: ''
        });
        fetchFees();
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message;
      setMessage('Error creating fee: ' + errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminders = async () => {
    const pendingIds = fees.filter((f) => f.status !== 'paid').map((f) => f._id);
    if (pendingIds.length === 0) {
      toast.info('No pending fees to remind');
      return;
    }
    try {
      await apiClient.post('/fees/reminders', { feeIds: pendingIds });
      toast.success(`Reminders sent for ${pendingIds.length} fee(s)`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reminders');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleExportPDF = () => {
    const data = fees.map(fee => ({
      Student: fee.studentName,
      'Fee Type': fee.feeType,
      Amount: fee.amount,
      'Due Date': new Date(fee.dueDate).toLocaleDateString(),
      Status: fee.status
    }));
    exportToPDF(data, 'fees-report', undefined, 'Fees Report');
  };

  const handleExportExcel = () => {
    const data = fees.map(fee => ({
      Student: fee.studentName,
      'Fee Type': fee.feeType,
      Amount: fee.amount,
      'Due Date': new Date(fee.dueDate).toLocaleDateString(),
      Status: fee.status
    }));
    exportToExcel(data, 'Fees Report');
  };

  const getStudentLabel = (student: Student) => {
    const className = student.classId?.name || student.class || '';
    return `${student.firstName} ${student.lastName} - ${student.rollNumber || 'N/A'}${className ? ` (Class ${className})` : ''}`;
  };

  return (
    <div className="container-fluid py-4">
      <h2>Fee Collection</h2>
      <p className="text-muted">Create tuition, hostel, transport and other fees — students pay via Razorpay from their dashboard</p>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="row">
        <div className="col-md-5">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Create New Fee</h5>
              <button type="button" className="btn btn-sm btn-outline-warning" onClick={handleSendReminders}>
                Send Reminders
              </button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Select Student</label>
                  <select
                    name="studentId"
                    className="form-select"
                    value={formData.studentId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Select Student --</option>
                    {students.map((student) => (
                      <option key={student._id} value={student._id}>
                        {getStudentLabel(student)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Fee Type</label>
                  <select
                    name="feeType"
                    className="form-select"
                    value={formData.feeType}
                    onChange={handleChange}
                    required
                  >
                    <option value="Tuition">Tuition Fee</option>
                    <option value="Examination">Examination Fee</option>
                    <option value="Library">Library Fee</option>
                    <option value="Transport">Transport Fee</option>
                    <option value="Hostel">Hostel Fee</option>
                    <option value="Sports">Sports Fee</option>
                    <option value="Lab">Lab Fee</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Amount (₹)</label>
                  <input
                    type="number"
                    name="amount"
                    className="form-control"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="Enter amount"
                    required
                    min="1"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    className="form-control"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    className="form-control"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Enter fee description"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Fee'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-7">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5>All Fees (Institution)</h5>
              <div>
                <button
                  className="btn btn-outline-success btn-sm me-2"
                  onClick={handleExportExcel}
                  disabled={fees.length === 0}
                >
                  Export Excel
                </button>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleExportPDF}
                  disabled={fees.length === 0}
                >
                  Export PDF
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Fee Type</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted">
                          No fees created yet
                        </td>
                      </tr>
                    ) : (
                      fees.map((fee) => (
                        <tr key={fee._id}>
                          <td>{fee.studentName}</td>
                          <td className="text-capitalize">{fee.feeType}</td>
                          <td>₹{fee.amount}</td>
                          <td>{new Date(fee.dueDate).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge ${
                              fee.status === 'paid' ? 'bg-success' :
                              fee.status === 'pending' ? 'bg-warning' : 'bg-danger'
                            }`}>
                              {fee.status}
                            </span>
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
      </div>
    </div>
  );
};

export default FeeCollectionPage;