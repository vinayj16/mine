import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import apiClient from '../../api/client'
import { useAuth } from '../../store/authStore'
import InstitutionDetailsCard from '../../components/dashboard/InstitutionDetailsCard'
import { INDIAN_CURRENCY } from '../../config/indianLocalization'

const TransportDashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalRoutes: 0,
    busesRunning: 0,
    totalStudents: 0,
    pendingIssues: 0
  })
  const [routeData, setRouteData] = useState<Array<{
    route: string
    bus: string
    students: number
    status: string
    arrivalTime: string
  }>>([])
  const [busStatusData, setBusStatusData] = useState<Array<{
    status: string
    count: number
  }>>([])
  const [emailSending, setEmailSending] = useState(false)
  const [emailMessage, setEmailMessage] = useState<string | null>(null)

  const sendTransportEmail = async (studentId: string) => {
    // Validate required parameters
    if (!studentId) {
      setEmailMessage('Invalid student ID')
      setTimeout(() => setEmailMessage(null), 3000)
      return
    }

    // Validate user and institution data
    if (!user?.institutionData) {
      setEmailMessage('User institution data not available')
      setTimeout(() => setEmailMessage(null), 3000)
      return
    }

    try {
      setEmailSending(true)
      const response = await apiClient.post(`/transport/send-email/${studentId}`, {
        transportData: {
          busNumber: 'BUS-001',
          routeNumber: 'R-001',
          driverName: 'John Doe',
          driverPhone: '+1234567890',
          conductorName: 'Jane Smith',
          conductorPhone: '+0987654321',
          pickupPoint: 'Main Gate',
          pickupTime: '7:30 AM',
          dropPoint: 'School Gate',
          dropTime: '3:30 PM',
          transportFee: INDIAN_CURRENCY.format(5000),
          paymentStatus: 'Paid',
          dueDate: '2024-04-30',
          schoolName: user.institutionData.name || 'EduSearch School'
        }
      })
      if (response.data.success) {
        setEmailMessage('Transport email sent successfully!')
        setTimeout(() => setEmailMessage(null), 3000)
      }
    } catch (err: any) {
      console.error('Error sending transport email:', err)
      const errorMessage = err.response?.data?.message || 'Failed to send transport email'
      setEmailMessage(errorMessage)
      setTimeout(() => setEmailMessage(null), 3000)
    } finally {
      setEmailSending(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const instId = user?.institutionId || user?.institution || '';

        // Use the same APIs as the transport pages.
        // 1) Routes (for route list + route counts + active/inactive)
        const routesResponse = await apiClient.get(
          `/transport/routes?institutionId=${instId}&_t=${Date.now()}`
        );

        const routesPayload = routesResponse.data;
        const routesRaw = routesPayload?.data?.routes ?? routesPayload?.data ?? routesPayload?.routes;
        const routesList: any[] = Array.isArray(routesRaw)
          ? routesRaw
          : Array.isArray(routesPayload)
            ? routesPayload
            : [];

        // Normalize route fields used by this dashboard.
        const normalizedRouteData = routesList.map((r) => ({
          route: r.name || r.routeName || '-',
          bus: r.vehicle?.registrationNumber || r.vehicleNumber || '-',
          students: r.studentsCount ?? r.assignedStudents ?? 0,
          status: r.status === 'active' || r.status === 'Active' ? 'On Time' : r.status === 'inactive' || r.status === 'Inactive' ? 'Delayed' : (r.status || 'On Time'),
          arrivalTime: r.startTime || r.arrivalTime || '-',
        }));

        setRouteData(normalizedRouteData.slice(0, 10));

        // 2) Vehicles (for bus running + maintenance count)
        const vehiclesResponse = await apiClient.get(
          `/transport/vehicles?tenant=${instId}&_t=${Date.now()}`
        );
        const vehiclesPayload = vehiclesResponse.data;
        const vehiclesRaw = vehiclesPayload?.data?.vehicles ?? vehiclesPayload?.data ?? vehiclesPayload?.vehicles;
        const vehiclesList: any[] = Array.isArray(vehiclesRaw)
          ? vehiclesRaw
          : Array.isArray(vehiclesPayload)
            ? vehiclesPayload
            : [];

        const busesRunning = vehiclesList.filter((v) => (v.status || '').toLowerCase() === 'active').length;
        const totalStudents = 0; // not consistently available from these endpoints
        const pendingIssues = 0; // not consistently available from these endpoints

        setStats({
          totalRoutes: routesList.length,
          busesRunning,
          totalStudents,
          pendingIssues,
        });

        // 3) Bus status chart (active/maintenance/inactive from vehicles)
        const countByStatus = (status: string) =>
          vehiclesList.filter((v) => (v.status || '').toLowerCase() === status).length;

        setBusStatusData([
          { status: 'Active', count: countByStatus('active') },
          { status: 'Maintenance', count: countByStatus('maintenance') },
          { status: 'Inactive', count: countByStatus('inactive') },
        ]);

        // 4) Complaints (optional; keep empty if endpoint not available)
        // Complaints endpoint not used in this dashboard, keeping state for future use

      } catch (err: any) {
        console.error('Error fetching transport dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to load transport dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.institutionId, user?.institution]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    )
  }

  return (
    <div>
      {/* INSTITUTION DETAILS */}
      <InstitutionDetailsCard
        institution={user?.institutionData}
        userRole={user?.role}
        plan={user?.plan}
        lastUpdated={new Date().toISOString()}
      />

      {/* ── PAGE HEADER ── */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Transport Manager Dashboard</h3>
          <nav>
            <ol className="breadcrumb mb-0">
<li className="breadcrumb-item"><Link to="/dashboard/transport">Dashboard</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Transport</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
          <button 
            className="btn btn-info"
            onClick={() => sendTransportEmail(user?.id || '')}
            disabled={!user?.id || emailSending}
          >
            <i className="ti ti-mail me-1" />{emailSending ? 'Sending...' : 'Send Transport Email'}
          </button>
          <Link to="/dashboard/transport/routes" className="btn btn-primary">
            <i className="ti ti-route me-1" />Routes
          </Link>
          <Link to="/dashboard/transport/vehicles" className="btn btn-success">
            <i className="ti ti-bus me-1" />Vehicles
          </Link>
        </div>
      </div>
      
      {emailMessage && (
        <div className={`alert ${emailMessage.includes('success') ? 'alert-success' : 'alert-danger'} mb-3`}>
          {emailMessage}
        </div>
      )}

      {/* ── STATS CARDS ── */}
      <div className="row mb-4">
        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill border-0">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <h2 className="mb-0">{stats.totalRoutes}</h2>
                <p className="mb-0">Total Routes</p>
                <small className="text-muted">Active today</small>
              </div>
              <div className="avatar avatar-xl bg-primary rounded d-flex align-items-center justify-content-center">
                <i className="ti ti-route fs-24 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill border-0">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <h2 className="mb-0">{stats.busesRunning}</h2>
                <p className="mb-0">Buses Running</p>
                <small className="text-muted">2 under maintenance</small>
              </div>
              <div className="avatar avatar-xl bg-success rounded d-flex align-items-center justify-content-center">
                <i className="ti ti-bus fs-24 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill border-0">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <h2 className="mb-0">{stats.totalStudents}</h2>
                <p className="mb-0">Total Students</p>
                <small className="text-muted">Using transport</small>
              </div>
              <div className="avatar avatar-xl bg-info rounded d-flex align-items-center justify-content-center">
                <i className="ti ti-users fs-24 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card flex-fill border-0">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <h2 className="mb-0">{stats.pendingIssues}</h2>
                <p className="mb-0">Pending Issues</p>
                <small className="text-muted">1 critical</small>
              </div>
              <div className="avatar avatar-xl bg-danger rounded d-flex align-items-center justify-content-center">
                <i className="ti ti-alert-circle fs-24 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BUS STATUS DISTRIBUTION CHART ── */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Bus Status Distribution</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={busStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── TODAY'S ROUTES ── */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Today's Bus Status</h5>
              <Link to="/dashboard/transport/routes" className="btn btn-sm btn-primary">
                <i className="ti ti-plus me-1" />Add Route
              </Link>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Route</th>
                      <th>Bus</th>
                      <th>Students</th>
                      <th>Status</th>
                      <th>Arrival Time</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routeData.map((route, index) => (
                      <tr key={index}>
                        <td>{route.route}</td>
                        <td>{route.bus}</td>
                        <td>{route.students}</td>
                        <td>
                          <span className={`badge ${
                            route.status === 'On Time' 
                              ? 'bg-success-transparent' 
                              : route.status === 'Delayed'
                                ? 'bg-warning-transparent'
                                : 'bg-danger-transparent'
                          }`}>
                            {route.status}
                          </span>
                        </td>
                        <td>{route.arrivalTime}</td>
                        <td>
                          <Link to="#" className="btn btn-sm btn-primary">
                            <i className="ti ti-map" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK LINKS ── */}
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-2">
                <div className="col-sm-6">
                  <Link to="/dashboard/transport/routes" className="btn btn-light border w-100 text-start">
                    <i className="ti ti-route me-2" />Manage Routes
                  </Link>
                </div>
                <div className="col-sm-6">
                  <Link to="/dashboard/transport/vehicles" className="btn btn-light border w-100 text-start">
                    <i className="ti ti-bus me-2" />Manage Vehicles
                  </Link>
                </div>
                <div className="col-sm-6">
                  <Link to="/dashboard/transport/drivers" className="btn btn-light border w-100 text-start">
                    <i className="ti ti-user me-2" />Manage Drivers
                  </Link>
                </div>
                <div className="col-sm-6">
                  <Link to="/dashboard/transport/pickup-points" className="btn btn-light border w-100 text-start">
                    <i className="ti ti-map-pin me-2" />Pickup Points
                  </Link>
                </div>
                <div className="col-sm-6">
                  <Link to="/dashboard/transport/assign" className="btn btn-light border w-100 text-start">
                    <i className="ti ti-transfer me-2" />Assign Vehicle
                  </Link>
                </div>
                <div className="col-sm-6">
                  <Link to="/dashboard/transport/maintenance" className="btn btn-light border w-100 text-start">
                    <i className="ti ti-wrench me-2" />Vehicle Maintenance
                  </Link>
                </div>
                <div className="col-sm-6">
                  <Link to="/dashboard/transport/reports" className="btn btn-light border w-100 text-start">
                    <i className="ti ti-report me-2" />Transport Reports
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Application Quick Access</h5>
              </div>
              <div className="card-body">
                <div className="row g-2">
                  <div className="col-sm-4">
                    <Link to="/transport/apps/chat" className="btn btn-outline-primary w-100 py-3 d-flex flex-column align-items-center gap-2">
                      <i className="ti ti-brand-hipchat fs-24" />
                      <span>Chat</span>
                    </Link>
                  </div>
                  <div className="col-sm-4">
                    <Link to="/transport/apps/calendar" className="btn btn-outline-info w-100 py-3 d-flex flex-column align-items-center gap-2">
                      <i className="ti ti-calendar fs-24" />
                      <span>Calendar</span>
                    </Link>
                  </div>
                  <div className="col-sm-4">
                    <Link to="/transport/apps/todo" className="btn btn-outline-success w-100 py-3 d-flex flex-column align-items-center gap-2">
                      <i className="ti ti-list-check fs-24" />
                      <span>Todo</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransportDashboardPage