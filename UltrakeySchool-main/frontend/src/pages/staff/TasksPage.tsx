import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

interface StaffTask {
  _id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assignedBy: {
    _id: string;
    name: string;
    email: string;
  };
  assignedTo: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  attachments?: string[];
  notes?: string;
}

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<StaffTask | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for new task
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as StaffTask['priority'],
    dueDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/tasks');
      
      if (response.data.success) {
        setTasks(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast.error(error.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/tasks', formData);
      
      if (response.data.success) {
        toast.success('Task created successfully');
        setShowAddModal(false);
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          dueDate: '',
          notes: ''
        });
        fetchTasks();
      }
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: StaffTask['status']) => {
    try {
      const response = await apiClient.put(`/tasks/${taskId}`, { status });
      
      if (response.data.success) {
        toast.success('Task status updated successfully');
        fetchTasks();
      }
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  };

  const getPriorityColor = (priority: StaffTask['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-danger';
      case 'high': return 'bg-warning';
      case 'medium': return 'bg-info';
      case 'low': return 'bg-secondary';
      default: return 'bg-light';
    }
  };

  const getStatusColor = (status: StaffTask['status']) => {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'in-progress': return 'bg-primary';
      case 'pending': return 'bg-warning';
      case 'cancelled': return 'bg-danger';
      default: return 'bg-light';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* PAGE HEADER */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">My Tasks</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/dashboard/staff">Dashboard</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Tasks</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <i className="ti ti-plus me-1" />New Task
          </button>
        </div>
      </div>

      {/* FILTERS AND STATS */}
      <div className="row mb-3">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <select
            className="form-control"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="col-md-2">
          <select
            className="form-control"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="col-md-4">
          <div className="d-flex gap-2">
            <div className="flex-fill text-center">
              <small className="text-muted d-block">Pending</small>
              <strong className="text-warning">{tasks.filter(t => t.status === 'pending').length}</strong>
            </div>
            <div className="flex-fill text-center">
              <small className="text-muted d-block">In Progress</small>
              <strong className="text-primary">{tasks.filter(t => t.status === 'in-progress').length}</strong>
            </div>
            <div className="flex-fill text-center">
              <small className="text-muted d-block">Completed</small>
              <strong className="text-success">{tasks.filter(t => t.status === 'completed').length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* TASKS LIST */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-list-check fs-24 text-muted"></i>
                  <p className="text-muted mt-2 mb-0">No tasks found</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {filteredTasks.map((task) => (
                    <div key={task._id} className="list-group-item">
                      <div className="d-flex align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-2">
                            <h6 className="mb-0 me-2">{task.title}</h6>
                            <span className={`badge ${getPriorityColor(task.priority)} me-2`}>
                              {task.priority}
                            </span>
                            <span className={`badge ${getStatusColor(task.status)}`}>
                              {task.status.replace('-', ' ')}
                            </span>
                          </div>
                          <p className="text-muted mb-2">{task.description}</p>
                          <div className="d-flex align-items-center text-muted small">
                            <i className="ti ti-calendar me-1"></i>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                            {task.assignedBy && (
                              <>
                                <i className="ti ti-user ms-3 me-1"></i>
                                Assigned by: {task.assignedBy.name}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="d-flex flex-column gap-1">
                          {task.status !== 'completed' && task.status !== 'cancelled' && (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleUpdateTaskStatus(task._id, 'completed')}
                            >
                              <i className="ti ti-check"></i>
                            </button>
                          )}
                          {task.status === 'pending' && (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleUpdateTaskStatus(task._id, 'in-progress')}
                            >
                              <i className="ti ti-play"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => {
                              setSelectedTask(task);
                              setShowViewModal(true);
                            }}
                          >
                            <i className="ti ti-eye"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ADD TASK MODAL */}
      {showAddModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Task</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateTask}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Priority</label>
                      <select
                        className="form-control"
                        value={formData.priority}
                        onChange={(e) => setFormData({...formData, priority: e.target.value as StaffTask['priority']})}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Due Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TASK MODAL */}
      {showViewModal && selectedTask && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Task Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowViewModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <p className="form-control-plaintext">{selectedTask.title}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <p className="form-control-plaintext">{selectedTask.description}</p>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Priority</label>
                    <span className={`badge ${getPriorityColor(selectedTask.priority)}`}>
                      {selectedTask.priority}
                    </span>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Status</label>
                    <span className={`badge ${getStatusColor(selectedTask.status)}`}>
                      {selectedTask.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Due Date</label>
                    <p className="form-control-plaintext">
                      {new Date(selectedTask.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Assigned By</label>
                    <p className="form-control-plaintext">
                      {selectedTask.assignedBy?.name || 'N/A'}
                    </p>
                  </div>
                </div>
                {selectedTask.notes && (
                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <p className="form-control-plaintext">{selectedTask.notes}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
                {selectedTask.status !== 'completed' && selectedTask.status !== 'cancelled' && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => {
                      handleUpdateTaskStatus(selectedTask._id, 'completed');
                      setShowViewModal(false);
                    }}
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TasksPage;
