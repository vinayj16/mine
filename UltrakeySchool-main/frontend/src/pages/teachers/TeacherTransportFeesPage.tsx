import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface TransportFee {
  _id: string;
  studentId: { _id: string; firstName: string; lastName: string; rollNumber?: string };
  amount: number;
  paidAmount: number;
  dueDate: string;
  paymentStatus: string;
  routeName?: string;
}

const TeacherTransportFeesPage = () => {
  const [transportFees, setTransportFees] = useState<TransportFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchTransportFees();
  }, []);

  const fetchTransportFees = async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const teacherId = userData?.id || userData?._id || '';

      const teacherRes = await apiClient.get(`/teachers/${teacherId}`);
      const teacherData = teacherRes.data?.data || teacherRes.data;
      const assignedClasses = teacherData?.classes || [];
      const classIds = assignedClasses
        .map((c: any) => c.classId?._id || c.classId?.toString())
        .filter(Boolean);

      if (classIds.length === 0) {
        setTransportFees([]);
        setLoading(false);
        return;
      }

      const studentsRes = await apiClient.get('/students', {
        params: { institutionId: userData.institutionId, limit: 500 }
      });
      const studentsData = studentsRes.data?.data || [];
      const studentsArray = Array.isArray(studentsData)
        ? studentsData
        : studentsData.students || studentsData.data || [];

      const myStudents = studentsArray.filter((s: any) => {
        const sid = s.classId?._id || s.classId?.toString() || s.class?.toString() || '';
        return classIds.includes(sid.toString());
      });

      const allFees: TransportFee[] = [];
      for (const student of myStudents) {
        const sid = student._id || student.id;
        if (!sid) continue;
        try {
          const feeRes = await apiClient.get(`/transport-fees/student/${sid}`);
          if (feeRes.data?.success) {
            const fees = Array.isArray(feeRes.data.data) ? feeRes.data.data : [];
            for (const fee of fees) {
              allFees.push({
                ...fee,
                studentId: fee.studentId || {
                  _id: sid,
                  firstName: student.firstName || student.name || 'Unknown',
                  lastName: student.lastName || '',
                  rollNumber: student.rollNumber || ''
                }
              });
            }
          }
        } catch {
          // no transport fees for this student
        }
      }

      setTransportFees(allFees);
    } catch (err: any) {
      console.error('Error fetching transport fees:', err);
      setError(err.message || 'Failed to load transport fees');
      toast.error('Failed to load transport fees');
    } finally {
      setLoading(false);
    }
  };

  const filteredFees = statusFilter
    ? transportFees.filter(f => f.paymentStatus === statusFilter)
    : transportFees;

  const totalDue = filteredFees.reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);
  const totalPaid = filteredFees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);

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
    <div>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Transport Fees</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item"><Link to="/dashboard/teacher">Teacher</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Transport Fees</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchTransportFees} title="Refresh">
            <i className="ti ti-refresh"></i>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted mb-1">Total Students with Transport</h6>
              <h3 className="mb-0">{transportFees.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted mb-1">Total Collected</h6>
              <h3 className="mb-0 text-success">Rs. {totalPaid.toLocaleString()}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted mb-1">Total Outstanding</h6>
              <h3 className="mb-0 text-danger">Rs. {totalDue.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Student Transport Fees</h4>
          <div className="d-flex align-items-center gap-2 mb-3">
            <select className="form-select form-select-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '150px' }}>
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
        <div className="card-body p-0 py-3">
          {filteredFees.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-car-off fs-1 text-muted mb-3"></i>
              <h5 className="mb-2">No Transport Fees Found</h5>
              <p className="text-muted mb-0">No transport fee records found for your students</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead className="thead-light">
                  <tr>
                    <th>Student</th>
                    <th>Roll No</th>
                    <th>Amount</th>
                    <th>Paid</th>
                    <th>Due</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFees.map((fee) => (
                    <tr key={fee._id}>
                      <td>
                        <Link to={`/dashboard/teacher/transport-fees/${fee.studentId?._id || fee._id}`} className="text-primary fw-medium">
                          {fee.studentId?.firstName} {fee.studentId?.lastName}
                        </Link>
                      </td>
                      <td>{fee.studentId?.rollNumber || '-'}</td>
                      <td>Rs. {(fee.amount || 0).toLocaleString()}</td>
                      <td className="text-success">Rs. {(fee.paidAmount || 0).toLocaleString()}</td>
                      <td className="text-danger">Rs. {((fee.amount || 0) - (fee.paidAmount || 0)).toLocaleString()}</td>
                      <td>{new Date(fee.dueDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${fee.paymentStatus === 'paid' ? 'bg-success' : fee.paymentStatus === 'partial' ? 'bg-warning text-dark' : fee.paymentStatus === 'overdue' ? 'bg-danger' : 'bg-secondary'}`}>
                          {fee.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="text-center mt-3">
        <Link to="/transport" className="btn btn-outline-primary">
          <i className="ti ti-car me-2"></i>Manage Transport Routes
        </Link>
      </div>
    </div>
  );
};

export default TeacherTransportFeesPage;
