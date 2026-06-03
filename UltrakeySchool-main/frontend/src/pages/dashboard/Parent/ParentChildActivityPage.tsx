import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../api/client';
import InstitutionDetailsCard from '../../../components/dashboard/InstitutionDetailsCard';
import { useAuth } from '../../../store/authStore';

interface Child {
  id: string;
  name: string;
  class?: string;
  section?: string;
  avatar?: string;
  relationship?: string;
  attendance: string;
  fees: { total: number; paid: number; pending: number };
  todayTimetable: any[];
}

const RELATIONSHIP_BADGES: Record<string, { label: string; color: string }> = {
  father: { label: 'Father', color: 'primary' },
  mother: { label: 'Mother', color: 'danger' },
  guardian: { label: 'Guardian', color: 'secondary' },
  grandparent: { label: 'Grandparent', color: 'info' },
  sibling: { label: 'Sibling', color: 'warning' },
  other: { label: 'Other', color: 'dark' },
};

const ACTIVITY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  timetable: { label: 'Timetable & Routine', icon: 'ti ti-calendar', color: 'info' },
  grades: { label: 'Grades & Results', icon: 'ti ti-report', color: 'warning' },
  attendance: { label: 'Attendance', icon: 'ti ti-checklist', color: 'secondary' },
  library: { label: 'Library Records', icon: 'ti ti-books', color: 'dark' },
  fees: { label: 'Fees & Payments', icon: 'ti ti-coin', color: 'success' },
};

const ParentChildActivityPage = () => {
  const { activity } = useParams<{ activity: string }>();
  const { user, institutionData } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const activityInfo = ACTIVITY_LABELS[activity || ''] || ACTIVITY_LABELS.timetable;

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/dashboard/parent');
      if (response.data.success) {
        const data = response.data.data;
        const childList = data.children || [];
        setChildren(childList);
        if (childList.length === 1) {
          setSelectedChildId(childList[0].id);
        }
      }
    } catch (err: any) {
      toast.error('Failed to load children data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const getActivityLink = (childId: string) => {
    const base = `/dashboard/parent/child/${childId}`;
    switch (activity) {
      case 'timetable': return `${base}/timetable`;
      case 'grades': return `${base}/results`;
      case 'attendance': return `${base}/attendance`;
      case 'library': return `${base}/library`;
      case 'fees': return `${base}/fees`;
      default: return base;
    }
  };

  return (
    <div>
      <InstitutionDetailsCard
        institution={institutionData || user?.institutionData}
        userRole={user?.role}
      />

      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">
            <i className={`${activityInfo.icon} me-2 text-${activityInfo.color}`}></i>
            {activityInfo.label}
          </h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
              <li className="breadcrumb-item"><Link to="/dashboard/parent">Parent</Link></li>
              <li className="breadcrumb-item active" aria-current="page">{activityInfo.label}</li>
            </ol>
          </nav>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="text-center py-5">
          <i className="ti ti-users-off fs-1 text-muted mb-3"></i>
          <h5>No Children Found</h5>
          <p className="text-muted">No children are linked to your account</p>
          <Link to="/dashboard/parent" className="btn btn-primary mt-2">
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <div className="row g-3">
          {children.map((child) => {
            const relBadge = RELATIONSHIP_BADGES[child.relationship || ''] || RELATIONSHIP_BADGES.guardian;
            const fees = child.fees || { total: 0, paid: 0, pending: 0 };
            return (
            <div key={child.id} className="col-xl-4 col-md-6">
              <div className="card border h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar avatar-lg rounded me-3 bg-light d-flex align-items-center justify-content-center">
                      <i className="ti ti-user fs-20 text-muted"></i>
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <h5 className="mb-0">{child.name}</h5>
                        <span className={`badge bg-${relBadge.color} badge-sm`}>{relBadge.label}</span>
                      </div>
                      <p className="text-muted mb-0 small">
                        Class: {child.class || 'N/A'} {child.section ? `, ${child.section}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="border rounded p-2 text-center">
                        <h6 className="text-success mb-1">{child.attendance}%</h6>
                        <small className="text-muted">Attendance</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="border rounded p-2 text-center">
                        {fees.pending > 0 ? (
                          <h6 className="text-danger mb-1">₹{fees.pending}</h6>
                        ) : (
                          <h6 className="text-success mb-1">
                            <i className="ti ti-circle-check"></i> Clear
                          </h6>
                        )}
                        <small className="text-muted">Fee Due</small>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <Link
                      to={getActivityLink(child.id)}
                      className={`btn btn-${activityInfo.color} w-100 d-flex align-items-center justify-content-center gap-2`}
                    >
                      <i className={activityInfo.icon}></i>
                      View {activityInfo.label}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ParentChildActivityPage;
