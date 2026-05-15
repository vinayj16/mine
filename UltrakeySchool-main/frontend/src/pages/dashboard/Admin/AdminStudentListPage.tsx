import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { StudentManagementApiService } from '../../../api/adminService';

interface StudentData {
  overview: {
    totalStudents: number;
    activeStudents: number;
    newAdmissions: number;
    graduatedStudents: number;
    maleStudents: number;
    femaleStudents: number;
    totalClasses: number;
    averageAttendance: number;
  };
  students: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    grade: string;
    section: string;
    rollNumber: string;
    status: 'Active' | 'Inactive' | 'Graduated' | 'Transferred';
    photo?: string;
  }[];
  gradeDistribution: {
    grade: string;
    count: number;
  }[];
  genderDistribution: {
    gender: string;
    count: number;
    percentage: number;
  }[];
}

const AdminStudentListPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchStudentData();
  }, [selectedGrade, selectedStatus]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      const [
        students,
        gradeDistribution,
        genderDistribution
      ] = await Promise.all([
        StudentManagementApiService.getStudentOverview(),
        StudentManagementApiService.getStudentList(selectedGrade, selectedStatus),
        StudentManagementApiService.getGradeDistribution(),
        StudentManagementApiService.getGenderDistribution()
      ]);

      setStudentData({
        overview: {
          totalStudents: 0,
          activeStudents: 0,
          newAdmissions: 0,
          graduatedStudents: 0,
          maleStudents: 0,
          femaleStudents: 0,
          totalClasses: 0,
          averageAttendance: 0
        },
        students: (students as any[]) || [],
        gradeDistribution: (gradeDistribution as any[]) || [],
        genderDistribution: (genderDistribution as any[]) || []
      });
    } catch (error) {
      console.error('Error fetching student data:', error);
      setStudentData({
        overview: {
          totalStudents: 0,
          activeStudents: 0,
          newAdmissions: 0,
          graduatedStudents: 0,
          maleStudents: 0,
          femaleStudents: 0,
          totalClasses: 0,
          averageAttendance: 0
        },
        students: [],
        gradeDistribution: [],
        genderDistribution: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Student Management</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Students</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
          <Link to="/admin/students/add" className="btn btn-primary text-white d-flex align-items-center">
            <i className="ti ti-plus me-1" />Add Student
          </Link>
        </div>
      </div>

      <div className="row mb-3">
        {[
          { label: 'Total Students', value: studentData?.overview.totalStudents || 0, icon: 'ti ti-users', color: 'bg-primary' },
          { label: 'Active Students', value: studentData?.overview.activeStudents || 0, icon: 'ti ti-user-check', color: 'bg-success' },
          { label: 'New Admissions', value: studentData?.overview.newAdmissions || 0, icon: 'ti ti-user-plus', color: 'bg-info' },
          { label: 'Graduated', value: studentData?.overview.graduatedStudents || 0, icon: 'ti ti trophy', color: 'bg-warning' }
        ].map((stat) => (
          <div key={stat.label} className="col-xxl-3 col-xl-6 d-flex">
            <div className="card flex-fill border-0 shadow-sm">
              <div className="card-body d-flex align-items-center">
                <div className={`avatar avatar-xl ${stat.color} rounded d-flex align-items-center justify-content-center me-3`}>
                  <i className={`${stat.icon} fs-20 text-white`} />
                </div>
                <div>
                  <h3 className="mb-0">{stat.value}</h3>
                  <p className="mb-0 text-muted">{stat.label}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row">
        <div className="col-xl-8 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="card-title">Student List</h4>
              <div className="d-flex gap-2">
                <select className="form-select form-select-sm" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                  <option value="all">All Grades</option>
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
                </select>
                <select className="form-select form-select-sm" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Grade</th>
                      <th>Section</th>
                      <th>Roll No.</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentData?.students.slice(0, 20).map((student) => (
                      <tr key={student.id}>
                        <td>{student.studentId}</td>
                        <td>{student.firstName} {student.lastName}</td>
                        <td>{student.grade}</td>
                        <td>{student.section}</td>
                        <td>{student.rollNumber}</td>
                        <td>
                          <span className={`badge ${student.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                            {student.status}
                          </span>
                        </td>
                        <td>
                          <Link to={`/admin/students/${student.id}`} className="btn btn-sm btn-light">View</Link>
                        </td>
                      </tr>
                    ))}
                    {(!studentData?.students || studentData.students.length === 0) && (
                      <tr>
                        <td colSpan={7} className="text-center text-muted">No students found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 d-flex">
          <div className="card flex-fill">
            <div className="card-header">
              <h4 className="card-title">Gender Distribution</h4>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={studentData?.genderDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="gender"
                    label
                  >
                    {(studentData?.genderDistribution || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3">
                {(studentData?.genderDistribution || []).map((item: any) => (
                  <div key={item.gender} className="d-flex justify-content-between mb-2">
                    <span>{item.gender}</span>
                    <span className="fw-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminStudentListPage;
