import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { examService } from '../../services/examService';
import type { Exam } from '../../services/examService';

declare global {
  interface Window {
    bootstrap: any;
  }
}

const ExamPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);

  const [newExam, setNewExam] = useState({
    name: '',
    subject: '',
    class: '',
    date: '',
    startTime: '',
    endTime: '',
    duration: 60,
    totalMarks: 100,
    examType: 'mid_term' as 'mid_term' | 'final' | 'practical' | 'assignment',
  });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await examService.getAll({ page: 1, limit: 100 });
      setExams(response.data);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewExam((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editExam) {
      setEditExam({
        ...editExam,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await examService.create(newExam);
      toast.success('Exam created successfully');
      setShowAddModal(false);
      resetForm();
      fetchExams();
    } catch (error) {
      console.error('Error creating exam:', error);
      toast.error('Failed to create exam');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editExam) return;

    try {
      await examService.update(editExam.id, {
        name: editExam.name,
        subject: editExam.subject,
        class: editExam.class,
        date: editExam.date,
        startTime: editExam.startTime,
        endTime: editExam.endTime,
        duration: editExam.duration,
        totalMarks: editExam.totalMarks,
        examType: editExam.examType,
      });
      toast.success('Exam updated successfully');
      setShowEditModal(false);
      setEditExam(null);
      fetchExams();
    } catch (error) {
      console.error('Error updating exam:', error);
      toast.error('Failed to update exam');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await examService.delete(deleteId);
      toast.success('Exam deleted successfully');
      setShowDeleteModal(false);
      setDeleteId(null);
      fetchExams();
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error('Failed to delete exam');
    }
  };

  const resetForm = () => {
    setNewExam({
      name: '',
      subject: '',
      class: '',
      date: '',
      startTime: '',
      endTime: '',
      duration: 60,
      totalMarks: 100,
      examType: 'mid_term',
    });
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    toast.info(`Export as ${type.toUpperCase()} - Feature coming soon`);
  };

  const timeOptions = [
    '09:00 AM',
    '09:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '12:00 PM',
    '12:30 PM',
    '01:00 PM',
    '01:30 PM',
    '02:00 PM',
  ];

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Exam</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="#">Academic</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Exam
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchExams}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={() => window.print()}
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
                <button
                  className="dropdown-item rounded-1"
                  onClick={() => handleExport('pdf')}
                >
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item rounded-1"
                  onClick={() => handleExport('excel')}
                >
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>
          <div className="mb-2">
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <i className="ti ti-square-rounded-plus-filled me-2"></i>Add Exam
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Exam List</h4>
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
              >
                <i className="ti ti-filter me-2"></i>Filter
              </button>
              <div className="dropdown-menu drop-width">
                <form>
                  <div className="d-flex align-items-center border-bottom p-3">
                    <h4>Filter</h4>
                  </div>
                  <div className="p-3 border-bottom pb-0">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Exam Type</label>
                          <select className="form-select">
                            <option>Select</option>
                            <option>Mid Term</option>
                            <option>Final</option>
                            <option>Practical</option>
                            <option>Assignment</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Status</label>
                          <select className="form-select">
                            <option>Select</option>
                            <option>Scheduled</option>
                            <option>In Progress</option>
                            <option>Completed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 d-flex align-items-center justify-content-end">
                    <button type="button" className="btn btn-light me-3">
                      Reset
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Apply
                    </button>
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
                  <button className="dropdown-item rounded-1 active">Ascending</button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">Descending</button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">Recently Viewed</button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">Recently Added</button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="card-body p-0 py-3">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <div className="form-check form-check-md">
                        <input className="form-check-input" type="checkbox" id="select-all" />
                      </div>
                    </th>
                    <th>ID</th>
                    <th>Exam Name</th>
                    <th>Subject</th>
                    <th>Class</th>
                    <th>Exam Date</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.length > 0 ? (
                    exams.map((exam) => (
                      <tr key={exam.id}>
                        <td>
                          <div className="form-check form-check-md">
                            <input className="form-check-input" type="checkbox" />
                          </div>
                        </td>
                        <td>
                          <Link to="#" className="link-primary">
                            {exam.id}
                          </Link>
                        </td>
                        <td>{exam.name}</td>
                        <td>{exam.subject}</td>
                        <td>{exam.class}</td>
                        <td>{new Date(exam.date).toLocaleDateString()}</td>
                        <td>{exam.startTime}</td>
                        <td>{exam.endTime}</td>
                        <td>
                          <span
                            className={`badge badge-soft-${
                              exam.status === 'scheduled'
                                ? 'info'
                                : exam.status === 'in_progress'
                                ? 'warning'
                                : exam.status === 'completed'
                                ? 'success'
                                : exam.status === 'cancelled'
                                ? 'danger'
                                : 'info'
                            }`}
                          >
                            {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                          </span>
                        </td>
                        <td>
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
                                  onClick={() => {
                                    setEditExam(exam);
                                    setShowEditModal(true);
                                  }}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item rounded-1 text-danger"
                                  onClick={() => {
                                    setDeleteId(exam.id);
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  <i className="ti ti-trash-x me-2"></i>Delete
                                </button>
                              </li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="text-center py-4">
                        No exams found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Exam</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Exam Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={newExam.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Subject</label>
                        <input
                          type="text"
                          className="form-control"
                          name="subject"
                          value={newExam.subject}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Class</label>
                        <input
                          type="text"
                          className="form-control"
                          name="class"
                          value={newExam.class}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Exam Date</label>
                        <input
                          type="date"
                          className="form-control"
                          name="date"
                          value={newExam.date}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Start Time</label>
                        <select
                          className="form-select"
                          name="startTime"
                          value={newExam.startTime}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          {timeOptions.map((time) => (
                            <option key={`start-${time}`} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-0">
                        <label className="form-label">End Time</label>
                        <select
                          className="form-select"
                          name="endTime"
                          value={newExam.endTime}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          {timeOptions.map((time) => (
                            <option key={`end-${time}`} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light me-2"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add Exam
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editExam && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Exam</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditExam(null);
                  }}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Exam Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={editExam.name}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Subject</label>
                        <input
                          type="text"
                          className="form-control"
                          name="subject"
                          value={editExam.subject}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Class</label>
                        <input
                          type="text"
                          className="form-control"
                          name="class"
                          value={editExam.class}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Exam Date</label>
                        <input
                          type="date"
                          className="form-control"
                          name="date"
                          value={editExam.date}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Start Time</label>
                        <select
                          className="form-select"
                          name="startTime"
                          value={editExam.startTime}
                          onChange={handleEditInputChange}
                          required
                        >
                          {timeOptions.map((time) => (
                            <option key={`edit-start-${time}`} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-0">
                        <label className="form-label">End Time</label>
                        <select
                          className="form-select"
                          name="endTime"
                          value={editExam.endTime}
                          onChange={handleEditInputChange}
                          required
                        >
                          {timeOptions.map((time) => (
                            <option key={`edit-end-${time}`} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light me-2"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditExam(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <div className="delete-icon">
                  <i className="ti ti-trash-x"></i>
                </div>
                <h4>Confirm Deletion</h4>
                <p>Are you sure you want to delete this exam? This action cannot be undone.</p>
                <div className="d-flex justify-content-center">
                  <button
                    type="button"
                    className="btn btn-light me-3"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteId(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleDelete}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExamPage;