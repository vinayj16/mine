import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import classService, { type Class } from '../../services/classService';
import { classScheduleService, type ClassSchedule, type CreateClassScheduleInput, type ClassScheduleFilters } from '../../services/classScheduleService';
import { useAuth } from '../../store/authStore';

const ClassesPage = () => {
  
  // State management
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    class: '',
    section: '',
    status: ''
  });

  const { user } = useAuth();
  const institutionId = user?.institutionId || user?.schoolId || '';
  const institutionCode = (user as any)?.institutionCode || (user as any)?.instituteCode || '';

  // Fetch classes from backend
  useEffect(() => {
    fetchClasses();
  }, [institutionId]); // Re-fetch when institutionId changes

  const fetchClasses = async () => {
    if (!institutionId) {
      console.warn('No institutionId, skipping fetch');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching classes for institution:', institutionId);
      const response = await classService.getAll({
        page: 1,
        limit: 100,
        search: searchTerm || undefined,
        institutionId: institutionId,
        institutionCode: institutionCode || undefined
      });
      
      const rawClasses = Array.isArray((response as any).data)
        ? (response as any).data
        : Array.isArray((response as any).classes)
          ? (response as any).classes
          : Array.isArray(response as any)
            ? (response as any)
            : [];

      const classesData = rawClasses.map((c: any) => ({
          ...c,
          id: c.id || c._id || c.classId,
          totalStudents: c.totalStudents ?? c.students ?? 0,
          subjects: c.subjects || []
      }));

      setClasses(classesData);
    } catch (err: any) {
      console.error('Error fetching classes:', err);
      setError(err.message || 'Failed to fetch classes');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter classes based on search term and filters
  const filteredClasses = classes.filter(cls => 
    (cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.section.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filters.class ? cls.name === filters.class : true) &&
    (filters.section ? cls.section === filters.section : true)
  );

  // Handle form submissions
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Get form data
      const formData = new FormData(e.target as HTMLFormElement);
      const totalStudents = formData.get('totalStudents') as string;
      const subjects = formData.get('subjects') as string;
      
      // Map frontend field names to backend field names
      const data = {
        name: formData.get('name') as string,
        section: formData.get('section') as string,
        students: totalStudents ? parseInt(totalStudents) : 0, // Map totalStudents to students
        subjects: subjects ? subjects.split(',').map(s => s.trim()) : [], // Parse subjects if provided
        classTeacher: formData.get('classTeacher') as string,
        institutionId: institutionId // Pass institutionId when creating
      };
      
      await classService.create(data);
      setShowAddModal(false);
      toast.success('Class created successfully');
      await fetchClasses(); // Refresh the list
    } catch (err: any) {
      console.error('Error adding class:', err);
      const errorMsg = err.message || err.response?.data?.message || 'Failed to add class';
      
      // Check for duplicate error
      if (errorMsg.includes('already exists')) {
        toast.error('Class already exists! Please use a different name or section.');
      } else {
        toast.error(errorMsg);
      }
      setError(errorMsg);
    }
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    
    try {
      // Get form data
      const formData = new FormData(e.target as HTMLFormElement);
      const totalStudents = formData.get('totalStudents') as string;
      const subjects = formData.get('subjects') as string;
      
      // Map frontend field names to backend field names
      const data = {
        name: formData.get('name') as string,
        section: formData.get('section') as string,
        students: totalStudents ? parseInt(totalStudents) : 0, // Map totalStudents to students
        subjects: subjects ? subjects.split(',').map(s => s.trim()) : [], // Parse subjects if provided
        classTeacher: formData.get('classTeacher') as string
      };
      
      // Use _id instead of id for MongoDB documents
      const classId = (selectedClass as any)._id || selectedClass.id;
      console.log('Updating class with ID:', classId, 'Data:', data);
      const updatedClass = await classService.update(classId, data);
      console.log('Updated class response:', updatedClass);
      
      // Normalize the updated class data with correct field names
      const normalizedUpdatedClass = {
        ...updatedClass,
        id: updatedClass.id || updatedClass._id || updatedClass.classId,
        totalStudents: updatedClass.totalStudents ?? updatedClass.students ?? 0,
        subjects: updatedClass.subjects || []
      };
      console.log('Normalized updated class:', normalizedUpdatedClass);
      
      // Update selectedClass with the updated data
      setSelectedClass(normalizedUpdatedClass);
      setShowEditModal(false);
      
      // Update local classes state immediately for instant UI feedback
      setClasses(prevClasses => 
        prevClasses.map(cls => {
          const updatedId = normalizedUpdatedClass.id;
          return cls.id === updatedId || cls._id === updatedId ? normalizedUpdatedClass : cls;
        })
      );
      
      // Also refresh from server to ensure data consistency
      console.log('Refreshing classes list after update...');
      await fetchClasses();
      
      toast.success('Class updated successfully');
    } catch (err: any) {
      console.error('Error updating class:', err);
      setError(err.message || 'Failed to update class');
      toast.error(err.message || 'Failed to update class');
    }
  };

  const handleDelete = async () => {
    if (!selectedClass) return;
    
    try {
      // Use _id instead of id for MongoDB documents
      const classId = (selectedClass as any)._id || selectedClass.id;
      await classService.delete(classId);
      setShowDeleteModal(false);
      await fetchClasses(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting class:', err);
      setError(err.message || 'Failed to delete class');
    }
  };

// Reset filters
  const handleResetFilters = () => {
    setFilters({ class: '', section: '', status: '' });
    setSearchTerm('');
    fetchClasses(); // Re-fetch without filters
  };

  return (
    <>

        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Classes List</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/academic">Academic</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  All Classes
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="pe-1 mb-2">
              <button 
                className="btn btn-outline-light bg-white btn-icon me-1"
                onClick={() => fetchClasses()}
                title="Refresh"
              >
                <i className="ti ti-refresh" />
              </button>
            </div>
            <div className="pe-1 mb-2">
              <button 
                className="btn btn-outline-light bg-white btn-icon me-1"
                title="Print"
                onClick={() => window.print()}
              >
                <i className="ti ti-printer" />
              </button>
            </div>
            <div className="dropdown me-2 mb-2">
              <button
                className="btn btn-light fw-medium d-inline-flex align-items-center dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                <i className="ti ti-file-export me-2" />Export
              </button>
              <ul className="dropdown-menu dropdown-menu-end p-3">
                <li>
                  <button className="dropdown-item rounded-1">
                    <i className="ti ti-file-type-pdf me-1" />Export as PDF
                  </button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">
                    <i className="ti ti-file-type-xls me-1" />Export as Excel
                  </button>
                </li>
              </ul>
            </div>
            <div className="mb-2">
              <button 
                className="btn btn-primary" 
                onClick={() => setShowAddModal(true)}
              >
                <i className="ti ti-square-rounded-plus-filled me-2" />
                Add Class
              </button>
            </div>
          </div>
        </div>

        {/* Classes List */}
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Classes List</h4>
            <div className="d-flex align-items-center flex-wrap">
              
              <div className="input-icon-start mb-3 me-2 position-relative">
                  <span className="icon-addon">
                    <i className="ti ti-calendar" />
                  </span>
                  <input type="text" className="form-control" placeholder="Select" defaultValue="Academic Year : 2024 / 2025" readOnly />
                </div>
              <div className="dropdown mb-3 me-2">
                <button
                  className="btn btn-outline-light bg-white dropdown-toggle"
                  data-bs-toggle="dropdown"
                >
                  <i className="ti ti-filter me-2" />Filter
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
                              value={filters.class}
                              onChange={(e) => setFilters({...filters, class: e.target.value})}
                            >
                              <option value="">Select</option>
                              <option>I</option>
                              <option>II</option>
                              <option>III</option>
                              <option>IV</option>
                              <option>V</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Section</label>
                            <select 
                              className="form-select"
                              value={filters.section}
                              onChange={(e) => setFilters({...filters, section: e.target.value})}
                            >
                              <option value="">Select</option>
                              <option>A</option>
                              <option>B</option>
                              <option>C</option>
                              <option>D</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Status</label>
                            <select 
                              className="form-select"
                              value={filters.status}
                              onChange={(e) => setFilters({...filters, status: e.target.value as any})}
                            >
                              <option value="">Select</option>
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 d-flex align-items-center justify-content-end">
                      <button 
                        type="button" 
                        className="btn btn-light me-3"
                        onClick={handleResetFilters}
                      >
                        Reset
                      </button>
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
                  <i className="ti ti-sort-ascending-2 me-2" />Sort by A-Z
                </button>
                <ul className="dropdown-menu p-3">
                  <li>
                    <button className="dropdown-item rounded-1 active">
                      Ascending
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item rounded-1">
                      Descending
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item rounded-1">
                      Recently Viewed
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item rounded-1">
                      Recently Added
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="card-body p-0 py-3">
            {/* Error Message */}
            {error && (
              <div className="alert alert-danger mx-3" role="alert">
                <i className="ti ti-alert-circle me-2"></i>
                {error}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading classes...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredClasses.length === 0 && (
              <div className="text-center py-5">
                <i className="ti ti-school-off fs-1 text-muted mb-3"></i>
                <p className="text-muted">No classes found</p>
                <button className="btn btn-primary mt-2" onClick={() => setShowAddModal(true)}>
                  <i className="ti ti-plus me-2"></i>Add First Class
                </button>
              </div>
            )}

            {/* Table */}
            {!loading && !error && filteredClasses.length > 0 && (
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
                          />
                        </div>
                      </th>
                      <th>ID</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>No of Students</th>
                      <th>No of Subjects</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClasses.map((cls) => (
                      <tr key={cls.id}>
                        <td>
                          <div className="form-check form-check-md">
                            <input className="form-check-input" type="checkbox" />
                          </div>
                        </td>
                        <td>
                          <a 
                            href="#!" 
                            className="link-primary" 
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedClass(cls);
                              setShowViewModal(true);
                            }}
                          >
                            {cls.id}
                          </a>
                        </td>
                        <td>{cls.name}</td>
                        <td>{cls.section}</td>
                        <td>{cls.totalStudents || 0}</td>
                        <td>{cls.subjects?.length || 0}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="dropdown">
                              <button
                                className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
                                data-bs-toggle="dropdown"
                              >
                                <i className="ti ti-dots-vertical fs-14" />
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end p-3">
                                <li>
                                  <button 
                                    className="dropdown-item rounded-1"
                                    onClick={() => {
                                      setSelectedClass(cls);
                                      setShowEditModal(true);
                                    }}
                                  >
                                    <i className="ti ti-edit-circle me-2" />Edit
                                  </button>
                                </li>
                                <li>
                                  <button 
                                    className="dropdown-item rounded-1 text-danger"
                                    onClick={() => {
                                      setSelectedClass(cls);
                                      setShowDeleteModal(true);
                                    }}
                                  >
                                    <i className="ti ti-trash-x me-2" />Delete
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
            )}
          </div>
        </div>
      

      {/* Add Class Modal */}
      <div className={`modal fade ${showAddModal ? 'show d-block' : ''}`} style={{ display: showAddModal ? 'block' : 'none' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Class</h4>
              <button 
                type="button" 
                className="btn-close custom-btn-close" 
                onClick={() => setShowAddModal(false)}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleAddClass}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Class Name</label>
                      <input type="text" name="name" className="form-control" required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Section</label>
                      <select name="section" className="form-select" required>
                        <option value="">Select</option>
                        <option>A</option>
                        <option>B</option>
                        <option>C</option>
                        <option>D</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">No of Students</label>
                      <input type="number" name="totalStudents" className="form-control" required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Subjects (comma-separated)</label>
                      <input 
                        type="text" 
                        name="subjects" 
                        className="form-control" 
                        placeholder="Math, Science, English" 
                      />
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="status-title">
                        <h5>Status</h5>
                        <p>Change the Status by toggle</p>
                      </div>
                      <div className="form-check form-switch">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          role="switch" 
                          id="switch-sm" 
                          defaultChecked 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-light me-2" 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Class
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Class Modal */}
      {selectedClass && (
        <div className={`modal fade ${showEditModal ? 'show d-block' : ''}`} style={{ display: showEditModal ? 'block' : 'none' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Class</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => setShowEditModal(false)}
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <form onSubmit={handleEditClass}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Class Name</label>
                        <input 
                          type="text" 
                          name="name"
                          className="form-control" 
                          defaultValue={selectedClass.name}
                          required 
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Section</label>
                        <select name="section" className="form-select" defaultValue={selectedClass.section} required>
                          <option value="">Select</option>
                          <option>A</option>
                          <option>B</option>
                          <option>C</option>
                          <option>D</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">No of Students</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          defaultValue={selectedClass.totalStudents}
                          name="totalStudents"
                          required 
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Subjects (comma-separated)</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          defaultValue={selectedClass.subjects?.join(', ') || ''}
                          name="subjects"
                          placeholder="Math, Science, English"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => setShowEditModal(false)}
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

      {/* Delete Confirmation Modal */}
      <div className={`modal fade ${showDeleteModal ? 'show d-block' : ''}`} style={{ display: showDeleteModal ? 'block' : 'none' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center">
              <div className="delete-icon">
                <i className="ti ti-trash-x" />
              </div>
              <h4>Confirm Deletion</h4>
              <p>You want to delete {selectedClass ? `class ${selectedClass.name} - Section ${selectedClass.section}` : 'the selected class'}, this can't be undone once you delete.</p>
              <div className="d-flex justify-content-center">
                <button 
                  className="btn btn-light me-3"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Class Modal */}
      {selectedClass && (
        <div className={`modal fade ${showViewModal ? 'show d-block' : ''}`} style={{ display: showViewModal ? 'block' : 'none' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <div className="d-flex align-items-center">
                  <h4 className="modal-title">Class Details</h4>
                </div>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => setShowViewModal(false)}
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="class-detail-info">
                      <p>Class Name</p>
                      <span>{selectedClass.name}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="class-detail-info">
                      <p>Section</p>
                      <span>{selectedClass.section}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="class-detail-info">
                      <p>No of Subjects</p>
                      <span>{selectedClass.subjects?.length || 0}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="class-detail-info">
                      <p>No of Students</p>
                      <span>{selectedClass.totalStudents || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {(showAddModal || showDeleteModal || showViewModal || showEditModal) && (
        <div 
          className="modal-backdrop fade show" 
          style={{ zIndex: 1040 }}
          onClick={() => {
            setShowAddModal(false);
            setShowDeleteModal(false);
            setShowViewModal(false);
            setShowEditModal(false);
          }}
        />
      )}
    
    </>
  );
};

export default ClassesPage;


export const ScheduleClassesPage = () => {
  const { user } = useAuth();
  const institutionId = user?.institutionId || user?.schoolId || '';

  // State management
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ClassSchedule | null>(null);
  const [filters, setFilters] = useState<ClassScheduleFilters>({
    className: '',
    section: '',
    day: '',
    status: '',
    institutionId: institutionId
  });

  // Fetch schedules from backend
  useEffect(() => {
    fetchSchedules();
  }, [institutionId]);

  const fetchSchedules = async () => {
    if (!institutionId) {
      console.error('Institution ID not found');
      return;
    }

    try {
      const response = await classScheduleService.getAll({
        ...filters,
        page: 1,
        limit: 100
      });
      setSchedules(response.data || []);
    } catch (err: any) {
      console.error('Error fetching schedules:', err);
    }
  };

  // Filter schedules based on filters
  const filteredSchedules = schedules.filter(schedule => 
    (filters.className ? schedule.className === filters.className : true) &&
    (filters.section ? schedule.section === filters.section : true) &&
    (filters.day ? schedule.day === filters.day : true) &&
    (filters.status ? schedule.status === filters.status : true)
  );

  // Handle form submissions
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get form data
      const formData = new FormData(e.target as HTMLFormElement);
      const data: CreateClassScheduleInput = {
        classId: formData.get('classId') as string,
        className: formData.get('className') as string,
        section: formData.get('section') as string,
        subject: formData.get('subject') as string,
        subjectId: formData.get('subjectId') as string,
        teacher: formData.get('teacher') as string,
        teacherId: formData.get('teacherId') as string,
        room: formData.get('room') as string,
        day: formData.get('day') as string,
        startTime: formData.get('startTime') as string,
        endTime: formData.get('endTime') as string,
        academicYear: '2024-2025',
        institutionId: institutionId
      };
      
      await classScheduleService.create(data);
      setShowAddModal(false);
      await fetchSchedules(); // Refresh the list
    } catch (err: any) {
      console.error('Error adding schedule:', err);
    }
  };

  const handleEditSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;
    
    try {
      // Get form data
      const formData = new FormData(e.target as HTMLFormElement);
      const data = {
        classId: formData.get('classId') as string,
        className: formData.get('className') as string,
        section: formData.get('section') as string,
        subject: formData.get('subject') as string,
        subjectId: formData.get('subjectId') as string,
        teacher: formData.get('teacher') as string,
        teacherId: formData.get('teacherId') as string,
        room: formData.get('room') as string,
        day: formData.get('day') as string,
        startTime: formData.get('startTime') as string,
        endTime: formData.get('endTime') as string,
        status: formData.get('status') as 'active' | 'inactive' | 'cancelled'
      };
      
      await classScheduleService.update(selectedSchedule._id, data);
      setShowEditModal(false);
      await fetchSchedules(); // Refresh the list
    } catch (err: any) {
      console.error('Error updating schedule:', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedSchedule) return;
    
    try {
      await classScheduleService.delete(selectedSchedule._id);
      setShowDeleteModal(false);
      await fetchSchedules(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting schedule:', err);
      console.error(err.message || 'Failed to delete schedule');
    }
  };

  
  return (
    <>
        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Schedule</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/academic">Academic</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Schedule Classes
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="pe-1 mb-2">
              <button 
                className="btn btn-outline-light bg-white btn-icon me-1"
                onClick={() => fetchSchedules()}
                title="Refresh"
              >
                <i className="ti ti-refresh" />
              </button>
            </div>
            <div className="pe-1 mb-2">
              <button 
                className="btn btn-outline-light bg-white btn-icon me-1"
                title="Print"
                onClick={() => window.print()}
              >
                <i className="ti ti-printer" />
              </button>
            </div>
            <div className="dropdown me-2 mb-2">
              <button
                className="btn btn-light fw-medium d-inline-flex align-items-center dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                <i className="ti ti-file-export me-2" />Export
              </button>
              <ul className="dropdown-menu dropdown-menu-end p-3">
                <li>
                  <button className="dropdown-item rounded-1">
                    <i className="ti ti-file-type-pdf me-1" />Export as PDF
                  </button>
                </li>
                <li>
                  <button className="dropdown-item rounded-1">
                    <i className="ti ti-file-type-xls me-1" />Export as Excel
                  </button>
                </li>
              </ul>
            </div>
            <div className="mb-2">
              <button 
                className="btn btn-primary" 
                onClick={() => setShowAddModal(true)}
              >
                <i className="ti ti-square-rounded-plus-filled me-2" />
                Add Schedule
              </button>
            </div>
          </div>
        </div>

        {/* Schedule List */}
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Schedule Classes</h4>
            <div className="d-flex align-items-center flex-wrap">
              <div className="input-icon-start mb-3 me-2 position-relative">
                <i className="ti ti-calendar" />
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
                  <i className="ti ti-filter me-2" />Filter
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
                              value={filters.className}
                              onChange={(e) => setFilters({...filters, className: e.target.value})}
                            >
                              <option value="">Select</option>
                              <option>I</option>
                              <option>II</option>
                              <option>III</option>
                              <option>IV</option>
                              <option>V</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Section</label>
                            <select 
                              className="form-select"
                              value={filters.section}
                              onChange={(e) => setFilters({...filters, section: e.target.value})}
                            >
                              <option value="">Select</option>
                              <option>A</option>
                              <option>B</option>
                              <option>C</option>
                              <option>D</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Day</label>
                            <select 
                              className="form-select"
                              value={filters.day}
                              onChange={(e) => setFilters({...filters, day: e.target.value})}
                            >
                              <option value="">Select</option>
                              <option>Monday</option>
                              <option>Tuesday</option>
                              <option>Wednesday</option>
                              <option>Thursday</option>
                              <option>Friday</option>
                              <option>Saturday</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Status</label>
                            <select 
                              className="form-select"
                              value={filters.status}
                              onChange={(e) => setFilters({...filters, status: e.target.value as any})}
                            >
                              <option value="">Select</option>
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 d-flex align-items-center justify-content-end">
                      <button 
                        type="button" 
                        className="btn btn-light me-3"
                        onClick={() => setFilters({ className: '', section: '', day: '', status: '', institutionId: institutionId })}
                      >
                        Reset
                      </button>
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
                  <i className="ti ti-sort-ascending-2 me-2" />Sort by
                </button>
                <ul className="dropdown-menu p-3">
                  <li>
                    <button className="dropdown-item rounded-1 active">
                      Class (A-Z)
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item rounded-1">
                      Class (Z-A)
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item rounded-1">
                      Time (Earliest First)
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item rounded-1">
                      Time (Latest First)
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="card-body p-0 py-3">
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
                        />
                      </div>
                    </th>
                    <th>ID</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Subject</th>
                    <th>Teacher</th>
                    <th>Room</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.map((schedule) => (
                    <tr key={schedule._id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <a 
                          href="#!" 
                          className="link-primary" 
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedSchedule(schedule);
                            setShowViewModal(true);
                          }}
                        >
                          {schedule._id}
                        </a>
                      </td>
                      <td>{schedule.className}</td>
                      <td>{schedule.section}</td>
                      <td>{schedule.subject}</td>
                      <td>{schedule.teacher}</td>
                      <td>{schedule.room}</td>
                      <td>{schedule.day}</td>
                      <td>{`${schedule.startTime} - ${schedule.endTime}`}</td>
                      <td>
                        <span className={`badge badge-soft-${schedule.status === 'active' ? 'success' : 'danger'} d-inline-flex align-items-center`}>
                          <i className="ti ti-circle-filled fs-5 me-1" />
                          {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="dropdown">
                            <button
                              className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
                              data-bs-toggle="dropdown"
                            >
                              <i className="ti ti-dots-vertical fs-14" />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end p-3">
                              <li>
                                <button 
                                  className="dropdown-item rounded-1"
                                  onClick={() => {
                                    setSelectedSchedule(schedule);
                                    setShowEditModal(true);
                                  }}
                                >
                                  <i className="ti ti-edit-circle me-2" />Edit
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item rounded-1 text-danger"
                                  onClick={() => {
                                    setSelectedSchedule(schedule);
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  <i className="ti ti-trash-x me-2" />Delete
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
        </div>
    

      {/* Add Schedule Modal */}
      <div className={`modal fade ${showAddModal ? 'show d-block' : ''}`} style={{ display: showAddModal ? 'block' : 'none' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Schedule</h4>
              <button 
                type="button" 
                className="btn-close custom-btn-close" 
                onClick={() => setShowAddModal(false)}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleAddSchedule}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Class</label>
                      <select name="className" className="form-select" required>
                        <option value="">Select Class</option>
                        <option>I</option>
                        <option>II</option>
                        <option>III</option>
                        <option>IV</option>
                        <option>V</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Section</label>
                      <select name="section" className="form-select" required>
                        <option value="">Select Section</option>
                        <option>A</option>
                        <option>B</option>
                        <option>C</option>
                        <option>D</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Subject</label>
                      <input type="text" name="subject" className="form-control" required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Teacher</label>
                      <select name="teacher" className="form-select" required>
                        <option value="">Select Teacher</option>
                        <option>John Smith</option>
                        <option>Sarah Johnson</option>
                        <option>Michael Brown</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Room</label>
                      <input type="text" name="room" className="form-control" required />
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Day</label>
                          <select name="day" className="form-select" required>
                            <option value="">Select Day</option>
                            <option>Monday</option>
                            <option>Tuesday</option>
                            <option>Wednesday</option>
                            <option>Thursday</option>
                            <option>Friday</option>
                            <option>Saturday</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Start Time</label>
                          <input type="time" name="startTime" className="form-control" required />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">End Time</label>
                          <input type="time" name="endTime" className="form-control" required />
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="status-title">
                        <h5>Status</h5>
                        <p>Change the Status by toggle</p>
                      </div>
                      <div className="form-check form-switch">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          role="switch" 
                          id="status-switch" 
                          name="status"
                          value="active"
                          defaultChecked 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-light me-2" 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Schedule Modal */}
      {selectedSchedule && (
        <div className={`modal fade ${showEditModal ? 'show d-block' : ''}`} style={{ display: showEditModal ? 'block' : 'none' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Schedule</h4>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => setShowEditModal(false)}
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <form onSubmit={handleEditSchedule}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Class</label>
                        <select 
                          name="className"
                          className="form-select" 
                          defaultValue={selectedSchedule.className}
                          required
                        >
                          <option value="">Select Class</option>
                          <option>I</option>
                          <option>II</option>
                          <option>III</option>
                          <option>IV</option>
                          <option>V</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Section</label>
                        <select 
                          name="section"
                          className="form-select" 
                          defaultValue={selectedSchedule.section}
                          required
                        >
                          <option value="">Select Section</option>
                          <option>A</option>
                          <option>B</option>
                          <option>C</option>
                          <option>D</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Subject</label>
                        <input 
                          type="text" 
                          name="subject"
                          className="form-control" 
                          defaultValue={selectedSchedule.subject}
                          required 
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Teacher</label>
                        <select 
                          name="teacher"
                          className="form-select" 
                          defaultValue={selectedSchedule.teacher}
                          required
                        >
                          <option value="">Select Teacher</option>
                          <option>John Smith</option>
                          <option>Sarah Johnson</option>
                          <option>Michael Brown</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Room</label>
                        <input 
                          type="text" 
                          name="room"
                          className="form-control" 
                          defaultValue={selectedSchedule.room}
                          required 
                        />
                      </div>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Day</label>
                            <select 
                              name="day"
                              className="form-select" 
                              defaultValue={selectedSchedule.day}
                              required
                            >
                              <option value="">Select Day</option>
                              <option>Monday</option>
                              <option>Tuesday</option>
                              <option>Wednesday</option>
                              <option>Thursday</option>
                              <option>Friday</option>
                              <option>Saturday</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Start Time</label>
                            <input 
                              type="time" 
                              name="startTime"
                              className="form-control" 
                              defaultValue={selectedSchedule.startTime} 
                              required 
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">End Time</label>
                            <input 
                              type="time" 
                              name="endTime"
                              className="form-control" 
                              defaultValue={selectedSchedule.endTime} 
                              required 
                            />
                          </div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="status-title">
                          <h5>Status</h5>
                          <p>Change the Status by toggle</p>
                        </div>
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            role="switch" 
                            id="edit-status-switch" 
                            name="status"
                            value="active"
                            defaultChecked={selectedSchedule.status === 'active'}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light me-2" 
                    onClick={() => setShowEditModal(false)}
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

      {/* Delete Confirmation Modal */}
      <div className={`modal fade ${showDeleteModal ? 'show d-block' : ''}`} style={{ display: showDeleteModal ? 'block' : 'none' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center">
              <div className="delete-icon">
                <i className="ti ti-trash-x" />
              </div>
              <h4>Confirm Deletion</h4>
              <p>You want to delete {selectedSchedule ? `schedule for ${selectedSchedule.className}-${selectedSchedule.section} (${selectedSchedule.subject})` : 'the selected schedule'}, this can't be undone once you delete.</p>
              <div className="d-flex justify-content-center">
                <button 
                  className="btn btn-light me-3"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Schedule Modal */}
      {selectedSchedule && (
        <div className={`modal fade ${showViewModal ? 'show d-block' : ''}`} style={{ display: showViewModal ? 'block' : 'none' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <div className="d-flex align-items-center">
                  <h4 className="modal-title">Schedule Details</h4>
                  <span className={`badge badge-soft-${selectedSchedule.status === 'active' ? 'success' : 'danger'} ms-2`}>
                    <i className="ti ti-circle-filled me-1 fs-5" />
                    {selectedSchedule.status.charAt(0).toUpperCase() + selectedSchedule.status.slice(1)}
                  </span>
                </div>
                <button 
                  type="button" 
                  className="btn-close custom-btn-close" 
                  onClick={() => setShowViewModal(false)}
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="schedule-detail-info">
                      <p>Class</p>
                      <span>{selectedSchedule.className} - {selectedSchedule.section}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="schedule-detail-info">
                      <p>Subject</p>
                      <span>{selectedSchedule.subject}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="schedule-detail-info">
                      <p>Teacher</p>
                      <span>{selectedSchedule.teacher}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="schedule-detail-info">
                      <p>Room</p>
                      <span>{selectedSchedule.room}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="schedule-detail-info">
                      <p>Day</p>
                      <span>{selectedSchedule.day}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="schedule-detail-info">
                      <p>Time</p>
                      <span>{selectedSchedule.startTime} - {selectedSchedule.endTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {(showAddModal || showDeleteModal || showViewModal || showEditModal) && (
        <div 
          className="modal-backdrop fade show" 
          style={{ zIndex: 1040 }}
          onClick={() => {
            setShowAddModal(false);
            setShowDeleteModal(false);
            setShowViewModal(false);
            setShowEditModal(false);
          }}
        />
      )}
    </>
  );
};
