import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { Building, Mail, Phone, MapPin, CreditCard, Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface InstitutionDetailsCardProps {
  institution?: {
    id: string;
    name: string;
    instituteCode: string;
    type: string;
    status: string;
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
  userRole?: string;
  plan?: string;
  lastUpdated?: string;
}

const InstitutionDetailsCard: React.FC<InstitutionDetailsCardProps> = ({
  institution,
  userRole,
  plan,
  lastUpdated
}) => {
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
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

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'school':
        return '🏫';
      case 'college':
        return '🎓';
      case 'university':
        return '🏛️';
      case 'degree':
        return '📚';
      case 'btech':
        return '⚙️';
      case 'medical':
        return '🏥';
      case 'management':
        return '💼';
      default:
        return '🏢';
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

  // If no institution data, show placeholder
  if (!institution) {
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
              <h4 className="mb-0 me-3">{institution.name}</h4>
              <Badge className={`${getStatusVariant(institution.status)} me-2`}>
                {getStatusIcon(institution.status)}
                {institution.status}
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
                Code: {institution.instituteCode}
              </span>
              <span className="me-3">
                Type: {institution.type}
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

          <Col xs="auto">
            <div className="text-end">
              <div className="small text-muted mb-1">Institution ID</div>
              <code className="small bg-light p-1 rounded">{institution.id.slice(-8)}</code>
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
