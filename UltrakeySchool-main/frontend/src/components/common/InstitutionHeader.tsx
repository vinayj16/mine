import React, { useState, useEffect } from 'react';
import institutionService from '../../services/institutionService';
import type { Institution } from '../../services/institutionService';

interface InstitutionHeaderProps {
  showFullDetails?: boolean;
}

const InstitutionHeader: React.FC<InstitutionHeaderProps> = ({ 
  showFullDetails = false 
}) => {
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstitution = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First try to get from localStorage user data (which has institution details from login)
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          // Build institution object from login response
          if (userData.institutionId && (userData.institutionName || userData.institutionCode)) {
            const contactInfo = userData.institutionContact || {};
            const localInstitution: Institution = {
              _id: userData.institutionId,
              name: userData.institutionName || userData.instituteType || 'My Institution',
              shortName: userData.institutionName,
              type: userData.institutionType || 'School',
              category: userData.institutionCategory || 'secondary',
              established: 2000,
              contact: {
                email: contactInfo.email || userData.email || '',
                phone: contactInfo.phone || '',
                alternatePhone: contactInfo.alternatePhone,
                website: contactInfo.website,
                address: contactInfo.address || { street: '', city: '', state: '', country: '', postalCode: '' }
              },
              principalName: userData.principalName || contactInfo.principalName || '',
              principalEmail: userData.principalEmail || contactInfo.principalEmail || '',
              principalPhone: userData.principalPhone || contactInfo.principalPhone || '',
              subscription: {
                planId: userData.plan || 'premium',
                planName: userData.plan ? userData.plan.charAt(0).toUpperCase() + userData.plan.slice(1) : 'Premium',
                status: 'active',
                startDate: '',
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                billingCycle: 'monthly',
                monthlyCost: 50000,
                currency: 'INR'
              },
              features: {
                maxUsers: 500,
                maxStudents: 400,
                maxTeachers: 50,
                storageLimit: 100,
                customDomain: false,
                whiteLabel: false,
                advancedAnalytics: false,
                prioritySupport: false
              },
              status: userData.status || 'active',
              createdAt: '',
              updatedAt: '',
              adminContact: undefined
            };
            setInstitution(localInstitution);
            setLoading(false);
            return;
          }
        }
        
        // Fallback to API call
        const institutionData = await institutionService.getCurrentUserInstitution();
        setInstitution(institutionData);
      } catch (err: any) {
        console.error('Failed to fetch institution details:', err);
        setError(err.message || 'Failed to load institution details');
      } finally {
        setLoading(false);
      }
    };

    fetchInstitution();
  }, []);

  if (loading) {
    return (
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center">
            <div className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span>Loading institution details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !institution) {
    return (
      <div className="card mb-4 border-warning">
        <div className="card-body">
          <div className="d-flex align-items-center text-warning">
            <i className="ti ti-alert-triangle me-2"></i>
            <span>{error || 'Institution details not available'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-4 border-primary">
      <div className="card-header bg-primary text-white">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <i className="ti ti-building me-2 fs-4"></i>
            <div>
              <h5 className="mb-0">{institution.name}</h5>
              <small className="opacity-75">{institution.instituteCode || institution.type}</small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className={`badge ${institution.status === 'active' ? 'bg-success' : 'bg-warning'}`}>
              {institution.status?.toUpperCase()}
            </span>
            <span className="badge bg-info">
              {institution.type}
            </span>
          </div>
        </div>
      </div>
      
      <div className="card-body">
        <div className="row">
          <div className="col-md-8">
            <div className="row g-3">
              {showFullDetails && (
                <>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Principal</small>
                    <strong>{institution.principalName}</strong>
                    <br />
                    <small className="text-muted">{institution.principalEmail}</small>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Admin Contact</small>
                    <strong>{institution.adminContact?.name}</strong>
                    <br />
                    <small className="text-muted">{institution.adminContact?.email}</small>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Contact</small>
                    <strong>{institution.contact.phone}</strong>
                    <br />
                    <small className="text-muted">{institution.contact.email}</small>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Address</small>
                    <strong>{institution.contact.address.city}, {institution.contact.address.state}</strong>
                    <br />
                    <small className="text-muted">{institution.contact.address.country}</small>
                  </div>
                </>
              )}
              
              <div className="col-md-6">
                <small className="text-muted d-block">Subscription</small>
                <strong>{institution.subscription?.planName}</strong>
                <br />
                <small className="text-muted">
                  Valid until: {new Date(institution.subscription?.endDate || '').toLocaleDateString()}
                </small>
              </div>
              
              <div className="col-md-6">
                <small className="text-muted d-block">Features</small>
                <div className="d-flex flex-wrap gap-1">
                  {institution.features?.customDomain && <span className="badge bg-light text-dark">Custom Domain</span>}
                  {institution.features?.whiteLabel && <span className="badge bg-light text-dark">White Label</span>}
                  {institution.features?.advancedAnalytics && <span className="badge bg-light text-dark">Advanced Analytics</span>}
                  {institution.features?.prioritySupport && <span className="badge bg-light text-dark">Priority Support</span>}
                </div>
              </div>
              
              {showFullDetails && institution.contact.website && (
                <div className="col-12">
                  <small className="text-muted d-block">Website</small>
                  <a href={institution.contact.website} target="_blank" rel="noopener noreferrer" className="text-primary">
                    {institution.contact.website}
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="text-center">
              <div className="mb-3">
                <i className="ti ti-building fs-1 text-primary"></i>
              </div>
              <h6 className="text-muted">Established</h6>
              <h4 className="mb-0">{institution.established}</h4>
              <small className="text-muted">Year of Establishment</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionHeader;
