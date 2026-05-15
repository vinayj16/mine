import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import AuthLeft from '../authleft/AuthLeft'
import AuthFooter from '../authfooter/AuthFooter'
import { institutionRegistrationService } from '../../../../services/institutionRegistrationService'

const instituteOptions = [
  { value: 'school',      label: 'School',      icon: 'ti-school' },
  { value: 'inter',       label: 'Inter',        icon: 'ti-book' },
  { value: 'degree',      label: 'Degree',       icon: 'ti-certificate' },
  { value: 'engineering', label: 'Engineering',  icon: 'ti-tools' },
]

interface FormErrors {
  instituteType?: string
  instituteCode?: string
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  agreed?: string
}

const getPasswordStrength = (pwd: string) => {
  if (!pwd) return { score: 0, label: '', color: '' }
  let score = 0
  if (pwd.length >= 8)           score++
  if (/[A-Z]/.test(pwd))         score++
  if (/[0-9]/.test(pwd))         score++
  if (/[^A-Za-z0-9]/.test(pwd))  score++
  if (pwd.length >= 12)          score++
  if (score <= 1) return { score: 1, label: 'Weak',        color: '#ef4444' }
  if (score === 2) return { score: 2, label: 'Fair',        color: '#f97316' }
  if (score === 3) return { score: 3, label: 'Good',        color: '#eab308' }
  if (score === 4) return { score: 4, label: 'Strong',      color: '#22c55e' }
  return              { score: 5, label: 'Very Strong',  color: '#16a34a' }
}

