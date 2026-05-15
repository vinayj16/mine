import React from 'react'

const AuthFooter: React.FC = () => (
  <footer className="auth-footer">
    © {new Date().getFullYear()} Ultrakey. All rights reserved.{' '}
    <a href="javascript:void(0);">Privacy Policy</a>{' · '}
    <a href="javascript:void(0);">Terms of Service</a>
  </footer>
)

export default AuthFooter
