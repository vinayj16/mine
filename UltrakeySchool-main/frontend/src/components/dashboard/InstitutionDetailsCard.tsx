import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { Building, Mail, Phone, MapPin, CreditCard, Shield, CheckCircle, AlertCircle } from 'lucide-react';

type InstitutionLike = {
  id?: string;
  _id?: string;
  institutionId?: string;
  name?: string;
  instituteCode?: string;
  code?: string;
  schoolCode?: string;
  type?: string;
  status?: string;
  logo?: string;
  contact?: {
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
  };
};

interface InstitutionDetailsCardProps {
  institution?: InstitutionLike | null;
  userRole?: string;
  plan?: string;
  lastUpdated?: string;
}

const resolveInstitutionId = (institution?: InstitutionLike | null): string => {
  const raw = institution?.id ?? institution?._id ?? institution?.institutionId;
  return raw != null ? String(raw) : '';
};

const resolveInstituteCode = (institution?: InstitutionLike | null): string =>
  institution?.instituteCode || institution?.code || institution?.schoolCode || 'N/A';

const InstitutionDetailsCard: React.FC<InstitutionDetailsCardProps> = ({
  institution,
  userRole,
  plan,
  lastUpdated
}) => {
  const getStatusVariant = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'active':
        return 'bg-success';
      case 'inactive':
        return 'bg-secondary';
      case 'suspended':
        return 'bg-danger';
      case 'pending':
        return 'bg-warning';
      default:
        return 'bg-primary';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'active':
        return <CheckCircle size={14} className="me-1" />;
      case 'inactive':
        return <AlertCircle size={14} className="me-1" />;
      case 'suspended':
        return <AlertCircle size={14} className="me-1" />;
      default:
        return <Shield size={14} className="me-1" />;
    }
  };

  const getTypeIcon = (type?: string) => {
    switch ((type || '').toLowerCase()) {
      case 'school':
        return <i className="ti ti-building"></i>;
      case 'college':
        return <i className="ti ti-school"></i>;
      case 'university':
        return <i className="ti ti-building-arch"></i>;
      case 'degree':
        return <i className="ti ti-books"></i>;
      case 'btech':
        return <i className="ti ti-settings"></i>;
      case 'medical':
        return <i className="ti ti-building-hospital"></i>;
      case 'management':
        return <i className="ti ti-briefcase"></i>;
      default:
        return <i className="ti ti-building"></i>;
    }
  };

  const getPlanVariant = (plan?: string) => {
    switch (plan?.toLowerCase()) {
      case 'basic':
        return 'bg-primary';
      case 'medium':
        return 'bg-info';
      case 'premium':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  };

  const instituteCode = resolveInstituteCode(institution);
  const institutionName = institution?.name?.trim() || '';

  // If no institution data, show placeholder
  if (!institution || !institutionName) {
    return (
      <Card className="mb-4 border-warning">
        <Card.Body className="p-3">
          <div className="text-center text-warning">
            <Building size={48} className="mb-2" />
            <h5 className="mb-2">Institution Not Assigned</h5>
            <p className="text-muted small mb-0">
              You are not currently assigned to any institution. Please contact your administrator.
            </p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border-primary institution-details-card">
      <Card.Body className="p-4">
        {/* Header Section */}
        <Row className="align-items-center mb-3">
           <Col xs="auto">
             <div className="institution-logo me-3">
               {institution.logo ? (
                 <img
                   src={institution.logo}
                   alt={institution.name}
                   style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                   className="rounded border"
                   onError={(e) => {
                     // Fallback to icon if image fails to load
                     (e.currentTarget as HTMLImageElement).src = '';
                   }}
                 />
               ) : (
                 <div
                   className="rounded d-flex align-items-center justify-content-center border"
                   style={{
                     width: '64px',
                     height: '64px',
                     backgroundColor: '#e3f2fd',
                     fontSize: '32px'
                   }}
                 >
                   {getTypeIcon(institution.type)}
                 </div>
               )}
             </div>
           </Col>
          
          <Col className="flex-grow-1">
            <div className="d-flex align-items-center mb-2">
              <h4 className="mb-0 me-3">{institutionName}</h4>
              <Badge className={`${getStatusVariant(institution?.status)} me-2`}>
                {getStatusIcon(institution?.status)}
                {institution?.status || 'active'}
              </Badge>
              {plan && (
                <Badge className={`${getPlanVariant(plan)} d-flex align-items-center`}>
                  <CreditCard size={12} className="me-1" />
                  {plan.toUpperCase()}
                </Badge>
              )}
            </div>
            
            <div className="d-flex align-items-center text-muted small mb-2">
              <span className="me-3">
                <Building size={14} className="me-1" />
                Institution ID: {instituteCode}
              </span>
              <span className="me-3">
                Type: {institution?.type || 'School'}
              </span>
              {userRole && (
                <span className="me-3">
                  Role: {userRole.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
              )}
              {lastUpdated && (
                <span>
                  <CheckCircle size={14} className="me-1" />
                  Updated: {new Date(lastUpdated).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Contact Information */}
            <div className="d-flex align-items-center text-muted small">
              {institution.contact?.email && (
                <span className="me-3">
                  <Mail size={14} className="me-1" />
                  {institution.contact.email}
                </span>
              )}
              {institution.contact?.phone && (
                <span className="me-3">
                  <Phone size={14} className="me-1" />
                  {institution.contact.phone}
                </span>
              )}
              {institution.contact?.address && (
                <span className="me-3">
                  <MapPin size={14} className="me-1" />
                  {[
                    institution.contact.address.city,
                    institution.contact.address.state,
                    institution.contact.address.country === 'India' ? '' : institution.contact.address.country
                  ].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </Col>

        </Row>

        {/* Address Section */}
        {institution.contact?.address && (
          <div className="mt-3 pt-3 border-top">
            <h6 className="text-muted mb-2">
              <MapPin size={16} className="me-1" />
              Address
            </h6>
            <div className="small">
              {institution.contact.address.street && (
                <div>{institution.contact.address.street}</div>
              )}
              <div>
                {[
                  institution.contact.address.city,
                  institution.contact.address.state,
                  institution.contact.address.postalCode
                ].filter(Boolean).join(', ')}
              </div>
              {institution.contact.address.country === 'India' && (
                <div className="text-muted">India</div>
              )}
            </div>
          </div>
        )}

        {/* Institution Context Badge */}
        <div className="mt-3 pt-3 border-top">
          <div className="d-flex align-items-center justify-content-between">
            <Badge className="bg-info d-flex align-items-center">
              <Shield size={12} className="me-1" />
              Institution Isolated
            </Badge>
            <small className="text-muted">
              All data is restricted to this institution only
            </small>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default InstitutionDetailsCard;
