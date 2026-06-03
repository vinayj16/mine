import React from 'react'

const AuthLeft: React.FC = () => {
  return (
    <div className="auth-left">
      {/* Hero background image with very subtle overlay */}
      <div className="al-hero-bg">
        <img 
          src="/assets/img/trung-pham-quoc-YDWwCkdmcKM-unsplash.jpg" 
          alt=""
          loading="lazy"
        />
        <div className="al-hero-overlay"></div>
      </div>

      {/* Subtle background pattern overlay */}
      <div className="auth-bg-overlay"></div>

      {/* Grid pattern overlay */}
      <div className="auth-grid-pattern"></div>

      {/* Decorative orbs */}
      <div className="al-orb al-orb-1"></div>
      <div className="al-orb al-orb-2"></div>

      {/* Decorative shapes from style1.css */}
      <div className="auth-shape auth-s1"></div>
      <div className="auth-shape auth-s2"></div>
      <div className="auth-shape auth-s3"></div>
      <div className="auth-shape auth-s4"></div>
      <div className="auth-shape auth-s5"></div>
      <div className="auth-shape auth-s6"></div>
      <div className="auth-ring"></div>
      <div className="auth-circle-big"></div>
      <div className="auth-circle-yellow"></div>

      {/* Main content area — flex-grow fills available space */}
      <div className="al-main-content">

        {/* Heading + tagline */}
        <div className="auth-content al-content">
          <h2>Built for modern<br />Institution management.</h2>
          <p className="auth-tagline al-tagline">
            Everything you need to manage your Institution — faster, smarter, better.
          </p>
        </div>

        {/* Features with SVG icons */}
        <div className="auth-features al-features">
          <div className="auth-feature">
            <div className="al-feat-icon-wrap">
              <img src="/assets/img/icons/feature-05.svg" alt="All-in-one" />
            </div>
            <div className="auth-feat-text">
              <h5>All-in-one Institution Management</h5>
              <p>Students, staff, attendance, and fees — all in one platform.</p>
            </div>
          </div>
          <div className="auth-feature">
            <div className="al-feat-icon-wrap">
              <img src="/assets/img/icons/feature-06.svg" alt="Reports" />
            </div>
            <div className="auth-feat-text">
              <h5>Smart Reports &amp; Analytics</h5>
              <p>Automated reports that save hours of admin work every day.</p>
            </div>
          </div>
          <div className="auth-feature">
            <div className="al-feat-icon-wrap">
              <img src="/assets/img/icons/global-img.svg" alt="Global" />
            </div>
            <div className="auth-feat-text">
              <h5>Designed to scale with your institution</h5>
              <p>From small institutes to large campuses, built for growth.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="auth-left-bottom">
        <span>&copy; 2026 Ultrakey IT Solutions</span>
        <span className="auth-left-bottom-sep">|</span>
        <span>All rights reserved.</span>
      </div>

      {/* Decorative SVG shapes */}
      <div className="al-svg-deco al-svg-1">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="55" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4"/>
          <circle cx="60" cy="60" r="40" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
          <circle cx="60" cy="60" r="25" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
        </svg>
      </div>
      <div className="al-svg-deco al-svg-2">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <path d="M40 5 L48 30 L75 30 L53 47 L61 73 L40 56 L19 73 L27 47 L5 30 L32 30 Z" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
        </svg>
      </div>

      <style>{`
        /* ── Hero background image ── */
        .al-hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
        }
        .al-hero-bg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.06;
          filter: saturate(0.3) brightness(0.8);
          transform: scale(1.05);
          transition: transform 12s ease;
        }
        .auth-left:hover .al-hero-bg img {
          transform: scale(1.15);
        }
        .al-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(67, 56, 202, 0.15) 0%,
            rgba(49, 46, 129, 0.10) 50%,
            rgba(30, 27, 75, 0.08) 100%
          );
          pointer-events: none;
        }

        /* ── Decorative orbs ── */
        .al-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          z-index: 1;
          animation: alFloat 8s ease-in-out infinite;
        }
        .al-orb-1 {
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
          bottom: 20%;
          left: -80px;
          animation-delay: -2s;
        }
        .al-orb-2 {
          width: 280px;
          height: 280px;
          background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
          top: 5%;
          right: -100px;
          animation-delay: -4s;
        }

        @keyframes alFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -30px) scale(1.1); }
          66% { transform: translate(-15px, 15px) scale(0.95); }
        }

        /* ── Logo text ── */
        .al-logo-text {
          font-size: 18px;
          font-weight: 800;
          color: #ffffff !important;
          letter-spacing: -0.01em;
          text-shadow: 0 2px 14px rgba(0,0,0,0.3);
          white-space: nowrap;
        }

        /* ── Main content wrapper (flex-grow fills space between logo & bottom) ── */
        .al-main-content {
          position: relative;
          z-index: 5;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow: hidden;
        }

        /* ── Content ── */
        .al-content {
          position: relative;
          z-index: 5;
        }
        .al-content h2 {
          color: #ffffff !important;
          text-shadow: 0 2px 20px rgba(0,0,0,0.35);
          font-size: 30px;
          font-weight: 900;
          line-height: 1.2;
          margin-bottom: 8px;
        }
        .al-tagline {
          color: rgba(255,255,255,0.92) !important;
          font-size: 14px;
          margin-bottom: 16px;
          line-height: 1.5;
          text-shadow: 0 1px 12px rgba(0,0,0,0.25);
        }

        /* ── SVG Icon Showcase ── */
        .al-icon-showcase {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
        }
        .al-icon-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: rgba(255,255,255,0.07);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 10px;
          font-size: 12px;
          color: rgba(255,255,255,0.85);
          font-weight: 600;
          transition: all 0.3s ease;
          cursor: default;
        }
        .al-icon-item:hover {
          background: rgba(255,255,255,0.12);
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.20);
        }
        .al-icon-item img {
          width: 26px;
          height: 26px;
          object-fit: contain;
          filter: brightness(0) invert(1);
          opacity: 0.85;
        }
        .al-icon-item:hover img {
          opacity: 1;
        }

        /* ── Feature items with SVG icons ── */
        .al-features {
          margin-bottom: 0;
        }
        .al-features .auth-feature {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 14px;
        }
        .al-features .auth-feature:last-child {
          margin-bottom: 0;
        }
        .al-feat-icon-wrap {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 12px;
          transition: all 0.3s ease;
        }
        .al-feat-icon-wrap img {
          width: 24px;
          height: 24px;
          object-fit: contain;
          filter: brightness(0) invert(1);
          opacity: 0.85;
        }
        .auth-feature:hover .al-feat-icon-wrap {
          background: rgba(255,255,255,0.14);
          transform: scale(1.05);
        }
        .auth-feature:hover .al-feat-icon-wrap img {
          opacity: 1;
        }
        .al-features .auth-feat-text h5 {
          color: #ffffff !important;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 3px;
          text-shadow: 0 1px 10px rgba(0,0,0,0.2);
        }
        .al-features .auth-feat-text p {
          color: rgba(255,255,255,0.82) !important;
          font-size: 13px;
          margin-bottom: 0;
          line-height: 1.5;
          text-shadow: 0 1px 8px rgba(0,0,0,0.15);
        }

        /* ── Bottom bar ── */
        .auth-left-bottom {
          color: rgba(255,255,255,0.5) !important;
          z-index: 6 !important;
        }

        /* ── Decorative SVG shapes ── */
        .al-svg-deco {
          position: absolute;
          pointer-events: none;
          z-index: 1;
          opacity: 0.5;
        }
        .al-svg-1 {
          bottom: 25%;
          right: 18%;
          animation: alFloat 12s ease-in-out infinite -3s;
        }
        .al-svg-2 {
          top: 6%;
          left: 12%;
          animation: alFloat 10s ease-in-out infinite -1s;
        }

        /* ── Override any external CSS conflicts ── */
        .auth-left .auth-content h2 { color: #ffffff !important; }
        .auth-left .auth-content .al-tagline,
        .auth-left .auth-content .auth-tagline { color: rgba(255,255,255,0.92) !important; }
        .auth-left .auth-content .auth-feat-text h5 { color: #ffffff !important; }
        .auth-left .auth-content .auth-feat-text p { color: rgba(255,255,255,0.82) !important; }

        /* ── Dark mode ── */
        [data-bs-theme="dark"] .al-hero-bg img {
          opacity: 0.03;
          filter: saturate(0.2) brightness(0.9);
        }
        [data-bs-theme="dark"] .al-hero-overlay {
          background: linear-gradient(
            135deg,
            rgba(10, 10, 14, 0.40) 0%,
            rgba(15, 15, 19, 0.30) 50%,
            rgba(5, 5, 8, 0.20) 100%
          );
        }

        /* ── Responsive ── */
        @media (max-width: 1200px) {
          .al-content h2 {
            font-size: 26px !important;
          }
        }

        @media (max-width: 992px) {
          .auth-left {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export default AuthLeft
