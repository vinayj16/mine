import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StudentManagementApiService } from '../../../api/adminService';

interface PromotionData {
  overview: {
    totalStudents: number;
    eligibleForPromotion: number;
    notEligibleForPromotion: number;
    promotedStudents: number;
    retainedStudents: number;
    currentSession: string;
    nextSession: string;
  };
  promotions: {
    id: string;
    studentId: string;
    studentName: string;
    currentGrade: string;
    currentSection: string;
    currentRollNumber: string;
    proposedGrade: string;
    proposedSection: string;
    proposedRollNumber: string;
    attendancePercentage: number;
    overallPercentage: number;
    gradePointAverage: number;
    subjects: {
      name: string;
      marks: number;
      grade: string;
    }[];
    promotionStatus: 'Eligible' | 'Not Eligible' | 'Promoted' | 'Retained' | 'Pending';
    promotionCriteria: {
      attendanceMet: boolean;
      academicMet: boolean;
      behaviorMet: boolean;
      feesPaid: boolean;
    };
    remarks?: string;
    promotedDate?: string;
    promotedBy?: string;
  }[];
  gradeWisePromotion: {
    grade: string;
    totalStudents: number;
    eligible: number;
    promoted: number;
    retained: number;
    promotionRate: number;
  }[];
  promotionCriteria: {
    category: string;
    requirement: string;
    minimumValue: number;
    weight: number;
  }[];
}

const AdminPromotionPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [promotionData, setPromotionData] = useState<PromotionData | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchPromotionData();
  }, [selectedGrade, selectedStatus]);

  const fetchPromotionData = async () => {
    try {
      setLoading(true);
      
      // Fetch all promotion data in parallel
      const [
        overview,
        promotions,
        gradeWisePromotion,
        promotionCriteria
      ] = await Promise.all([
        StudentManagementApiService.getPromotionOverview(),
        StudentManagementApiService.getPromotionList(selectedGrade, selectedStatus),
        StudentManagementApiService.getGradeWisePromotion(),
        StudentManagementApiService.getPromotionCriteria()
      ]);

      setPromotionData({
        overview: (overview || {
          totalStudents: 0,
          eligibleForPromotion: 0,
          notEligibleForPromotion: 0,
          promotedStudents: 0,
          retainedStudents: 0,
          currentSession: '2024-2025',
          nextSession: '2025-2026'
        }) as {
          totalStudents: number;
          eligibleForPromotion: number;
          notEligibleForPromotion: number;
          promotedStudents: number;
          retainedStudents: number;
          currentSession: string;
          nextSession: string;
        },
        promotions: (promotions as any[]) || [],
        gradeWisePromotion: (gradeWisePromotion as any[]) || [
          { grade: 'Grade 1', totalStudents: 0, eligible: 0, promoted: 0, retained: 0, promotionRate: 0 },
          { grade: 'Grade 2', totalStudents: 0, eligible: 0, promoted: 0, retained: 0, promotionRate: 0 },
          { grade: 'Grade 3', totalStudents: 0, eligible: 0, promoted: 0, retained: 0, promotionRate: 0 },
          { grade: 'Grade 4', totalStudents: 0, eligible: 0, promoted: 0, retained: 0, promotionRate: 0 }
        ],
        promotionCriteria: (promotionCriteria as any[]) || [
          { category: 'Attendance', requirement: 'Minimum Attendance', minimumValue: 75, weight: 30 },
          { category: 'Academic', requirement: 'Minimum Percentage', minimumValue: 40, weight: 50 },
          { category: 'Behavior', requirement: 'Conduct Grade', minimumValue: 'C', weight: 20 },
          { category: 'Fees', requirement: 'Fees Status', minimumValue: 'Paid', weight: 0 }
        ]
      });

    } catch (error: any) {
      console.error('Error fetching promotion data:', error);
      
      // Set empty data on error
      setPromotionData({
        overview: {
          totalStudents: 0,
          eligibleForPromotion: 0,
          notEligibleForPromotion: 0,
          promotedStudents: 0,
          retainedStudents: 0,
          currentSession: '2024-2025',
          nextSession: '2025-2026'
        },
        promotions: [],
        gradeWisePromotion: [],
        promotionCriteria: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePromotionProcess = () => {
    // Handle promotion process logic
    console.log('Starting promotion process...');
  };

  const filteredPromotions = promotionData?.promotions.filter(promotion => {
    const matchesGrade = selectedGrade === 'all' || promotion.currentGrade === selectedGrade;
    const matchesStatus = selectedStatus === 'all' || promotion.promotionStatus === selectedStatus;
    return matchesGrade && matchesStatus;
  }) || [];

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
          <h3 className="page-title mb-1">Student Promotion</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/school-admin">Dashboard</Link></li>
              <li className="breadcrumb-item">Peoples</li>
              <li className="breadcrumb-item">Students</li>
              <li className="breadcrumb-item active">Promotion</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button className="btn btn-outline-light bg-white btn-icon me-2" onClick={fetchPromotionData}>
            <i className="ti ti-refresh"></i>
          </button>
          <button className="btn btn-primary" onClick={handlePromotionProcess}>
            <i className="ti ti-arrow-up me-2"></i>Process Promotions
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
                  <h4 className="mb-1">{promotionData?.overview.totalStudents}</h4>
                  <p className="mb-0">Total Students</p>
                  <small>Session {promotionData?.overview.currentSession}</small>
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
                  <h4 className="mb-1">{promotionData?.overview.eligibleForPromotion}</h4>
                  <p className="mb-0">Eligible</p>
                  <small>For promotion</small>
                </div>
                <i className="ti ti-user-check fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{promotionData?.overview.promotedStudents}</h4>
                  <p className="mb-0">Promoted</p>
                  <strong>{promotionData?.overview.retainedStudents}</strong> Retained
                </div>
                <i className="ti ti-arrow-up fs-24"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-1">{promotionData?.overview.nextSession}</h4>
                  <p className="mb-0">Next Session</p>
                  <small>Academic year</small>
                </div>
                <i className="ti ti-calendar fs-24"></i>
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
              <h5 className="card-title">Promotion Sections</h5>
              <div className="nav flex-column nav-pills">
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'overview' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('overview')}
                >
                  <i className="ti ti-chart-pie me-2"></i>
                  Overview
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'promotions' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('promotions')}
                >
                  <i className="ti ti-list me-2"></i>
                  All Promotions
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'process' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('process')}
                >
                  <i className="ti ti-arrow-up me-2"></i>
                  Process Promotions
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'criteria' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('criteria')}
                >
                  <i className="ti ti-settings me-2"></i>
                  Promotion Criteria
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'reports' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('reports')}
                >
                  <i className="ti ti-file-text me-2"></i>
                  Promotion Reports
                </button>
                <button 
                  className={`nav-link text-start mb-2 ${selectedSection === 'certificates' ? 'active' : ''}`}
                  onClick={() => setSelectedSection('certificates')}
                >
                  <i className="ti ti-certificate me-2"></i>
                  Certificates
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
                    <h5 className="card-title mb-0">Promotion Status</h5>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-around text-center">
                      <div>
                        <h4 className="text-success">{promotionData?.overview.eligibleForPromotion}</h4>
                        <small className="text-muted">Eligible</small>
                      </div>
                      <div>
                        <h4 className="text-warning">{promotionData?.overview.notEligibleForPromotion}</h4>
                        <small className="text-muted">Not Eligible</small>
                      </div>
                      <div>
                        <h4 className="text-info">{promotionData?.overview.promotedStudents}</h4>
                        <small className="text-muted">Promoted</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Promotion Criteria</h5>
                  </div>
                  <div className="card-body">
                    {promotionData?.promotionCriteria.map((criteria, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <h6 className="mb-0">{criteria.category}</h6>
                          <small className="text-muted">{criteria.requirement}</small>
                        </div>
                        <div className="text-end">
                          <span className="badge bg-primary">{criteria.minimumValue}</span>
                          {criteria.weight > 0 && <small className="text-muted d-block">Weight: {criteria.weight}%</small>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Grade-wise Promotion</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Current Grade</th>
                            <th>Total Students</th>
                            <th>Eligible</th>
                            <th>Promoted</th>
                            <th>Retained</th>
                            <th>Promotion Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {promotionData?.gradeWisePromotion.map((grade, index) => (
                            <tr key={index}>
                              <td>{grade.grade}</td>
                              <td>{grade.totalStudents}</td>
                              <td>{grade.eligible}</td>
                              <td>{grade.promoted}</td>
                              <td>{grade.retained}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <span className={`badge bg-${
                                    grade.promotionRate >= 90 ? 'success' :
                                    grade.promotionRate >= 75 ? 'warning' : 'danger'
                                  } me-2`}>
                                    {grade.promotionRate}%
                                  </span>
                                  <div className="progress" style={{ width: '100px', height: '8px' }}>
                                    <div 
                                      className={`progress-bar bg-${
                                        grade.promotionRate >= 90 ? 'success' :
                                        grade.promotionRate >= 75 ? 'warning' : 'danger'
                                      }`}
                                      style={{ width: `${grade.promotionRate}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Promotions */}
          {selectedSection === 'promotions' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Student Promotions</h5>
                <div className="d-flex gap-2">
                  <select 
                    className="form-select form-select-sm"
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                  >
                    <option value="all">All Grades</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                  </select>
                  <select 
                    className="form-select form-select-sm"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="Eligible">Eligible</option>
                    <option value="Not Eligible">Not Eligible</option>
                    <option value="Promoted">Promoted</option>
                    <option value="Retained">Retained</option>
                    <option value="Pending">Pending</option>
                  </select>
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
                        <th>Student Name</th>
                        <th>Current Grade</th>
                        <th>Proposed Grade</th>
                        <th>Attendance</th>
                        <th>Overall %</th>
                        <th>GPA</th>
                        <th>Criteria Met</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPromotions.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="text-center text-muted">
                            No promotion data found. Click "Process Promotions" to evaluate students.
                          </td>
                        </tr>
                      ) : (
                        filteredPromotions.map((promotion) => (
                          <tr key={promotion.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar avatar-sm bg-primary text-white rounded-circle me-2">
                                  {promotion.studentName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h6 className="mb-0">{promotion.studentName}</h6>
                                  <small className="text-muted">ID: {promotion.studentId}</small>
                                </div>
                              </div>
                            </td>
                            <td>{promotion.currentGrade} - {promotion.currentSection}</td>
                            <td>{promotion.proposedGrade} - {promotion.proposedSection}</td>
                            <td>
                              <span className={`badge bg-${
                                promotion.attendancePercentage >= 75 ? 'success' : 'danger'
                              }`}>
                                {promotion.attendancePercentage}%
                              </span>
                            </td>
                            <td>{promotion.overallPercentage}%</td>
                            <td>{promotion.gradePointAverage}</td>
                            <td>
                              <div>
                                <span className={`badge bg-${
                                  promotion.promotionCriteria.attendanceMet ? 'success' : 'danger'
                                } me-1`}>
                                  A
                                </span>
                                <span className={`badge bg-${
                                  promotion.promotionCriteria.academicMet ? 'success' : 'danger'
                                } me-1`}>
                                  Ac
                                </span>
                                <span className={`badge bg-${
                                  promotion.promotionCriteria.behaviorMet ? 'success' : 'danger'
                                } me-1`}>
                                  B
                                </span>
                                <span className={`badge bg-${
                                  promotion.promotionCriteria.feesPaid ? 'success' : 'danger'
                                }`}>
                                  F
                                </span>
                              </div>
                              <small className="text-muted">A=Attendance, Ac=Academic, B=Behavior, F=Fees</small>
                            </td>
                            <td>
                              <span className={`badge ${
                                promotion.promotionStatus === 'Eligible' ? 'bg-success' :
                                promotion.promotionStatus === 'Not Eligible' ? 'bg-danger' :
                                promotion.promotionStatus === 'Promoted' ? 'bg-primary' :
                                promotion.promotionStatus === 'Retained' ? 'bg-warning' : 'bg-info'
                              }`}>
                                {promotion.promotionStatus}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary" title="View Details">
                                  <i className="ti ti-eye"></i>
                                </button>
                                {promotion.promotionStatus === 'Eligible' && (
                                  <button className="btn btn-outline-success" title="Promote">
                                    <i className="ti ti-arrow-up"></i>
                                  </button>
                                )}
                                {promotion.promotionStatus === 'Not Eligible' && (
                                  <button className="btn btn-outline-warning" title="Review">
                                    <i className="ti ti-edit"></i>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Process Promotions */}
          {selectedSection === 'process' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Process Student Promotions</h5>
              </div>
              <div className="card-body">
                <div className="alert alert-info">
                  <h6> Promotion Process for {promotionData?.overview.currentSession} → {promotionData?.overview.nextSession}</h6>
                  <p className="mb-0">This process will evaluate all students based on the promotion criteria and determine their eligibility for promotion to the next grade.</p>
                </div>
                
                <div className="mb-4">
                  <h6>Current Promotion Criteria</h6>
                  <div className="row">
                    {promotionData?.promotionCriteria.map((criteria, index) => (
                      <div className="col-md-6" key={index}>
                        <div className="card border">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="mb-0">{criteria.category}</h6>
                                <small className="text-muted">{criteria.requirement}</small>
                              </div>
                              <div className="text-end">
                                <span className="badge bg-primary">{criteria.minimumValue}</span>
                                {criteria.weight > 0 && <small className="text-muted d-block">Weight: {criteria.weight}%</small>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h6>Process Options</h6>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="dry-run" defaultChecked />
                    <label className="form-check-label" htmlFor="dry-run">
                      Run in dry-run mode (preview results without actual promotion)
                    </label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="notify-parents" />
                    <label className="form-check-label" htmlFor="notify-parents">
                      Send notifications to parents about promotion results
                    </label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="generate-certificates" />
                    <label className="form-check-label" htmlFor="generate-certificates">
                      Generate promotion certificates for promoted students
                    </label>
                  </div>
                </div>

                <div className="mb-4">
                  <h6>Grade Selection</h6>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="grade1" defaultChecked />
                        <label className="form-check-label" htmlFor="grade1">Grade 1 → Grade 2</label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="grade2" defaultChecked />
                        <label className="form-check-label" htmlFor="grade2">Grade 2 → Grade 3</label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="grade3" defaultChecked />
                        <label className="form-check-label" htmlFor="grade3">Grade 3 → Grade 4</label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="grade4" defaultChecked />
                        <label className="form-check-label" htmlFor="grade4">Grade 4 → Grade 5</label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="grade5" defaultChecked />
                        <label className="form-check-label" htmlFor="grade5">Grade 5 → Grade 6</label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-between">
                  <div>
                    <button className="btn btn-outline-primary">
                      <i className="ti ti-file-text me-1"></i>View Previous Results
                    </button>
                  </div>
                  <div>
                    <button className="btn btn-secondary me-2">Cancel</button>
                    <button className="btn btn-outline-warning me-2">
                      <i className="ti ti-eye me-1"></i>Preview Results
                    </button>
                    <button className="btn btn-primary">
                      <i className="ti ti-arrow-up me-1"></i>Start Process
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Promotion Criteria */}
          {selectedSection === 'criteria' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Promotion Criteria Settings</h5>
              </div>
              <div className="card-body">
                <form>
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Requirement</th>
                          <th>Minimum Value</th>
                          <th>Weight (%)</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {promotionData?.promotionCriteria.map((criteria, index) => (
                          <tr key={index}>
                            <td>{criteria.category}</td>
                            <td>{criteria.requirement}</td>
                            <td>
                              <input type="text" className="form-control form-control-sm" defaultValue={criteria.minimumValue} />
                            </td>
                            <td>
                              <input type="number" className="form-control form-control-sm" defaultValue={criteria.weight} />
                            </td>
                            <td>
                              <div className="form-check form-switch">
                                <input className="form-check-input" type="checkbox" defaultChecked />
                              </div>
                            </td>
                            <td>
                              <button className="btn btn-outline-primary btn-sm">
                                <i className="ti ti-edit"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mb-3">
                    <h6>Add New Criterion</h6>
                    <div className="row">
                      <div className="col-md-3">
                        <input type="text" className="form-control" placeholder="Category" />
                      </div>
                      <div className="col-md-3">
                        <input type="text" className="form-control" placeholder="Requirement" />
                      </div>
                      <div className="col-md-2">
                        <input type="text" className="form-control" placeholder="Min Value" />
                      </div>
                      <div className="col-md-2">
                        <input type="number" className="form-control" placeholder="Weight %" />
                      </div>
                      <div className="col-md-2">
                        <button className="btn btn-primary btn-sm">
                          <i className="ti ti-plus"></i> Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end">
                    <button type="submit" className="btn btn-primary">
                      <i className="ti ti-settings me-1"></i>Save Criteria
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Promotion Reports */}
          {selectedSection === 'reports' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Promotion Reports</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-file-text fs-24 text-primary mb-2"></i>
                        <h6>Promotion Summary</h6>
                        <p className="text-muted small">Complete promotion report</p>
                        <button className="btn btn-primary btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-users fs-24 text-success mb-2"></i>
                        <h6>Student-wise Report</h6>
                        <p className="text-muted small">Individual student reports</p>
                        <button className="btn btn-success btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-chart-bar fs-24 text-warning mb-2"></i>
                        <h6>Grade-wise Report</h6>
                        <p className="text-muted small">Grade-wise analysis</p>
                        <button className="btn btn-warning btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-exclamation-circle fs-24 text-danger mb-2"></i>
                        <h6>Non-eligible Students</h6>
                        <p className="text-muted small">Students not eligible</p>
                        <button className="btn btn-danger btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-certificate fs-24 text-info mb-2"></i>
                        <h6>Certificate Report</h6>
                        <p className="text-muted small">Promotion certificates</p>
                        <button className="btn btn-info btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border h-100">
                      <div className="card-body text-center">
                        <i className="ti ti-mail fs-24 text-secondary mb-2"></i>
                        <h6>Parent Communication</h6>
                        <p className="text-muted small">Notification reports</p>
                        <button className="btn btn-secondary btn-sm">Generate</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Certificates */}
          {selectedSection === 'certificates' && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Promotion Certificates</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Grade</th>
                        <th>Promoted To</th>
                        <th>Certificate Status</th>
                        <th>Generated Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={7} className="text-center text-muted">
                          No certificates generated yet. Process promotions first to generate certificates.
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

export default AdminPromotionPage;
