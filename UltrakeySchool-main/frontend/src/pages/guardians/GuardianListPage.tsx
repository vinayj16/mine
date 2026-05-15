import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../store/authStore';
import guardianService from '../../services/guardianService';
import { mapGuardianToDisplay, type GuardianDisplay } from './guardianHelpers';

const GuardianListPage = () => {
  const { user } = useAuth();
  const [guardians, setGuardians] = useState<GuardianDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!user?.schoolId) {
      setError('Unable to determine the current school. Log in again or contact your administrator.');
      setLoading(false);

      return () => {
        isMounted = false;
      };
    }

    const loadGuardians = async () => {
      setLoading(true);

      try {
        const payload = await guardianService.listForSchool(user.schoolId, { limit: 50 });
        if (!isMounted) return;
        setGuardians(payload.guardians.map(mapGuardianToDisplay));
        setError(null);
      } catch (fetchError: any) {
        if (!isMounted) return;
        console.error('GuardianListPage:', fetchError);
        setError(fetchError?.message || 'Failed to load guardians.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadGuardians();

    return () => {
      isMounted = false;
    };
  }, [user?.schoolId]);

  return (
    <>
      <div className="d-md-flex d-block alignments-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Guardian List</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">Peoples</li>
              <li className="breadcrumb-item active" aria-current="page">
                Guardian List
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content alignments-center flex-wrap">
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon me-1">
              <i className="ti ti-refresh" />
            </button>
          </div>
          <div className="pe-1 mb-2">
            <button className="btn btn-outline-light bg-white btn-icon me-1">
              <i className="ti ti-printer" />
            </button>
          </div>
          <div className="dropdown me-2 mb-2">
            <button className="dropdown-toggle btn btn-light fw-medium d-inline-flex alignments-center" data-bs-toggle="dropdown">
              <i className="ti ti-file-export me-2" />
              Export
            </button>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <button className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-pdf me-2" />
                  Export as PDF
                </button>
              </li>
              <li>
                <button className="dropdown-item rounded-1">
                  <i className="ti ti-file-type-xls me-2" />
                  Export as Excel
                </button>
              </li>
            </ul>
          </div>
          <div className="mb-2">
            <button className="btn btn-primary d-flex alignments-center">
              <i className="ti ti-square-rounded-plus me-2" />
              Add Guardian
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex alignments-center justify-content-between flex-wrap pb-0">
          <h4 className="mb-3">Guardian List</h4>
          <div className="d-flex alignments-center flex-wrap">
            <div className="input-icon-start mb-3 me-2 position-relative">
              <span className="icon-addon">
                <i className="ti ti-calendar" />
              </span>
              <input type="text" className="form-control" defaultValue="Academic Year : 2024 / 2025" readOnly />
            </div>
            <div className="dropdown mb-3 me-2">
              <button className="btn btn-outline-light bg-white dropdown-toggle" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                <i className="ti ti-filter me-2" />
                Filter
              </button>
              <div className="dropdown-menu drop-width p-0">
                <div className="d-flex alignments-center border-bottom p-3">
                  <h4 className="mb-0">Filter</h4>
                </div>
                <div className="p-3 border-bottom pb-0">
                  <div className="row">
                    {['Guardian', 'Child', 'Class', 'Status'].map((label) => (
                      <div className="col-md-6" key={label}>
                        <div className="mb-3">
                          <label className="form-label">{label}</label>
                          <select className="form-select">
                            <option>Select</option>
                            <option>Option 1</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 d-flex alignments-center justify-content-end">
                  <button className="btn btn-light me-3">Reset</button>
                  <button className="btn btn-primary">Apply</button>
                </div>
              </div>
            </div>
            <div className="d-flex alignments-center bg-white border rounded-2 p-1 mb-3 me-2">
              <button className="btn btn-icon btn-sm primary-hover active me-1">
                <i className="ti ti-list-tree" />
              </button>
              <Link to="/guardian-grid" className="btn btn-icon btn-sm bg-light primary-hover">
                <i className="ti ti-grid-dots" />
              </Link>
            </div>
            <div className="dropdown mb-3">
              <button className="btn btn-outline-light bg-white dropdown-toggle" data-bs-toggle="dropdown">
                <i className="ti ti-sort-ascending-2 me-2" />
                Sort by A-Z
              </button>
              <ul className="dropdown-menu p-3">
                {['Ascending', 'Descending', 'Recently Viewed', 'Recently Added'].map((label) => (
                  <li key={label}>
                    <button className="dropdown-item rounded-1">{label}</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger m-3" role="alert">
            {error}
          </div>
        )}

        <div className="card-body p-0 py-3">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : guardians.length === 0 ? (
            <div className="p-5 text-center text-muted">No guardians have been registered for this school.</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead className="thead-light">
                  <tr>
                    <th>
                      <div className="form-check form-check-md">
                        <input className="form-check-input" type="checkbox" />
                      </div>
                    </th>
                    <th>ID</th>
                    <th>Guardian Name</th>
                    <th>Child</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {guardians.map((guardian) => (
                    <tr key={guardian.id}>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td className="text-primary">{guardian.id}</td>
                      <td>
                        <div className="d-flex alignments-center">
                          <span className="avatar avatar-md me-2">
                            <img src={guardian.avatar} className="img-fluid rounded-circle" alt={guardian.name} />
                          </span>
                          <div className="overflow-hidden">
                            <p className="text-dark mb-0">{guardian.name}</p>
                            <small className="text-muted">Added on {guardian.addedOn}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex alignments-center">
                          <span className="avatar avatar-md me-2">
                            <img src={guardian.child.avatar} className="img-fluid rounded-circle" alt={guardian.child.name} />
                          </span>
                          <div className="overflow-hidden">
                            <p className="text-dark mb-0">{guardian.child.name}</p>
                            <small className="text-muted">
                              {guardian.child.classLabel}, {guardian.child.section}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>{guardian.phone}</td>
                      <td>{guardian.email}</td>
                      <td>
                        <div className="dropdown">
                          <button className="btn btn-white btn-icon btn-sm d-flex alignments-center justify-content-center rounded-circle p-0" data-bs-toggle="dropdown">
                            <i className="ti ti-dots-vertical fs-14" />
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end p-3">
                            <li>
                              <button className="dropdown-item rounded-1">
                                <i className="ti ti-edit-circle me-2" />
                                Edit
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item rounded-1">
                                <i className="ti ti-trash-x me-2" />
                                Delete
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
          )}
        </div>
      </div>
    </>
  );
};

export default GuardianListPage;
