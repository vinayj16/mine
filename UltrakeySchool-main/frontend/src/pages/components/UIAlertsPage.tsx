import React, { useState } from 'react'

const UIAlertsPage: React.FC = () => {
  const [showAlerts, setShowAlerts] = useState({
    primary: true,
    secondary: true,
    success: true,
    danger: true,
    warning: true,
    info: true,
    light: true,
    dark: true
  })

  const handleClose = (alertType: keyof typeof showAlerts) => {
    setShowAlerts(prev => ({ ...prev, [alertType]: false }))
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Alerts</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/">Dashboard</a>
              </li>
              <li className="breadcrumb-item">UI Components</li>
              <li className="breadcrumb-item active" aria-current="page">Alerts</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Default Alerts */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Default Alerts</h4>
        </div>
        <div className="card-body">
          <div className="alert alert-primary" role="alert">
            <strong>Primary!</strong> This is a primary alertâ€”check it out!
          </div>
          <div className="alert alert-secondary" role="alert">
            <strong>Secondary!</strong> This is a secondary alertâ€”check it out!
          </div>
          <div className="alert alert-success" role="alert">
            <strong>Success!</strong> This is a success alertâ€”check it out!
          </div>
          <div className="alert alert-danger" role="alert">
            <strong>Danger!</strong> This is a danger alertâ€”check it out!
          </div>
          <div className="alert alert-warning" role="alert">
            <strong>Warning!</strong> This is a warning alertâ€”check it out!
          </div>
          <div className="alert alert-info" role="alert">
            <strong>Info!</strong> This is a info alertâ€”check it out!
          </div>
          <div className="alert alert-light" role="alert">
            <strong>Light!</strong> This is a light alertâ€”check it out!
          </div>
          <div className="alert alert-dark" role="alert">
            <strong>Dark!</strong> This is a dark alertâ€”check it out!
          </div>
        </div>
      </div>

      {/* Dismissible Alerts */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Dismissible Alerts</h4>
        </div>
        <div className="card-body">
          {showAlerts.primary && (
            <div className="alert alert-primary alert-dismissible fade show" role="alert">
              <strong>Primary!</strong> You should check in on some of those fields below.
              <button type="button" className="btn-close" onClick={() => handleClose('primary')}></button>
            </div>
          )}
          {showAlerts.secondary && (
            <div className="alert alert-secondary alert-dismissible fade show" role="alert">
              <strong>Secondary!</strong> You should check in on some of those fields below.
              <button type="button" className="btn-close" onClick={() => handleClose('secondary')}></button>
            </div>
          )}
          {showAlerts.success && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <strong>Success!</strong> You successfully read this important alert message.
              <button type="button" className="btn-close" onClick={() => handleClose('success')}></button>
            </div>
          )}
          {showAlerts.danger && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <strong>Danger!</strong> Change a few things up and try submitting again.
              <button type="button" className="btn-close" onClick={() => handleClose('danger')}></button>
            </div>
          )}
          {showAlerts.warning && (
            <div className="alert alert-warning alert-dismissible fade show" role="alert">
              <strong>Warning!</strong> Better check yourself, you're not looking too good.
              <button type="button" className="btn-close" onClick={() => handleClose('warning')}></button>
            </div>
          )}
          {showAlerts.info && (
            <div className="alert alert-info alert-dismissible fade show" role="alert">
              <strong>Info!</strong> This alert needs your attention, but it's not super important.
              <button type="button" className="btn-close" onClick={() => handleClose('info')}></button>
            </div>
          )}
          {showAlerts.light && (
            <div className="alert alert-light alert-dismissible fade show" role="alert">
              <strong>Light!</strong> This is a light alertâ€”check it out!
              <button type="button" className="btn-close" onClick={() => handleClose('light')}></button>
            </div>
          )}
          {showAlerts.dark && (
            <div className="alert alert-dark alert-dismissible fade show" role="alert">
              <strong>Dark!</strong> This is a dark alertâ€”check it out!
              <button type="button" className="btn-close" onClick={() => handleClose('dark')}></button>
            </div>
          )}
        </div>
      </div>

      {/* Alerts with Icons */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Alerts with Icons</h4>
        </div>
        <div className="card-body">
          <div className="alert alert-primary d-flex align-items-center" role="alert">
            <i className="ti ti-bell-ringing-2 me-2"></i>
            <div>
              <strong>Primary Alert!</strong> This alert has an icon.
            </div>
          </div>
          <div className="alert alert-success d-flex align-items-center" role="alert">
            <i className="ti ti-circle-check me-2"></i>
            <div>
              <strong>Success Alert!</strong> Operation completed successfully.
            </div>
          </div>
          <div className="alert alert-warning d-flex align-items-center" role="alert">
            <i className="ti ti-alert-triangle me-2"></i>
            <div>
              <strong>Warning Alert!</strong> Please review your input.
            </div>
          </div>
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="ti ti-alert-circle me-2"></i>
            <div>
              <strong>Danger Alert!</strong> Critical error occurred.
            </div>
          </div>
          <div className="alert alert-info d-flex align-items-center" role="alert">
            <i className="ti ti-info-circle me-2"></i>
            <div>
              <strong>Info Alert!</strong> Here's some useful information.
            </div>
          </div>
        </div>
      </div>

      {/* Outline Alerts */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Outline Alerts</h4>
        </div>
        <div className="card-body">
          <div className="alert alert-outline-primary" role="alert">
            <strong>Primary Outline!</strong> This is a primary outline alert.
          </div>
          <div className="alert alert-outline-success" role="alert">
            <strong>Success Outline!</strong> This is a success outline alert.
          </div>
          <div className="alert alert-outline-warning" role="alert">
            <strong>Warning Outline!</strong> This is a warning outline alert.
          </div>
          <div className="alert alert-outline-danger" role="alert">
            <strong>Danger Outline!</strong> This is a danger outline alert.
          </div>
          <div className="alert alert-outline-info" role="alert">
            <strong>Info Outline!</strong> This is an info outline alert.
          </div>
        </div>
      </div>

      {/* Square Alerts */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Square Alerts</h4>
        </div>
        <div className="card-body">
          <div className="alert alert-square alert-primary" role="alert">
            <strong>Primary Square!</strong> This is a primary square alert.
          </div>
          <div className="alert alert-square alert-success" role="alert">
            <strong>Success Square!</strong> This is a success square alert.
          </div>
          <div className="alert alert-square alert-warning" role="alert">
            <strong>Warning Square!</strong> This is a warning square alert.
          </div>
          <div className="alert alert-square alert-danger" role="alert">
            <strong>Danger Square!</strong> This is a danger square alert.
          </div>
        </div>
      </div>

      {/* Rounded Alerts */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Rounded Alerts</h4>
        </div>
        <div className="card-body">
          <div className="alert alert-rounded alert-primary" role="alert">
            <strong>Primary Rounded!</strong> This is a primary rounded alert.
          </div>
          <div className="alert alert-rounded alert-success" role="alert">
            <strong>Success Rounded!</strong> This is a success rounded alert.
          </div>
          <div className="alert alert-rounded alert-warning" role="alert">
            <strong>Warning Rounded!</strong> This is a warning rounded alert.
          </div>
          <div className="alert alert-rounded alert-danger" role="alert">
            <strong>Danger Rounded!</strong> This is a danger rounded alert.
          </div>
        </div>
      </div>

      {/* Alert with Additional Content */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Alert with Additional Content</h4>
        </div>
        <div className="card-body">
          <div className="alert alert-success" role="alert">
            <h4 className="alert-heading">Well done!</h4>
            <p>Aww yeah, you successfully read this important alert message. This example text is going to run a bit longer so that you can see how spacing within an alert works with this kind of content.</p>
            <hr />
            <p className="mb-0">Whenever you need to, be sure to use margin utilities to keep things nice and tidy.</p>
          </div>
          
          <div className="alert alert-info" role="alert">
            <h4 className="alert-heading">Information!</h4>
            <p>This alert contains additional information that might be useful for the user. You can include any HTML content here like links, buttons, or other elements.</p>
            <div className="mt-3">
              <button className="btn btn-info me-2">Learn More</button>
              <button className="btn btn-outline-info">Dismiss</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default UIAlertsPage
