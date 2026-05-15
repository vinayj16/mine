import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { Building, Shield, CheckCircle } from 'lucide-react';

interface InstitutionHeaderProps {
  institution: {
    id: string;
    name: string;
    instituteCode: string;
    type: string;
    status: string;
    logo?: string;
  };
  userRole?: string;
  lastUpdated?: string;
}

const InstitutionHeader: React.FC<InstitutionHeaderProps> = ({
  institution,
  userRole,
  lastUpdated
}) => {
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'danger';
      default:
        return 'primary';
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
      default:
        return '🏢';
    }
  };

  return (
    <Card className="mb-4 border-primary">
      <Card.Body className="p-3">
        <Row className="align-items-center">
          <Col xs="auto">
            <div className="institution-logo me-3">
              {institution.logo ? (
                <img
                  src={institution.logo}
                  alt={institution.name}
                  style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                  className="rounded"
                />
              ) : (
                <div
                  className="rounded d-flex align-items-center justify-content-center"
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: '#e3f2fd',
                    fontSize: '24px'
                  }}
                >
                  {getTypeIcon(institution.type)}
                </div>
              )}
            </div>
          </Col>
          
          <Col className="flex-grow-1">
            <div className="d-flex align-items-center mb-1">
              <h5 className="mb-0 me-2">{institution.name}</h5>
              <Badge variant={getStatusVariant(institution.status)} className="me-2">
                {institution.status}
              </Badge>
              {institution.meta?.institutionIsolated && (
                <Badge variant="info" className="d-flex align-items-center">
                  <Shield size={12} className="me-1" />
                  Isolated
                </Badge>
              )}
            </div>
            
            <div className="d-flex align-items-center text-muted small">
              <span className="me-3">
                <Building size={14} className="me-1" />
                Code: {institution.instituteCode}
              </span>
              <span className="me-3">
                Type: {institution.type}
              </span>
              {userRole && (
                <span className="me-3">
                  Role: {userRole}
                </span>
              )}
              {lastUpdated && (
                <span>
                  <CheckCircle size={14} className="me-1" />
                  Updated: {new Date(lastUpdated).toLocaleString()}
                </span>
              )}
            </div>
          </Col>

          <Col xs="auto">
            <div className="text-end">
              <div className="small text-muted mb-1">Institution ID</div>
              <code className="small">{institution.id.slice(-8)}</code>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default InstitutionHeader;
