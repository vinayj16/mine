import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface Player {
  _id: string;
  playerId: string;
  name: string;
  avatar?: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  sportId: {
    _id: string;
    name: string;
  };
  sportName: string;
  position?: string;
  jerseyNumber?: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'injured' | 'suspended';
  createdAt: string;
}

interface FormData {
  studentId: string;
  name: string;
  sportId: string;
  sportName: string;
  position: string;
  jerseyNumber: string;
  joinDate: string;
  status: string;
}

const PlayersPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [formData, setFormData] = useState<FormData>({
    studentId: '',
    name: '',
    sportId: '',
    sportName: '',
    position: '',
    jerseyNumber: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'active'
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchPlayers = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get('/players', {
        params: { limit: 100 }
      })

      if (response.data.success) {
        setPlayers(response.data.data.players || [])
      }
    } catch (err: any) {
      console.error('Error fetching players:', err)
      const errorMessage = err.response?.data?.message || 'Failed to load players'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlayers()
  }, [])

  const handleRefresh = () => {
    fetchPlayers()
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Player name is required')
      return false
    }
    if (!formData.sportName.trim()) {
      toast.error('Sport name is required')
      return false
    }
    if (!formData.joinDate) {
      toast.error('Join date is required')
      return false
    }
    return true
  }

  // Handle add player
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return

    try {
      setSubmitting(true)

      const playerData = {
        studentId: formData.studentId || undefined,
        name: formData.name.trim(),
        sportId: formData.sportId || undefined,
        sportName: formData.sportName.trim(),
        position: formData.position.trim() || undefined,
        jerseyNumber: formData.jerseyNumber.trim() || undefined,
        joinDate: new Date(formData.joinDate),
        status: formData.status
      }

      const response = await apiClient.post('/players', playerData)

      if (response.data.success) {
        toast.success('Player added successfully')
        setShowAddModal(false)
        setFormData({
          studentId: '',
          name: '',
          sportId: '',
          sportName: '',
          position: '',
          jerseyNumber: '',
          joinDate: new Date().toISOString().split('T')[0],
          status: 'active'
        })
        fetchPlayers()
      }
    } catch (err: any) {
      console.error('Error adding player:', err)
      const errorMessage = err.response?.data?.message || 'Failed to add player'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  };

  // Handle edit player
  const handleEditPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setFormData({
      studentId: player.studentId?._id || '',
      name: player.name,
      sportId: player.sportId?._id || '',
      sportName: player.sportName,
      position: player.position || '',
      jerseyNumber: player.jerseyNumber || '',
      joinDate: new Date(player.joinDate).toISOString().split('T')[0],
      status: player.status
    });
    setShowEditModal(true);
  };

  // Handle update player
  const handleUpdatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;
    
    if (!validateForm()) return

    try {
      setSubmitting(true)

      const playerData = {
        name: formData.name.trim(),
        sportName: formData.sportName.trim(),
        position: formData.position.trim() || undefined,
        jerseyNumber: formData.jerseyNumber.trim() || undefined,
        joinDate: new Date(formData.joinDate),
        status: formData.status
      }

      const response = await apiClient.put(`/players/${selectedPlayer._id}`, playerData)

      if (response.data.success) {
        toast.success('Player updated successfully')
        setShowEditModal(false)
        setSelectedPlayer(null)
        setFormData({
          studentId: '',
          name: '',
          sportId: '',
          sportName: '',
          position: '',
          jerseyNumber: '',
          joinDate: new Date().toISOString().split('T')[0],
          status: 'active'
        })
        fetchPlayers()
      }
    } catch (err: any) {
      console.error('Error updating player:', err)
      const errorMessage = err.response?.data?.message || 'Failed to update player'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  };

  // Handle delete player
  const handleDeletePlayer = async () => {
    if (!selectedPlayer) return;

    try {
      const response = await apiClient.delete(`/players/${selectedPlayer._id}`)

      if (response.data.success) {
        toast.success('Player deleted successfully')
        setShowDeleteModal(false)
        setSelectedPlayer(null)
        fetchPlayers()
      }
    } catch (err: any) {
      console.error('Error deleting player:', err)
      const errorMessage = err.response?.data?.message || 'Failed to delete player'
      toast.error(errorMessage)
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    })
  }

  return (
    <>
      
        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Players</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/dashboard">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <a href="#!">Management</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Players</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="pe-1 mb-2">
              <button 
                className="btn btn-outline-light bg-white btn-icon me-1"
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh"
              >
                <i className="ti ti-refresh"></i>
              </button>
            </div>
            <div className="pe-1 mb-2">
              <button 
                className="btn btn-outline-light bg-white btn-icon me-1"
                onClick={() => window.print()}
                title="Print"
              >
                <i className="ti ti-printer"></i>
              </button>
            </div>
            <div className="dropdown me-2 mb-2">
              <button 
                className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center"
                data-bs-toggle="dropdown"
              >
                <i className="ti ti-file-export me-2"></i>Export
              </button>
              <ul className="dropdown-menu dropdown-menu-end p-3">
                <li>
                  <a href="#!" className="dropdown-item rounded-1">
                    <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                  </a>
                </li>
                <li>
                  <a href="#!" className="dropdown-item rounded-1">
                    <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                  </a>
                </li>
              </ul>
            </div>
            <div className="mb-2">
              <button 
                className="btn btn-primary d-flex align-items-center"
                onClick={() => setShowAddModal(true)}
              >
                <i className="ti ti-square-rounded-plus me-2"></i>Add Player
              </button>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Players List</h4>
            <div className="d-flex align-items-center flex-wrap">
              <div className="input-icon-start mb-3 me-2 position-relative">
                <span className="icon-addon">
                  <i className="ti ti-calendar"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control date-range bookingrange" 
                  placeholder="Select"
                  value="Academic Year : 2024 / 2025"
                  readOnly
                />
              </div>
              
              <div className="dropdown mb-3 me-2">
                <button 
                  className="btn btn-outline-light bg-white dropdown-toggle"
                  data-bs-toggle="dropdown" 
                  data-bs-auto-close="outside"
                >
                  <i className="ti ti-filter me-2"></i>Filter
                </button>
                <div className="dropdown-menu drop-width">
                  <form>
                    <div className="d-flex align-items-center border-bottom p-3">
                      <h4>Filter</h4>
                    </div>
                    <div className="p-3 border-bottom">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Player</label>
                            <select className="form-select">
                              <option>Select</option>
                              <option>Francis</option>
                              <option>Cheryl</option>
                              <option>Daniel</option>
                              <option>Irene</option>
                              <option>Keith</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Sports</label>
                            <select className="form-select">
                              <option>Select</option>
                              <option>Cricket</option>
                              <option>Throwball</option>
                              <option>Football</option>
                              <option>Tennis</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 d-flex align-items-center justify-content-end">
                      <button type="button" className="btn btn-light me-3">Reset</button>
                      <button type="submit" className="btn btn-primary">Apply</button>
                    </div>
                  </form>
                </div>
              </div>
              
              <div className="dropdown mb-3">
                <button 
                  className="btn btn-outline-light bg-white dropdown-toggle"
                  data-bs-toggle="dropdown"
                >
                  <i className="ti ti-sort-ascending-2 me-2"></i>Sort by A-Z
                </button>
                <ul className="dropdown-menu p-3">
                  <li>
                    <a href="#!" className="dropdown-item rounded-1 active">
                      Ascending
                    </a>
                  </li>
                  <li>
                    <a href="#!" className="dropdown-item rounded-1">
                      Descending
                    </a>
                  </li>
                  <li>
                    <a href="#!" className="dropdown-item rounded-1">
                      Recently Viewed
                    </a>
                  </li>
                  <li>
                    <a href="#!" className="dropdown-item rounded-1">
                      Recently Added
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Loading State */}
          {loading && (
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading players...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="card-body">
              <div className="alert alert-danger" role="alert">
                <i className="ti ti-alert-circle me-2"></i>
                {error}
                <button
                  className="btn btn-sm btn-outline-danger ms-3"
                  onClick={fetchPlayers}
                >
                  <i className="ti ti-refresh me-1"></i>Retry
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && players.length === 0 && (
            <div className="card-body text-center py-5">
              <i className="ti ti-trophy" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <p className="mt-2 text-muted">No players found</p>
              <button className="btn btn-primary mt-2" onClick={() => setShowAddModal(true)}>
                <i className="ti ti-square-rounded-plus me-2" />
                Add First Player
              </button>
            </div>
          )}

          {/* Players Table */}
          {!loading && !error && players.length > 0 && (
          <div className="card-body p-0 py-3">
            <div className="custom-datatable-filter table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <div className="form-check form-check-md">
                        <input className="form-check-input" type="checkbox" id="select-all" />
                      </div>
                    </th>
                    <th>ID</th>
                    <th>Player Name</th>
                    <th>Sports</th>
                    <th>Date of Join</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={player._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td><a href="#!" className="link-primary">{player.playerId}</a></td>
                      <td>
                        <div className="d-flex align-items-center">
                          <a href="#!" className="avatar avatar-md">
                            {player.avatar || player.studentId?.avatar ? (
                              <img 
                                src={player.avatar || player.studentId?.avatar} 
                                className="img-fluid rounded-circle" 
                                alt={player.name} 
                              />
                            ) : (
                              <div className="d-flex align-items-center justify-content-center w-100 h-100 bg-light rounded-circle">
                                <i className="ti ti-user fs-16 text-muted"></i>
                              </div>
                            )}
                          </a>
                          <div className="ms-2">
                            <p className="text-dark mb-0">
                              <a href="#!">{player.name}</a>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>{player.sportName}</td>
                      <td>{formatDate(player.joinDate)}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="dropdown">
                            <button
                              className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
                              data-bs-toggle="dropdown" 
                              aria-expanded="false"
                            >
                              <i className="ti ti-dots-vertical fs-14"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end p-3">
                              <li>
                                <button 
                                  className="dropdown-item rounded-1"
                                  onClick={() => handleEditPlayer(player)}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item rounded-1 text-danger"
                                  onClick={() => {
                                    setSelectedPlayer(player);
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  <i className="ti ti-trash-x me-2"></i>Delete
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>
      

      {/* Add Player Modal */}
      {showAddModal && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Player</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleAddPlayer}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Player Name *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Sport Name *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="sportName"
                          value={formData.sportName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Student ID (Optional)</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="studentId"
                          value={formData.studentId}
                          onChange={handleInputChange}
                          placeholder="MongoDB ObjectId"
                        />
                        <small className="text-muted">Link to existing student record</small>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Sport ID (Optional)</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="sportId"
                          value={formData.sportId}
                          onChange={handleInputChange}
                          placeholder="MongoDB ObjectId"
                        />
                        <small className="text-muted">Link to existing sport record</small>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Position</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="position"
                          value={formData.position}
                          onChange={handleInputChange}
                          placeholder="e.g., Forward, Goalkeeper"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Jersey Number</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="jerseyNumber"
                          value={formData.jerseyNumber}
                          onChange={handleInputChange}
                          placeholder="e.g., 10"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Date of Join *</label>
                        <input 
                          type="date" 
                          className="form-control"
                          name="joinDate"
                          value={formData.joinDate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Status</label>
                        <select 
                          className="form-select"
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="injured">Injured</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => setShowAddModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Adding...
                      </>
                    ) : (
                      'Add Player'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Player Modal */}
      {showEditModal && selectedPlayer && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Player</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleUpdatePlayer}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Player Name *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Sport Name *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="sportName"
                          value={formData.sportName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Position</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="position"
                          value={formData.position}
                          onChange={handleInputChange}
                          placeholder="e.g., Forward, Goalkeeper"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Jersey Number</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="jerseyNumber"
                          value={formData.jerseyNumber}
                          onChange={handleInputChange}
                          placeholder="e.g., 10"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Date of Join *</label>
                        <input 
                          type="date" 
                          className="form-control"
                          name="joinDate"
                          value={formData.joinDate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Status</label>
                        <select 
                          className="form-select"
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="injured">Injured</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => setShowEditModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Updating...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <form>
                <div className="modal-body text-center">
                  <span className="delete-icon">
                    <i className="ti ti-trash-x"></i>
                  </span>
                  <h4>Confirm Deletion</h4>
                  <p>Are you sure you want to delete this player? This action cannot be undone.</p>
                  <div className="d-flex justify-content-center">
                    <button 
                      type="button" 
                      className="btn btn-light me-3" 
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger"
                      onClick={handleDeletePlayer}
                    >
                      Yes, Delete
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayersPage;