/**
 * Example Component: Real-time Dashboard Management
 * Demonstrates how to use the real-time dashboard API with React hooks
 */

import React, { useState } from 'react'
import { useDashboardManagement, useDashboardRoleSwitch } from '../../hooks/useDashboard'

const RealTimeDashboardExample: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState('admin')
  const { switchRole, dashboardData, loading, error } = useDashboardRoleSwitch()
  const { stats, refreshAllData } = useDashboardManagement(selectedRole)

  // Handle role change
  const handleRoleChange = (newRole: string) => {
    setSelectedRole(newRole)
    switchRole(newRole)
  }

  // Available roles for demonstration
  const availableRoles = [
    { value: 'superadmin', label: 'Super Admin' },
    { value: 'institution_admin', label: 'Institution Admin' },
    { value: 'admin', label: 'School Admin' },
    { value: 'principal', label: 'Principal' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'student', label: 'Student' },
    { value: 'parent', label: 'Parent' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'hr_manager', label: 'HR Manager' },
    { value: 'librarian', label: 'Librarian' },
    { value: 'transport_manager', label: 'Transport Manager' },
    { value: 'hostel_warden', label: 'Hostel Warden' },
    { value: 'staff_member', label: 'Staff Member' }
  ]

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error loading dashboard</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => handleRoleChange(selectedRole)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Real-time Dashboard</h1>
        <div className="flex space-x-4">
          <select
            value={selectedRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableRoles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <button
            onClick={refreshAllData}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Refresh All
          </button>
        </div>
      </div>

      {dashboardData && (
        <>
          {/* Dashboard Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{dashboardData.title}</h2>
                <p className="text-gray-600 mt-2">{dashboardData.description}</p>
                <div className="flex items-center space-x-4 mt-4">
                  {dashboardData.badge && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {dashboardData.badge}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    Route: {dashboardData.route}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Demo User</div>
                <div className="font-medium">{dashboardData.demoUser.name}</div>
                <div className="text-sm text-gray-600">{dashboardData.demoUser.email}</div>
                <div className="text-sm text-gray-600">Plan: {dashboardData.demoUser.plan}</div>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {dashboardData.kpis.map((kpi, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">{kpi.label}</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{kpi.value}</div>
                {kpi.note && (
                  <div className="text-sm text-gray-600 mt-2">{kpi.note}</div>
                )}
              </div>
            ))}
          </div>

          {/* Dashboard Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Permissions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Permissions</h3>
              <div className="space-y-2">
                {dashboardData.permissions.map((permission, index) => (
                  <div key={index} className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded">
                    {permission}
                  </div>
                ))}
              </div>
            </div>

            {/* Getting Started */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h3>
              <p className="text-gray-600">{dashboardData.startingPoint}</p>
              
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Demo User Modules:</h4>
                <div className="flex flex-wrap gap-2">
                  {dashboardData.demoUser.modules.map((module: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      {module}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* System Statistics (if available) */}
          {stats && Object.keys(stats).length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.institutions}</div>
                  <div className="text-sm text-gray-600">Institutions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.regions}</div>
                  <div className="text-sm text-gray-600">Regions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.employees}</div>
                  <div className="text-sm text-gray-600">Employees</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">${(stats.revenue / 1000).toFixed(0)}K</div>
                  <div className="text-sm text-gray-600">Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{stats.books}</div>
                  <div className="text-sm text-gray-600">Books</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.vehicles}</div>
                  <div className="text-sm text-gray-600">Vehicles</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default RealTimeDashboardExample
