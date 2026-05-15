import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../store/authStore';
import guardianService from '../../services/guardianService';
import { mapGuardianToDisplay, type GuardianDisplay } from './guardianHelpers';

const GuardianGridPage = () => {
  const { user } = useAuth();
  const [guardians, setGuardians] = useState<GuardianDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!user?.schoolId) {
      setError('Unable to resolve your school. Please sign in again.');
      setLoading(false);

      return () => {
        isMounted = false;
      };
    }

    const fetchGuardians = async () => {
      setLoading(true);

      try {
        const payload = await guardianService.listForSchool(user.schoolId, { limit: 100 });
        if (!isMounted) return;
        setGuardians(payload.guardians.map(mapGuardianToDisplay));
        setError(null);
      } catch (fetchError: any) {
        if (!isMounted) return;
        console.error('GuardianGridPage:', fetchError);
        setError(fetchError?.message || 'Failed to load guardians.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchGuardians();

    return () => {
      isMounted = false;
    };
  }, [user?.schoolId]);

  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Guardian</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">Peoples</li>
              <li className="breadcrumb-item active" aria-current="page">
                Guardian Grid
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
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
            <button className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center" data-bs-toggle="dropdown">
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
            <button className="btn btn-primary d-flex align-items-center">
              <i className="ti ti-square-rounded-plus me-2" />
              Add Guardian
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-3 border rounded-1 d-flex align-items-center justify-content-between flex-wrap mb-4 pb-0">
        <h4 className="mb-3">Guardian Grid</h4>
        <div className="d-flex align-items-center flex-wrap">
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
              <div className="d-flex align-items-center border-bottom p-3">
                <h4 className="mb-0">Filter</h4>
              </div>
              <div className="p-3 pb-0 border-bottom">
                <div className="row">
                  {['Guardian Name', 'Child'].map((label) => (
                    <div className="col-md-6" key={label}>
                      <div className="mb-3">
                        <label className="form-label">{label}</label>
                        <select className="form-select">
                          <option>Select</option>
                          <option>Option 1</option>
                          <option>Option 2</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 d-flex align-items-center justify-content-end">
                <button className="btn btn-light me-3">Reset</button>
                <button className="btn btn-primary">Apply</button>
              </div>
            </div>
          </div>
          <div className="d-flex alignments-center bg-white border rounded-2 p-1 mb-3 me-2">
            <Link to="/guardians" className="btn btn-icon btn-sm bg-light primary-hover me-1">
              <i className="ti ti-list-tree" />
            </Link>
            <button className="btn btn-icon btn-sm primary-hover active">
              <i className="ti ti-grid-dots" />
            </button>
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

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : (
        <div className="row">
          {guardians.map((guardian) => (
            <div className="col-xl-4 col-md-6 d-flex" key={guardian.id}>
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <span className="link-primary">{guardian.id}</span>
                  <div className="dropdown">
                    <button className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0" data-bs-toggle="dropdown">
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
                </div>
                <div className="card-body">
                  <div className="bg-light-300 rounded-2 p-3 mb-3">
                    <div className="d-flex align-items-center">
                      <span className="avatar avatar-lg flex-shrink-0">
                        <img src={guardian.avatar} className="img-fluid rounded-circle" alt={guardian.name} />
                      </span>
                      <div className="ms-2 overflow-hidden">
                        <h6 className="text-dark text-truncate mb-0">{guardian.name}</h6>
                        <p className="mb-0">Added on {guardian.addedOn}</p>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-between gx-2">
                    <div>
                      <p className="mb-0">Email</p>
                      <p className="text-dark mb-0">{guardian.email}</p>
                    </div>
                    <div>
                      <p className="mb-0">Phone</p>
                      <p className="text-dark mb-0">{guardian.phone}</p>
                    </div>
                  </div>
                </div>
                <div className="card-footer d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <span className="avatar avatar-md flex-shrink-0 p-0 me-2">
                      <img src={guardian.child.avatar} alt={guardian.child.name} className="img-fluid rounded-circle" />
                    </span>
                    <div>
                      <p className="text-dark mb-0">{guardian.child.name}</p>
                      <small className="text-muted">
                        {guardian.child.classLabel}, {guardian.child.section}
                      </small>
                    </div>
                  </div>
                  <button className="btn btn-light btn-sm">View Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default GuardianGridPage;
