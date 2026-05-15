import React, { useState } from 'react'

const UIButtonsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)

  const handleLoadingClick = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Buttons</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/">Dashboard</a>
              </li>
              <li className="breadcrumb-item">UI Components</li>
              <li className="breadcrumb-item active" aria-current="page">Buttons</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Default Buttons */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Default Buttons</h4>
        </div>
        <div className="card-body">
          <div className="btn-list">
            <button type="button" className="btn btn-primary">Primary</button>
            <button type="button" className="btn btn-secondary">Secondary</button>
            <button type="button" className="btn btn-success">Success</button>
            <button type="button" className="btn btn-danger">Danger</button>
            <button type="button" className="btn btn-warning">Warning</button>
            <button type="button" className="btn btn-info">Info</button>
            <button type="button" className="btn btn-light">Light</button>
            <button type="button" className="btn btn-dark">Dark</button>
            <button type="button" className="btn btn-link">Link</button>
          </div>
        </div>
      </div>

      {/* Outline Buttons */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Outline Buttons</h4>
        </div>
        <div className="card-body">
          <div className="btn-list">
            <button type="button" className="btn btn-outline-primary">Primary</button>
            <button type="button" className="btn btn-outline-secondary">Secondary</button>
            <button type="button" className="btn btn-outline-success">Success</button>
            <button type="button" className="btn btn-outline-danger">Danger</button>
            <button type="button" className="btn btn-outline-warning">Warning</button>
            <button type="button" className="btn btn-outline-info">Info</button>
            <button type="button" className="btn btn-outline-light">Light</button>
            <button type="button" className="btn btn-outline-dark">Dark</button>
          </div>
        </div>
      </div>

      {/* Rounded Buttons */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Rounded Buttons</h4>
        </div>
        <div className="card-body">
          <div className="btn-list">
            <button type="button" className="btn btn-primary rounded-pill">Primary</button>
            <button type="button" className="btn btn-secondary rounded-pill">Secondary</button>
            <button type="button" className="btn btn-success rounded-pill">Success</button>
            <button type="button" className="btn btn-danger rounded-pill">Danger</button>
            <button type="button" className="btn btn-warning rounded-pill">Warning</button>
            <button type="button" className="btn btn-info rounded-pill">Info</button>
            <button type="button" className="btn btn-light rounded-pill">Light</button>
            <button type="button" className="btn btn-dark rounded-pill">Dark</button>
          </div>
        </div>
      </div>

      {/* Button Sizes */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Button Sizes</h4>
        </div>
        <div className="card-body">
          <div className="mb-4">
            <h5 className="mb-3">Large Buttons</h5>
            <div className="btn-list">
              <button type="button" className="btn btn-primary btn-lg">Large Primary</button>
              <button type="button" className="btn btn-secondary btn-lg">Large Secondary</button>
              <button type="button" className="btn btn-success btn-lg">Large Success</button>
            </div>
          </div>
          
          <div className="mb-4">
            <h5 className="mb-3">Default Buttons</h5>
            <div className="btn-list">
              <button type="button" className="btn btn-primary">Default Primary</button>
              <button type="button" className="btn btn-secondary">Default Secondary</button>
              <button type="button" className="btn btn-success">Default Success</button>
            </div>
          </div>
          
          <div className="mb-4">
            <h5 className="mb-3">Small Buttons</h5>
            <div className="btn-list">
              <button type="button" className="btn btn-primary btn-sm">Small Primary</button>
              <button type="button" className="btn btn-secondary btn-sm">Small Secondary</button>
              <button type="button" className="btn btn-success btn-sm">Small Success</button>
            </div>
          </div>
          
          <div>
            <h5 className="mb-3">Extra Small Buttons</h5>
            <div className="btn-list">
              <button type="button" className="btn btn-primary btn-xs">Extra Small</button>
              <button type="button" className="btn btn-secondary btn-xs">Extra Small</button>
              <button type="button" className="btn btn-success btn-xs">Extra Small</button>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons with Icons */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Buttons with Icons</h4>
        </div>
        <div className="card-body">
          <div className="mb-4">
            <h5 className="mb-3">Icon Left</h5>
            <div className="btn-list">
              <button type="button" className="btn btn-primary">
                <i className="ti ti-plus me-2"></i>Add New
              </button>
              <button type="button" className="btn btn-success">
                <i className="ti ti-check me-2"></i>Save
              </button>
              <button type="button" className="btn btn-danger">
                <i className="ti ti-trash me-2"></i>Delete
              </button>
              <button type="button" className="btn btn-warning">
                <i className="ti ti-edit me-2"></i>Edit
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <h5 className="mb-3">Icon Right</h5>
            <div className="btn-list">
              <button type="button" className="btn btn-primary">
                Submit <i className="ti ti-arrow-right ms-2"></i>
              </button>
              <button type="button" className="btn btn-success">
                Download <i className="ti ti-download ms-2"></i>
              </button>
              <button type="button" className="btn btn-info">
                Settings <i className="ti ti-settings ms-2"></i>
              </button>
            </div>
          </div>
          
          <div>
            <h5 className="mb-3">Icon Only</h5>
            <div className="btn-list">
              <button type="button" className="btn btn-primary btn-icon">
                <i className="ti ti-home"></i>
              </button>
              <button type="button" className="btn btn-success btn-icon">
                <i className="ti ti-check"></i>
              </button>
              <button type="button" className="btn btn-danger btn-icon">
                <i className="ti ti-x"></i>
              </button>
              <button type="button" className="btn btn-warning btn-icon">
                <i className="ti ti-edit"></i>
              </button>
              <button type="button" className="btn btn-info btn-icon">
                <i className="ti ti-settings"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Button States */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Button States</h4>
        </div>
        <div className="card-body">
          <div className="mb-4">
            <h5 className="mb-3">Active State</h5>
            <div className="btn-list">
              <button type="button" className="btn btn-primary active">Active Primary</button>
              <button type="button" className="btn btn-success active">Active Success</button>
              <button type="button" className="btn btn-danger active">Active Danger</button>
            </div>
          </div>
          
          <div className="mb-4">
            <h5 className="mb-3">Disabled State</h5>
            <div className="btn-list">
              <button type="button" className="btn btn-primary" disabled>Disabled Primary</button>
              <button type="button" className="btn btn-success" disabled>Disabled Success</button>
              <button type="button" className="btn btn-danger" disabled>Disabled Danger</button>
            </div>
          </div>
          
          <div>
            <h5 className="mb-3">Loading State</h5>
            <div className="btn-list">
              <button 
                type="button" 
                className="btn btn-primary"
                disabled={isLoading}
                onClick={handleLoadingClick}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Loading...
                  </>
                ) : (
                  'Click to Load'
                )}
              </button>
              <button 
                type="button" 
                className="btn btn-success"
                disabled={isLoading}
                onClick={handleLoadingClick}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  'Process Data'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Button Groups */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Button Groups</h4>
        </div>
        <div className="card-body">
          <div className="mb-4">
            <h5 className="mb-3">Basic Button Group</h5>
            <div className="btn-group" role="group">
              <button type="button" className="btn btn-outline-primary">Left</button>
              <button type="button" className="btn btn-outline-primary">Middle</button>
              <button type="button" className="btn btn-outline-primary">Right</button>
            </div>
          </div>
          
          <div className="mb-4">
            <h5 className="mb-3">Vertical Button Group</h5>
            <div className="btn-group-vertical" role="group">
              <button type="button" className="btn btn-outline-primary">Top</button>
              <button type="button" className="btn btn-outline-primary">Middle</button>
              <button type="button" className="btn btn-outline-primary">Bottom</button>
            </div>
          </div>
          
          <div>
            <h5 className="mb-3">Toolbar Style</h5>
            <div className="btn-group" role="group">
              <button type="button" className="btn btn-secondary">
                <i className="ti ti-align-left"></i>
              </button>
              <button type="button" className="btn btn-secondary">
                <i className="ti ti-align-center"></i>
              </button>
              <button type="button" className="btn btn-secondary">
                <i className="ti ti-align-right"></i>
              </button>
            </div>
            <div className="btn-group ms-2" role="group">
              <button type="button" className="btn btn-secondary">
                <i className="ti ti-bold"></i>
              </button>
              <button type="button" className="btn btn-secondary">
                <i className="ti ti-italic"></i>
              </button>
              <button type="button" className="btn btn-secondary">
                <i className="ti ti-underline"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Block Buttons */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Block Buttons</h4>
        </div>
        <div className="card-body">
          <div className="d-grid gap-2">
            <button className="btn btn-primary" type="button">Block level button</button>
            <button className="btn btn-success" type="button">Block level button</button>
            <button className="btn btn-danger" type="button">Block level button</button>
          </div>
        </div>
      </div>
    </>
  )
}

export default UIButtonsPage
