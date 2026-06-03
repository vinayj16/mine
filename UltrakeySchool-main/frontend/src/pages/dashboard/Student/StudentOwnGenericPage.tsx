import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import { getInstitutionId } from '../../../utils/auth';
import apiClient from '../../../api/client';
import uploadService from '../../../services/uploadService';

const PageTitle: Record<string, string> = {
  homework: 'My Homework',
  syllabus: 'My Syllabus',
  profile: 'My Profile',
  exams: 'My Exams',
  grades: 'My Grades',
  transport: 'My Transport',
};

const PageIcon: Record<string, string> = {
  homework: 'ti ti-book-2',
  syllabus: 'ti ti-file-text',
  profile: 'ti ti-user',
  exams: 'ti ti-pencil',
  grades: 'ti ti-star',
  transport: 'ti ti-bus',
};

const StudentOwnGenericPage: React.FC = () => {
  const location = useLocation();
  const pageKey = location.pathname.split('/').pop() || 'homework';
  const title = PageTitle[pageKey] || 'Student';
  const icon = PageIcon[pageKey] || 'ti ti-file';

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const institutionId = getInstitutionId();
        const profileRes = await apiClient.get('/students/me');
        const studentData = profileRes.data.data;
        setStudent(studentData);
        const studentId = studentData._id;

        // Helper to safely extract class ID - handles populated objects, ObjectIds, and raw strings
        const getClassId = (data: any): string | null => {
          if (!data || !data.classId) return null;
          const c = data.classId;
          // If it's an object (populated), extract _id or id
          if (typeof c === 'object') {
            return c._id || c.id || null;
          }
          // If it's a string or ObjectId, use toString
          return String(c);
        };

        switch (pageKey) {
          case 'homework': {
            const res = await apiClient.get('/homework', { params: { limit: 50 } });
            const allHomework: any[] = res.data.data?.homeworks || [];
            const classIdStr = getClassId(studentData);
            const filtered = allHomework.filter((h: any) => {
              const hc = h.classId;
              const hClassId = !hc ? null : typeof hc === 'object' ? (hc._id || hc.id || null) : String(hc);
              return hClassId === classIdStr;
            });
            setData(filtered);
            break;
          }
          case 'syllabus': {
            const scId = studentData.institutionId || institutionId;
            const clId = getClassId(studentData);
            if (scId && clId) {
              try {
                const res = await apiClient.get(`/syllabi/schools/${scId}/classes/${clId}/syllabi`);
                setData(res.data.data || []);
              } catch {
                setData([]);
              }
            }
            break;
          }
          case 'profile': {
            setData([studentData]);
            break;
          }
          case 'exams': {
            try {
              const res = await apiClient.get('/exams', { params: { limit: 20 } });
              const examsPayload = res.data.data;
              const allExams: any[] = examsPayload?.data || examsPayload?.exams || res.data.exams || [];
              setData(allExams);
            } catch {
              setData([]);
            }
            break;
          }
          case 'grades': {
            const currentYear = new Date().getFullYear();
            const acYear = `${currentYear}-${currentYear + 1}`;
            const res = await apiClient.get(`/students/${studentId}/results`, {
              params: { academicYear: acYear }
            });
            const results: any[] = res.data.data || [];
            setData(results);
            break;
          }
          case 'transport': {
            try {
              const res = await apiClient.get('/transport/assignments', {
                params: { studentId }
              });
              const assignments = res.data.data || [];
              setData(Array.isArray(assignments) ? assignments : [assignments]);
            } catch {
              try {
                const res = await apiClient.get(`/students/${studentId}/sidebar`);
                const sidebar = res.data.data;
                setStats(sidebar?.transport || null);
              } catch {
                setData([]);
              }
            }
            break;
          }
          default:
            setData([]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pageKey]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (pageKey) {
      case 'homework':
        return renderHomework();
      case 'syllabus':
        return renderSyllabus();
      case 'profile':
        return renderProfile();
      case 'exams':
        return renderExams();
      case 'grades':
        return renderGrades();
      case 'transport':
        return renderTransport();
      default:
        return null;
    }
  };

  const renderHomework = () => {
    const dueSoon = data.filter((h: any) => h.dueDate && new Date(h.dueDate) > new Date());
    const overdue = data.filter((h: any) => h.dueDate && new Date(h.dueDate) < new Date());
    return (
      <>
        <div className="row mb-3">
          <div className="col-sm-4">
            <div className="card">
              <div className="card-body text-center py-3">
                <h3 className="text-primary mb-1">{data.length}</h3>
                <small className="text-muted">Total Assignments</small>
              </div>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="card">
              <div className="card-body text-center py-3">
                <h3 className="text-success mb-1">{dueSoon.length}</h3>
                <small className="text-muted">Due Soon</small>
              </div>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="card">
              <div className="card-body text-center py-3">
                <h3 className="text-danger mb-1">{overdue.length}</h3>
                <small className="text-muted">Overdue</small>
              </div>
            </div>
          </div>
        </div>
        {data.length === 0 ? (
          <div className="card"><div className="card-body text-center py-4 text-muted">No homework assignments found.</div></div>
        ) : (
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead><tr><th>Subject</th><th>Title</th><th>Due Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.map((h: any, i: number) => {
                      const dueDate = h.dueDate ? new Date(h.dueDate) : null;
                      const isOverdue = dueDate && dueDate < new Date();
                      return (
                        <tr key={h._id || i}>
                          <td>{h.subjectName || 'N/A'}</td>
                          <td>{h.title}</td>
                          <td>{dueDate?.toLocaleDateString() || 'N/A'}</td>
                          <td><span className={`badge ${isOverdue ? 'bg-danger' : 'bg-success'}`}>{isOverdue ? 'Overdue' : 'Active'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderSyllabus = () => {
    if (!data || data.length === 0) {
      return (
        <div className="card"><div className="card-body text-center py-5 text-muted">
          <i className="ti ti-file-text fs-1 text-muted mb-3 d-block"></i>
          <h5>No syllabus data available</h5>
        </div></div>
      );
    }
    return (
      <div className="card">
        <div className="card-body">
          {data.map((s: any, i: number) => (
            <div key={s._id || i} className="mb-3 pb-3 border-bottom">
              <h6>{s.title || s.name || 'Syllabus'}</h6>
              <p className="text-muted mb-1">{s.description}</p>
              {s.topics && Array.isArray(s.topics) && (
                <div className="mt-2">
                  {s.topics.map((t: any, ti: number) => (
                    <span key={ti} className="badge bg-light text-dark me-1 mb-1">{t.name || t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warn('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warn('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadService.uploadProfileImage(file);
      if (result.success && result.file) {
        const imageUrl = result.file.url || result.file.secure_url || '';
        if (!imageUrl) {
          toast.error('Upload succeeded but no image URL was returned');
          return;
        }
        toast.success('Profile photo uploaded successfully');
        // Update local state so the photo shows immediately
        setData(prev => {
          const updated = [...prev];
          if (updated[0]) {
            updated[0] = { ...updated[0], avatar: imageUrl, photo: imageUrl };
          }
          return updated;
        });
      } else {
        toast.error(result.error || 'Failed to upload photo');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderProfile = () => {
    const s = data[0];
    if (!s) return null;
    const fields = [
      { label: 'Name', value: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() },
      { label: 'Email', value: s.email },
      { label: 'Phone', value: s.phone },
      { label: 'Admission No', value: s.admissionNumber },
      { label: 'Roll Number', value: s.rollNumber },
      { label: 'Class', value: s.classId?.name || s.className },
      { label: 'Section', value: s.section },
      { label: 'Status', value: s.status },
    ];
    return (
      <div className="card">
        <div className="card-body">
          <div className="text-center mb-4">
            <div
              className="avatar avatar-xxl mx-auto mb-3 position-relative"
              style={{width: '120px', height: '120px', cursor: 'pointer'}}
              onClick={() => fileInputRef.current?.click()}
              title="Click to upload photo"
            >
              {uploading && (
                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                  style={{background: 'rgba(0,0,0,0.4)', borderRadius: '50%', zIndex: 1}}>
                  <div className="spinner-border spinner-border-sm text-white" role="status">
                    <span className="visually-hidden">Uploading...</span>
                  </div>
                </div>
              )}
              {s.avatar || s.photo ? (
                <img src={s.avatar || s.photo} alt="Profile" className="rounded-circle" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              ) : (
                <div className="avatar-title rounded-circle bg-primary fs-1">
                  {(s.name || s.firstName || 'S').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-1"
                style={{width: '32px', height: '32px', border: '2px solid #fff'}}>
                <i className="ti ti-camera text-white" style={{fontSize: '14px', lineHeight: '26px'}}></i>
              </div>
            </div>
            <p className="text-muted small mb-0">Click on the photo to upload</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              style={{display: 'none'}}
              onChange={handlePhotoUpload}
            />
          </div>
          <table className="table">
            <tbody>
              {fields.filter(f => f.value).map((f, i) => (
                <tr key={i}><td className="fw-medium" style={{width: '180px'}}>{f.label}</td><td>{f.value}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderExams = () => {
    if (!data || data.length === 0) {
      return (
        <div className="card"><div className="card-body text-center py-5 text-muted">
          <i className="ti ti-pencil fs-1 text-muted mb-3 d-block"></i>
          <h5>No exam data available</h5>
        </div></div>
      );
    }
    return (
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead><tr><th>Exam Name</th><th>Term</th><th>Start Date</th><th>End Date</th><th>Status</th></tr></thead>
              <tbody>
                {data.map((e: any, i: number) => (
                  <tr key={e._id || i}>
                    <td>{e.name || e.examName}</td>
                    <td>{e.term || e.examType || 'N/A'}</td>
                    <td>{e.startDate ? new Date(e.startDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{e.endDate ? new Date(e.endDate).toLocaleDateString() : 'N/A'}</td>
                    <td><span className={`badge ${e.isActive ? 'bg-success' : 'bg-secondary'}`}>{e.isActive ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderGrades = () => {
    if (!data || data.length === 0) {
      return (
        <div className="card"><div className="card-body text-center py-5 text-muted">
          <i className="ti ti-star fs-1 text-muted mb-3 d-block"></i>
          <h5>No grades/results available</h5>
        </div></div>
      );
    }
    return (
      <>
        <div className="row mb-3">
          {data.map((r: any, i: number) => (
            <div className="col-md-6 mb-3" key={r._id || i}>
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">{r.term?.toUpperCase() || `Term ${i + 1}`} Examination</h6>
                  <span className={`badge ${r.percentage >= 75 ? 'bg-success' : r.percentage >= 60 ? 'bg-warning' : 'bg-danger'}`}>
                    {r.percentage}%
                  </span>
                </div>
                <div className="card-body">
                  <p className="mb-2">Overall Grade: <strong>{r.overallGrade || 'N/A'}</strong> | Rank: <strong>{r.rank || 'N/A'}</strong></p>
                  <div className="table-responsive">
                    <table className="table table-sm mb-0">
                      <thead><tr><th>Subject</th><th>Marks</th><th>Grade</th></tr></thead>
                      <tbody>
                        {(r.subjects || []).map((sub: any, si: number) => (
                          <tr key={si}>
                            <td>{sub.subjectName}</td>
                            <td>{sub.marksObtained}/{sub.totalMarks}</td>
                            <td><span className="badge bg-light text-dark">{sub.grade}</span></td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="fw-bold"><td>Total</td><td>{r.totalMarksObtained}/{r.totalMaxMarks}</td><td>{r.overallGrade}</td></tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderTransport = () => {
    if (stats) {
      return (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="ti ti-bus fs-1 text-primary mb-3 d-block"></i>
            <h5>Route: {stats.route || 'Not Assigned'}</h5>
            <p className="text-muted mb-1">Bus: {stats.busNumber || 'N/A'}</p>
            <p className="text-muted mb-1">Pickup: {stats.pickupPoint || 'N/A'}</p>
            <p className="text-muted">Time: {stats.pickupTime || 'N/A'}</p>
          </div>
        </div>
      );
    }
    if (data.length > 0) {
      const t = data[0];
      return (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="ti ti-bus fs-1 text-primary mb-3 d-block"></i>
            <h5>Route: {t.routeName || t.route || 'Assigned'}</h5>
            <p className="text-muted mb-1">Vehicle: {t.vehicleNumber || t.busNumber || 'N/A'}</p>
            <p className="text-muted mb-1">Pickup: {t.pickupPoint || 'Main Gate'}</p>
            <p className="text-muted">Time: {t.pickupTime || '07:30 AM'}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="card"><div className="card-body text-center py-5 text-muted">
        <i className="ti ti-bus fs-1 text-muted mb-3 d-block"></i>
        <h5>No transport assignment found</h5>
      </div></div>
    );
  };

  return (
    <div>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">{title}</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><a href="/dashboard/student">Dashboard</a></li>
              <li className="breadcrumb-item active" aria-current="page">{title}</li>
            </ol>
          </nav>
        </div>
      </div>

      {student && pageKey !== 'profile' && (
        <div className="card mb-3">
          <div className="card-body d-flex align-items-center">
            <i className={`${icon} fs-1 text-primary me-3`}></i>
            <div>
              <h6 className="mb-0">{student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student'}</h6>
              <small className="text-muted">{student.classId?.name || ''} {student.section || ''}</small>
            </div>
          </div>
        </div>
      )}

      {renderContent()}
    </div>
  );
};

export default StudentOwnGenericPage;
