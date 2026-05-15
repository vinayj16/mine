import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import apiClient from '../../../../api/client'

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
        
        // Redirect to login after 3 seconds
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
    <div className="authentication-wrapper d-flex align-items-center justify-content-center">
      <div className="authentication-inner position-relative">
        <div className="card">
          <div className="card-body p-5">
            <div className="d-flex justify-content-center align-items-center mb-4">
              <div className="auth-logo">
                <img src="/assets/images/logo.svg" alt="Logo" className="img-fluid" />
              </div>
            </div>

            <h4 className="text-center mb-4">Forgot Password?</h4>
            
            {!isSuccess ? (
              <>
                <p className="text-center text-muted mb-4">
                  Enter your email address and we'll send you instructions to reset your password.
                </p>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>

                  <div className="d-grid">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Sending...
                        </>
                      ) : (
                        'Send Reset Instructions'
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="mb-4">
                  <i className="ti ti-mail-check text-success" style={{ fontSize: '4rem' }}></i>
                </div>
                <h5 className="text-success mb-3">Check Your Email</h5>
                <p className="text-muted mb-4">
                  {message}
                </p>
                <p className="text-muted small">
                  You will be redirected to the login page shortly...
                </p>
              </div>
            )}

            <div className="text-center mt-4">
              <Link to="/login" className="text-decoration-none">
                <i className="ti ti-arrow-left me-1"></i>
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
