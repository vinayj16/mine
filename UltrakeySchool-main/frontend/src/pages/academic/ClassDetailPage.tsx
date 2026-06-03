import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';
import { getInstitutionId } from '../../utils/auth';

interface ClassData {
  _id: string;
  name: string;
  section?: string;
  classTeacher?: { _id: string; name: string; email: string };
  studentCount?: number;
  subjectCount?: number;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  admissionNumber?: string;
  rollNumber?: string;
  userId?: { _id: string; name: string; email: string; avatar: string; phone: string };
}

interface Subject {
  _id: string;
  name: string;
  code?: string;
  type?: string;
}

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId?: string;
  department?: string;
  userId?: { _id: string; name: string; email: string; avatar: string };
}

interface ClassOverview {
  class: ClassData;
  students: Student[];
  subjects: Subject[];
  teachers: Teacher[];
}

const ClassDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [overview, setOverview] = useState<ClassOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'subjects'>('students');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (id) fetchOverview();
  }, [id]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/classes/${id}/overview`, {
        params: { institutionId: getInstitutionId() }
      });
      if (res.data.success) setOverview(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load class overview');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = (overview?.students || []).filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${s.firstName} ${s.lastName}`.toLowerCase();
    return name.includes(q) || s.admissionNumber?.toLowerCase().includes(q) || s.userId?.name?.toLowerCase().includes(q);
  });

  const filteredTeachers = (overview?.teachers || []).filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) || t.employeeId?.toLowerCase().includes(q) || t.userId?.name?.toLowerCase().includes(q);
  });

  const filteredSubjects = (overview?.subjects || []).filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q);
  });

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  }

  if (!overview?.class) {
    return <div className="text-center py-5 text-muted">Class not found</div>;
  }

  const { class: cls } = overview;

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">{cls.name} {cls.section || ''}</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item"><Link to="/academic/classes">Classes</Link></li>
              <li className="breadcrumb-item active" aria-current="page">{cls.name} {cls.section || ''}</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #0d6efd' }}>
            <div className="card-body text-center py-4">
              <i className="ti ti-users fs-1 text-primary mb-2"></i>
              <h3 className="mb-0">{overview.students.length}</h3>
              <small className="text-muted">Students</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #198754' }}>
            <div className="card-body text-center py-4">
              <i className="ti ti-book fs-1 text-success mb-2"></i>
              <h3 className="mb-0">{overview.subjects.length}</h3>
              <small className="text-muted">Subjects</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #ffc107' }}>
            <div className="card-body text-center py-4">
              <i className="ti ti-school fs-1 text-warning mb-2"></i>
              <h3 className="mb-0">{overview.teachers.length}</h3>
              <small className="text-muted">Teachers</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #dc3545' }}>
            <div className="card-body text-center py-4">
              <i className="ti ti-calendar fs-1 text-danger mb-2"></i>
              <h3 className="mb-0">{cls.classTeacher?.name || 'N/A'}</h3>
              <small className="text-muted">Class Teacher</small>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <ul className="nav nav-tabs card-header-tabs border-0">
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
                <i className="ti ti-users me-1"></i>Students ({overview.students.length})
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'teachers' ? 'active' : ''}`} onClick={() => setActiveTab('teachers')}>
                <i className="ti ti-school me-1"></i>Teachers ({overview.teachers.length})
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'subjects' ? 'active' : ''}`} onClick={() => setActiveTab('subjects')}>
                <i className="ti ti-book me-1"></i>Subjects ({overview.subjects.length})
              </button>
            </li>
          </ul>
          <input
            type="text"
            className="form-control form-control-sm w-auto"
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ minWidth: '200px' }}
          />
        </div>
        <div className="card-body p-0">
          {activeTab === 'students' && (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Admission No.</th>
                    <th>Roll No.</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-4 text-muted">No students found</td></tr>
                  ) : filteredStudents.map((s, i) => (
                    <tr key={s._id}>
                      <td>{i + 1}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="avatar avatar-sm me-2" style={{ background: '#0d6efd', color: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                            {(s.userId?.name || `${s.firstName} ${s.lastName}`).charAt(0).toUpperCase()}
                          </span>
                          <Link to={`/students/details/${s._id}`} className="text-decoration-none fw-medium">
                            {s.userId?.name || `${s.firstName} ${s.lastName}`}
                          </Link>
                        </div>
                      </td>
                      <td>{s.admissionNumber || '-'}</td>
                      <td>{s.rollNumber || '-'}</td>
                      <td>{s.userId?.email || '-'}</td>
                      <td>{s.userId?.phone || '-'}</td>
                      <td>
                        <Link to={`/students/details/${s._id}`} className="btn btn-sm btn-outline-primary">
                          <i className="ti ti-eye"></i>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'teachers' && (
            <div className="row g-3 p-3">
              {filteredTeachers.length === 0 ? (
                <div className="col-12 text-center py-4 text-muted">No teachers assigned</div>
              ) : filteredTeachers.map(t => (
                <div className="col-md-4 col-lg-3" key={t._id}>
                  <div className="card border h-100">
                    <div className="card-body text-center py-4">
                      <span className="avatar avatar-lg mb-3 d-inline-flex align-items-center justify-content-center rounded-circle bg-warning text-white" style={{ width: 56, height: 56, fontSize: 20 }}>
                        {(t.userId?.name || `${t.firstName} ${t.lastName}`).charAt(0).toUpperCase()}
                      </span>
                      <h6 className="mb-1">{t.userId?.name || `${t.firstName} ${t.lastName}`}</h6>
                      <small className="text-muted d-block">{t.employeeId || 'N/A'}</small>
                      {t.department && <small className="text-muted d-block">{t.department}</small>}
                      <div className="mt-2">
                        <span className="badge bg-light text-dark">{t.userId?.email || ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'subjects' && (
            <div className="row g-3 p-3">
              {filteredSubjects.length === 0 ? (
                <div className="col-12 text-center py-4 text-muted">No subjects assigned</div>
              ) : filteredSubjects.map(s => (
                <div className="col-md-3 col-sm-4" key={s._id}>
                  <div className="card border h-100">
                    <div className="card-body text-center py-4">
                      <span className={`avatar avatar-md mb-3 d-inline-flex align-items-center justify-content-center rounded-circle ${s.type === 'lab' ? 'bg-success' : 'bg-info'} text-white`} style={{ width: 48, height: 48, fontSize: 18 }}>
                        <i className={`ti ${s.type === 'lab' ? 'ti-flask' : 'ti-book'}`}></i>
                      </span>
                      <h6 className="mb-1">{s.name}</h6>
                      {s.code && <small className="text-muted d-block">{s.code}</small>}
                      {s.type && <span className="badge bg-secondary mt-2">{s.type}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ClassDetailPage;
