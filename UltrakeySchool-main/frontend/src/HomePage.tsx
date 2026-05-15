import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from './api/client'

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const [blogs, setBlogs] = useState<any[]>([])
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHomeData()
  }, [])

  const fetchHomeData = async () => {
    try {
      setLoading(true)
      const [blogsRes, testimonialsRes] = await Promise.all([
        apiClient.get('/blogs/posts'),
        apiClient.get('/testimonials')
      ])

      if (blogsRes.data.success) {
        const blogData = Array.isArray(blogsRes.data.data) ? blogsRes.data.data : blogsRes.data.data?.posts || [];
        setBlogs(blogData.slice(0, 3))
      }
      if (testimonialsRes.data.success) {
        const testData = testimonialsRes.data.data?.testimonials || testimonialsRes.data.data || [];
        setTestimonials(testData.slice(0, 6))
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
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <nav className="navbar navbar-expand-lg">
          <div className="container">
            <a className="navbar-brand d-flex align-items-center" href="/">
              <img src="/assets/img/Ultrakey_fav.png" alt="EduSearch" height="40" className="me-2" />
              <span className="brand-text">EduSearch</span>
            </a>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto align-items-center">
                <li className="nav-item">
                  <a className="nav-link" href="#features">Features</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#blogs">Blog</a>
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
                <li className="nav-item ms-lg-3">
                  <button
                    className="btn btn-primary btn-lg px-4"
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
            <div className="col-lg-6">
              <h1 className="hero-title mb-4">
                All-in-One <span className="text-primary">Education Management</span> Platform
              </h1>
              <p className="hero-subtitle text-muted mb-4">
                Streamline your educational institution with comprehensive tools for student management,
                academic tracking, fee management, library, transport, hostel, and more.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <button
                  className="btn btn-primary btn-lg px-5"
                  onClick={() => navigate('/login')}
                >
                  Get Started
                  <i className="ti ti-arrow-right ms-2"></i>
                </button>
                <a href="#features" className="btn btn-outline-secondary btn-lg px-5">
                  Learn More
                </a>
              </div>
            </div>
            <div className="col-lg-6 text-center mt-5 mt-lg-0">
              <div className="hero-image">
                <img
                  src="/assets/img/Ultrakey_fav.png"
                  alt="EduSearch Dashboard"
                  className="img-fluid"
                  style={{ maxHeight: '400px' }}
                />
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
              <div className="col-6 col-lg-3" key={index}>
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
          <div className="text-center mb-5">
            <h2 className="section-title">Powerful Features</h2>
            <p className="text-muted">Everything you need to manage your educational institution</p>
          </div>
          <div className="row g-4">
            {features.map((feature, index) => (
              <div className="col-md-6 col-lg-4" key={index}>
                <div className="feature-card card h-100">
                  <div className="card-body p-4">
                    <div className="feature-icon mb-3">
                      <i className={`ti ${feature.icon} fs-1 text-primary`}></i>
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

      {/* Blogs Section */}
      {!loading && blogs.length > 0 && (
        <section className="blogs-section py-5 bg-light" id="blogs">
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="section-title">Latest from Our Blog</h2>
              <p className="text-muted">Insights and updates from the EduSearch team</p>
            </div>
            <div className="row g-4">
              {blogs.map((blog) => (
                <div className="col-md-6 col-lg-4" key={blog._id}>
                  <div className="blog-card card h-100">
                    <div className="card-body p-4">
                      <div className="blog-category badge bg-primary mb-2">{blog.category}</div>
                      <h5 className="blog-title mb-2">{blog.title}</h5>
                      <p className="text-muted mb-3">{blog.excerpt}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">{blog.author}</small>
                        <small className="text-muted"><i className="ti ti-eye me-1"></i>{blog.views}</small>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {!loading && testimonials.length > 0 && (
        <section className="testimonials-section py-5" id="testimonials">
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="section-title">What Our Users Say</h2>
              <p className="text-muted">Trusted by educators across India</p>
            </div>
            <div className="row g-4">
              {testimonials.map((testimonial) => (
                <div className="col-md-6 col-lg-4" key={testimonial._id}>
                  <div className="testimonial-card card h-100">
                    <div className="card-body p-4">
                      <div className="testimonial-rating mb-2">
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`ti ti-star ${i < (testimonial.rating || 5) ? 'text-warning' : 'text-muted'}`}
                          ></i>
                        ))}
                      </div>
                      <p className="testimonial-content text-muted mb-3">"{testimonial.content}"</p>
                      <div className="testimonial-author">
                        <h6 className="mb-0">{testimonial.name}</h6>
                        <small className="text-muted">{testimonial.role} - {testimonial.institution}</small>
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
      <section className="about-section py-5 bg-light" id="about">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <h2 className="section-title mb-4">Why Choose EduSearch?</h2>
              <p className="text-muted mb-4">
                EduSearch is a comprehensive education management platform designed to simplify
                administrative tasks and enhance the learning experience for educational institutions
                of all sizes.
              </p>
              <ul className="feature-list list-unstyled">
                <li className="mb-3">
                  <i className="ti ti-check text-success me-2"></i>
                  Cloud-based and accessible from anywhere
                </li>
                <li className="mb-3">
                  <i className="ti ti-check text-success me-2"></i>
                  Role-based access for parents, teachers, and administrators
                </li>
                <li className="mb-3">
                  <i className="ti ti-check text-success me-2"></i>
                  Real-time notifications and updates
                </li>
                <li className="mb-3">
                  <i className="ti ti-check text-success me-2"></i>
                  Comprehensive reporting and analytics
                </li>
                <li>
                  <i className="ti ti-check text-success me-2"></i>
                  Secure and reliable data management
                </li>
              </ul>
            </div>
            <div className="col-lg-6">
              <div className="about-image text-center">
                <img
                  src="/assets/img/Ultrakey_fav.png"
                  alt="EduSearch"
                  className="img-fluid"
                  style={{ maxHeight: '350px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section py-5">
        <div className="container">
          <div className="cta-content text-center">
            <h2 className="mb-4">Ready to Get Started?</h2>
            <p className="text-muted mb-4">
              Join hundreds of educational institutions using EduSearch to streamline their operations.
            </p>
            <button
              className="btn btn-primary btn-lg px-5"
              onClick={() => navigate('/login')}
            >
              Login Now
              <i className="ti ti-arrow-right ms-2"></i>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer py-4">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <div className="d-flex align-items-center mb-2">
                <img src="/assets/img/Ultrakey_fav.png" alt="EduSearch" height="30" className="me-2" />
                <span className="brand-text fw-bold">EduSearch</span>
              </div>
              <p className="text-muted small mb-0">
                The complete education management solution for modern institutions.
              </p>
            </div>
            <div className="col-md-6 text-md-end" id="contact">
              <p className="text-muted small mb-1">
                <i className="ti ti-mail me-2"></i>
                support@edusearch.com
              </p>
              <p className="text-muted small mb-0">
                <i className="ti ti-phone me-2"></i>
                +91 98765 43210
              </p>
            </div>
          </div>
          <hr className="my-3" />
          <div className="text-center">
            <p className="text-muted small mb-0">
              &copy; {new Date().getFullYear()} EduSearch. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        .home-page {
          min-height: 100vh;
        }
        .home-header {
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .brand-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: #3b82f6;
        }
        .hero-section {
          padding: 80px 0;
          background: linear-gradient(135deg, #f8fafc 0%, #e9ecef 100%);
        }
        .min-vh-75 {
          min-height: 75vh;
        }
        .hero-title {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1.2;
        }
        .hero-subtitle {
          font-size: 1.2rem;
          line-height: 1.6;
        }
        .stats-section {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
        }
        .stat-card {
          padding: 20px;
        }
        .stat-value {
          font-size: 2.5rem;
          font-weight: 700;
        }
        .stat-label {
          font-size: 1rem;
          color: rgba(255,255,255,0.8);
        }
        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1e293b;
        }
        .feature-card {
          border: none;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.12);
        }
        .feature-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .about-section .feature-list li {
          font-size: 1.1rem;
        }
        .blog-card {
          border: none;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .blog-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.12);
        }
        .blog-category {
          display: inline-block;
          font-size: 0.75rem;
        }
        .testimonial-card {
          border: none;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .testimonial-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.12);
        }
        .testimonial-rating {
          display: flex;
          gap: 2px;
        }
        .cta-section {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        }
        .home-footer {
          background: #1e293b;
          color: white;
        }
        .home-footer .brand-text {
          color: white;
        }
      `}</style>
    </div>
  )
}

export default HomePage