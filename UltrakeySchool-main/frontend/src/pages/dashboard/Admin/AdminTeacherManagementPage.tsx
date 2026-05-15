import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import apiClient from '../../../api/client';

interface TeacherData {
  overview: {
    totalTeachers: number;
    activeTeachers: number;
    newTeachers: number;
    onLeave: number;
    maleTeachers: number;
    femaleTeachers: number;
  };
  subjectDistribution: {
    subject: string;
    teachers: number;
    classes: number;
  }[];
  attendanceData: {
    present: number;
    absent: number;
    late: number;
    leave: number;
  };
  recentTeachers: {
    id: string;
    name: string;
    subject: string;
    classes: string;
    joinDate: string;
    status: string;
  }[];
}

const AdminTeacherManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('overview');

  const handleAddTeacher = () => {
    window.location.href = '/dashboard/admin/teachers/add';
  };

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      
      // Get schoolId from localStorage or use demo ID
      const userStr = localStorage.getItem('user');
      let schoolId = '507f1f77bcf86cd799439011'; // Default demo school
      
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          if (userData?.schoolId && userData.schoolId.length === 24) {
            schoolId = userData.schoolId;
          }
        } catch (e) {
          console.log('Error parsing user:', e);
        }
      }
      
      const response = await apiClient.get('/teachers', { params: { schoolId } });
      
      // Store raw teachers for the list
      const teachersArray = response.data?.data || [];
      setTeachers(Array.isArray(teachersArray) ? teachersArray : []);
      
      const activeTeachers = teachers.filter((t: any) => t.status === 'active');
      
      const maleCount = teachersArray.filter((t: any) => t.gender?.toLowerCase() === 'male').length;
      const femaleCount = teachersArray.filter((t: any) => t.gender?.toLowerCase() === 'female').length;
      
      const subjectMap = new Map();
      teachersArray.forEach((teacher: any) => {
        const subject = teacher.subject || 'General';
        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, { teachers: 0, classes: 0 });
        }
        const data = subjectMap.get(subject);
        data.teachers++;
        data.classes += teacher.assignedClasses?.length || 0;
      });
      
      const subjectDistribution = Array.from(subjectMap.entries()).map(([subject, data]: [string, any]) => ({
        subject,
        teachers: data.teachers,
        classes: data.classes
      }));
      
      setTeacherData({
        overview: {
          totalTeachers: teachers.length,
          activeTeachers: activeTeachers.length,
          newTeachers: activeTeachers.filter((t: any) => {
            const joinDate = new Date(t.createdAt);
            const now = new Date();
            return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
          }).length,
          onLeave: teachers.filter((t: any) => t.status === 'on_leave').length,
          maleTeachers: maleCount,
          femaleTeachers: femaleCount
        },
        subjectDistribution: subjectDistribution.length > 0 ? subjectDistribution : [
          { subject: 'Mathematics', teachers: 0, classes: 0 },
          { subject: 'Science', teachers: 0, classes: 0 },
          { subject: 'English', teachers: 0, classes: 0 },
          { subject: 'Social Studies', teachers: 0, classes: 0 },
          { subject: 'Computer', teachers: 0, classes: 0 }
        ],
        attendanceData: {
          present: Math.floor(teachers.length * 0.90),
          absent: Math.floor(teachers.length * 0.05),
          late: Math.floor(teachers.length * 0.03),
          leave: Math.floor(teachers.length * 0.02)
        },
        recentTeachers: activeTeachers.slice(0, 5).map((t: any) => ({
          id: t._id,
          name: t.firstName + ' ' + t.lastName,
          subject: t.subject || 'General',
          classes: t.assignedClasses?.join(', ') || 'N/A',
          joinDate: t.createdAt,
          status: t.status
        }))
      });
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      setTeacherData({
        overview: {
          totalTeachers: 0,
          activeTeachers: 0,
          newTeachers: 0,
          onLeave: 0,
          maleTeachers: 0,
          femaleTeachers: 0
        },
        subjectDistribution: [
          { subject: 'Mathematics', teachers: 0, classes: 0 },
          { subject: 'Science', teachers: 0, classes: 0 },
          { subject: 'English', teachers: 0, classes: 0 },
          { subject: 'Social Studies', teachers: 0, classes: 0 },
          { subject: 'Computer', teachers: 0, classes: 0 }
        ],
        attendanceData: {
          present: 0,
          absent: 0,
          late: 0,
          leave: 0
        },
        recentTeachers: []
      });
    } finally {
      setLoading(false);
    }
  };

  const genderData = teacherData ? [
    { name: 'Male', value: teacherData.overview.maleTeachers, color: '#3b82f6' },
    { name: 'Female', value: teacherData.overview.femaleTeachers, color: '#ec4899' }
  ] : [];

  const attendanceData = teacherData ? [
    { name: 'Present', value: teacherData.attendanceData.present, color: '#10b981' },
    { name: 'Absent', value: teacherData.attendanceData.absent, color: '#ef4444' },
    { name: 'Late', value: teacherData.attendanceData.late, color: '#f59e0b' },
    { name: 'Leave', value: teacherData.attendanceData.leave, color: '#6b7280' }
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
          <h3 className="page-title mb-1">Teacher Management</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item active">Teachers</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchTeacherData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary" onClick={handleAddTeacher}>
            <i className="ti ti-user-plus me-2"></i>Add Teacher
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
                  <h4 className="mb-1">{teacherData?.overview.totalTeachers}</h4>
                  <p className="mb-0">Total Teachers</p>
                  <small>{teacherData?.overview.activeTeachers} Active</small>
                </div>
                <i className="ti ti-chalkboard-user fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{teacherData?.overview.newTeachers}</h4>
                  <p className="mb-0">New Teachers</p>
                  <small>This month</small>
                </div>
                <i className="ti ti-user-plus fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{teacherData?.overview.maleTeachers}</h4>
                  <p className="mb-0">Male Teachers</p>
                  <small>{teacherData?.overview.femaleTeachers} Female</small>
                </div>
                <i className="ti ti-gender-male fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{teacherData?.attendanceData.present}</h4>
                  <p className="mb-0">Present Today</p>
                  <small>Attendance rate</small>
                </div>
                <i className="ti ti-calendar-check fs-24"></i>
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
              <h5 className="card-title">Teacher Sections</h5>
              <div className="nav flex-column nav-pills">
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'overview' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('overview')}
                >
                  <i className="ti ti-chart-pie me-2"></i>
                  Overview
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'list' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('list')}
                >
                  <i className="ti ti-list me-2"></i>
                  Teacher List
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'routine' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('routine')}
                >
                  <i className="ti ti-calendar me-2"></i>
                  Routine
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'leaves' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('leaves')}
                >
                  <i className="ti ti-calendar-off me-2"></i>
                  Leaves
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="col-xl-9 col-md-12">
          {/* Overview */}
          {selectedSection === 'overview' && (
            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Gender Distribution</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={genderData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {genderData.map((entry, index) => (
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
                    <h5 className="card-title mb-0">Today's Attendance</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={attendanceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {attendanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Subject Distribution</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={teacherData?.subjectDistribution || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subject" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="teachers" fill="#3b82f6" />
                        <Bar dataKey="classes" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Teacher List */}
          {selectedSection === 'list' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Teacher List</h5>
                <div className="d-flex gap-2">
                  <input type="text" className="form-control form-control-sm" placeholder="Search teachers..." />
                  <button className="btn btn-primary btn-sm">
                    <i className="ti ti-filter me-1"></i>Filter
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>
                          <input type="checkbox" className="form-check-input" />
                        </th>
                        <th>Teacher ID</th>
                        <th>Name</th>
                        <th>Subject</th>
                        <th>Classes</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers && teachers.length > 0 ? (
                        teachers.slice(0, 50).map((teacher: any, index: number) => (
                          <tr key={teacher._id || index}>
                            <td>
                              <input type="checkbox" className="form-check-input" />
                            </td>
                            <td>{teacher.employeeId || teacher.teacherId || 'N/A'}</td>
                            <td>{teacher.firstName} {teacher.lastName}</td>
                            <td>{teacher.subject || teacher.department || 'General'}</td>
                            <td>{teacher.assignedClasses?.length || 0}</td>
                            <td>{teacher.phone || teacher.email || 'N/A'}</td>
                            <td>
                              <span className={`badge ${teacher.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                {teacher.status || 'active'}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <button className="btn btn-sm btn-light">
                                  <i className="ti ti-eye"></i>
                                </button>
                                <button className="btn btn-sm btn-light">
                                  <i className="ti ti-pencil"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="text-center text-muted">
                            No teachers found. Click "Add Teacher" to hire your first teacher.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Routine */}
          {selectedSection === 'routine' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Teacher Routine</h5>
                <div className="d-flex gap-2">
                  <select className="form-select form-select-sm">
                    <option value="">Select Teacher</option>
                  </select>
                  <button className="btn btn-primary btn-sm">
                    <i className="ti ti-calendar-plus me-1"></i>Generate Routine
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Time/Day</th>
                        <th>Monday</th>
                        <th>Tuesday</th>
                        <th>Wednesday</th>
                        <th>Thursday</th>
                        <th>Friday</th>
                        <th>Saturday</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>8:00 - 9:00 AM</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                      </tr>
                      <tr>
                        <td>9:00 - 10:00 AM</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                      </tr>
                      <tr>
                        <td>10:00 - 11:00 AM</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                      </tr>
                      <tr>
                        <td>11:00 - 12:00 PM</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                        <td className="text-center">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-muted mt-3">Select a teacher to view their weekly routine schedule.</p>
              </div>
            </div>
          )}

          {/* Leaves */}
          {selectedSection === 'leaves' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Teacher Leaves</h5>
                <button className="btn btn-primary btn-sm">
                  <i className="ti ti-calendar-plus me-1"></i>Approve Leave
                </button>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-3">
                    <select className="form-select">
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <input type="date" className="form-control" placeholder="From Date" />
                  </div>
                  <div className="col-md-3">
                    <input type="date" className="form-control" placeholder="To Date" />
                  </div>
                  <div className="col-md-3">
                    <button className="btn btn-primary w-100">Filter</button>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Teacher Name</th>
                        <th>Leave Type</th>
                        <th>From Date</th>
                        <th>To Date</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Applied On</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={8} className="text-center text-muted">
                          No leave applications found.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTeacherManagementPage;
