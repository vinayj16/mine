import React from 'react'

const AuthLeft: React.FC = () => {
  return (
    <div className="auth-left">
      {/* Decorative shapes */}
      <div className="auth-shape auth-s1"></div>
      <div className="auth-shape auth-s2"></div>
      <div className="auth-shape auth-s3"></div>
      <div className="auth-shape auth-s4"></div>
      <div className="auth-shape auth-s5"></div>
      <div className="auth-shape auth-s6"></div>
      <div className="auth-ring"></div>
      <div className="auth-circle-big"></div>
      <div className="auth-circle-yellow"></div>

      {/* Logo */}
      <div className="auth-logo">
        <div className="auth-logo-icon">
          <img src="/assets/img/logo.png" alt="Ultrakey" />
        </div>
      </div>

      {/* Feature content */}
      <div className="auth-content">
        <h2>Built for modern school management.</h2>
        <p className="auth-tagline">
          Everything you need to manage your school — faster, smarter, better.
        </p>

        <div className="auth-features">
          <div className="auth-feature">
            <div className="auth-feat-icon"><i className="ti ti-school"></i></div>
            <div className="auth-feat-text">
              <h5>All-in-one School Management</h5>
              <p>Students, staff, attendance, and fees — all in one platform.</p>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feat-icon"><i className="ti ti-chart-bar"></i></div>
            <div className="auth-feat-text">
              <h5>Smart Reports &amp; Analytics</h5>
              <p>Automated reports that save hours of admin work every day.</p>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feat-icon"><i className="ti ti-rocket"></i></div>
            <div className="auth-feat-text">
              <h5>Designed to scale with your school</h5>
              <p>From small institutes to large campuses, built for growth.</p>
            </div>
          </div>
        </div>

        <a href="javascript:void(0);" className="auth-cta">
          <div className="auth-cta-labels">
            <small>Learn more about Ultrakey</small>
            <strong>Visit ultrakey.app</strong>
          </div>
          <span className="auth-cta-arrow">→</span>
        </a>
      </div>
    </div>
  )
}

export default AuthLeft
