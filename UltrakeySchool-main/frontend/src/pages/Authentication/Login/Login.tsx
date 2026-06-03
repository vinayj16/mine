import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getRoleBasedDashboard } from '../../../utils/permissions'
import { useAuthStore } from '../../../store/authStore'
import AuthLeft from './authleft/AuthLeft'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user && hasInteracted) {
      navigate(getRoleBasedDashboard(user.role), { replace: true })
    }
  }, [hasInteracted, isAuthenticated, user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { login } = useAuthStore.getState()
      await login(email, password)
      setHasInteracted(true)
      toast.success(`Welcome back!`, { autoClose: 3000 })
    } catch (err: any) {
      // error is set in store
    }
  }

  return (
    <div className="auth-root">
      <AuthLeft />
      <div className="auth-right">
        <div className="auth-right-header">
        </div>
        <div className="auth-right-scroll">
          <div className="auth-right-inner">
            <h1>Welcome Back</h1>
            <p className="auth-subtitle">Please enter your details to login</p>

            <form onSubmit={handleSubmit}>
              <div className="auth-field has-label">
                <label>Email Address</label>
                <i className="ti ti-mail auth-icon"></i>
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email" required
                />
              </div>

              <div className="auth-field has-label">
                <label>Password</label>
                <i className="ti ti-lock auth-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password" required
                />
                <span
                  className={`ti auth-eye ${showPassword ? 'ti-eye' : 'ti-eye-off'}`}
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>

              <div className="auth-meta">
                <label className="auth-remember">
                  <input type="checkbox" checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)} />
                  Remember Me
                </label>
                <Link to="/forgot-password" className="auth-forgot">Forgot Password?</Link>
              </div>

              <button type="submit" className="auth-btn-primary">LOGIN</button>
            </form>
            <div className="auth-switch">
              Don't have an account?{' '}
              <Link to="/register">Create Account</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
