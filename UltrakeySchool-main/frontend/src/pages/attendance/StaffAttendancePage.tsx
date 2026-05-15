import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface StaffAttendance {
  _id: string;
  staffId: string;
  staffName: string;
  staffAvatar?: string;
  department: string;
  designation: string;
  attendance: 'present' | 'late' | 'absent' | 'holiday' | 'halfday';
  notes: string;
  date: string;
}

const StaffAttendancePage: React.FC = () => {
  const [staffAttendance, setStaffAttendance] = useState<StaffAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchStaffAttendance();
  }, [selectedDate]);

  const fetchStaffAttendance = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/attendance/staff', {
        params: { date: selectedDate }
      });
      setStaffAttendance(response.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch staff attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = async (staffId: string, status: StaffAttendance['attendance']) => {
    try {
      await apiClient.post('/attendance/mark', {
        staffId,
        date: selectedDate,
        status
      });
      
      setStaffAttendance(staffAttendance.map(staff => 
        staff.staffId === staffId ? { ...staff, attendance: status } : staff
      ));
      toast.success('Attendance updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update attendance');
    }
  };

  const handleNoteChange = async (staffId: string, note: string) => {
    setStaffAttendance(staffAttendance.map(staff => 
      staff.staffId === staffId ? { ...staff, notes: note } : staff
    ));
  };

  const handleSaveNotes = async (staffId: string) => {
    const staff = staffAttendance.find(s => s.staffId === staffId);
    if (!staff) return;

    try {
      await apiClient.put(`/attendance/${staff._id}`, {
        notes: staff.notes
      });
      toast.success('Notes saved successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save notes');
    }
  };

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedStaff(staffAttendance.map(staff => staff.staffId));
    } else {
      setSelectedStaff([]);
    }
  };

  const toggleStaffSelection = (staffId: string) => {
    if (selectedStaff.includes(staffId)) {
      setSelectedStaff(selectedStaff.filter(id => id !== staffId));
    } else {
      setSelectedStaff([...selectedStaff, staffId]);
    }
  };

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Staff Attendance</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <a href="#!">Report</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Staff Attendance</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              onClick={fetchStaffAttendance}
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button 
              type="button" 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={() => window.print()}
              title="Print"
            >
              <i className="ti ti-printer"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Staff Attendance List</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-calendar"></i>
              </span>
              <input 
                type="date" 
                className="form-control" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="card-body p-0 py-3">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : staffAttendance.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-users-off" style={{ fontSize: '48px', opacity: 0.3 }} />
              <p className="text-muted mt-3">No staff records found for this date</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <div className="form-check form-check-md">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="select-all"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Attendance</th>
                    <th style={{ minWidth: '200px' }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {staffAttendance.map((staff) => (
                    <tr key={staff.staffId}>
                      <td>
                        <div className="form-check form-check-md">
                          <input 
                            className="form-check-input" 
                            type="checkbox"
                            checked={selectedStaff.includes(staff.staffId)}
                            onChange={() => toggleStaffSelection(staff.staffId)}
                          />
                        </div>
                      </td>
                      <td><span className="link-primary">{staff.staffId}</span></td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-md">
                            <img
                              src={staff.staffAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.staffName)}&background=random`}
                              className="img-fluid rounded-circle"
                              alt={staff.staffName}
                            />
                          </div>
                          <div className="ms-2">
                            <p className="text-dark mb-0">{staff.staffName}</p>
                          </div>
                        </div>
                      </td>
                      <td>{staff.department}</td>
                      <td>{staff.designation}</td>
                      <td>
                        <div className="d-flex align-items-center check-radio-group flex-nowrap">
                          {(['present', 'late', 'absent', 'holiday', 'halfday'] as const).map((status) => (
                            <label key={status} className="custom-radio">
                              <input
                                type="radio"
                                name={`staff-${staff.staffId}`}
                                checked={staff.attendance === status}
                                onChange={() => handleAttendanceChange(staff.staffId, status)}
                              />
                              <span className="checkmark"></span>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </label>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter notes"
                            value={staff.notes}
                            onChange={(e) => handleNoteChange(staff.staffId, e.target.value)}
                            onBlur={() => handleSaveNotes(staff.staffId)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StaffAttendancePage;
