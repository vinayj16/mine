import React, { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'

interface StaffData {
  totalStaff: number;
  activeStaff: number;
  newStaff: number;
  departmentsCount: number;
  recentStaff: Array<{
    id: string;
    name: string;
    email: string;
    department: string;
    designation: string;
    joinDate: string;
    status: 'active' | 'inactive';
  }>;
  staffByDepartment: Array<{
    department: string;
    count: number;
  }>;
}

const StaffOverviewPage: React.FC = () => {
  const [data, setData] = useState<StaffData>({
    totalStaff: 0,
    activeStaff: 0,
    newStaff: 0,
    departmentsCount: 0,
    recentStaff: [],
    staffByDepartment: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStaffData()
  }, [])

  const fetchStaffData = async () => {
    try {
      setLoading(true)
      try {
        const response = await apiClient.get('/staff/institution')
        if (response.data?.success && response.data?.data) {
          const apiData = response.data.data
          // Validate and ensure arrays exist
          setData({
            totalStaff: apiData.totalStaff || 0,
            activeStaff: apiData.activeStaff || 0,
            newStaff: apiData.newStaff || 0,
            departmentsCount: apiData.departmentsCount || 0,
            recentStaff: Array.isArray(apiData.recentStaff) ? apiData.recentStaff : [],
            staffByDepartment: Array.isArray(apiData.staffByDepartment) ? apiData.staffByDepartment : []
          })
        }
      } catch {
        // Use demo data - already set as initial state
      }
    } catch (err: any) {
      console.error('Error fetching staff data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold">Staff Overview</h4>
          <p className="text-muted mb-0">Manage and view staff statistics</p>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h5>{data.totalStaff}</h5>
              <p className="mb-0">Total Staff</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h5>{data.activeStaff}</h5>
              <p className="mb-0">Active Staff</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <h5>{data.newStaff}</h5>
              <p className="mb-0">New This Month</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <h5>{data.departmentsCount}</h5>
              <p className="mb-0">Departments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5>Recent Staff</h5>
        </div>
        <div className="card-body">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentStaff.map(staff => (
                <tr key={staff.id}>
                  <td>{staff.name}</td>
                  <td>{staff.email}</td>
                  <td>{staff.department}</td>
                  <td>{staff.designation}</td>
                  <td>
                    <span className={`badge ${staff.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                      {staff.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default StaffOverviewPage