const Register: React.FC = () => {
  const [instituteType, setInstituteType]             = useState('')
  const [dropdownOpen, setDropdownOpen]               = useState(false)
  const [instituteCode, setInstituteCode]             = useState('')
  const [name, setName]                               = useState('')
  const [email, setEmail]                             = useState('')
  const [password, setPassword]                       = useState('')
  const [confirmPassword, setConfirmPassword]         = useState('')
  const [showPassword, setShowPassword]               = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreed, setAgreed]                           = useState(false)
  const [errors, setErrors]                           = useState<FormErrors>({})
  const [loading, setLoading]                         = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Set body class for auth page styling
  useEffect(() => {
    document.body.classList.add('auth-page')
    return () => {
      document.body.classList.remove('auth-page')
    }
  }, [])

  const selectedOption = instituteOptions.find(o => o.value === instituteType)
  const strength = getPasswordStrength(password)

  const validate = (): FormErrors => {
    const errs: FormErrors = {}
    if (!instituteType)
      errs.instituteType = 'Please select an institute type.'
    if (!instituteCode.trim())
      errs.instituteCode = 'Institute code is required.'
    else if (instituteCode.trim().length < 3)
      errs.instituteCode = 'Institute code must be at least 3 characters.'
    if (!name.trim())
      errs.name = 'Full name is required.'
    else if (name.trim().length < 2)
      errs.name = 'Name must be at least 2 characters.'
    else if (!/^[a-zA-Z\s'-]+$/.test(name.trim()))
      errs.name = 'Name can only contain letters, spaces or hyphens.'
    if (!email.trim())
      errs.email = 'Email address is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = 'Please enter a valid email address.'
    if (!password)
      errs.password = 'Password is required.'
    else if (password.length < 8)
      errs.password = 'Password must be at least 8 characters.'
    else if (!/[A-Z]/.test(password))
      errs.password = 'Must contain at least one uppercase letter.'
    else if (!/[0-9]/.test(password))
      errs.password = 'Must contain at least one number.'
    else if (!/[^A-Za-z0-9]/.test(password))
      errs.password = 'Must contain at least one special character.'
    if (!confirmPassword)
      errs.confirmPassword = 'Please confirm your password.'
    else if (confirmPassword !== password)
      errs.confirmPassword = 'Passwords do not match.'
    if (!agreed)
      errs.agreed = 'You must agree to the Terms & Privacy Policy.'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)

    if (Object.keys(errs).length > 0) {
      toast.error('Please fix all errors before submitting')
      return
    }

    try {
      setLoading(true)

      const registrationData = {
        instituteType,
        instituteCode,
        fullName: name,
        email,
        password,
        agreedToTerms: agreed
      }

      const response = await institutionRegistrationService.submitRegistration(registrationData)

      if (response.success) {
        toast.success('Registration submitted successfully! A superadmin will review your application and contact you soon.')

        // Reset form
        setInstituteType('')
        setInstituteCode('')
        setName('')
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setAgreed(false)
        setDropdownOpen(false)
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.message || 'Registration submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const hasErr = (f: keyof FormErrors) => !!errors[f]

  return (
    <div className="auth-root">
      <AuthLeft />
      <div className="auth-right">
        <div className="auth-right-scroll">
          <div className="auth-right-inner">
            <div className="auth-right-header">
              <div className="auth-right-logo">
                <img src="/assets/img/Ultrakey_fav.png" alt="Ultrakey" />
              </div>
              <h1>Create Account</h1>
              <p className="auth-subtitle">Fill in your details to get started</p>
            </div>

            <div className="auth-right-form">
              <form onSubmit={handleSubmit} noValidate>

              {/* ── Institute Type ── */}
              <div className="auth-field has-label" style={{ animationDelay: '.5s', position: 'relative', zIndex: dropdownOpen ? 999 : 'auto' }}>
                <label>Institute Type *</label>
                <div className="auth-input-wrap" ref={dropdownRef} style={{ position: 'relative' }}>
                  <i className={`ti ti-building auth-icon${hasErr('instituteType') ? ' auth-icon--error' : ''}`} />
                  <div
                    className={`auth-custom-select${dropdownOpen ? ' open' : ''}${hasErr('instituteType') ? ' field--error' : ''}`}
                    onClick={() => { setDropdownOpen(p => !p); clearError('instituteType') }}
                  >
                    {selectedOption ? (
                      <span className="auth-custom-select__value">
                        <i className={`ti ${selectedOption.icon}`} />
                        {selectedOption.label}
                      </span>
                    ) : (
                      <span className="auth-custom-select__placeholder">Select Institute Type</span>
                    )}
                    <i className={`ti ti-chevron-down auth-custom-select__arrow${dropdownOpen ? ' rotated' : ''}`} />
                  </div>
                  {dropdownOpen && (
                    <div className="auth-custom-dropdown">
                      {instituteOptions.map(opt => (
                        <div
                          key={opt.value}
                          className={`auth-custom-dropdown__item${instituteType === opt.value ? ' selected' : ''}`}
                          onClick={() => { setInstituteType(opt.value); setDropdownOpen(false); clearError('instituteType') }}
                        >
                          <span className="auth-custom-dropdown__icon">
                            <i className={`ti ${opt.icon}`} />
                          </span>
                          <span className="auth-custom-dropdown__label">{opt.label}</span>
                          {instituteType === opt.value && <i className="ti ti-check auth-custom-dropdown__check" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {hasErr('instituteType') && (
                  <p className="auth-error-msg"><i className="ti ti-alert-circle" /> {errors.instituteType}</p>
                )}
              </div>

              {/* ── Institute Code ── */}
              <div className="auth-field has-label" style={{ animationDelay: '.57s' }}>
                <label>Institute Code *</label>
                <div className="auth-input-wrap">
                  <i className={`ti ti-code auth-icon${hasErr('instituteCode') ? ' auth-icon--error' : ''}`} />
                  <input
                    type="text"
                    value={instituteCode}
                    onChange={e => { setInstituteCode(e.target.value); clearError('instituteCode') }}
                    placeholder="Enter your institute code"
                    className={hasErr('instituteCode') ? 'field--error' : ''}
                    disabled={loading}
                  />
                </div>
                {hasErr('instituteCode') && (
                  <p className="auth-error-msg"><i className="ti ti-alert-circle" /> {errors.instituteCode}</p>
                )}
              </div>

              {/* ── Full Name ── */}
              <div className="auth-field has-label" style={{ animationDelay: '.64s' }}>
                <label>Full Name *</label>
                <div className="auth-input-wrap">
                  <i className={`ti ti-user auth-icon${hasErr('name') ? ' auth-icon--error' : ''}`} />
                  <input
                    type="text"
                    value={name}
                    onChange={e => { setName(e.target.value); clearError('name') }}
                    placeholder="Enter your full name"
                    className={hasErr('name') ? 'field--error' : ''}
                    disabled={loading}
                  />
                </div>
                {hasErr('name') && (
                  <p className="auth-error-msg"><i className="ti ti-alert-circle" /> {errors.name}</p>
                )}
              </div>

              {/* ── Email ── */}
              <div className="auth-field has-label" style={{ animationDelay: '.71s' }}>
                <label>Email *</label>
                <div className="auth-input-wrap">
                  <i className={`ti ti-mail auth-icon${hasErr('email') ? ' auth-icon--error' : ''}`} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); clearError('email') }}
                    placeholder="Enter your email"
                    className={hasErr('email') ? 'field--error' : ''}
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>
                {hasErr('email') && (
                  <p className="auth-error-msg"><i className="ti ti-alert-circle" /> {errors.email}</p>
                )}
              </div>

              {/* ── Password ── */}
              <div className="auth-field has-label" style={{ animationDelay: '.78s' }}>
                <label>Password *</label>
                <div className="auth-input-wrap">
                  <i className={`ti ti-lock auth-icon${hasErr('password') ? ' auth-icon--error' : ''}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); clearError('password') }}
                    placeholder="Create a password"
                    className={hasErr('password') ? 'field--error' : ''}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <span
                    className={`ti auth-eye ${showPassword ? 'ti-eye' : 'ti-eye-off'}`}
                    onClick={() => setShowPassword(p => !p)}
                  />
                </div>
                {password && (
                  <div className="pwd-strength">
                    <div className="pwd-strength__bars">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="pwd-strength__bar"
                          style={{ background: i <= strength.score ? strength.color : '#e2e8f0' }} />
                      ))}
                    </div>
                    <div className="pwd-strength__meta">
                      <span className="pwd-strength__label" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                      <span className="pwd-strength__rules">
                        {[
                          { check: password.length >= 8,         label: '8+ chars' },
                          { check: /[A-Z]/.test(password),       label: 'Uppercase' },
                          { check: /[0-9]/.test(password),       label: 'Number' },
                          { check: /[^A-Za-z0-9]/.test(password),label: 'Special' },
                        ].map(r => (
                          <span key={r.label} className={r.check ? 'rule--pass' : 'rule--fail'}>
                            <i className={`ti ti-${r.check ? 'check' : 'x'}`} /> {r.label}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                )}
                {hasErr('password') && (
                  <p className="auth-error-msg"><i className="ti ti-alert-circle" /> {errors.password}</p>
                )}
              </div>

              {/* ── Confirm Password ── */}
              <div className="auth-field has-label" style={{ animationDelay: '.85s' }}>
                <label>Confirm Password *</label>
                <div className="auth-input-wrap">
                  <i className={`ti ti-lock-check auth-icon${hasErr('confirmPassword') ? ' auth-icon--error' : ''}`} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); clearError('confirmPassword') }}
                    placeholder="Confirm your password"
                    className={hasErr('confirmPassword') ? 'field--error' : ''}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <span
                    className={`ti auth-eye ${showConfirmPassword ? 'ti-eye' : 'ti-eye-off'}`}
                    onClick={() => setShowConfirmPassword(p => !p)}
                  />
                </div>
                {hasErr('confirmPassword') && (
                  <p className="auth-error-msg"><i className="ti ti-alert-circle" /> {errors.confirmPassword}</p>
                )}
              </div>

              {/* ── Terms ── */}
              <div className={`auth-terms${hasErr('agreed') ? ' terms--error' : ''}`}>
                <input 
                  type="checkbox" 
                  id="agree" 
                  checked={agreed}
                  onChange={e => { setAgreed(e.target.checked); clearError('agreed') }}
                  disabled={loading}
                />
                <label htmlFor="agree" className="auth-terms-text">
                  I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
                </label>
              </div>
              {hasErr('agreed') && (
                <p className="auth-error-msg auth-error-msg--terms">
                  <i className="ti ti-alert-circle" /> {errors.agreed}
                </p>
              )}

              <button 
                type="submit" 
                className="auth-btn-primary" 
                disabled={loading}
                style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    CREATING ACCOUNT...
                  </>
                ) : (
                  'CREATE ACCOUNT'
                )}
              </button>
              </form>

              <div className="auth-or">or</div>
             
              <div className="auth-switch">
                Already have an account? <Link to="/login">Login</Link>
              </div>
            </div>

          </div>
        </div>
        <AuthFooter />
      </div>
    </div>
  )
}

export default Register
