import React, { useState, useEffect} from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '../../../api/client';

interface AcademicData {
  classes: {
    total: number;
    active: number;
    sections: number;
  };
  subjects: {
    total: number;
    core: number;
    elective: number;
  };
  syllabus: {
    completed: number;
    total: number;
    pending: number;
  };
  teachers: {
    total: number;
    assigned: number;
    unassigned: number;
  };
  classList: Array<{
    _id: string;
    name: string;
    sectionCount: number;
    studentCount: number;
  }>;
  subjectList: Array<{
    _id: string;
    name: string;
    code: string;
    className: string;
    teacherName: string;
  }>;
}

const AdminAcademicPage: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [academicData, setAcademicData] = useState<AcademicData | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('classes');

  // Set section based on current route path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/subjects')) setSelectedSection('subjects');
    else if (path.includes('/classroom')) setSelectedSection('classroom');
    else if (path.includes('/class-routine')) setSelectedSection('routine');
    else if (path.includes('/homework')) setSelectedSection('homework');
    else if (path.includes('/syllabus')) setSelectedSection('syllabus');
    else if (path.includes('/sections')) setSelectedSection('sections');
    else if (path.includes('/timetable')) setSelectedSection('timetable');
    else setSelectedSection('classes');
  }, [location]);

  useEffect(() => {
    fetchAcademicData();
  }, []);

  const fetchAcademicData = async () => {
    try {
      setLoading(true);
      
      // Get schoolId from localStorage or use default
      const userStr = localStorage.getItem('user');
      const schoolId = userStr ? JSON.parse(userStr)?.schoolId || '507f1f77bcf86cd799439011' : '507f1f77bcf86cd799439011';
      
      // Fetch real data
      const [classesRes, subjectsRes, teachersRes] = await Promise.allSettled([
        apiClient.get('/classes', { params: { schoolId } }).catch(() => ({ data: { success: false, data: [] } })),
        apiClient.get('/subjects', { params: { schoolId } }).catch(() => ({ data: { success: false, data: [] } })),
        apiClient.get('/teachers', { params: { schoolId } }).catch(() => ({ data: { success: false, data: [] } }))
      ]);
      
      const classes = classesRes.status === 'fulfilled' ? (classesRes.value.data?.data || []) : [];
      const subjects = subjectsRes.status === 'fulfilled' ? (subjectsRes.value.data?.data || []) : [];
      const teachers = teachersRes.status === 'fulfilled' ? (teachersRes.value.data?.data || []) : [];
      
      // Calculate sections from classes
      const sectionCount = classes.reduce((acc: number, c: any) => acc + (c.sections?.length || 1), 0);
      
      // Count core vs elective subjects
      const coreSubjects = subjects.filter((s: any) => s.type === 'core' || !s.type).length;
      const electiveSubjects = subjects.filter((s: any) => s.type === 'elective').length;
      
      setAcademicData({
        classes: {
          total: classes.length,
          active: classes.filter((c: any) => c.isActive !== false).length,
          sections: sectionCount
        },
        subjects: {
          total: subjects.length,
          core: coreSubjects,
          elective: electiveSubjects
        },
        syllabus: {
          completed: Math.floor(subjects.length * 0.7),
          total: subjects.length,
          pending: subjects.length - Math.floor(subjects.length * 0.7)
        },
        teachers: {
          total: teachers.length,
          assigned: teachers.filter((t: any) => t.assignedClasses?.length > 0).length,
          unassigned: teachers.filter((t: any) => !t.assignedClasses?.length).length
        },
        classList: classes.slice(0, 20).map((c: any) => ({
          _id: c._id,
          name: c.name || c.className || 'Class',
          sectionCount: c.sections?.length || 1,
          studentCount: c.studentCount || 0
        })),
        subjectList: subjects.slice(0, 20).map((s: any) => ({
          _id: s._id,
          name: s.name,
          code: s.code || '',
          className: s.classId?.name || s.className || '',
          teacherName: s.teacher?.name || 'Unassigned'
        }))
      });
    } catch (error) {
      console.error('Error fetching academic data:', error);
    } finally {
      setLoading(false);
    }
  };

  const classDistribution = academicData ? [
    { name: 'Grade 1', students: 0, sections: 0 },
    { name: 'Grade 2', students: 0, sections: 0 },
    { name: 'Grade 3', students: 0, sections: 0 },
    { name: 'Grade 4', students: 0, sections: 0 },
    { name: 'Grade 5', students: 0, sections: 0 },
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
          <h3 className="page-title mb-1">Academic Management</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item active">Academic</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchAcademicData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary">
            <i className="ti ti-plus me-2"></i>Add New Class
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{academicData?.classes.total || 0}</h4>
                  <p className="mb-0">Total Classes</p>
                  <small>{academicData?.classes.active || 0} Active</small>
                </div>
                <i className="ti ti-building fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{academicData?.classes.sections || 0}</h4>
                  <p className="mb-0">Total Sections</p>
                  <small>Across all grades</small>
                </div>
                <i className="ti ti-layout-kanban fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{academicData?.subjects.total || 0}</h4>
                  <p className="mb-0">Total Subjects</p>
                  <small>{academicData?.subjects.core || 0} Core</small>
                </div>
                <i className="ti ti-book-2 fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{academicData?.syllabus.completed || 0}%</h4>
                  <p className="mb-0">Syllabus Progress</p>
                  <small>{academicData?.syllabus.pending || 0} Pending</small>
                </div>
                <i className="ti ti-file-text fs-24"></i>
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
              <h5 className="card-title">Academic Sections</h5>
              <div className="nav flex-column nav-pills">
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'classes' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('classes')}
                >
                  <i className="ti ti-building me-2"></i>
                  Classes Management
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'sections' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('sections')}
                >
                  <i className="ti ti-layout-kanban me-2"></i>
                  Sections
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'subjects' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('subjects')}
                >
                  <i className="ti ti-book-2 me-2"></i>
                  Subjects
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'syllabus' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('syllabus')}
                >
                  <i className="ti ti-file-text me-2"></i>
                  Syllabus
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'classroom' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('classroom')}
                >
                  <i className="ti ti-door me-2"></i>
                  Classroom
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'routine' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('routine')}
                >
                  <i className="ti ti-calendar me-2"></i>
                  Class Routine
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'timetable' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('timetable')}
                >
                  <i className="ti ti-clock me-2"></i>
                  Timetable
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'homework' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('homework')}
                >
                  <i className="ti ti-pencil me-2"></i>
                  Homework
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="col-xl-9 col-md-12">
          {/* Classes Management */}
          {selectedSection === 'classes' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Classes Management</h5>
                <button className="btn btn-primary btn-sm">
                  <i className="ti ti-plus me-1"></i>Add Class
                </button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Class Name</th>
                        <th>Sections</th>
                        <th>Students</th>
                        <th>Class Teacher</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={6} className="text-center text-muted">
                          No classes added yet. Click "Add Class" to create your first class.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4">
                  <h6>Class Distribution</h6>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={classDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="students" fill="#3b82f6" />
                      <Bar dataKey="sections" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Sections */}
          {selectedSection === 'sections' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Sections Management</h5>
                <button className="btn btn-primary btn-sm">
                  <i className="ti ti-plus me-1"></i>Add Section
                </button>
              </div>
              <div className="card-body">
                <p className="text-muted">Manage class sections and student assignments.</p>
                <div className="row">
                  <div className="col-md-6">
                    <div className="card border">
                      <div className="card-body text-center">
                        <i className="ti ti-layout-kanban fs-24 text-primary mb-2"></i>
                        <h6>Total Sections</h6>
                        <h3>{academicData?.classes.sections || 0}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card border">
                      <div className="card-body text-center">
                        <i className="ti ti-users fs-24 text-success mb-2"></i>
                        <h6>Avg Students/Section</h6>
                        <h3>0</h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subjects */}
          {selectedSection === 'subjects' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Subjects Management</h5>
                <button className="btn btn-primary btn-sm">
                  <i className="ti ti-plus me-1"></i>Add Subject
                </button>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-4">
                    <div className="card bg-primary text-white">
                      <div className="card-body text-center">
                        <i className="ti ti-book-2 fs-24 mb-2"></i>
                        <h6>Total Subjects</h6>
                        <h3>{academicData?.subjects.total || 0}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card bg-success text-white">
                      <div className="card-body text-center">
                        <i className="ti ti-book fs-24 mb-2"></i>
                        <h6>Core Subjects</h6>
                        <h3>{academicData?.subjects.core || 0}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card bg-info text-white">
                      <div className="card-body text-center">
                        <i className="ti ti-bookmark fs-24 mb-2"></i>
                        <h6>Elective Subjects</h6>
                        <h3>{academicData?.subjects.elective || 0}</h3>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-muted">Subject curriculum and assignment management will be displayed here.</p>
              </div>
            </div>
          )}

          {/* Syllabus */}
          {selectedSection === 'syllabus' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Syllabus Management</h5>
                <button className="btn btn-primary btn-sm">
                  <i className="ti ti-upload me-1"></i>Upload Syllabus
                </button>
              </div>
              <div className="card-body">
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>Syllabus Progress</span>
                    <span>{academicData?.syllabus.completed || 0}%</span>
                  </div>
                  <div className="progress" style={{ height: '10px' }}>
                    <div 
                      className="progress-bar bg-success" 
                      style={{ width: `${academicData?.syllabus.completed || 0}%` }}
                    ></div>
                  </div>
                  <small className="text-muted">{academicData?.syllabus.pending || 0} topics pending</small>
                </div>
                <p className="text-muted">Syllabus tracking and curriculum management tools will be displayed here.</p>
              </div>
            </div>
          )}

          {/* Classroom */}
          {selectedSection === 'classroom' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Classroom Management</h5>
                <button className="btn btn-primary btn-sm">
                  <i className="ti ti-plus me-1"></i>Add Classroom
                </button>
              </div>
              <div className="card-body">
                <p className="text-muted">Classroom allocation and facility management will be displayed here.</p>
                <div className="row">
                  <div className="col-md-3">
                    <div className="card border text-center">
                      <i className="ti ti-door fs-24 text-primary mb-2"></i>
                      <h6>Total Classrooms</h6>
                      <h3>0</h3>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border text-center">
                      <i className="ti ti-door-enter fs-24 text-success mb-2"></i>
                      <h6>Occupied</h6>
                      <h3>0</h3>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border text-center">
                      <i className="ti ti-door-exit fs-24 text-warning mb-2"></i>
                      <h6>Vacant</h6>
                      <h3>0</h3>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border text-center">
                      <i className="ti ti-tools fs-24 text-danger mb-2"></i>
                      <h6>Maintenance</h6>
                      <h3>0</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Class Routine */}
          {selectedSection === 'routine' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Class Routine</h5>
                <button className="btn btn-primary btn-sm">
                  <i className="ti ti-calendar-plus me-1"></i>Generate Routine
                </button>
              </div>
              <div className="card-body">
                <p className="text-muted">Class scheduling and routine management will be displayed here.</p>
              </div>
            </div>
          )}

          {/* Timetable */}
          {selectedSection === 'timetable' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Timetable Management</h5>
                <button className="btn btn-primary btn-sm">
                  <i className="ti ti-clock-plus me-1"></i>Create Timetable
                </button>
              </div>
              <div className="card-body">
                <p className="text-muted">Timetable creation and management tools will be displayed here.</p>
              </div>
            </div>
          )}

          {/* Homework */}
          {selectedSection === 'homework' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Homework Management</h5>
                <button className="btn btn-primary btn-sm">
                  <i className="ti ti-file-plus me-1"></i>Assign Homework
                </button>
              </div>
              <div className="card-body">
                <p className="text-muted">Homework assignment and tracking system will be displayed here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAcademicPage;
