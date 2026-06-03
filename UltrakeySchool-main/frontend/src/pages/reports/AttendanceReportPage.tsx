import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface AttendanceRecord {
  _id: string;
  userId: { _id: string; name: string; email: string; avatar?: string; };
  studentId?: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'holiday';
  checkInTime?: string;
  checkOutTime?: string;
}

interface PersonSummary {
  id: string;
  name: string;
  avatar?: string;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  holiday: number;
  total: number;
  percentage: number;
  records: AttendanceRecord[];
}

const TABS = [
  { key: 'attendance-report', label: 'Attendance Report' },
  { key: 'students-type', label: 'Students Attendance Type' },
  { key: 'student-daywise', label: 'Student Day Wise' },
  { key: 'teacher-daywise', label: 'Teacher Day Wise' },
  { key: 'teacher-report', label: 'Teacher Report' },
  { key: 'staff-daywise', label: 'Staff Day Wise' },
  { key: 'staff-report', label: 'Staff Report' },
];

const AttendanceReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('attendance-report');
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<PersonSummary[]>([]);
  const [daywiseData, setDaywiseData] = useState<AttendanceRecord[]>([]);
  const [filters, setFilters] = useState({
    class: '', section: '', name: '', gender: '', status: '', startDate: '', endDate: ''
  });

  const getInstitutionId = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) { const u = JSON.parse(userStr); return u.institutionId || u.institutionId || u.school || ''; }
    } catch { /* */ }
    return localStorage.getItem('institutionId') || localStorage.getItem('institutionId') || '';
  };
  const institutionId = getInstitutionId();

  const buildSummaries = useCallback((records: AttendanceRecord[]): PersonSummary[] => {
    const map = new Map<string, PersonSummary>();
    records.forEach(r => {
      const id = r.userId._id;
      if (!map.has(id)) {
        map.set(id, { id, name: r.userId.name, avatar: r.userId.avatar, present: 0, absent: 0, late: 0, halfDay: 0, holiday: 0, total: 0, percentage: 0, records: [] });
      }
      const s = map.get(id)!;
      s.records.push(r);
      s.total++;
      if (r.status === 'present') s.present++;
      else if (r.status === 'absent') s.absent++;
      else if (r.status === 'late') s.late++;
      else if (r.status === 'half-day') s.halfDay++;
      else if (r.status === 'holiday') s.holiday++;
      const working = s.total - s.holiday;
      s.percentage = working > 0 ? Math.round(((s.present + s.late + s.halfDay * 0.5) / working) * 100) : 0;
    });
    return Array.from(map.values());
  }, []);

  const fetchAttendanceReport = useCallback(async (userType: string = 'student') => {
    try {
      setLoading(true);
      setError(null);
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const sd = filters.startDate || firstDay.toISOString().split('T')[0];
      const ed = filters.endDate || now.toISOString().split('T')[0];
      const response = await apiClient.get('/attendance/report', {
        params: { institutionId, startDate: sd, endDate: ed, userType, format: 'json' }
      });
      if (response.data.success) {
        const records = response.data.data.attendance || [];
        setDaywiseData(records);
        setAttendanceData(buildSummaries(records));
      } else {
        setAttendanceData([]);
        setDaywiseData([]);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load attendance report';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [institutionId, filters.startDate, filters.endDate, buildSummaries]);

  useEffect(() => {
    fetchAttendanceReport('student');
  }, [fetchAttendanceReport]);

  const handleRefresh = () => {
    const userType = activeTab.includes('teacher') ? 'teacher' : activeTab.includes('staff') ? 'staff' : 'student';
    fetchAttendanceReport(userType);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const userType = activeTab.includes('teacher') ? 'teacher' : activeTab.includes('staff') ? 'staff' : 'student';
    fetchAttendanceReport(userType);
  };

  const resetFilters = () => {
    setFilters({ class: '', section: '', name: '', gender: '', status: '', startDate: '', endDate: '' });
    const userType = activeTab.includes('teacher') ? 'teacher' : activeTab.includes('staff') ? 'staff' : 'student';
    fetchAttendanceReport(userType);
  };

  const handleTabClick = (key: string) => {
    setActiveTab(key);
    setLoading(true);
    setError(null);
    if (key === 'teacher-daywise' || key === 'teacher-report') {
      fetchAttendanceReport('teacher');
    } else if (key === 'staff-daywise' || key === 'staff-report') {
      fetchAttendanceReport('staff');
    } else {
      fetchAttendanceReport('student');
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'present': return 'bg-success';
      case 'absent': return 'bg-danger';
      case 'late': return 'bg-pending';
      case 'half-day': return 'bg-dark';
      case 'holiday': return 'bg-info';
      default: return 'bg-light';
    }
  };

  const getDaysInMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  };

  const getAttendanceForDate = (records: AttendanceRecord[], day: number) => {
    const d = new Date();
    d.setDate(day);
    const ds = d.toISOString().split('T')[0];
    return records.find(r => r.date.startsWith(ds));
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = { present: 'success', absent: 'danger', late: 'warning', 'half-day': 'secondary', holiday: 'info' };
    return <span className={`badge bg-${colors[status] || 'light'}`}>{status}</span>;
  };

  const statusSummary = (data: PersonSummary[]) => ({
    present: data.reduce((s, p) => s + p.present, 0),
    absent: data.reduce((s, p) => s + p.absent, 0),
    late: data.reduce((s, p) => s + p.late, 0),
    halfDay: data.reduce((s, p) => s + p.halfDay, 0),
    holiday: data.reduce((s, p) => s + p.holiday, 0),
  });

  const renderDaywiseTable = () => (
    <div className="table-responsive">
      <table className="table datatable">
        <thead className="thead-light">
          <tr>
            <th>Name</th>
            <th>%</th>
            <th className="no-sort">P</th>
            <th className="no-sort">L</th>
            <th className="no-sort">A</th>
            <th className="no-sort">H</th>
            <th className="no-sort">Hol</th>
            {Array.from({ length: Math.min(getDaysInMonth(), 23) }, (_, i) => {
              const d = new Date(); d.setDate(i + 1);
              const day = d.toLocaleDateString('en-IN', { weekday: 'short' }).charAt(0);
              return (<th key={i} className="no-sort"><div className="text-center"><span className="day-num d-block">{String(i + 1).padStart(2, '0')}</span><span>{day}</span></div></th>);
            })}
          </tr>
        </thead>
        <tbody>
          {attendanceData.map(p => (
            <tr key={p.id}>
              <td><div className="d-flex align-items-center">
                {p.avatar ? <img src={p.avatar} className="avatar avatar-md rounded-circle me-2" alt={p.name} /> :
                  <div className="avatar avatar-md rounded-circle me-2 bg-light d-flex align-items-center justify-content-center"><i className="ti ti-user fs-16 text-muted"></i></div>}
                <span>{p.name}</span>
              </div></td>
              <td><span className={`badge ${p.percentage >= 90 ? 'badge-soft-success' : p.percentage >= 75 ? 'badge-soft-info' : 'badge-soft-warning'}`}>{p.percentage}%</span></td>
              <td>{p.present}</td><td>{p.late}</td><td>{p.absent}</td><td>{p.halfDay}</td><td>{p.holiday}</td>
              {Array.from({ length: Math.min(getDaysInMonth(), 23) }, (_, i) => {
                const att = getAttendanceForDate(p.records, i + 1);
                return (<td key={i}>{att ? <span className={`attendance-range ${getStatusClass(att.status)}`} title={`${att.date}: ${att.status}`}></span> : <span className="attendance-range bg-light"></span>}</td>);
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTypeTable = () => {
    const stats = statusSummary(attendanceData);
    const total = stats.present + stats.absent + stats.late + stats.halfDay + stats.holiday;
    const types = [
      { label: 'Present', count: stats.present, color: 'success', icon: 'ti ti-checks' },
      { label: 'Absent', count: stats.absent, color: 'danger', icon: 'ti ti-x' },
      { label: 'Late', count: stats.late, color: 'pending', icon: 'ti ti-clock-x' },
      { label: 'Halfday', count: stats.halfDay, color: 'dark', icon: 'ti ti-calendar-event' },
      { label: 'Holiday', count: stats.holiday, color: 'info', icon: 'ti ti-clock-up' },
    ];
    return (
      <div className="p-3">
        <div className="row g-3 mb-3">
          {types.map(t => (
            <div key={t.label} className="col-md-4 col-lg-3">
              <div className={`border rounded p-3 d-flex align-items-center`}>
                <span className={`attendance-icon bg-${t.color} me-3`}><i className={t.icon}></i></span>
                <div>
                  <h5 className="mb-0">{t.count}</h5>
                  <small className="text-muted">{t.label} ({total > 0 ? Math.round(t.count / total * 100) : 0}%)</small>
                </div>
              </div>
            </div>
          ))}
        </div>
        <h5 className="mb-3">Student-wise Breakdown</h5>
        <div className="table-responsive">
          <table className="table datatable">
            <thead className="thead-light">
              <tr><th>Name</th><th>Present</th><th>Absent</th><th>Late</th><th>Halfday</th><th>Holiday</th><th>%</th></tr>
            </thead>
            <tbody>
              {attendanceData.map(p => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td><span className="text-success">{p.present}</span></td>
                  <td><span className="text-danger">{p.absent}</span></td>
                  <td><span className="text-warning">{p.late}</span></td>
                  <td>{p.halfDay}</td>
                  <td>{p.holiday}</td>
                  <td><span className={`badge ${p.percentage >= 90 ? 'badge-soft-success' : p.percentage >= 75 ? 'badge-soft-info' : 'badge-soft-warning'}`}>{p.percentage}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (loading) return <div className="card-body text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div><p className="mt-2 text-muted">Loading...</p></div>;
    if (error) return <div className="card-body"><div className="alert alert-danger"><i className="ti ti-alert-circle me-2"></i>{error}<button className="btn btn-sm btn-outline-danger ms-3" onClick={handleRefresh}><i className="ti ti-refresh me-1"></i>Retry</button></div></div>;
    if (attendanceData.length === 0 && daywiseData.length === 0)
      return <div className="card-body text-center py-5"><i className="ti ti-calendar-stats" style={{ fontSize: '48px', color: '#ccc' }}></i><p className="mt-2 text-muted">No attendance records found</p></div>;

    switch (activeTab) {
      case 'students-type':
      case 'teacher-report':
      case 'staff-report':
        return renderTypeTable();
      case 'student-daywise':
      case 'teacher-daywise':
      case 'staff-daywise':
        return renderDaywiseTable();
      default:
        return renderDaywiseTable();
    }
  };

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Attendance Report</h3>
          <nav><ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
            <li className="breadcrumb-item"><Link to="#">Report</Link></li>
            <li className="breadcrumb-item active">Attendance Report</li>
          </ol></nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon me-1" onClick={handleRefresh} disabled={loading} title="Refresh">
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon me-1" onClick={() => window.print()} title="Print">
              <i className="ti ti-printer"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="filter-wrapper">
        <div className="list-tab">
          <ul className="nav nav-tabs">
            {TABS.map(tab => (
              <li key={tab.key} className="nav-item">
                <Link to="#" className={`nav-link ${activeTab === tab.key ? 'active' : ''}`} onClick={() => handleTabClick(tab.key)}>
                  {tab.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="attendance-types page-header justify-content-end mb-4">
        <ul className="attendance-type-list d-flex flex-wrap gap-3">
          <li className="d-flex align-items-center"><span className="attendance-icon bg-success me-1"><i className="ti ti-checks"></i></span>Present</li>
          <li className="d-flex align-items-center"><span className="attendance-icon bg-danger me-1"><i className="ti ti-x"></i></span>Absent</li>
          <li className="d-flex align-items-center"><span className="attendance-icon bg-pending me-1"><i className="ti ti-clock-x"></i></span>Late</li>
          <li className="d-flex align-items-center"><span className="attendance-icon bg-dark me-1"><i className="ti ti-calendar-event"></i></span>Halfday</li>
          <li className="d-flex align-items-center"><span className="attendance-icon bg-info me-1"><i className="ti ti-clock-up"></i></span>Holiday</li>
        </ul>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">{TABS.find(t => t.key === activeTab)?.label || 'Attendance'}</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon"><i className="ti ti-calendar"></i></span>
              <input type="text" className="form-control date-range bookingrange" placeholder="Select" defaultValue="Academic Year : 2024 / 2025" readOnly />
            </div>
            <div className="dropdown mb-3 me-2">
              <button className="btn btn-outline-light bg-white dropdown-toggle" onClick={() => setShowFilter(!showFilter)}>
                <i className="ti ti-filter me-2"></i>Filter
              </button>
            </div>
          </div>
        </div>

        {showFilter && (
          <div className="p-3 border-bottom">
            <form onSubmit={handleApplyFilters}>
              <div className="row">
                {['startDate', 'endDate'].map(f => (
                  <div key={f} className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">{f === 'startDate' ? 'Start Date' : 'End Date'}</label>
                      <input type="date" className="form-control" name={f} value={(filters as any)[f]} onChange={handleFilterChange} />
                    </div>
                  </div>
                ))}
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select className="form-select" name="status" value={filters.status} onChange={handleFilterChange}>
                      <option value="">All</option>
                      <option>present</option><option>absent</option><option>late</option><option>half-day</option><option>holiday</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-end mt-3">
                <button type="button" className="btn btn-light me-2" onClick={resetFilters}>Reset</button>
                <button type="submit" className="btn btn-primary">Apply</button>
              </div>
            </form>
          </div>
        )}

        {renderTabContent()}
      </div>
    </>
  );
};

export default AttendanceReportPage;
