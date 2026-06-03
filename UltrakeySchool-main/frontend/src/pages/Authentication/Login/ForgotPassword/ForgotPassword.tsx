import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiClient from '../../../../api/client'
import AuthLeft from '../authleft/AuthLeft'

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await apiClient.post('/auth/forgot-password', { email })
      if (response.data.success) {
        setMessage('Password reset instructions have been sent to your email address.')
        setIsSuccess(true)
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setError(response.data.message || 'Failed to send reset instructions')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset instructions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <AuthLeft />
      <div className="auth-right">
        <div className="auth-right-header">
          <div className="auth-right-logo">
            <img src="/assets/img/Ultrakey_fav.png" alt="Ultrakey" />
          </div>
        </div>
        <div className="auth-right-scroll">
          <div className="auth-right-inner">
            <h1>Forgot Password?</h1>
            <p className="auth-subtitle">Enter your email to reset your password</p>
            {!isSuccess ? (
              <form onSubmit={handleSubmit}>
                <p className="auth-subtitle-desc">
                  Enter your email address and we'll send you instructions to reset your password.
                </p>

                {error && (
                  <p className="auth-error-msg"><i className="ti ti-alert-circle" /> {error}</p>
                )}

                <div className="auth-field has-label">
                  <label>Email Address</label>
                  <i className="ti ti-mail auth-icon"></i>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <button type="submit" className="auth-btn-primary" disabled={loading}>
                  {loading ? 'SENDING...' : 'SEND RESET INSTRUCTIONS'}
                </button>
              </form>
            ) : (
              <div className="auth-forgot-success">
                <div className="auth-icon-circle">
                  <i className="ti ti-mail-check"></i>
                </div>
                <h5>Check Your Email</h5>
                <p className="auth-subtitle-desc">{message}</p>
                <p className="auth-forgot-redirect">You will be redirected to the login page shortly...</p>
              </div>
            )}

            <div className="auth-switch">
              <Link to="/login">
                <i className="ti ti-arrow-left me-1"></i> Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
