import React, { useState } from 'react'
import { useHRManagement, useHRFilters, useStaffSearch } from '../../hooks/useHRM'

const HRManagementExample: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  
  const { 
    staff, 
    departments,  
    leaveRecords, 
    stats, 
    loading, 
    error, 
    refreshAllData 
  } = useHRManagement(selectedDepartment, selectedStatus)
  
  const { filteredStaff, loading: filterLoading, currentFilter, applyFilter, clearFilter } = useHRFilters()
  const { searchResults, loading: searchLoading, searchStaff, clearSearch } = useStaffSearch()

  // Handle search
  const handleSearch = async () => {
    if (searchTerm.trim()) {
      await searchStaff(searchTerm)
      clearFilter()
    } else {
      clearSearch()
      applyFilter({ department: selectedDepartment, status: selectedStatus })
    }
  }

  // Handle filter changes
  const handleFilterChange = async (department?: string, status?: string) => {
    setSelectedDepartment(department || '')
    setSelectedStatus(status || '')
    clearSearch()
    await applyFilter({ department, status })
  }

  // Handle staff selection
  const handleStaffSelect = (staffId: string) => {
    setSelectedStaff(staffId === selectedStaff ? null : staffId)
  }

  // Get display staff (filtered or searched)
  const displayStaff = searchTerm.trim() ? searchResults : (currentFilter.department || currentFilter.status) ? filteredStaff : staff

  // Get selected staff details
  const selectedStaffDetails = staff.find(s => s.id === selectedStaff)

  if (loading && !staff.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading HR data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">HR Management</h1>
        <button
          onClick={refreshAllData}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Refresh All
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Staff</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStaff}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-green-500">Active Staff</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{stats.activeStaff}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-yellow-500">On Leave</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">{stats.onLeaveStaff}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-blue-500">Pending Leaves</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{stats.pendingLeaves}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search staff..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => handleFilterChange(e.target.value, selectedStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => handleFilterChange(selectedDepartment, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>

          {/* Clear Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">&nbsp;</label>
            <button
              onClick={() => {
                clearFilter()
                clearSearch()
                setSelectedDepartment('')
                setSelectedStatus('')
                setSearchTerm('')
              }}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Staff Members ({displayStaff.length})
              </h2>
            </div>

            {(filterLoading || searchLoading) ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            ) : displayStaff.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No staff found
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {displayStaff.map((staffMember) => (
                  <div 
                    key={staffMember.id} 
                    className="p-6 hover:bg-gray-50 cursor-pointer"
                    onClick={() => staffMember.id && handleStaffSelect(staffMember.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img
                          src={staffMember.avatar || '/assets/img/staff/default.jpg'}
                          alt={staffMember.name}
                          className="h-12 w-12 rounded-full"
                        />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{staffMember.name}</h3>
                          <p className="text-sm text-gray-600">{staffMember.email}</p>
                          <p className="text-sm text-gray-600">{staffMember.phone}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              staffMember.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : staffMember.status === 'inactive'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {staffMember.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {staffMember.department} • {staffMember.designation}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-2">
                          Joined {staffMember.joinDate}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          ${staffMember.salary?.toLocaleString()}/year
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Staff Details & Quick Actions */}
        <div className="space-y-6">
          {/* Selected Staff Details */}
          {selectedStaffDetails && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Details</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedStaffDetails.avatar || '/assets/img/staff/default.jpg'}
                    alt={selectedStaffDetails.name}
                    className="h-16 w-16 rounded-full"
                  />
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{selectedStaffDetails.name}</h4>
                    <p className="text-sm text-gray-600">{selectedStaffDetails.designation}</p>
                    <p className="text-sm text-gray-600">{selectedStaffDetails.department}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Email:</span>
                    <p className="text-gray-900">{selectedStaffDetails.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Phone:</span>
                    <p className="text-gray-900">{selectedStaffDetails.phone}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Salary:</span>
                    <p className="text-gray-900">${selectedStaffDetails.salary?.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Join Date:</span>
                    <p className="text-gray-900">{selectedStaffDetails.joinDate}</p>
                  </div>
                </div>

                {selectedStaffDetails.address && (
                  <div>
                    <span className="font-medium text-gray-500">Address:</span>
                    <p className="text-gray-900">{selectedStaffDetails.address}</p>
                  </div>
                )}

                {selectedStaffDetails.emergencyContact && (
                  <div>
                    <span className="font-medium text-gray-500">Emergency Contact:</span>
                    <p className="text-gray-900">
                      {selectedStaffDetails.emergencyContact.name} ({selectedStaffDetails.emergencyContact.relationship})
                    </p>
                    <p className="text-gray-900">{selectedStaffDetails.emergencyContact.phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Leave Records */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Leave Requests</h3>
            <div className="space-y-3">
              {leaveRecords.slice(0, 3).map((leave) => (
                <div key={leave.id} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{leave.staffName}</p>
                      <p className="text-sm text-gray-600">{leave.leaveType} • {leave.days} days</p>
                      <p className="text-xs text-gray-500">{leave.startDate} to {leave.endDate}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      leave.status === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : leave.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Departments Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Departments</h3>
            <div className="space-y-3">
              {departments.map((dept) => (
                <div key={dept.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{dept.name}</p>
                    <p className="text-sm text-gray-600">{dept.headOfDepartment}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{dept.staffCount} staff</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}
    </div>
  )
}

export default HRManagementExample
