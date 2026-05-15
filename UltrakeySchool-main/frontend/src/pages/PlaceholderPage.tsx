import { useState, useEffect } from 'react';
import apiClient from '../api/client';

type DataSource = 
  | 'students' 
  | 'teachers' 
  | 'classes' 
  | 'subjects' 
  | 'attendance' 
  | 'exams' 
  | 'fees' 
  | 'homework' 
  | 'events' 
  | 'notices' 
  | 'statistics'
  | 'parents'
  | 'staff'
  | 'departments'
  | 'branches'
  | 'library'
  | 'transport'
  | 'hostel';

type PlaceholderPageProps = {
  title: string;
  description?: string;
  dataSource?: DataSource;
};

const PlaceholderPage = ({ title, description, dataSource }: PlaceholderPageProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dataSource) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let endpoint = '';
        
        // Map dataSource to API endpoint
        switch (dataSource) {
          case 'students':
            endpoint = '/students';
            break;
          case 'teachers':
            endpoint = '/teachers';
            break;
          case 'classes':
            endpoint = '/classes';
            break;
          case 'subjects':
            endpoint = '/subjects';
            break;
          case 'attendance':
            endpoint = '/attendance';
            break;
          case 'exams':
            endpoint = '/exams';
            break;
          case 'fees':
            endpoint = '/fees';
            break;
          case 'homework':
            endpoint = '/homework';
            break;
          case 'events':
            endpoint = '/events';
            break;
          case 'notices':
            endpoint = '/notices';
            break;
          case 'statistics':
            endpoint = '/statistics/dashboard';
            break;
          case 'parents':
            endpoint = '/parents';
            break;
          case 'staff':
            endpoint = '/staff';
            break;
          case 'departments':
            endpoint = '/departments';
            break;
          case 'branches':
            endpoint = '/branches';
            break;
          case 'library':
            endpoint = '/library/books';
            break;
          case 'transport':
            endpoint = '/transport/vehicles';
            break;
          case 'hostel':
            endpoint = '/hostel/rooms';
            break;
          default:
            setData([]);
            return;
        }

        const response = await apiClient.get(endpoint);
        
        // Handle different response formats
        if (response?.data) {
          if (response.data.success) {
            // Standard API response format
            const responseData = response.data.data;
            if (Array.isArray(responseData)) {
              setData(responseData);
            } else if (responseData && typeof responseData === 'object') {
              // For statistics or single object responses
              setData([responseData]);
            } else {
              setData([]);
            }
          } else if (Array.isArray(response.data)) {
            // Direct array response
            setData(response.data);
          } else {
            setData([]);
          }
        } else {
          setData([]);
        }
      } catch (err: any) {
        console.error(`Error fetching ${dataSource}:`, err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch data';
        setError(errorMessage);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dataSource]);

  // If no data source specified, show simple placeholder
  if (!dataSource) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-file-code fs-1 text-muted mb-3"></i>
          <h2 className="mb-3">{title}</h2>
          <p className="text-muted mb-4">
            {description ?? 'This page is under development and will be available soon.'}
          </p>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Render with data fetching
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title mb-0">{title}</h3>
      </div>
      <div className="card-body">
        {description && <p className="text-muted mb-3">{description}</p>}
        
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading data...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="ti ti-alert-circle me-2"></i>
            <div>{error}</div>
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="text-center py-5">
            <i className="ti ti-database-off fs-1 text-muted mb-3"></i>
            <h4 className="mb-2">No data available</h4>
            <p className="text-muted">There are no records to display at this time.</p>
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="thead-light">
                  <tr>
                    {Object.keys(data[0] || {}).slice(0, 5).map(key => (
                      <th key={key}>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 10).map((item, index) => (
                    <tr key={item._id || item.id || index}>
                      {Object.values(item).slice(0, 5).map((value: any, i) => (
                        <td key={i}>
                          {value === null || value === undefined 
                            ? '-' 
                            : typeof value === 'object' 
                              ? JSON.stringify(value).slice(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '')
                              : String(value).slice(0, 100)
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.length > 10 && (
              <div className="alert alert-info mt-3" role="alert">
                <i className="ti ti-info-circle me-2"></i>
                Showing 10 of {data.length} records
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PlaceholderPage;
