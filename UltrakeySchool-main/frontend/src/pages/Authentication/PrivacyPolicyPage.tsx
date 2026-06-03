import React from 'react'
import { Link } from 'react-router-dom'

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="policy-page">
      <header className="policy-header">
        <div className="container d-flex justify-content-between align-items-center">
          <Link to="/" className="policy-brand d-flex align-items-center">
            <img src="/assets/img/Ultrakey_fav.png" alt="Ultrakey" height="35" className="me-2" />
            <span className="brand-text">EduSearch</span>
          </Link>
          <Link to="/" className="btn btn-outline-light btn-sm">
            <i className="ti ti-arrow-left me-1"></i> Back to Home
          </Link>
        </div>
      </header>

      <main className="policy-content container py-5">
        <div className="policy-card card p-4 p-md-5">
          <h1 className="policy-title mb-4">Privacy Policy</h1>
          <p className="text-muted last-updated mb-5">Last Updated: May 20, 2026</p>

          <div className="policy-section mb-5">
            <h2>1. Information We Collect</h2>
            <p>
              When you visit our website, we automatically gather certain details about your device—such as your browser type, IP address, time zone, and cookies stored on your device. As you navigate the site, we also collect data about the pages you view, referral sources (such as search terms or links), and how you interact with our content. This data is referred to as <strong>Device Information</strong>.
            </p>
            <p>We collect Device Information through:</p>
            <ul className="policy-list">
              <li>
                <strong>Cookies:</strong> Small data files placed on your device to enhance your browsing experience. You can disable cookies in your browser settings.
              </li>
              <li>
                <strong>Log Files:</strong> Records of your site activity, including IP address, browser type, ISP, referring/exit pages, and timestamps.
              </li>
              <li>
                <strong>Web Beacons, Tags &amp; Pixels:</strong> Tools that help us analyze user engagement and improve the website experience.
              </li>
            </ul>
            <p>
              When you purchase or attempt to purchase a website or digital service, we collect <strong>Order Information</strong>, including your name, email address, billing address, payment details, and any project-specific details you provide.
            </p>
          </div>

          <div className="policy-section mb-5">
            <h2>2. How We Use Your Information</h2>
            <p>We use the information collected to:</p>
            <ul className="policy-list">
              <li>Deliver your purchased website files or services</li>
              <li>Process payments and provide order confirmations</li>
              <li>Communicate with you regarding your purchase or project</li>
              <li>Protect against fraud and unauthorized transactions</li>
              <li>Improve our website and services through analytics and user feedback</li>
              <li>Share updates or promotional information if you’ve opted in</li>
            </ul>
          </div>

          <div className="policy-section mb-5">
            <h2>3. Sharing Your Personal Information</h2>
            <p>
              We share your data only with trusted third-party services that enable us to deliver your website and process payments securely. For example, we use secure payment gateways and analytics tools to enhance performance. We may also disclose personal information to comply with legal obligations or to protect our rights.
            </p>
            <p>
              Finally, we may also share your Personal Information to comply with applicable laws and regulations, to respond to a subpoena, search warrant, or other lawful request for information we receive, or to otherwise protect our rights.
            </p>
          </div>

          <div className="policy-section mb-5">
            <h2>4. Data Retention</h2>
            <p>
              Your order details and project-related files are stored securely for record-keeping and future support unless you request deletion.
            </p>
          </div>

          <div className="policy-section mb-5">
            <h2>5. Your Rights</h2>
            <p>
              You’re responsible for maintaining the confidentiality of your account credentials. By making a purchase, you confirm that the information you provide is accurate and that you have the authority to enter into the agreement. You can request updates, corrections, or removal of your personal data by contacting us directly.
            </p>
          </div>

          <div className="policy-section mb-5">
            <h2>6. Updates to This Policy</h2>
            <p>
              We may revise this Privacy Policy from time to time to reflect operational, legal, or security updates. The latest version will always be available on our website.
            </p>
          </div>

          <div className="policy-section">
            <h2>7. Contact Us</h2>
            <p>
              For any questions, concerns, or complaints about this Privacy Policy, please contact us at:
            </p>
            <div className="contact-details p-4 rounded bg-light">
              <p className="mb-2"><strong>Email:</strong> <a href="mailto:hr@ultrakeyit.com">hr@ultrakeyit.com</a></p>
              <p className="mb-0"><strong>Mailing Address:</strong> Flat No: 204, 2nd Floor, Indira Nagar, Gachibowli, Hyderabad, Telangana 500032</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="policy-footer py-4 mt-5">
        <div className="container text-center">
          <p className="text-muted small mb-0">&copy; {new Date().getFullYear()} EduSearch. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default PrivacyPolicyPage
