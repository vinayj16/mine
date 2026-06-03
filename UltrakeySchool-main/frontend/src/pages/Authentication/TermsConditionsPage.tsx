import React from 'react'
import { Link } from 'react-router-dom'

const TermsConditionsPage: React.FC = () => {
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
          <h1 className="policy-title mb-4">Terms &amp; Conditions</h1>
          <p className="text-muted last-updated mb-5">Last Updated: May 20, 2026</p>

          <div className="policy-section mb-5">
            <h2>Copyright and Trademark</h2>
            <p>
              Unless otherwise stated, all materials on this website – including text, images, illustrations, software, audio, video, and animations – are the intellectual property of Ultrakey IT Solutions. No content may be copied, reproduced, modified, transmitted, distributed, or used in any form without prior written consent from Ultrakey IT Solutions. All rights reserved.
            </p>
          </div>

          <div className="policy-section mb-5">
            <h2>Products, Content and Specifications</h2>
            <p>
              All product descriptions, specifications, features, images, and prices listed on our website are subject to change at any time without prior notice. While we strive to display product details and colors accurately, variations may occur due to differences in devices and displays. Product availability is not guaranteed. It is your responsibility to ensure that the products you purchase comply with your local laws and regulations. By placing an order, you confirm that your purchases will be used lawfully.
            </p>
          </div>

          <div className="policy-section mb-5">
            <h2>Limitations</h2>
            <p>
              Orders are shipped to the address you provide at checkout, provided it complies with our guidelines. Risk of loss passes to you once the order is handed over to the carrier. We are not liable for delays, damage, or losses caused by third-party services. Please ensure your details are correct before confirming your order.
            </p>
          </div>

          <div className="policy-section mb-5">
            <h2>Duties and Taxes</h2>
            <p>
              All applicable duties, taxes, and customs fees are the responsibility of the buyer. International shipments may be subject to customs inspection and additional charges as per the destination country’s regulations.
            </p>
          </div>

          <div className="policy-section mb-5">
            <h2>Your Account</h2>
            <p>
              You are responsible for keeping your account credentials confidential and for all activities performed under your account. Ultrakey IT Solutions reserves the right to refuse service, cancel orders, or terminate accounts if any fraudulent or unauthorized activity is detected. By placing an order, you confirm that you are at least 18 years old and that all information provided is true and accurate.
            </p>
          </div>

          <div className="policy-section mb-5">
            <h2>Returns and Refunds</h2>
            <p>
              We aim to ensure your satisfaction with every purchase. Please refer to our Return &amp; Refund Policy page for information on returns, replacements, and refunds.
            </p>
          </div>

          <div className="policy-section mb-5">
            <h2>Electronic Communications</h2>
            <p>
              By using our website or contacting us electronically, you consent to receive communications from Ultrakey IT Solutions in electronic form. These communications meet any legal requirements that such communications be in writing.
            </p>
          </div>

          <div className="policy-section">
            <h2>For More Information</h2>
            <p>
              If you have any questions or require more information, please visit our website or get in touch with us:
            </p>
            <div className="contact-details p-4 rounded bg-light">
              <p className="mb-2"><strong>Company:</strong> Ultrakey IT Solutions</p>
              <p className="mb-2"><strong>Email:</strong> <a href="mailto:hr@ultrakeyit.com">hr@ultrakeyit.com</a></p>
              <p className="mb-0"><strong>Address:</strong> Flat No: 204, 2nd Floor, Indira Nagar, Gachibowli, Hyderabad, Telangana 500032</p>
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

export default TermsConditionsPage
