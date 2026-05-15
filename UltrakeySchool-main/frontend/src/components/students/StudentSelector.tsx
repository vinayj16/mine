import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  admissionNumber: string;
  classId?: {
    name: string;
  };
  avatar?: string;
}

interface StudentSelectorProps {
  onSelect?: (student: Student) => void;
  redirectPath?: string;
  title?: string;
  description?: string;
}

const StudentSelector: React.FC<StudentSelectorProps> = ({
  onSelect,
  redirectPath = '',
  title = 'Select a Student',
  description = 'Please select a student to view their details'
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/students', {
        params: { limit: 100, status: 'active' }
      });
      if (response.data.success) {
        setStudents(response.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading students...</span>
          </div>
          <p className="mt-2 text-muted">Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
          <h4 className="mb-3">{error}</h4>
          <button className="btn btn-primary" onClick={fetchStudents}>
            <i className="ti ti-refresh me-2"></i>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h4 className="mb-0">{title}</h4>
        <p className="text-muted mb-0 small">{description}</p>
      </div>
      <div className="card-body">
        <div className="mb-4">
          <div className="input-group">
            <span className="input-group-text"><i className="ti ti-search"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, student ID, or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-5">
            <i className="ti ti-users-off fs-1 text-muted mb-3"></i>
            <h5>No students found</h5>
            <p className="text-muted">
              {searchTerm ? 'Try adjusting your search' : 'No students available'}
            </p>
          </div>
        ) : (
          <div className="row g-3">
            {filteredStudents.map((student) => (
              <div key={student._id} className="col-md-6 col-xl-4">
                {onSelect ? (
                  <div
                    className="card h-100 cursor-pointer hover-shadow"
                    onClick={() => onSelect(student)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-body d-flex align-items-center">
                      <img
                        src={student.avatar || `https://ui-avatars.com/api/?name=${student.firstName}+${student.lastName}&background=random`}
                        alt=""
                        className="rounded-circle me-3"
                        width="50"
                        height="50"
                      />
                      <div>
                        <h6 className="mb-1">{student.firstName} {student.lastName}</h6>
                        <p className="mb-0 text-muted small">
                          ID: {student.studentId}<br/>
                          Class: {student.classId?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    to={`${redirectPath}/${student._id}`}
                    className="card h-100 text-decoration-none hover-shadow"
                  >
                    <div className="card-body d-flex align-items-center">
                      <img
                        src={student.avatar || `https://ui-avatars.com/api/?name=${student.firstName}+${student.lastName}&background=random`}
                        alt=""
                        className="rounded-circle me-3"
                        width="50"
                        height="50"
                      />
                      <div>
                        <h6 className="mb-1 text-dark">{student.firstName} {student.lastName}</h6>
                        <p className="mb-0 text-muted small">
                          ID: {student.studentId}<br/>
                          Class: {student.classId?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSelector;
