import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';

interface HostelRoomData {
  id: string;
  roomNumber: string;
  hostel?: string;
  block?: string;
  type?: string;
  floor?: number;
  currentResidents: number;
  capacity: number;
  occupied?: number;
  rent?: number;
  status?: string;
}

interface HostelStatistics {
  totalRooms: number;
  vacantRooms: number;
  occupiedRooms?: number;
  totalResidents: number;
  maintenanceIssues: number;
  pendingComplaints: number;
}

const HostelReportPage: React.FC = () => {
  const [rooms, setRooms] = useState<HostelRoomData[]>([]);
  const [hostelStats, setHostelStats] = useState<HostelStatistics>({
    totalRooms: 0,
    vacantRooms: 0,
    totalResidents: 0,
    maintenanceIssues: 0,
    pendingComplaints: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<HostelRoomData | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDashboardStats();
    fetchRooms();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await apiClient.get('/hostel/dashboard/stats');
      
      if (response.data.success) {
        const data = response.data.data || {};
        setHostelStats({
          totalRooms: data.totalRooms || 0,
          vacantRooms: data.vacantRooms || 0,
          occupiedRooms: data.occupiedRooms || 0,
          totalResidents: data.totalResidents || 0,
          maintenanceIssues: data.maintenanceIssues || 0,
          pendingComplaints: data.pendingComplaints || 0
        });
      }
    } catch (err: any) {
      console.error('Error fetching statistics:', err);
      setError(err.response?.data?.error?.message || err.message || 'Failed to load statistics');
    }
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/hostel/dashboard/rooms');
      
      if (response.data.success) {
        // Handle both old format (roomData) and new format (rooms)
        const roomData = response.data.data?.rooms || response.data.data?.roomData || [];
        setRooms(roomData.map((r: any) => ({
          id: r.id,
          roomNumber: r.roomNumber,
          hostel: r.hostel,
          block: r.block,
          type: r.type,
          floor: r.floor,
          currentResidents: r.currentResidents || 0,
          capacity: r.capacity,
          occupied: r.occupied,
          rent: r.rent,
          status: r.status
        })));
      } else {
        setError(response.data.error?.message || response.data.message || 'Failed to load rooms');
      }
    } catch (err: any) {
      console.error('Error fetching rooms:', err);
      setError(err.response?.data?.error?.message || err.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRoom = (room: HostelRoomData) => {
    setSelectedRoom(room);
    setShowViewModal(true);
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (room.block && room.block.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'occupied' && room.currentResidents > 0) ||
      (filterType === 'available' && room.currentResidents < room.capacity);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Hostel Reports</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">Reports</li>
              <li className="breadcrumb-item active" aria-current="page">
                Hostel Report
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <button 
            className="btn btn-primary d-flex align-items-center mb-2"
            onClick={() => window.print()}
          >
            <i className="ti ti-file-plus me-2" />
            Print Report
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-3">
          <i className="ti ti-alert-circle me-2" />
          {error}
          <button 
            type="button" 
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={fetchRooms}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
      <div className="row">
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1">Total Rooms</p>
                  <h4 className="mb-0">{hostelStats.totalRooms}</h4>
                </div>
                <div className="avatar avatar-md bg-primary-transparent">
                  <i className="ti ti-building text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1">Vacant Rooms</p>
                  <h4 className="mb-0">{hostelStats.vacantRooms}</h4>
                </div>
                <div className="avatar avatar-md bg-info-transparent">
                  <i className="ti ti-door text-info" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1">Total Residents</p>
                  <h4 className="mb-0">{hostelStats.totalResidents}</h4>
                </div>
                <div className="avatar avatar-md bg-success-transparent">
                  <i className="ti ti-user-check text-success" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1">Pending Complaints</p>
                  <h4 className="mb-0">{hostelStats.pendingComplaints}</h4>
                </div>
                <div className="avatar avatar-md bg-warning-transparent">
                  <i className="ti ti-alert-circle text-warning" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms Table */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap">
          <h4 className="card-title">Room Occupancy</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start me-2">
              <span className="icon-addon">
                <i className="ti ti-search" />
              </span>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="form-select" 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Rooms</option>
              <option value="occupied">Occupied</option>
              <option value="available">Available</option>
            </select>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" />
                    </div>
                  </th>
                  <th>Room Number</th>
                  <th>Block</th>
                  <th>Current Residents</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room) => (
                  <tr key={room.id}>
                    <td>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" />
                      </div>
                    </td>
                    <td>{room.roomNumber}</td>
                    <td>{room.block}</td>
                    <td>{room.currentResidents}</td>
                    <td>{room.capacity}</td>
                    <td>
                      <span className={`badge ${room.currentResidents > 0 ? 'bg-success' : 'bg-warning'}`}>
                        {room.currentResidents > 0 ? 'Occupied' : 'Available'}
                      </span>
                    </td>
                    <td>
                      <div className="dropdown">
                        <button className="btn btn-white btn-icon btn-sm" data-bs-toggle="dropdown">
                          <i className="ti ti-dots-vertical" />
                        </button>
                        <ul className="dropdown-menu">
                          <li>
                            <button 
                              className="dropdown-item" 
                              onClick={() => handleViewRoom(room)}
                            >
                              <i className="ti ti-eye me-2" />
                              View Details
                            </button>
                          </li>
                          <li>
                            <button 
                              className="dropdown-item"
                              onClick={() => window.print()}
                            >
                              <i className="ti ti-printer me-2" />
                              Print
                            </button>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
        </>
      )}

      {/* View Room Modal */}
      {showViewModal && selectedRoom && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Room Details</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowViewModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Room Number</label>
                      <p className="form-control-plaintext">{selectedRoom.roomNumber}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Block</label>
                      <p className="form-control-plaintext">{selectedRoom.block}</p>
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Capacity</label>
                      <p className="form-control-plaintext">{selectedRoom.capacity}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Current Residents</label>
                      <p className="form-control-plaintext">{selectedRoom.currentResidents}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
                <button type="button" className="btn btn-info" onClick={() => window.print()}>
                  <i className="ti ti-printer me-2" />
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HostelReportPage;
