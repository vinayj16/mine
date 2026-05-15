import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { classService } from '../../services/classService';
import type { Class } from '../../services/classService';

interface ClassSection {
  id: string;
  sectionName: string;
  status: 'active' | 'inactive';
  classCount: number;
}

const ClassSectionPage: React.FC = () => {
  // State management
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState<ClassSection | null>(null);
  const [newSection, setNewSection] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Fetch classes and extract sections
  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      setError(null);
       const response = await classService.getAll({
         page: 1, 
         limit: 1000
       });
       
       console.log('ClassSectionPage - raw response:', response);
       
       // Handle various response formats
       let classesArray: Class[] = [];
       if (response === undefined || response === null) {
         console.warn('ClassSectionPage - response is null or undefined');
       } else if (Array.isArray(response)) {
         classesArray = response;
       } else {
         const responseAny = response as any;
         if (responseAny && Array.isArray(responseAny.data)) {
           classesArray = responseAny.data;
         } else if (responseAny?.data?.data && Array.isArray(responseAny.data.data)) {
           classesArray = responseAny.data.data;
         } else if (responseAny?.data && typeof responseAny.data === 'object' && !(responseAny.data instanceof Array)) {
           // Handle case where response.data is an object containing the array
           if (Array.isArray(responseAny.data.items)) {
             classesArray = responseAny.data.items;
           } else if (Array.isArray(responseAny.data.results)) {
             classesArray = responseAny.data.results;
           } else if (Array.isArray(responseAny.data.content)) {
             classesArray = responseAny.data.content;
           } else {
             // Try to find any array property in the response.data object
             for (const key in responseAny.data) {
               if (Array.isArray(responseAny.data[key])) {
                 classesArray = responseAny.data[key];
                 break;
               }
             }
           }
         }
       }
       
       console.log('ClassSectionPage - extracted classes:', classesArray);
      
      // Extract unique sections from classes
      const sectionMap = new Map<string, { count: number; status: string }>();
      
      if (Array.isArray(classesArray)) {
        classesArray.forEach((cls: Class) => {
          if (cls.section) {
            const existing = sectionMap.get(cls.section);
            if (existing) {
              existing.count++;
            } else {
              sectionMap.set(cls.section, {
                count: 1,
                status: 'active'
              });
            }
          }
        });
      }
      
      // Convert map to array
      const sectionsArray: ClassSection[] = Array.from(sectionMap.entries()).map(([name, data], index) => ({
        id: `SE${index + 1}`,
        sectionName: name,
        status: 'active' as const,
        classCount: data.count
      }));
      
      setSections(sectionsArray.sort((a, b) => a.sectionName.localeCompare(b.sectionName)));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sections';
      console.error('Error fetching sections:', err);
      setError(errorMessage);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSection.trim()) {
      try {
        // Create a placeholder class with the new section
        await classService.create({
          name: 'Placeholder',
          section: newSection.trim(),
          classTeacher: 'TBD',
          subjects: []
        });
        
        toast.success('Section added successfully');
        setNewSection('');
        setShowAddModal(false);
        await fetchSections();
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add section';
        console.error('Error adding section:', err);
        toast.error(errorMessage);
      }
    }
  };

  const handleEditSection = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.info('Section editing is managed through class management');
    setShowEditModal(false);
  };

  const openEditModal = (section: ClassSection) => {
    setSelectedSection(section);
    setNewSection(section.sectionName);
    setIsActive(section.status === 'active');
    setShowEditModal(true);
  };

  const openDeleteModal = (section: ClassSection) => {
    setSelectedSection(section);
    setShowDeleteModal(true);
  };

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Sections</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <span>Academic</span>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Sections</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <div className="pe-1 mb-2">
            <button 
              className="btn btn-outline-light bg-white btn-icon me-1" 
              onClick={() => fetchSections()}
            >
              <i className="ti ti-refresh"></i>
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button 
              type="button" 
              className="btn btn-outline-light bg-white btn-icon me-1"
              onClick={() => window.print()}
            >
              <i className="ti ti-printer"></i>
            </button>
          </div>
          <div className="mb-2">
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setNewSection('');
                setIsActive(true);
                setShowAddModal(true);
              }}
            >
              <i className="ti ti-square-rounded-plus-filled me-2"></i>Add Section
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Class Sections</h4>
        </div>
        <div className="card-body p-0 py-3">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading sections...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger m-3" role="alert">
              <i className="ti ti-alert-circle me-2"></i>
              {error}
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-layout-grid" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <p className="mt-2 text-muted">No sections found. Add your first section to get started.</p>
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
                    <th>Section Name</th>
                    <th>Classes Using</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map((section) => (
                    <tr key={section.id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td><a href="#" className="link-primary">{section.id}</a></td>
                      <td>{section.sectionName}</td>
                      <td>{section.classCount}</td>
                      <td>
                        <span className={`badge badge-soft-${section.status === 'active' ? 'success' : 'danger'} d-inline-flex align-items-center`}>
                          <i className="ti ti-circle-filled fs-5 me-1"></i>
                          {section.status === 'active' ? 'Active' : 'Inactive'}
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
                                  onClick={() => openEditModal(section)}
                                >
                                  <i className="ti ti-edit-circle me-2"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item rounded-1 text-danger" 
                                  onClick={() => openDeleteModal(section)}
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
          )}
        </div>
      </div>

      {/* Add Section Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Section</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddModal(false)}
                />
              </div>
              <form onSubmit={handleAddSection}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Section Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={newSection}
                          onChange={(e) => setNewSection(e.target.value)}
                          placeholder="e.g., A, B, C"
                          required
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
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
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
                  <button type="submit" className="btn btn-primary">Add Section</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {showEditModal && selectedSection && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Section</h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowEditModal(false)}
                />
              </div>
              <form onSubmit={handleEditSection}>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <i className="ti ti-info-circle me-2"></i>
                    Sections are managed through class management. Please edit the classes that use this section.
                  </div>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Section Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={newSection}
                          readOnly
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Classes Using This Section</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={selectedSection.classCount}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-light" 
                    onClick={() => setShowEditModal(false)}
                  >
                    Close
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedSection && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center p-4">
                <i className="ti ti-alert-triangle fs-1 text-warning mb-3"></i>
                <h4>Cannot Delete Section</h4>
                <p>
                  Section <strong>{selectedSection.sectionName}</strong> is being used by {selectedSection.classCount} class(es).
                  <br />
                  Please remove or reassign these classes first.
                </p>
                <div className="d-flex justify-content-center mt-4">
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={() => setShowDeleteModal(false)}
                  >
                    OK
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

export default ClassSectionPage;
