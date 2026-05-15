import React from 'react'

const UICardsPage: React.FC = () => {
  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Cards</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/">Dashboard</a>
              </li>
              <li className="breadcrumb-item">UI Components</li>
              <li className="breadcrumb-item active" aria-current="page">Cards</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Basic Cards */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Basic Cards</h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Card title</h5>
                  <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                  <a href="#" className="btn btn-primary">Go somewhere</a>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Special title treatment</h5>
                  <p className="card-text">With supporting text below as a natural lead-in to additional content.</p>
                  <a href="#" className="btn btn-primary">Go somewhere</a>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Card title</h5>
                  <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                  <a href="#" className="btn btn-primary">Go somewhere</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Colored Cards */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Colored Cards</h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <h5 className="card-title text-white">Primary Card</h5>
                  <p className="card-text">Some quick example text to build on the card title.</p>
                  <a href="#" className="btn btn-light">Learn More</a>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <h5 className="card-title text-white">Success Card</h5>
                  <p className="card-text">Some quick example text to build on the card title.</p>
                  <a href="#" className="btn btn-light">Learn More</a>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-danger text-white">
                <div className="card-body">
                  <h5 className="card-title text-white">Danger Card</h5>
                  <p className="card-text">Some quick example text to build on the card title.</p>
                  <a href="#" className="btn btn-light">Learn More</a>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body">
                  <h5 className="card-title text-white">Warning Card</h5>
                  <p className="card-text">Some quick example text to build on the card title.</p>
                  <a href="#" className="btn btn-light">Learn More</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards with Images */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Cards with Images</h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <div className="card">
                <img src="https://via.placeholder.com/400x200" className="card-img-top" alt="Card image" />
                <div className="card-body">
                  <h5 className="card-title">Card with Image</h5>
                  <p className="card-text">This is a wider card with supporting text below as a natural lead-in to additional content.</p>
                  <p className="card-text"><small className="text-muted">Last updated 3 mins ago</small></p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <img src="https://via.placeholder.com/400x200" className="card-img-top" alt="Card image" />
                <div className="card-body">
                  <h5 className="card-title">Card with Image</h5>
                  <p className="card-text">This card has supporting text below as a natural lead-in to additional content.</p>
                  <p className="card-text"><small className="text-muted">Last updated 5 mins ago</small></p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <img src="https://via.placeholder.com/400x200" className="card-img-top" alt="Card image" />
                <div className="card-body">
                  <h5 className="card-title">Card with Image</h5>
                  <p className="card-text">This is another card with title and supporting text below.</p>
                  <p className="card-text"><small className="text-muted">Last updated 10 mins ago</small></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* List Group Cards */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">List Group Cards</h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  Featured
                </div>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item">Cras justo odio</li>
                  <li className="list-group-item">Dapibus ac facilisis in</li>
                  <li className="list-group-item">Vestibulum at eros</li>
                </ul>
                <div className="card-body">
                  <a href="#" className="card-link">Card link</a>
                  <a href="#" className="card-link">Another link</a>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <ul className="nav nav-tabs card-header-tabs">
                    <li className="nav-item">
                      <a className="nav-link active" href="#">Active</a>
                    </li>
                    <li className="nav-item">
                      <a className="nav-link" href="#">Link</a>
                    </li>
                    <li className="nav-item">
                      <a className="nav-link disabled" href="#">Disabled</a>
                    </li>
                  </ul>
                </div>
                <div className="card-body">
                  <h5 className="card-title">Special title treatment</h5>
                  <p className="card-text">With supporting text below as a natural lead-in to additional content.</p>
                  <a href="#" className="btn btn-primary">Go somewhere</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header and Footer Cards */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Header and Footer Cards</h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  Featured
                </div>
                <div className="card-body">
                  <h5 className="card-title">Special title treatment</h5>
                  <p className="card-text">With supporting text below as a natural lead-in to additional content.</p>
                  <a href="#" className="btn btn-primary">Go somewhere</a>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <h5 className="card-header">Quote</h5>
                <div className="card-body">
                  <blockquote className="blockquote mb-0">
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante.</p>
                    <footer className="blockquote-footer">Someone famous in <cite title="Source Title">Source Title</cite></footer>
                  </blockquote>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center">
                <div className="card-header">
                  Featured
                </div>
                <div className="card-body">
                  <h5 className="card-title">Special title treatment</h5>
                  <p className="card-text">With supporting text below as a natural lead-in to additional content.</p>
                  <a href="#" className="btn btn-primary">Go somewhere</a>
                </div>
                <div className="card-footer text-muted">
                  2 days ago
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Cards */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title">Advanced Cards</h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="avatar avatar-lg bg-primary rounded-circle me-3">
                      <i className="ti ti-user fs-4"></i>
                    </div>
                    <div>
                      <h5 className="card-title mb-1">User Profile</h5>
                      <p className="card-text text-muted mb-0">Complete user profile information</p>
                    </div>
                  </div>
                </div>
                <div className="card-footer bg-transparent">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Last updated: 2 hours ago</span>
                    <button className="btn btn-sm btn-primary">View Details</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="card-title mb-0">Statistics</h5>
                    <span className="badge bg-success">+12%</span>
                  </div>
                  <div className="row text-center">
                    <div className="col-4">
                      <h3 className="mb-1">1,234</h3>
                      <p className="text-muted mb-0">Users</p>
                    </div>
                    <div className="col-4">
                      <h3 className="mb-1">567</h3>
                      <p className="text-muted mb-0">Orders</p>
                    </div>
                    <div className="col-4">
                      <h3 className="mb-1">$12.5k</h3>
                      <p className="text-muted mb-0">Revenue</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Variations */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Card Variations</h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <div className="card card-outline-primary">
                <div className="card-body text-center">
                  <i className="ti ti-bell fs-1 text-primary mb-3"></i>
                  <h5 className="card-title">Notifications</h5>
                  <p className="card-text">Manage your notification preferences</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card card-hoverable">
                <div className="card-body text-center">
                  <i className="ti ti-settings fs-1 text-secondary mb-3"></i>
                  <h5 className="card-title">Settings</h5>
                  <p className="card-text">Configure your application settings</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-gradient-primary text-white">
                <div className="card-body text-center">
                  <i className="ti ti-chart-bar fs-1 mb-3"></i>
                  <h5 className="card-title text-white">Analytics</h5>
                  <p className="card-text">View detailed analytics and reports</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-dashed">
                <div className="card-body text-center">
                  <i className="ti ti-cloud-upload fs-1 text-info mb-3"></i>
                  <h5 className="card-title">Upload</h5>
                  <p className="card-text">Upload files to the cloud storage</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default UICardsPage
