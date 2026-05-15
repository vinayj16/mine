import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import InstitutionCreationWizard from '../superadmin/InstitutionCreationWizard'
import { useAuth } from '../../store/authStore'
import { toast } from 'react-toastify'

const AgentAddInstitutionPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is authenticated and is an agent
    if (!user) {
      toast.error('Please login to access this page')
      navigate('/login')
      return
    }

    if (user.role !== 'agent' && user.role !== 'Agent') {
      toast.error('Access denied. Agent role required.')
      navigate('/agent')
      return
    }
  }, [user, navigate])

  const handleInstitutionCreated = (institution: any) => {
    toast.success(`Institution "${institution.institutionName}" created successfully!`)
    
    // Navigate to institutions list after successful creation
    setTimeout(() => {
      navigate('/agent/institutions')
    }, 2000)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    toast.error(errorMessage)
  }

  if (loading && !user) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Verifying authentication...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Add New Institution</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to="/agent">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/agent/institutions">Institutions</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">Add Institution</li>
                </ol>
              </nav>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
              <i className="ti ti-alert-triangle me-2"></i>
              <div>
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          <InstitutionCreationWizard 
            context="agent" 
            agentId={user?.id}
            onInstitutionCreated={handleInstitutionCreated}
            onError={handleError}
            setLoading={setLoading}
          />
        </div>
      </div>
    </div>
  )
}

export default AgentAddInstitutionPage
