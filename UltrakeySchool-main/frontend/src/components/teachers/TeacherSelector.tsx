import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  departmentId?: {
    name: string;
  };
  designation?: {
    name: string;
  };
  avatar?: string;
}

interface TeacherSelectorProps {
  onSelect?: (teacher: Teacher) => void;
  redirectPath?: string;
  title?: string;
  description?: string;
}

const TeacherSelector: React.FC<TeacherSelectorProps> = ({
  onSelect,
  redirectPath = '',
  title = 'Select a Teacher',
  description = 'Please select a teacher to view their details'
}) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/teachers', {
        params: { limit: 100, status: 'active' }
      });
      if (response.data.success) {
        setTeachers(response.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading teachers...</span>
          </div>
          <p className="mt-2 text-muted">Loading teachers...</p>
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
          <button className="btn btn-primary" onClick={fetchTeachers}>
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
              placeholder="Search by name, employee ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredTeachers.length === 0 ? (
          <div className="text-center py-5">
            <i className="ti ti-users-off fs-1 text-muted mb-3"></i>
            <h5>No teachers found</h5>
            <p className="text-muted">
              {searchTerm ? 'Try adjusting your search' : 'No teachers available'}
            </p>
          </div>
        ) : (
          <div className="row g-3">
            {filteredTeachers.map((teacher) => (
              <div key={teacher._id} className="col-md-6 col-xl-4">
                {onSelect ? (
                  <div
                    className="card h-100 cursor-pointer hover-shadow"
                    onClick={() => onSelect(teacher)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-body d-flex align-items-center">
                      <img
                        src={teacher.avatar || `https://ui-avatars.com/api/?name=${teacher.firstName}+${teacher.lastName}&background=random`}
                        alt=""
                        className="rounded-circle me-3"
                        width="50"
                        height="50"
                      />
                      <div>
                        <h6 className="mb-1">{teacher.firstName} {teacher.lastName}</h6>
                        <p className="mb-0 text-muted small">
                          ID: {teacher.employeeId}<br/>
                          Dept: {teacher.departmentId?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    to={`${redirectPath}/${teacher._id}`}
                    className="card h-100 text-decoration-none hover-shadow"
                  >
                    <div className="card-body d-flex align-items-center">
                      <img
                        src={teacher.avatar || `https://ui-avatars.com/api/?name=${teacher.firstName}+${teacher.lastName}&background=random`}
                        alt=""
                        className="rounded-circle me-3"
                        width="50"
                        height="50"
                      />
                      <div>
                        <h6 className="mb-1 text-dark">{teacher.firstName} {teacher.lastName}</h6>
                        <p className="mb-0 text-muted small">
                          ID: {teacher.employeeId}<br/>
                          Dept: {teacher.departmentId?.name || 'N/A'}
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

export default TeacherSelector;
