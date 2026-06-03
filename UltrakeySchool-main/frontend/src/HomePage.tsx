import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import apiClient from './api/client'
import { useThemeStore } from './store/themeStore'

// ─── Inline SVG Logo ───
const EduLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <defs>
      <linearGradient id="elg" x1="0" y1="0" x2="40" y2="40">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
    <rect width="40" height="40" rx="10" fill="url(#elg)" />
    <path d="M20 8L30 15L20 22L10 15L20 8Z" fill="white" opacity="0.95" />
    <rect x="18" y="21" width="4" height="8" rx="1" fill="white" opacity="0.85" />
    <path d="M10 22V28C10 30.2 14.5 32 20 32C25.5 32 30 30.2 30 28V22" stroke="white" strokeWidth="1.8" fill="none" opacity="0.6" />
    <circle cx="20" cy="15" r="2" fill="white" opacity="0.35" />
  </svg>
)

// ─── Inline SVG Section Illustration (About) ───
const AboutIllustration = () => (
  <svg viewBox="0 0 400 340" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 400, height: 'auto' }}>
    <defs>
      <linearGradient id="ag1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
      <linearGradient id="ag2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
    <circle cx="200" cy="170" r="130" fill="#6366f1" opacity="0.04" />
    <circle cx="200" cy="170" r="95" fill="#6366f1" opacity="0.04" />

    {/* Monitor/Screen */}
    <rect x="120" y="90" width="160" height="110" rx="8" fill="#6366f1" opacity="0.08" stroke="#6366f1" strokeWidth="1.5"/>
    <rect x="130" y="100" width="60" height="40" rx="4" fill="#10b981" opacity="0.1" />
    <rect x="200" y="100" width="50" height="20" rx="3" fill="#f59e0b" opacity="0.1" />
    <rect x="200" y="128" width="50" height="12" rx="2" fill="#6366f1" opacity="0.08" />
    <rect x="130" y="150" width="120" height="8" rx="2" fill="#6366f1" opacity="0.06" />
    <rect x="130" y="164" width="90" height="6" rx="2" fill="#6366f1" opacity="0.04" />
    <rect x="185" y="200" width="30" height="20" rx="3" fill="#6366f1" opacity="0.1" />
    <rect x="155" y="220" width="90" height="8" rx="2" fill="#6366f1" opacity="0.06" />

    {/* User avatars */}
    <circle cx="130" cy="270" r="20" fill="url(#ag1)" opacity="0.08" />
    <circle cx="130" cy="270" r="12" fill="url(#ag1)" opacity="0.15" />
    <circle cx="270" cy="270" r="20" fill="url(#ag2)" opacity="0.08" />
    <circle cx="270" cy="270" r="12" fill="url(#ag2)" opacity="0.15" />
    <circle cx="200" cy="290" r="18" fill="#f59e0b" opacity="0.06" />
    <circle cx="200" cy="290" r="10" fill="#f59e0b" opacity="0.1" />

    {/* Check marks */}
    <circle cx="330" cy="80" r="14" fill="#10b981" opacity="0.08" />
    <path d="M325 80 L328 84 L335 76" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
    <circle cx="70" cy="80" r="14" fill="#6366f1" opacity="0.08" />
    <path d="M65 80 L68 84 L75 76" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
  </svg>
)

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const { isDarkMode, toggle } = useThemeStore()
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [blogs, setBlogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [contactSending, setContactSending] = useState(false)
  const [hoveredImage, setHoveredImage] = useState<number | null>(null)

  useEffect(() => {
    fetchHomeContent()
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    // Sync body/html bg to page color so overscroll doesn't show white
    const lightBg = '#f8fafc'
    const darkBg = '#0f0f13'
    const bg = isDarkMode ? darkBg : lightBg
    document.documentElement.style.background = bg
    document.body.style.background = bg
    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.documentElement.style.background = ''
      document.body.style.background = ''
    }
  }, [isDarkMode])

  // Scroll Reveal IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [loading]) // re-run when content loads

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactForm.name || !contactForm.email || !contactForm.phone || !contactForm.message) {
      toast.error('Please fill in all required fields')
      return
    }
    setContactSending(true)
    try {
      const res = await apiClient.post('/contact-messages', {
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
        subject: contactForm.subject || 'Contact Form Inquiry',
        message: contactForm.message
      })
      if (res.data?.success) {
        toast.success('Thank you! Your message has been sent successfully.')
        setContactForm({ name: '', email: '', phone: '', subject: '', message: '' })
      } else {
        toast.error(res.data?.message || 'Failed to send message. Please try again.')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send message. Please try again later.')
    } finally {
      setContactSending(false)
    }
  }

  const fetchHomeContent = async () => {
    try {
      setLoading(true)
      const [testimonialsRes, blogsRes] = await Promise.all([
        apiClient.get('/testimonials'),
        apiClient.get('/blogs', { params: { limit: 3 } }).catch(() => ({ data: { success: false, data: { blogs: [] } } }))
      ]);
      if (testimonialsRes.data.success) {
        const testData = testimonialsRes.data.data?.testimonials || testimonialsRes.data.data || [];
        setTestimonials(testData.slice(0, 6))
      }
      if (blogsRes.data?.success) {
        setBlogs(blogsRes.data.data?.blogs || blogsRes.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching home data:', error)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: 'ti-users',
      title: 'Student Management',
      description: 'Comprehensive student records, attendance tracking, and academic performance monitoring.',
    },
    {
      icon: 'ti-school',
      title: 'Academic Management',
      description: 'Manage classes, subjects, timetables, examinations, and results efficiently.',
    },
    {
      icon: 'ti-wallet',
      title: 'Fee & Finance',
      description: 'Automated fee collection, expense tracking, and detailed financial reports.',
    },
    {
      icon: 'ti-book',
      title: 'Library System',
      description: 'Digital library management with book cataloging, issue tracking, and availability monitoring.',
    },
    {
      icon: 'ti-bus',
      title: 'Transport Management',
      description: 'Route planning, vehicle tracking, and transport fee management.',
    },
    {
      icon: 'ti-home',
      title: 'Hostel Management',
      description: 'Room allocation, hostel fee tracking, and student accommodation management.',
    },
  ]

  const stats = [
    { value: '500+', label: 'Institutions' },
    { value: '50K+', label: 'Students' },
    { value: '5K+', label: 'Teachers' },
    { value: '99.9%', label: 'Uptime' },
  ]

  return (
    <div className="home-page" style={{ width: '100%' }}>
      {/* Header */}
      <header className={`home-header${scrolled ? ' scrolled' : ''}`}>
        <nav className="navbar navbar-expand-lg">
          <div className="container">
            <a className="navbar-brand d-flex align-items-center gap-2" href="/">
              <EduLogo size={36} />
              <span className="brand-text">EduSearch</span>
            </a>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto align-items-center gap-1">
                <li className="nav-item">
                  <a className="nav-link" href="#features">Features</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#gallery">Gallery</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#testimonials">Testimonials</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#about">About</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#contact">Contact</a>
                </li>
                <li className="nav-item ms-lg-2">
                  <button
                    className="btn btn-link nav-link px-2"
                    onClick={toggle}
                    title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  >
                    {isDarkMode ? <i className="ti ti-sun fs-4" /> : <i className="ti ti-moon fs-4" />}
                  </button>
                </li>
                <li className="nav-item ms-lg-3">
                  <button
                    className="btn btn-primary btn-lg px-4 home-btn"
                    onClick={() => navigate('/login')}
                  >
                    <i className="ti ti-login me-2"></i>
                    Login
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="row align-items-center min-vh-75">
            <div className="col-lg-6" style={{ animation: 'fadeInUp 0.8s ease' }}>
              <div className="hero-badge mb-3">
                <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
                  <i className="ti ti-sparkles me-1"></i>
                  Trusted by 500+ Institutions
                </span>
              </div>
              <h1 className="hero-title mb-4">
                All-in-One{' '}
                <span className="text-gradient">Education Management</span>{' '}
                Platform
              </h1>
              <p className="hero-subtitle text-muted mb-4">
                Streamline your educational institution with comprehensive tools for student management,
                academic tracking, fee management, library, transport, hostel, and more.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <button
                  className="btn btn-primary btn-lg px-5 home-btn"
                  onClick={() => navigate('/login')}
                >
                  Get Started
                  <i className="ti ti-arrow-right ms-2"></i>
                </button>
                <a href="#features" className="btn btn-outline-secondary btn-lg px-5">
                  Learn More
                </a>
              </div>
              <div className="hero-trust mt-4 d-flex align-items-center gap-3">
                <div className="d-flex">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="trust-avatar" style={{ marginLeft: i > 1 ? -8 : 0, zIndex: 5 - i }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `var(--avatar-${i})`, border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'white' }}>
                        {['A','B','C','D'][i-1]}
                      </div>
                    </div>
                  ))}
                </div>
                <span className="text-muted small">Trusted by school administrators nationwide</span>
              </div>
            </div>              <div className="col-lg-6 text-center mt-5 mt-lg-0 position-relative" style={{ animation: 'fadeInUp 0.8s ease 0.2s both' }}>
              <div className="hero-image-wrapper">
                <div className="hero-image-main">
                  <img 
                    src="/assets/img/m-monk-E813FON0wDQ-unsplash.jpg" 
                    alt="Modern Classroom"
                    className="img-fluid rounded-4 shadow-lg"
                    style={{ maxHeight: '400px', objectFit: 'cover', width: '100%' }}
                  />
                  <div className="hero-image-overlay">
                    <span className="badge bg-white text-dark px-3 py-2 rounded-pill shadow-sm">
                      <i className="ti ti-school me-1 text-primary"></i>
                      Modern Learning Environment
                    </span>
                  </div>
                </div>
                <div className="hero-image-accent">
                  <img 
                    src="/assets/img/jess-bailey-l3N9Q27zULw-unsplash.jpg" 
                    alt="Library"
                    className="img-fluid rounded-3 shadow hero-accent-img"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="hero-image-accent-2">
                  <img 
                    src="/assets/img/myles-tan-WNAO036c6FM-unsplash.jpg" 
                    alt="Students"
                    className="img-fluid rounded-3 shadow hero-accent-img-sm"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section py-5">
        <div className="container">
          <div className="row g-4">
            {stats.map((stat, index) => (
              <div className="col-6 col-lg-3" key={index} style={{ animation: `fadeInUp 0.6s ease ${0.1 * index}s both` }}>
                <div className="stat-card text-center">
                  <h2 className="stat-value mb-1">{stat.value}</h2>
                  <p className="stat-label mb-0">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section py-5" id="features">
        <div className="container">
          <div className="text-center mb-5 reveal">
            <h2 className="section-title">Powerful Features</h2>
            <p className="text-muted fs-4">Everything you need to manage your educational institution</p>
          </div>
          <div className="row g-4">
            {features.map((feature, index) => (
              <div className="col-md-6 col-lg-4" key={index}>
                <div className="feature-card card h-100 border-0 reveal" style={{ transitionDelay: `${0.08 * index}s` }}>
                  <div className="card-body p-4">
                    <div className="feature-icon mb-3">
                      <i className={`ti ${feature.icon} fs-3`}></i>
                    </div>
                    <h5 className="feature-title mb-2">{feature.title}</h5>
                    <p className="text-muted mb-0">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Campus Gallery Section */}
      <section className="gallery-section py-5" id="gallery">
        <div className="container">
          <div className="text-center mb-5 reveal">
            <h2 className="section-title">Our Campus Gallery</h2>
            <p className="text-muted fs-4">A glimpse into our vibrant educational environment</p>
          </div>
          <div className="gallery-grid">
            {[
              { src: '/assets/img/redd-francisco-PTRzqc_h1r4-unsplash.jpg', title: 'Modern Campus', subtitle: 'State-of-the-art infrastructure' },
              { src: '/assets/img/nick-morrison-FHnnjk1Yj7Y-unsplash.jpg', title: 'Library Resources', subtitle: 'Rich collection of knowledge' },
              { src: '/assets/img/susan-q-yin-2JIvboGLeho-unsplash.jpg', title: 'Interactive Learning', subtitle: 'Engaging classroom sessions' },
              { src: '/assets/img/tim-mossholder-WE_Kv_ZB1l0-unsplash.jpg', title: 'Collaborative Spaces', subtitle: 'Team work & group studies' },
              { src: '/assets/img/rut-miit-oTglG1D4hRA-unsplash.jpg', title: 'Student Life', subtitle: 'Holistic development' },
              { src: '/assets/img/md-duran-1VqHRwxcCCw-unsplash.jpg', title: 'Digital Learning', subtitle: 'Technology-driven education' },
            ].map((img, idx) => (
              <div 
                key={idx} 
                className={`gallery-item reveal ${hoveredImage === idx ? 'gallery-expanded' : ''}`}
                style={{ transitionDelay: `${0.1 * idx}s` }}
                onMouseEnter={() => setHoveredImage(idx)}
                onMouseLeave={() => setHoveredImage(null)}
              >
                <img src={img.src} alt={img.title} loading="lazy" />
                <div className="gallery-overlay">
                  <div className="gallery-info">
                    <h5>{img.title}</h5>
                    <p>{img.subtitle}</p>
                  </div>
                </div>
                <div className="gallery-icon">
                  <i className="ti ti-eye"></i>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blogs Section */}
      {!loading && blogs.length > 0 && (
        <section className="blogs-section py-5">
          <div className="container">
            <div className="text-center mb-5" style={{ animation: 'fadeInUp 0.6s ease' }}>
              <h2 className="section-title">Latest Updates</h2>
              <p className="text-muted fs-5">News and announcements from our institution</p>
            </div>
            <div className="row g-4">
              {blogs.map((blog) => (
                <div className="col-md-6 col-lg-4" key={blog._id} style={{ animation: 'fadeInUp 0.6s ease both' }}>
                  <div className="blog-card card h-100 border-0">
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill">
                          {blog.category || 'General'}
                        </span>
                        <small className="text-muted">{blog.readTime || 3} min read</small>
                      </div>
                      <h5 className="blog-title mb-2">{blog.title}</h5>
                      <p className="blog-excerpt text-muted mb-3">
                        {blog.excerpt || (blog.content ? blog.content.substring(0, 120) + '...' : '')}
                      </p>
                      <div className="d-flex align-items-center justify-content-between">
                        <small className="text-muted">
                          <i className="ti ti-calendar me-1"></i>
                          {blog.formattedDate || new Date(blog.publishedAt).toLocaleDateString()}
                        </small>
                        {blog.author?.name && (
                          <small className="text-muted">
                            <i className="ti ti-user me-1"></i>
                            {blog.author.name}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <style>{`
            .blog-card {
              border-radius: 16px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.06);
              transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .blog-card:hover {
              transform: translateY(-6px);
              box-shadow: 0 12px 40px rgba(0,0,0,0.08);
            }
            .blog-title {
              font-weight: 700;
              color: #0f172a;
              line-height: 1.4;
            }
            .blog-excerpt {
              font-size: 0.9rem;
              line-height: 1.6;
            }
            .blogs-section {
              background: linear-gradient(135deg, #f8fafc 0%, #f0f4ff 100%);
            }
            [data-bs-theme="dark"] .blogs-section {
              background: linear-gradient(135deg, #0f0f13 0%, #13131a 100%) !important;
            }
            [data-bs-theme="dark"] .blog-card {
              background: #18181c !important;
            }
            [data-bs-theme="dark"] .blog-title {
              color: #e4e4e7 !important;
            }
          `}</style>
        </section>
      )}

      {/* Testimonials Section */}
      {!loading && testimonials.length > 0 && (
        <section className="testimonials-section py-5" id="testimonials">
          <div className="container">
            <div className="text-center mb-5" style={{ animation: 'fadeInUp 0.6s ease' }}>
              <h2 className="section-title">What Our Users Say</h2>
              <p className="text-muted fs-5">Trusted by educators across India</p>
            </div>
            <div className="row g-4">
              {testimonials.map((testimonial) => (
                <div className="col-md-6 col-lg-4" key={testimonial._id} style={{ animation: 'fadeInUp 0.6s ease both' }}>
                  <div className="testimonial-card card h-100 border-0">
                    <div className="card-body p-4">
                      <div className="testimonial-rating mb-2">
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`ti ti-star ${i < (testimonial.rating || 5) ? 'text-warning' : 'text-muted opacity-25'}`}
                          ></i>
                        ))}
                      </div>
                      <p className="testimonial-content text-muted mb-3">"{testimonial.content}"</p>
                      <div className="testimonial-author d-flex align-items-center gap-2">
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 14 }}>
                          {testimonial.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <h6 className="mb-0">{testimonial.name}</h6>
                          <small className="text-muted">{testimonial.role} - {testimonial.institution}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section className="about-section py-5" id="about">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6" style={{ animation: 'fadeInUp 0.8s ease' }}>
              <AboutIllustration />
            </div>
            <div className="col-lg-6" style={{ animation: 'fadeInUp 0.8s ease 0.2s both' }}>
              <h2 className="section-title mb-4">Why Choose EduSearch?</h2>
              <p className="text-muted fs-4 mb-4">
                EduSearch is a comprehensive education management platform designed to simplify
                administrative tasks and enhance the learning experience for educational institutions
                of all sizes.
              </p>
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="about-check-item d-flex align-items-start gap-2">
                    <i className="ti ti-circle-check text-success fs-5 mt-1 flex-shrink-0"></i>
                    <span>Cloud-based, accessible from anywhere</span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="about-check-item d-flex align-items-start gap-2">
                    <i className="ti ti-circle-check text-success fs-5 mt-1 flex-shrink-0"></i>
                    <span>Role-based access for parents, teachers, admins</span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="about-check-item d-flex align-items-start gap-2">
                    <i className="ti ti-circle-check text-success fs-5 mt-1 flex-shrink-0"></i>
                    <span>Real-time notifications and updates</span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="about-check-item d-flex align-items-start gap-2">
                    <i className="ti ti-circle-check text-success fs-5 mt-1 flex-shrink-0"></i>
                    <span>Comprehensive reporting and analytics</span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="about-check-item d-flex align-items-start gap-2">
                    <i className="ti ti-circle-check text-success fs-5 mt-1 flex-shrink-0"></i>
                    <span>Secure and reliable data management</span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="about-check-item d-flex align-items-start gap-2">
                    <i className="ti ti-circle-check text-success fs-5 mt-1 flex-shrink-0"></i>
                    <span>24/7 dedicated customer support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section py-5">
        <div className="container">
          <div className="cta-content text-center" style={{ animation: 'fadeInUp 0.8s ease' }}>
            <h2 className="mb-4">Ready to Get Started?</h2>
            <p className="text-muted fs-4 mb-4">
              Join hundreds of educational institutions using EduSearch to streamline their operations.
            </p>
            <button
              className="btn btn-primary btn-lg px-5 home-btn"
              onClick={() => navigate('/login')}
            >
              Login Now
              <i className="ti ti-arrow-right ms-2"></i>
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section py-5" id="contact">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center mb-5" style={{ animation: 'fadeInUp 0.6s ease' }}>
              <h2 className="section-title">Get In Touch</h2>
              <p className="text-muted fs-4">Have questions? We'd love to hear from you.</p>
            </div>
          </div>
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <form onSubmit={handleContactSubmit} className="contact-form">
                <div className="row g-3">
                  <div className="col-md-6">
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Your Name *"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      placeholder="Your Email *"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <input
                      type="tel"
                      className="form-control form-control-lg"
                      placeholder="Phone Number *"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Subject"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                    />
                  </div>
                  <div className="col-12">
                    <textarea
                      className="form-control form-control-lg"
                      rows={4}
                      placeholder="Your Message *"
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-12 text-center">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg px-5 home-btn"
                      disabled={contactSending}
                    >
                      {contactSending ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <i className="ti ti-mail me-2" />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer py-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <EduLogo size={32} />
                <span className="fw-bold fs-4" style={{ color: 'white' }}>EduSearch</span>
              </div>
              <p className="text-white-50 small mb-0" style={{ maxWidth: 280 }}>
                The complete education management solution for modern institutions. Streamlining administration since 2024.
              </p>
            </div>
            <div className="col-md-4">
              <h6 className="text-white mb-3">Quick Links</h6>
              <div className="d-flex flex-column gap-2">
                <a href="#features" className="text-white-50 small text-decoration-none">Features</a>
                <a href="#gallery" className="text-white-50 small text-decoration-none">Gallery</a>
                <a href="#about" className="text-white-50 small text-decoration-none">About Us</a>
                <a href="#contact" className="text-white-50 small text-decoration-none">Contact</a>
              </div>
            </div>
            <div className="col-md-4">
              <h6 className="text-white mb-3">Contact</h6>
              <div className="d-flex flex-column gap-2">
                <span className="text-white-50 small">
                  <i className="ti ti-mail me-2"></i>
                  support@edusearch.com
                </span>
                <span className="text-white-50 small">
                  <i className="ti ti-phone me-2"></i>
                  +91 98765 43210
                </span>
                <span className="text-white-50 small">
                  <i className="ti ti-map-pin me-2"></i>
                  Hyderabad, Telangana, India
                </span>
              </div>
            </div>
          </div>
          <hr className="my-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <p className="text-white-50 small mb-0">
              &copy; {new Date().getFullYear()} EduSearch. All rights reserved.
            </p>
            <div className="footer-links d-flex gap-3">
              <Link to="/privacy" className="text-white-50 small text-decoration-none">Privacy Policy</Link>
              <span className="text-white-50 small">·</span>
              <Link to="/terms" className="text-white-50 small text-decoration-none">Terms &amp; Conditions</Link>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        /* ── Animations ── */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }

        /* ── Home Page Root ── */
        .home-page {
          min-height: 100vh;
          width: 100%;
          background: #f8fafc;
        }

        /* ── Header ── */
        .home-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          position: sticky;
          top: 0;
          z-index: 1000;
          transition: box-shadow 0.3s ease;
        }
        .home-header.scrolled {
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .brand-text {
          font-size: 1.4rem;
          font-weight: 700;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .nav-link {
          position: relative;
          font-weight: 500;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          left: 50%;
          bottom: 4px;
          width: 0;
          height: 2px;
          background: #6366f1;
          transition: all 0.3s;
        }
        .nav-link:hover::after {
          width: 100%;
          left: 0;
        }

        /* ── Hero ── */
        .hero-section {
          padding: 80px 0;
          position: relative;
          overflow: hidden;
        }
        .hero-section::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .hero-section::after {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          right: -100px;
          top: -100px;
          background: radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .min-vh-75 {
          min-height: 75vh;
        }
        .hero-title {
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          font-weight: 800;
          line-height: 1.15;
          color: #0f172a;
        }
        .text-gradient {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-subtitle {
          font-size: 1.4rem;
          line-height: 1.7;
          color: #64748b;
          max-width: 700px;
        }
        .hero-badge .badge {
          font-size: 0.85rem;
          font-weight: 500;
        }
        .trust-avatar {
          transition: transform 0.2s ease;
        }
        .trust-avatar:hover {
          transform: translateY(-2px);
        }
        .home-btn {
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }
        .home-btn::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          left: -100%;
          top: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          transition: 0.6s;
        }
        .home-btn:hover::before {
          left: 100%;
        }
        .home-btn:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 40px rgba(99,102,241,0.35);
        }
        .btn-outline-secondary {
          border-color: #e2e8f0;
          color: #475569;
          background: white;
        }
        .btn-outline-secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #1e293b;
        }
        .hero-trust {
          color: #94a3b8;
        }

        /* ── Hero Image Layout ── */
        .hero-image-wrapper {
          position: relative;
          display: inline-block;
          padding-bottom: 40px;
        }
        .hero-image-main {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(99,102,241,0.15);
        }
        .hero-image-main img {
          transition: transform 0.6s ease;
          width: 100%;
          max-height: 400px;
          object-fit: cover;
        }
        .hero-image-main:hover img {
          transform: scale(1.05);
        }
        .hero-image-overlay {
          position: absolute;
          bottom: 16px;
          left: 16px;
        }
        .hero-image-accent {
          position: absolute;
          bottom: 0;
          right: -20px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.12);
          border: 3px solid white;
          animation: float 5s ease-in-out infinite;
          z-index: 2;
        }
        .hero-accent-img {
          width: 160px !important;
          height: 160px !important;
          object-fit: cover;
        }
        .hero-accent-img-sm {
          width: 120px !important;
          height: 120px !important;
          object-fit: cover;
        }
        .hero-image-accent-2 {
          position: absolute;
          top: -10px;
          right: 40px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          border: 3px solid white;
          animation: float 5s ease-in-out infinite 1s;
          z-index: 1;
        }

        /* ── Stats ── */
        .stats-section {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          position: relative;
          overflow: hidden;
        }
        .stats-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          opacity: 0.5;
        }
        .stat-card {
          padding: 24px 20px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
          transition: transform 0.3s ease, background 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-8px) scale(1.03);
          background: rgba(255, 255, 255, 0.15);
        }
        .stat-value {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #ffffff, #dbeafe);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .stat-label {
          font-size: 1rem;
          color: rgba(255,255,255,0.75);
          font-weight: 500;
        }

        /* ── Section Title ── */
        .section-title {
          font-size: 2.4rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        /* ── Features ── */
        .features-section {
          background: white;
        }
        .feature-card {
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          transition: transform 0.4s ease, box-shadow 0.4s ease;
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .feature-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04));
          opacity: 0;
          transition: 0.4s;
        }
        .feature-card:hover::before {
          opacity: 1;
        }
        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 25px 50px rgba(99,102,241,0.15), 0 10px 20px rgba(0,0,0,0.05);
        }
        .feature-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6366f1;
          transition: 0.4s;
        }
        .feature-card:hover .feature-icon {
          transform: rotate(10deg) scale(1.15);
        }
        .feature-title {
          font-weight: 700;
          color: #0f172a;
        }

        /* ── Testimonials ── */
        .testimonials-section {
          background: white;
        }
        .testimonial-card {
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .testimonial-card::after {
          content: "❝";
          position: absolute;
          right: 20px;
          top: 10px;
          font-size: 5rem;
          opacity: 0.05;
        }
        .testimonial-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08);
        }
        .testimonial-rating {
          display: flex;
          gap: 2px;
        }
        .testimonial-content {
          font-size: 0.95rem;
          line-height: 1.6;
          font-style: italic;
        }
        .testimonial-author h6 {
          font-weight: 700;
          color: #0f172a;
        }

        /* ── Gallery ── */
        .gallery-section {
          background: linear-gradient(135deg, #f0f4ff 0%, #f8fafc 50%, #eef2ff 100%);
        }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .gallery-item {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          aspect-ratio: 4/3;
          background: linear-gradient(135deg, #e0e7ff 0%, #eef2ff 50%, #f0f4ff 100%);
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
          position: relative;
          z-index: 1;
        }

        .gallery-item:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 50px rgba(99,102,241,0.15);
          z-index: 2;
        }
        .gallery-item:hover img {
          transform: scale(1.1);
        }
        .gallery-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(15,23,42,0.7) 0%, transparent 60%);
          padding: 20px 20px 16px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .gallery-item:hover .gallery-overlay,
        .gallery-expanded .gallery-overlay {
          opacity: 1;
        }
        .gallery-info h5 {
          color: #fff;
          font-weight: 700;
          margin-bottom: 2px;
          font-size: 0.95rem;
        }
        .gallery-info p {
          color: rgba(255,255,255,0.75);
          margin: 0;
          font-size: 0.8rem;
        }
        .gallery-icon {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6366f1;
          opacity: 0;
          transform: translateY(-10px);
          transition: all 0.3s ease;
        }
        .gallery-item:hover .gallery-icon,
        .gallery-expanded .gallery-icon {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Blogs ── */
        .blog-card {
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          overflow: hidden;
        }
        .blog-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08);
        }
        .blog-title {
          font-weight: 700;
          color: #0f172a;
          line-height: 1.4;
        }
        .blog-excerpt {
          font-size: 0.9rem;
          line-height: 1.6;
        }
        .blogs-section {
          background: linear-gradient(135deg, #f8fafc 0%, #f0f4ff 100%);
        }

        /* ── About ── */
        .about-section {
          background: linear-gradient(135deg, #f8fafc 0%, #f0f4ff 100%);
        }
        .about-check-item {
          font-size: 0.95rem;
          color: #334155;
          line-height: 1.5;
          padding: 12px;
          border-radius: 12px;
          transition: 0.3s;
        }
        .about-check-item:hover {
          background: rgba(99,102,241,0.05);
          transform: translateX(6px);
        }
        .about-check-item i {
          color: #10b981;
        }

        /* ── CTA ── */
        .cta-section {
          background: linear-gradient(135deg, #eef2ff 0%, #f0f4ff 50%, #ede9fe 100%);
        }
        .cta-content {
          background: white;
          padding: 60px;
          border-radius: 30px;
          box-shadow: 0 30px 60px rgba(99,102,241,0.08);
        }
        .cta-content h2 {
          font-size: 2.4rem;
          font-weight: 800;
          color: #0f172a;
        }

        /* ── Contact ── */
        .contact-section {
          background: white;
        }
        .contact-form {
          background: white;
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.08);
        }
        .contact-form .form-control {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          color: #0f172a;
          border-radius: 14px;
          min-height: 55px;
          transition: all 0.3s ease;
        }
        .contact-form .form-control:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
          background: white;
          transform: translateY(-2px);
        }
        textarea.form-control {
          min-height: 140px !important;
        }

        /* ── Footer ── */
        .home-footer {
          background: #0f172a;
          position: relative;
        }
        .home-footer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        }
        .home-footer h6 {
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .text-white-50 {
          color: rgba(255, 255, 255, 0.6);
        }
        .home-footer a:hover {
          color: rgba(255, 255, 255, 0.9) !important;
        }

        /* ── Scroll Reveal ── */
        .reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.23, 1, 0.32, 1);
          transition-delay: inherit;
        }
        .reveal-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Trust Avatar Colors ── */
        .trust-avatar:nth-child(1) div {
          background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
        }
        .trust-avatar:nth-child(2) div {
          background: linear-gradient(135deg, #f59e0b, #f97316) !important;
        }
        .trust-avatar:nth-child(3) div {
          background: linear-gradient(135deg, #10b981, #06b6d4) !important;
        }
        .trust-avatar:nth-child(4) div {
          background: linear-gradient(135deg, #ef4444, #ec4899) !important;
        }

        /* ── Responsive ── */
        @media (max-width: 992px) {
          .hero-title { font-size: 2.2rem; }
          .section-title { font-size: 1.8rem; }
          .hero-section { padding: 60px 0; }
          .stat-value { font-size: 2rem; }
          .stat-card { padding: 16px; }
          .min-vh-75 { min-height: auto; }
          .cta-content h2 { font-size: 1.8rem; }
          .gallery-grid { grid-template-columns: repeat(2, 1fr); }
          .hero-image-accent { right: -10px; width: 130px; height: 130px; }
          .hero-accent-img { width: 130px !important; height: 130px !important; }
          .hero-image-accent-2 { display: none; }
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 1.8rem; }
          .hero-section { padding: 40px 0; }
          .hero-subtitle { font-size: 1rem; }
          .home-header .navbar-collapse {
            background: white;
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.1);
            margin-top: 8px;
          }
          .stat-card { padding: 12px; }
          .stat-value { font-size: 1.6rem; }
          .section-title { font-size: 1.5rem; }
        }

        @media (max-width: 576px) {
          .hero-title { font-size: 1.5rem; }
          .hero-section { padding: 30px 0; }
          .stat-value { font-size: 1.3rem; }
          .stat-label { font-size: 0.8rem; }
          .gallery-grid { grid-template-columns: 1fr; }
          .hero-image-accent { display: none; }
          .hero-accent-img, .hero-accent-img-sm { display: none; }
        }

        /* ── Dark Mode ── */
        [data-bs-theme="dark"] .home-page {
          background: #0f0f13;
        }
        /* Keep body/html bg in sync — handled via useEffect */
        [data-bs-theme="dark"] .home-header {
          background: rgba(15, 15, 19, 0.95) !important;
          backdrop-filter: blur(12px);
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        [data-bs-theme="dark"] .home-header.scrolled {
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        [data-bs-theme="dark"] .home-header .navbar-collapse {
          background: #18181c;
          box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        }
        [data-bs-theme="dark"] .hero-section {
          background: linear-gradient(135deg, #0f0f13 0%, #13131a 50%, #18181c 100%) !important;
        }
        [data-bs-theme="dark"] .hero-title {
          color: #e4e4e7;
        }
        [data-bs-theme="dark"] .hero-subtitle {
          color: #a1a1aa;
        }
        [data-bs-theme="dark"] .features-section {
          background: #0f0f13 !important;
        }
        [data-bs-theme="dark"] .feature-card {
          background: #18181c !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        [data-bs-theme="dark"] .feature-card:hover {
          box-shadow: 0 12px 40px rgba(99, 102, 241, 0.08);
        }
        [data-bs-theme="dark"] .section-title {
          color: #e4e4e7;
        }
        [data-bs-theme="dark"] .feature-title {
          color: #e4e4e7;
        }
        [data-bs-theme="dark"] .feature-icon {
          background: linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.1) 100%);
        }
        [data-bs-theme="dark"] .testimonials-section {
          background: #0f0f13 !important;
        }
        [data-bs-theme="dark"] .testimonial-card {
          background: #18181c !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        [data-bs-theme="dark"] .testimonial-card:hover {
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }
        [data-bs-theme="dark"] .testimonial-author h6 {
          color: #e4e4e7;
        }
        [data-bs-theme="dark"] .gallery-section {
          background: linear-gradient(135deg, #0f0f13 0%, #13131a 50%, #18181c 100%) !important;
        }
        [data-bs-theme="dark"] .gallery-item {
          background: #18181c;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        [data-bs-theme="dark"] .gallery-item:hover {
          box-shadow: 0 20px 50px rgba(99,102,241,0.1);
        }
        [data-bs-theme="dark"] .hero-image-main {
          box-shadow: 0 20px 60px rgba(99,102,241,0.08);
        }
        [data-bs-theme="dark"] .hero-image-accent,
        [data-bs-theme="dark"] .hero-image-accent-2 {
          border-color: #18181c;
        }
        [data-bs-theme="dark"] .about-section {
          background: linear-gradient(135deg, #0f0f13 0%, #13131a 100%) !important;
        }
        [data-bs-theme="dark"] .about-check-item {
          color: #d4d4d8;
        }
        [data-bs-theme="dark"] .blogs-section {
          background: linear-gradient(135deg, #0f0f13 0%, #13131a 100%) !important;
        }
        [data-bs-theme="dark"] .blog-card {
          background: #18181c !important;
        }
        [data-bs-theme="dark"] .blog-title {
          color: #e4e4e7 !important;
        }
        [data-bs-theme="dark"] .cta-section {
          background: linear-gradient(135deg, #13131a 0%, #18181c 50%, #1a1a20 100%) !important;
        }
        [data-bs-theme="dark"] .cta-content h2 {
          color: #e4e4e7;
        }
        [data-bs-theme="dark"] .cta-content {
          background: rgba(24,24,28,0.9) !important;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.05);
        }
        [data-bs-theme="dark"] .contact-section {
          background: #0f0f13 !important;
        }
        [data-bs-theme="dark"] .contact-form {
          background: rgba(24,24,28,0.9) !important;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.05);
        }
        [data-bs-theme="dark"] .contact-form .form-control {
          background: #18181c;
          border-color: #2a2a32;
          color: #e4e4e7;
        }
        [data-bs-theme="dark"] .contact-form .form-control:focus {
          background: #1e1e24;
          border-color: #6366f1;
        }
        [data-bs-theme="dark"] .home-footer {
          background: #0a0a0e !important;
        }

        [data-bs-theme="dark"] .btn-outline-secondary {
          background: #18181c !important;
          border-color: #2a2a32 !important;
          color: #a1a1aa !important;
        }
        [data-bs-theme="dark"] .btn-outline-secondary:hover {
          background: #1e1e24 !important;
          border-color: #33333d !important;
          color: #e4e4e7 !important;
        }
      `}</style>
    </div>
  )
}

export default HomePage
