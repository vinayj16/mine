import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import syllabusService from '../../services/syllabusService';
import classService from '../../services/classService';
import subjectService from '../../services/subjectService';
import type { Syllabus, CreateSyllabusInput } from '../../services/syllabusService';
import type { Class } from '../../services/classService';
import type { Subject } from '../../services/subjectService';

const ClassSyllabusPage: React.FC = () => {
  const [syllabusList, setSyllabusList] = useState<Syllabus[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSyllabus, setSelectedSyllabus] = useState<Syllabus | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [title, setTitle] = useState('');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [term, setTerm] = useState<'1' | '2' | '3' | 'annual'>('1');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const schoolId = localStorage.getItem('schoolId') || '';
  const institutionId = localStorage.getItem('institutionId') || '';
  
  console.log('[Syllabus Page] schoolId:', schoolId);
  console.log('[Syllabus Page] institutionId:', institutionId);

  // Helper functions for type-safe value extraction
  const getDisplayValue = (value: any, field: 'name' | '_id'): string => {
    if (typeof value === 'object' && value !== null && field in value) {
      return String(value[field]);
    }
    return String(value);
  };

  useEffect(() => {
    fetchSyllabi();
    fetchClasses();
    fetchSubjects();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await classService.getAll({ institutionId });
      console.log('[Syllabus Page] Classes response:', response);
      setClasses(response.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await subjectService.getAll({
        schoolId,
        institutionId: undefined
      });
      console.log('[Syllabus Page] Subjects response:', response);
      setSubjects(response.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchSyllabi = async () => {
    try {
      setLoading(true);
      const data = await syllabusService.getAll(schoolId);
      console.log('[Syllabus Page] Syllabi response:', data);
      setSyllabusList(data);
    } catch (error) {
      console.error('Error fetching syllabi:', error);
      toast.error('Failed to load syllabi');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedSubject || !title) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const newSyllabusData: CreateSyllabusInput = {
        classId: selectedClass,
        subjectId: selectedSubject,
        academicYear,
        term,
        title,
        status: 'active',
      };

      console.log('[Syllabus Page] Creating syllabus with data:', newSyllabusData);
      console.log('[Syllabus Page] schoolId:', schoolId);
      const response = await syllabusService.create(schoolId, newSyllabusData);
      console.log('[Syllabus Page] Create response:', response);
      setShowAddModal(false);
      resetForm();
      toast.success('Syllabus added successfully');
      fetchSyllabi();
    } catch (error) {
      console.error('Error adding syllabus:', error);
      toast.error('Failed to add syllabus');
    }
  };

  const handleEditSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSyllabus || !selectedClass || !selectedSubject || !title) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await syllabusService.update(schoolId, selectedSyllabus._id, {
        classId: selectedClass,
        subjectId: selectedSubject,
        title,
        academicYear,
        term,
      });
      setShowEditModal(false);
      resetForm();
      toast.success('Syllabus updated successfully');
      fetchSyllabi();
    } catch (error) {
      console.error('Error updating syllabus:', error);
      toast.error('Failed to update syllabus');
    }
  };

  const handleDeleteSyllabus = async () => {
    if (!selectedSyllabus) return;

    try {
      await syllabusService.delete(schoolId, selectedSyllabus._id);
      setShowDeleteModal(false);
      toast.success('Syllabus deleted successfully');
      fetchSyllabi();
    } catch (error) {
      console.error('Error deleting syllabus:', error);
      toast.error('Failed to delete syllabus');
    }
  };

  const handleDeleteMultiple = async () => {
    try {
      await Promise.all(
        selectedItems.map((id) => syllabusService.delete(schoolId, id))
      );
      setSelectedItems([]);
      setShowDeleteModal(false);
      toast.success('Selected items deleted successfully');
      fetchSyllabi();
    } catch (error) {
      console.error('Error deleting syllabi:', error);
      toast.error('Failed to delete selected items');
    }
  };

  const toggleStatus = async (syllabus: Syllabus) => {
    try {
      const newStatus = syllabus.status === 'active' ? 'archived' : 'active';
      await syllabusService.update(schoolId, syllabus._id, { status: newStatus });
      toast.success('Status updated successfully');
      fetchSyllabi();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setSelectedClass('');
    setSelectedSubject('');
    setTitle('');
    setAcademicYear('2024-2025');
    setTerm('1');
    setSelectedSyllabus(null);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(syllabusList.map((item) => item._id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id]);
    } else {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    }
  };

  const filteredSyllabus = Array.isArray(syllabusList) ? syllabusList.filter((item) => {
    const matchesClass = !filterClass || item.classId === filterClass;
    const matchesStatus = !filterStatus || item.status === filterStatus.toLowerCase();
    return matchesClass && matchesStatus;
  }) : [];

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Class Syllabus</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <a href="#">Academic</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Syllabus
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={fetchSyllabi}
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Refresh"
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={() => window.print()}
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Print"
            >
              <i className="ti ti-printer"></i>
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <button
              className="btn btn-light fw-medium d-inline-flex align-items-center dropdown-toggle"
              data-bs-toggle="dropdown"
            >
              <i className="ti ti-file-export me-2"></i>Export
            </button>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <button className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-xls me-1"></i>Export as Excel
                </button>
              </li>
            </ul>
          </div>
          <div className="mb-2">
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <i className="ti ti-square-rounded-plus-filled me-2"></i>Add Syllabus
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Class Syllabus</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-calendar"></i>
              </span>
              <input
                type="text"
                className="form-control date-range bookingrange"
                placeholder="Select"
                value={`Academic Year : ${academicYear}`}
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
                  <div className="p-3 border-bottom pb-0">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Class</label>
                          <select
                            className="form-select"
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                          >
                            <option value="">Select</option>
                            {classes.map((cls) => (
                              <option key={cls._id || cls.id} value={cls._id || cls.id || ''}>
                                {cls.name} - {cls.section}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Status</label>
                          <select
                            className="form-select"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                          >
                            <option value="">Select</option>
                            <option value="active">Active</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 d-flex align-items-center justify-content-end">
                    <button
                      type="button"
                      className="btn btn-light me-3"
                      onClick={() => {
                        setFilterClass('');
                        setFilterStatus('');
                      }}
                    >
                      Reset
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
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="select-all"
                          checked={selectedItems.length === syllabusList.length && syllabusList.length > 0}
                          onChange={handleSelectAll}
                        />
                      </div>
                    </th>
                    <th>Title</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Academic Year</th>
                    <th>Term</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSyllabus.length > 0 ? (
                    filteredSyllabus.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div className="form-check form-check-md">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={selectedItems.includes(item._id)}
                              onChange={(e) => handleSelectItem(item._id, e.target.checked)}
                            />
                          </div>
                        </td>
                        <td>{item.title}</td>
                        <td>{getDisplayValue(item.classId, 'name')}</td>
                        <td>{getDisplayValue(item.subjectId, 'name')}</td>
                        <td>{item.academicYear}</td>
                        <td>{item.term}</td>
                        <td>
                          <span
                            className={`badge badge-soft-${
                              item.status === 'active' ? 'success' : item.status === 'draft' ? 'warning' : 'danger'
                            } d-inline-flex align-items-center`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => toggleStatus(item)}
                          >
                            <i className="ti ti-circle-filled fs-5 me-1"></i>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        </td>
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
                                    onClick={() => {
                                      setSelectedSyllabus(item);
                                      setSelectedClass(getDisplayValue(item.classId, '_id'));
                                      setSelectedSubject(getDisplayValue(item.subjectId, '_id'));
                                      setTitle(item.title);
                                      setAcademicYear(item.academicYear);
                                      setTerm(item.term);
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
                                      setSelectedSyllabus(item);
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-4">
                        No syllabi found
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
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Syllabus</h4>
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
              <form onSubmit={handleAddSyllabus}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Title</label>
                        <input
                          type="text"
                          className="form-control"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Class</label>
                        <select
                          className="form-select"
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          {classes.map((cls) => (
                            <option key={cls._id || cls.id} value={cls._id || cls.id || ''}>
                              {cls.name} - {cls.section}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Subject</label>
                        <select
                          className="form-select"
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          {subjects.map((subj) => (
                            <option key={subj._id} value={subj._id}>
                              {subj.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Academic Year</label>
                        <input
                          type="text"
                          className="form-control"
                          value={academicYear}
                          onChange={(e) => setAcademicYear(e.target.value)}
                          required
                        />
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Term</label>
                        <select
                          className="form-select"
                          value={term}
                          onChange={(e) => setTerm(e.target.value as '1' | '2' | '3' | 'annual')}
                        >
                          <option value="1">Term 1</option>
                          <option value="2">Term 2</option>
                          <option value="3">Term 3</option>
                          <option value="annual">Annual</option>
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
                    Add Syllabus
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedSyllabus && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Syllabus</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  aria-label="Close"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
              <form onSubmit={handleEditSyllabus}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Title</label>
                        <input
                          type="text"
                          className="form-control"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Class</label>
                        <select
                          className="form-select"
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          {classes.map((cls) => (
                            <option key={cls._id || cls.id} value={cls._id || cls.id || ''}>
                              {cls.name} - {cls.section}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Subject</label>
                        <select
                          className="form-select"
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          {subjects.map((subj) => (
                            <option key={subj._id} value={subj._id}>
                              {subj.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Academic Year</label>
                        <input
                          type="text"
                          className="form-control"
                          value={academicYear}
                          onChange={(e) => setAcademicYear(e.target.value)}
                          required
                        />
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Term</label>
                        <select
                          className="form-select"
                          value={term}
                          onChange={(e) => setTerm(e.target.value as '1' | '2' | '3' | 'annual')}
                        >
                          <option value="1">Term 1</option>
                          <option value="2">Term 2</option>
                          <option value="3">Term 3</option>
                          <option value="annual">Annual</option>
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
                      resetForm();
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
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <div className="delete-icon">
                  <i className="ti ti-trash-x"></i>
                </div>
                <h4>Confirm Deletion</h4>
                <p>
                  {selectedSyllabus
                    ? 'Are you sure you want to delete this syllabus?'
                    : 'You want to delete all the marked items, this cant be undone once you delete.'}
                </p>
                <div className="d-flex justify-content-center">
                  <button
                    type="button"
                    className="btn btn-light me-3"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedSyllabus(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      if (selectedSyllabus) {
                        handleDeleteSyllabus();
                      } else {
                        handleDeleteMultiple();
                      }
                    }}
                  >
                    Yes, Delete
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

export default ClassSyllabusPage;