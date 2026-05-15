/**
 * Example Component: Real-time Guardian Management
 * Demonstrates how to use the real-time guardian API with React hooks
 */

import React, { useState } from 'react'
import { useGuardianManagement, useGuardianFilters, useGuardian } from '../../hooks/useGuardians'

const GuardianManagementExample: React.FC = () => {
  const [schoolId] = useState('school-123') // Example school ID
  const [selectedGuardian, setSelectedGuardian] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const { guardians, stats, loading, error, refreshAllData } = useGuardianManagement(schoolId)
  const { filteredGuardians, loading: filterLoading, currentFilter, applyFilter, clearFilter } = useGuardianFilters(schoolId)
  const { loading: guardianLoading } = useGuardian(selectedGuardian || '', schoolId)

  // Handle search
  const handleSearch = async () => {
    if (searchTerm.trim()) {
      await applyFilter('search', searchTerm)
    } else {
      await applyFilter('all', '')
    }
  }

  // Handle status filter
  const handleStatusFilter = async (status: string) => {
    await applyFilter('status', status)
  }

  // Handle guardian selection
  const handleGuardianSelect = (guardianId: string) => {
    setSelectedGuardian(guardianId === selectedGuardian ? null : guardianId)
  }

  // Get display guardians (filtered or all)
  const displayGuardians = currentFilter.type !== 'all' ? filteredGuardians : guardians

  if (loading && !guardians.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading guardians...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Guardian Management</h1>
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
          <div className="text-sm font-medium text-gray-500">Total Guardians</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-green-500">Active</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{stats.active}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-yellow-500">Inactive</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">{stats.inactive}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-blue-500">Total Children</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{stats.totalChildren}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name or email..."
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

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Clear Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">&nbsp;</label>
            <button
              onClick={clearFilter}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {currentFilter.type !== 'all' && (
          <div className="mt-4 text-sm text-gray-600">
            Current filter: <span className="font-medium">{currentFilter.type}</span> - 
            <span className="font-medium"> {currentFilter.value}</span>
          </div>
        )}
      </div>

      {/* Guardians List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Guardians ({displayGuardians.length})
          </h2>
        </div>

        {filterLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Filtering guardians...</p>
          </div>
        ) : displayGuardians.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No guardians found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {displayGuardians.map((guardian) => (
              <div key={guardian.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={guardian.avatar}
                      alt={guardian.name}
                      className="h-12 w-12 rounded-full"
                    />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{guardian.name}</h3>
                      <p className="text-sm text-gray-600">{guardian.email}</p>
                      <p className="text-sm text-gray-600">{guardian.phone}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          guardian.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : guardian.status === 'inactive'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {guardian.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          Added on {guardian.addedOn}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-2">
                      {guardian.children.length} {guardian.children.length === 1 ? 'child' : 'children'}
                    </div>
                    <button
                      onClick={() => handleGuardianSelect(guardian.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      {selectedGuardian === guardian.id ? 'Hide' : 'View'} Details
                    </button>
                  </div>
                </div>

                {/* Children Details */}
                {guardian.children.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Children:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {guardian.children.map((child, index) => (
                        <div key={index} className="flex items-center space-x-3 bg-gray-50 p-3 rounded">
                          <img
                            src={child.avatar}
                            alt={child.name}
                            className="h-8 w-8 rounded-full"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{child.name}</div>
                            <div className="text-xs text-gray-600">
                              Class {child.classLabel} - Section {child.section}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Guardian Details */}
                {selectedGuardian === guardian.id && guardianLoading && (
                  <div className="mt-4 text-center text-gray-600">
                    Loading guardian details...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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

export default GuardianManagementExample
