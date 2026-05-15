import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { exportToPDF, exportToExcel } from '../../../utils/exportUtils';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  class: string;
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

  // Form state
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
      const response = await axios.get('/api/v1/students');
      if (response.data.success) {
        setStudents(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchFees = async () => {
    try {
      const response = await axios.get('/api/v1/fees');
      if (response.data.success) {
        setFees(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching fees:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post('/api/v1/fees/create', {
        studentId: formData.studentId,
        feeType: formData.feeType,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate,
        description: formData.description
      });

      if (response.data.success) {
        setMessage('Fee created successfully! Student will be notified.');
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
      setMessage('Error creating fee: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
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
    exportToPDF(data, 'Fees Report');
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

  return (
    <div className="container-fluid py-4">
      <h2>Fee Collection</h2>
      <p className="text-muted">Create fees that will appear in student dashboard for payment</p>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="row">
        <div className="col-md-5">
          <div className="card">
            <div className="card-header">
              <h5>Create New Fee</h5>
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
                        {student.firstName} {student.lastName} - {student.rollNumber} (Class {student.class})
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
              <h5>All Fees</h5>
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
                          <td>{fee.feeType}</td>
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
