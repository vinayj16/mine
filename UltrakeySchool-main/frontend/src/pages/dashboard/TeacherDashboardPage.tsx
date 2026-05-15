import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { apiClient } from '../../api/client'
import InstitutionHeader from '../../components/common/InstitutionHeader'

const TeacherDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get('/dashboard/teacher')
      
      if (response.data.success && response.data.data) {
        setDashboardData(response.data.data)
      }
    } catch (err: any) {
      console.error('Error fetching teacher dashboard:', err)
      // Set empty data instead of showing error
      setDashboardData({
        overview: {
          totalStudents: 0,
          activeClasses: 0,
          pendingAssignments: 0,
          attendanceRate: 0
        },
        schedule: [],
        recentActivities: [],
        notifications: []
      })
    } finally {
      setLoading(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  // Transform backend data for UI - using empty arrays/objects as fallbacks
  const teacherProfile = dashboardData?.teacherProfile || {}
  const todayClasses = dashboardData?.todayClasses || []
  const attendanceData = dashboardData?.attendanceData || {}
  const bestPerformers = dashboardData?.bestPerformers || []
  const studentProgress = dashboardData?.studentProgress || []
  const upcomingEvents = dashboardData?.upcomingEvents || []
  const syllabusData = dashboardData?.syllabusData || []
  const studentMarks = dashboardData?.studentMarks || []
  const leaveStatus = dashboardData?.leaveStatus || []
  const noticeMessage = dashboardData?.noticeMessage || ''

  return (
    <>
      <InstitutionHeader showFullDetails={false} />
      
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Teacher Dashboard</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Teacher Dashboard
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Greeting Section */}
      <div className="row">
        <div className="col-md-12 d-flex">
          <div className="card flex-fill bg-info bg-03">
            <div className="card-body">
              <h1 className="text-white mb-1">Good Morning {teacherProfile.name || 'Teacher'}</h1>
              <p className="text-white mb-3">Have a Good day at work</p>
              {noticeMessage && (
                <p className="text-light">
                  Notice: {noticeMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Profile + Syllabus completion */}
      <div className="row">
        <div className="col-xxl-8 col-xl-12">
          <div className="row">
            <div className="col-xxl-7 col-xl-8 d-flex">
              <div className="card bg-dark position-relative flex-fill">
                <div className="card-body pb-1">
                  <div className="d-sm-flex align-items-center justify-content-between row-gap-3">
                    <div className="d-flex align-items-center overflow-hidden mb-3">
                      <div className="avatar avatar-xxl rounded flex-shrink-0 border border-2 border-white me-3">
                        <img
                          src={teacherProfile.avatar || '/assets/img/teachers/teacher-05.jpg'}
                          alt="Teacher"
                        />
                      </div>
                      <div className="overflow-hidden">
                        <span className="badge bg-transparent-primary text-primary mb-1">
                          #{teacherProfile.employeeId || 'N/A'}
                        </span>
                        <h3 className="text-white mb-1 text-truncate">{teacherProfile.name || 'Teacher Name'}</h3>
                        <div className="d-flex align-items-center flex-wrap text-light row-gap-2">
                          <span className="me-2">Classes: {teacherProfile.classes || 'N/A'}</span>
                          <span className="d-flex align-items-center">
                            <i className="ti ti-circle-filled text-warning fs-7 me-1" />
                            {teacherProfile.subject || 'Subject'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link
                      to="/profile/edit"
                      className="btn btn-primary flex-shrink-0 mb-3"
                    >
                      Edit Profile
                    </Link>
                  </div>
                  <div className="student-card-bg">
                    <img src="/assets/img/bg/circle-shape.png" alt="Bg" />
                    <img src="/assets/img/bg/shape-02.png" alt="Bg" />
                    <img src="/assets/img/bg/shape-04.png" alt="Bg" />
                    <img src="/assets/img/bg/blue-polygon.png" alt="Bg" />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xxl-5 col-xl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-body">
                  <div className="row align-items-center justify-content-between">
                    <div className="col-sm-5">
                      <div id="plan_chart" className="mb-3 mb-sm-0 text-center text-sm-start" />
                    </div>
                    <div className="col-sm-7">
                      <div className="text-center text-sm-start">
                        <h4 className="mb-3">Syllabus</h4>
                        <p className="mb-2">
                          <i className="ti ti-circle-filled text-success me-1" />
                          Completed: <span className="fw-semibold">{dashboardData?.syllabusCompletion?.completed || 0}%</span>
                        </p>
                        <p>
                          <i className="ti ti-circle-filled text-danger me-1" />
                          Pending: <span className="fw-semibold">{dashboardData?.syllabusCompletion?.pending || 0}%</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Class cards */}
          <div className="card mt-4">
            <div className="card-header d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <h4 className="me-2">Today's Class</h4>
              </div>
              <div className="d-inline-flex align-items-center class-datepick">
                <span className="icon">
                  <i className="ti ti-chevron-left me-2" />
                </span>
                <input type="text" className="form-control datetimepicker border-0" placeholder={new Date().toLocaleDateString()} />
                <span className="icon">
                  <i className="ti ti-chevron-right" />
                </span>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {todayClasses.length > 0 ? (
                  todayClasses.map((cls: any, index: number) => (
                    <div key={index} className="col-sm-3">
                      <div className="bg-light-400 rounded p-3">
                        <span className={`badge ${cls.isCompleted ? 'badge-danger text-decoration-line-through' : 'badge-primary'} badge-lg mb-2`}>
                          <i className="ti ti-clock me-1" />
                          {cls.time}
                        </span>
                        <p className="text-dark mb-0">{cls.className}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12">
                    <p className="text-muted text-center">No classes scheduled for today</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attendance + Best Performers + Student Progress */}
          <div className="row mt-4">
            <div className="col-xxl-6 col-xl-6 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Attendance</h4>
                  <div className="card-dropdown">
                    <a href="#" className="dropdown-toggle p-2">
                      <i className="ti ti-calendar-due" />
                      This Week
                    </a>
                  </div>
                </div>
                <div className="card-body pb-0">
                  <div className="bg-light-300 rounde border p-3 mb-3">
                    <div className="d-flex align-items-center justify-content-between flex-wrap">
                      <h6 className="mb-2">Last 7 Days</h6>
                      <p className="mb-2">{attendanceData.dateRange || 'N/A'}</p>
                    </div>
                    <div className="d-flex align-items-center gap-1 flex-wrap">
                      {attendanceData.weekDays?.map((day: any, idx: number) => (
                        <a key={idx} href="#" className={`badge badge-lg ${day.status === 'present' ? 'bg-success' : day.status === 'absent' ? 'bg-danger' : 'bg-white border text-default'}`}>
                          {day.label}
                        </a>
                      ))}
                    </div>
                  </div>
                  <p className="mb-3">
                    <i className="ti ti-calendar-heart text-primary me-2" />
                    No of total working days <span className="fw-medium text-dark">{attendanceData.totalWorkingDays || 0} Days</span>
                  </p>
                  <div className="border rounded p-3 mb-3">
                    <div className="row">
                      <div className="col text-center border-end">
                        <p className="mb-1">Present</p>
                        <h5>{attendanceData.present || 0}</h5>
                      </div>
                      <div className="col text-center border-end">
                        <p className="mb-1">Absent</p>
                        <h5>{attendanceData.absent || 0}</h5>
                      </div>
                      <div className="col text-center border-end">
                        <p className="mb-1">Halfday</p>
                        <h5>{attendanceData.halfday || 0}</h5>
                      </div>
                      <div className="col text-center">
                        <p className="mb-1">Late</p>
                        <h5>{attendanceData.late || 0}</h5>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xxl-6 col-xl-6 col-md-6 d-flex flex-column">
              <div className="card mb-4 flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Best Performers</h4>
                  <Link to="/students" className="link-primary fw-medium">
                    View All
                  </Link>
                </div>
                <div className="card-body pb-1">
                  {bestPerformers.map((performer: any, idx: number) => (
                    <div key={idx} className="d-sm-flex align-items-center mb-1">
                      <div className="w-50 mb-2">
                        <h6>{performer.className}</h6>
                      </div>
                      <div className="class-progress w-100 ms-sm-3 mb-3">
                        <div className="progress justify-content-between" role="progressbar" aria-valuemin={0} aria-valuemax={100}>
                          <div className="progress-bar bg-primary" style={{ width: `${performer.percentage}%` }}>
                            <div className="avatar-list-stacked avatar-group-xs d-flex">
                              {performer.topStudents?.slice(0, 3).map((student: any, sidx: number) => (
                                <span key={sidx} className="avatar avatar-rounded">
                                  <img
                                    className="border border-white"
                                    src={student.avatar || '/assets/img/students/student-01.jpg'}
                                    alt="student"
                                  />
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="badge">{performer.percentage}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h4 className="card-title">Student Progress</h4>
                  <div className="dropdown">
                    <a href="#" className="bg-white dropdown-toggle" data-bs-toggle="dropdown">
                      <i className="ti ti-calendar me-2" />
                      This Month
                    </a>
                  </div>
                </div>
                <div className="card-body">
                  {studentProgress.map((student: any, idx: number) => (
                    <div key={idx} className="d-flex align-items-center justify-content-between p-3 mb-2 border br-5">
                      <div className="d-flex align-items-center overflow-hidden me-2">
                        <Link to={`/students/${student.id}`} className="avatar avatar-lg flex-shrink-0 br-6 me-2">
                          <img src={student.avatar || '/assets/img/students/student-09.jpg'} alt="student" />
                        </Link>
                        <div className="overflow-hidden">
                          <h6 className="mb-1 text-truncate">
                            <Link to={`/students/${student.id}`}>{student.name}</Link>
                          </h6>
                          <p>{student.class}</p>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <img src="/assets/img/icons/medal.svg" alt="medal" />
                        <span className="badge badge-success ms-2">{student.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Schedules */}
        <div className="col-xxl-4 col-xl-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="card-title">Schedules</h4>
              <Link to="/events/add" className="link-primary fw-medium me-2">
                <i className="ti ti-square-plus me-1" />
                Add New
              </Link>
            </div>
            <div className="card-body">
              <div className="datepic mb-4" />
              <h4 className="mb-3">Upcoming Events</h4>

              <div className="event-scroll">
                {upcomingEvents.map((event: any, idx: number) => (
                  <div key={idx} className={`border-start border-${event.color || 'primary'} border-3 shadow-sm p-3 mb-3`}>
                    <div className="d-flex align-items-center mb-3 pb-3 border-bottom">
                      <span className={`avatar p-1 me-2 bg-${event.color || 'primary'}-transparent flex-shrink-0`}>
                        <i className={`${event.icon || 'ti ti-calendar'} fs-24`} />
                      </span>
                      <div className="flex-fill">
                        <h6 className="mb-1">{event.title}</h6>
                        <p className="d-flex align-items-center mb-0">
                          <i className="ti ti-calendar me-1" />
                          {event.date}
                        </p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <p className="mb-0">
                        <i className="ti ti-clock me-1" />
                        {event.time}
                      </p>
                      {event.participants && (
                        <div className="avatar-list-stacked avatar-group-sm">
                          {event.participants.slice(0, 2).map((participant: any, pidx: number) => (
                            <span key={pidx} className="avatar border-0">
                              <img
                                src={participant.avatar || '/assets/img/parents/parent-11.jpg'}
                                className="rounded-circle"
                                alt="participant"
                              />
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Syllabus / Lesson Plan */}
      <div className="row mt-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="card-title">Syllabus / Lesson Plan</h4>
              <Link to="/syllabus" className="link-primary fw-medium">
                View All
              </Link>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {syllabusData.map((lesson: any, idx: number) => (
                  <div key={idx} className="col-md-3">
                    <div className="card mb-0">
                      <div className="card-body">
                        <div className="bg-success-transparent rounded p-2 fw-semibold mb-3 text-center">
                          {lesson.className}
                        </div>
                        <div className="border-bottom mb-3">
                          <h5 className="mb-3">{lesson.title}</h5>
                          <div className="progress progress-xs mb-3">
                            <div
                              className="progress-bar bg-success"
                              role="progressbar"
                              style={{ width: `${lesson.completion}%` }}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            />
                          </div>
                        </div>
                        <div className="d-flex align-items-center justify-content-between">
                          <Link to={`/schedule-classes/${lesson.id}`} className="fw-medium">
                            <i className="ti ti-edit me-1" />
                            Reschedule
                          </Link>
                          <a href="#" className="link-primary">
                            <i className="ti ti-share-3 me-1" />
                            Share
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Marks + Leave Status */}
      <div className="row mt-4">
        <div className="col-xxl-8 col-xl-7 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap">
              <h4 className="card-title">Student Marks</h4>
            </div>
            <div className="card-body px-0">
              <div className="custom-datatable-filter table-responsive">
                <table className="table">
                  <thead className="thead-light">
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Marks %</th>
                      <th>CGPA</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentMarks.map((student: any, idx: number) => (
                      <tr key={idx}>
                        <td>{student.id}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <Link to={`/students/${student.id}`} className="avatar avatar-md">
                              <img
                                src={student.avatar || '/assets/img/students/student-01.jpg'}
                                className="img-fluid rounded-circle"
                                alt="student"
                              />
                            </Link>
                            <div className="ms-2">
                              <p className="text-dark mb-0">
                                <Link to={`/students/${student.id}`}>{student.name}</Link>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>{student.class}</td>
                        <td>{student.section}</td>
                        <td>{student.marksPercentage}%</td>
                        <td>{student.cgpa}</td>
                        <td>
                          <span className={`badge ${student.status === 'Pass' ? 'bg-success' : 'bg-danger'}`}>
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-4 col-xl-5 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="card-title">Leave Status</h4>
            </div>
            <div className="card-body">
              {leaveStatus.map((leave: any, idx: number) => (
                <div key={idx} className="bg-light-300 d-sm-flex align-items-center justify-content-between p-3 mb-3">
                  <div className="d-flex align-items-center mb-2 mb-sm-0">
                    <div className={`avatar avatar-lg bg-${leave.color || 'danger'}-transparent flex-shrink-0 me-2`}>
                      <i className="ti ti-brand-socket-io" />
                    </div>
                    <div>
                      <h6 className="mb-1">{leave.type}</h6>
                      <p className="mb-0">Date: {leave.date}</p>
                    </div>
                  </div>
                  <span className={`badge ${leave.statusClass || 'bg-skyblue'} d-inline-flex align-items-center`}>
                    <i className="ti ti-circle-filled fs-5 me-1" />
                    {leave.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TeacherDashboardPage
