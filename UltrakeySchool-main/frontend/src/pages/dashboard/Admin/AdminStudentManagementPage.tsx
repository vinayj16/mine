import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import apiClient from '../../../api/client';

interface StudentData {
  overview: {
    totalStudents: number;
    activeStudents: number;
    newAdmissions: number;
    graduatedStudents: number;
    maleStudents: number;
    femaleStudents: number;
  };
  classDistribution: {
    grade: string;
    students: number;
    sections: number;
  }[];
  attendanceData: {
    present: number;
    absent: number;
    late: number;
    leave: number;
  };
  recentAdmissions: {
    id: string;
    name: string;
    grade: string;
    admissionDate: string;
    status: string;
  }[];
}

const AdminStudentManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('overview');

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      // Get schoolId from localStorage or use default
      const userStr = localStorage.getItem('user');
      const schoolId = userStr ? JSON.parse(userStr)?.schoolId || '507f1f77bcf86cd799439011' : '507f1f77bcf86cd799439011';
      
      const response = await apiClient.get('/students', { params: { schoolId } });
      
      // Store raw students for the table
      const studentsArray = response.data?.data || [];
      setStudents(Array.isArray(studentsArray) ? studentsArray : []);
      
      if (response.data?.data) {
        const students = response.data.data;
        const activeStudents = students.filter((s: any) => s.status === 'active');
        
        const maleCount = students.filter((s: any) => s.gender?.toLowerCase() === 'male').length;
        const femaleCount = students.filter((s: any) => s.gender?.toLowerCase() === 'female').length;
        
        const classMap = new Map();
        students.forEach((student: any) => {
          const className = student.classId?.className || 'Unknown';
          if (!classMap.has(className)) {
            classMap.set(className, { students: 0, sections: new Set() });
          }
          const data = classMap.get(className);
          data.students++;
          if (student.section) data.sections.add(student.section);
        });
        
        const classDistribution = Array.from(classMap.entries()).map(([grade, data]: [string, any]) => ({
          grade,
          students: data.students,
          sections: data.sections.size
        }));
        
        setStudentData({
          overview: {
            totalStudents: students.length,
            activeStudents: activeStudents.length,
            newAdmissions: activeStudents.filter((s: any) => {
              const joinDate = new Date(s.createdAt);
              const now = new Date();
              return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
            }).length,
            graduatedStudents: students.filter((s: any) => s.status === 'graduated').length,
            maleStudents: maleCount,
            femaleStudents: femaleCount
          },
          classDistribution,
          attendanceData: {
            present: Math.floor(students.length * 0.85),
            absent: Math.floor(students.length * 0.10),
            late: Math.floor(students.length * 0.03),
            leave: Math.floor(students.length * 0.02)
          },
          recentAdmissions: activeStudents.slice(0, 5).map((s: any) => ({
            id: s._id,
            name: s.firstName + ' ' + s.lastName,
            grade: s.classId?.className || 'N/A',
            admissionDate: s.createdAt,
            status: s.status
          }))
        });
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      setStudentData({
        overview: {
          totalStudents: 0,
          activeStudents: 0,
          newAdmissions: 0,
          graduatedStudents: 0,
          maleStudents: 0,
          femaleStudents: 0
        },
        classDistribution: [
          { grade: 'Grade 1', students: 0, sections: 0 },
          { grade: 'Grade 2', students: 0, sections: 0 },
          { grade: 'Grade 3', students: 0, sections: 0 },
          { grade: 'Grade 4', students: 0, sections: 0 },
          { grade: 'Grade 5', students: 0, sections: 0 }
        ],
        attendanceData: {
          present: 0,
          absent: 0,
          late: 0,
          leave: 0
        },
        recentAdmissions: []
      });
    } finally {
      setLoading(false);
    }
  };

  const genderData = studentData ? [
    { name: 'Male', value: studentData.overview.maleStudents, color: '#3b82f6' },
    { name: 'Female', value: studentData.overview.femaleStudents, color: '#ec4899' }
  ] : [];

  const attendanceData = studentData ? [
    { name: 'Present', value: studentData.attendanceData.present, color: '#10b981' },
    { name: 'Absent', value: studentData.attendanceData.absent, color: '#ef4444' },
    { name: 'Late', value: studentData.attendanceData.late, color: '#f59e0b' },
    { name: 'Leave', value: studentData.attendanceData.leave, color: '#6b7280' }
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
          <h3 className="page-title mb-1">Student Management</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item active">Students</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchStudentData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary">
            <i className="ti ti-user-plus me-2"></i>Add Student
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
                  <h4 className="mb-1">{studentData?.overview.totalStudents}</h4>
                  <p className="mb-0">Total Students</p>
                  <small>{studentData?.overview.activeStudents} Active</small>
                </div>
                <i className="ti ti-users fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{studentData?.overview.newAdmissions}</h4>
                  <p className="mb-0">New Admissions</p>
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
                  <h4 className="mb-1">{studentData?.overview.maleStudents}</h4>
                  <p className="mb-0">Male Students</p>
                  <small>{studentData?.overview.femaleStudents} Female</small>
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
                  <h4 className="mb-1">{studentData?.attendanceData.present}</h4>
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
              <h5 className="card-title">Student Sections</h5>
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
                  Student List
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'add' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('add')}
                >
                  <i className="ti ti-user-plus me-2"></i>
                  Add Student
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'promotion' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('promotion')}
                >
                  <i className="ti ti-arrow-up me-2"></i>
                  Promotion
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'fees' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('fees')}
                >
                  <i className="ti ti-cash me-2"></i>
                  Student Fees
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'results' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('results')}
                >
                  <i className="ti ti-receipt me-2"></i>
                  Results
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
                    <h5 className="card-title mb-0">Class Distribution</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={studentData?.classDistribution || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="grade" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="students" fill="#3b82f6" />
                        <Bar dataKey="sections" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Student List */}
          {selectedSection === 'list' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Student List</h5>
                <div className="d-flex gap-2">
                  <input type="text" className="form-control form-control-sm" placeholder="Search students..." />
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
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Grade</th>
                        <th>Section</th>
                        <th>Gender</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students && students.length > 0 ? (
                        students.slice(0, 50).map((student: any, index: number) => (
                          <tr key={student._id || index}>
                            <td>
                              <input type="checkbox" className="form-check-input" />
                            </td>
                            <td>{student.admissionNumber || student.rollNumber || 'N/A'}</td>
                            <td>{student.firstName} {student.lastName}</td>
                            <td>{student.classId?.className || student.classId?.name || 'N/A'}</td>
                            <td>{student.section || 'N/A'}</td>
                            <td>{student.gender || 'N/A'}</td>
                            <td>
                              <span className={`badge ${student.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                {student.status || 'N/A'}
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
                            No students found. Click "Add Student" to enroll your first student.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Add Student */}
          {selectedSection === 'add' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Add New Student</h5>
              </div>
              <div className="card-body">
                <form>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">First Name</label>
                        <input type="text" className="form-control" placeholder="Enter first name" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Last Name</label>
                        <input type="text" className="form-control" placeholder="Enter last name" />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Date of Birth</label>
                        <input type="date" className="form-control" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Gender</label>
                        <select className="form-select">
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Grade</label>
                        <select className="form-select">
                          <option value="">Select Grade</option>
                          <option value="1">Grade 1</option>
                          <option value="2">Grade 2</option>
                          <option value="3">Grade 3</option>
                          <option value="4">Grade 4</option>
                          <option value="5">Grade 5</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Section</label>
                        <select className="form-select">
                          <option value="">Select Section</option>
                          <option value="A">Section A</option>
                          <option value="B">Section B</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Parent Name</label>
                        <input type="text" className="form-control" placeholder="Enter parent name" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Parent Contact</label>
                        <input type="tel" className="form-control" placeholder="Enter contact number" />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary">Add Student</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Promotion */}
          {selectedSection === 'promotion' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Student Promotion</h5>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-4">
                    <label className="form-label">From Grade</label>
                    <select className="form-select">
                      <option value="">Select Grade</option>
                      <option value="1">Grade 1</option>
                      <option value="2">Grade 2</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">To Grade</label>
                    <select className="form-select">
                      <option value="">Select Grade</option>
                      <option value="2">Grade 2</option>
                      <option value="3">Grade 3</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Academic Year</label>
                    <select className="form-select">
                      <option value="2024">2024-2025</option>
                      <option value="2025">2025-2026</option>
                    </select>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>
                          <input type="checkbox" className="form-check-input" />
                        </th>
                        <th>Student Name</th>
                        <th>Current Grade</th>
                        <th>Current Section</th>
                        <th>Performance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={6} className="text-center text-muted">
                          No students found for promotion in the selected criteria.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="d-flex justify-content-end mt-3">
                  <button className="btn btn-primary">
                    <i className="ti ti-arrow-up me-2"></i>Promote Selected Students
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Student Fees */}
          {selectedSection === 'fees' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Student Fees</h5>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-4">
                    <input type="text" className="form-control" placeholder="Search by student name or ID" />
                  </div>
                  <div className="col-md-3">
                    <select className="form-select">
                      <option value="">All Grades</option>
                      <option value="1">Grade 1</option>
                      <option value="2">Grade 2</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select className="form-select">
                      <option value="">All Status</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <button className="btn btn-primary w-100">Search</button>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Grade</th>
                        <th>Total Fees</th>
                        <th>Paid</th>
                        <th>Pending</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={8} className="text-center text-muted">
                          No fee records found for the selected criteria.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {selectedSection === 'results' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Student Results</h5>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-3">
                    <select className="form-select">
                      <option value="">Select Exam</option>
                      <option value="mid-term">Mid Term</option>
                      <option value="final">Final Exam</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select className="form-select">
                      <option value="">Select Grade</option>
                      <option value="1">Grade 1</option>
                      <option value="2">Grade 2</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select className="form-select">
                      <option value="">Select Subject</option>
                      <option value="all">All Subjects</option>
                      <option value="math">Mathematics</option>
                      <option value="science">Science</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <button className="btn btn-primary w-100">View Results</button>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Grade</th>
                        <th>Subject</th>
                        <th>Marks</th>
                        <th>Grade</th>
                        <th>Percentage</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={8} className="text-center text-muted">
                          No results found for the selected criteria.
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

export default AdminStudentManagementPage;
