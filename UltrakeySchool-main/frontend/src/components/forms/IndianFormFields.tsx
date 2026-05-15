import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import { INDIAN_STATES, INDIAN_CITIES, INDIAN_INSTITUTION_TYPES, INDIAN_EDUCATION_BOARDS, INDIAN_PHONE_PATTERN, INDIAN_CURRENCY } from '../../config/indianLocalization';

interface IndianFormFieldsProps {
  values?: any;
  onChange?: (field: string, value: any) => void;
  errors?: any;
  touched?: any;
  includeInstitutionFields?: boolean;
  includeAddressFields?: boolean;
  includeContactFields?: boolean;
}

const IndianFormFields: React.FC<IndianFormFieldsProps> = ({
  values = {},
  onChange = () => {},
  errors = {},
  touched = {},
  includeInstitutionFields = false,
  includeAddressFields = false,
  includeContactFields = false
}) => {
  const handleChange = (field: string, value: any) => {
    onChange(field, value);
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    return INDIAN_PHONE_PATTERN.format(phone);
  };

  return (
    <div className="indian-form-fields">
      {/* Institution Fields */}
      {includeInstitutionFields && (
        <>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Institution Type *</Form.Label>
                <Form.Select
                  value={values.institutionType || ''}
                  onChange={(e) => handleChange('institutionType', e.target.value)}
                  isInvalid={errors.institutionType && touched.institutionType}
                >
                  <option value="">Select Institution Type</option>
                  {INDIAN_INSTITUTION_TYPES.map((type) => (
                    <optgroup key={type.value} label={type.label}>
                      {type.subtypes.map((subtype, index) => (
                        <option key={`${type.value}-${index}`} value={subtype}>
                          {subtype}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.institutionType}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Education Board</Form.Label>
                <Form.Select
                  value={values.educationBoard || ''}
                  onChange={(e) => handleChange('educationBoard', e.target.value)}
                  isInvalid={errors.educationBoard && touched.educationBoard}
                >
                  <option value="">Select Education Board</option>
                  {INDIAN_EDUCATION_BOARDS.map((board, index) => (
                    <option key={index} value={board}>
                      {board}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.educationBoard}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
        </>
      )}

      {/* Contact Fields */}
      {includeContactFields && (
        <>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Phone Number *</Form.Label>
                <Form.Control
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={formatPhone(values.phone || '')}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  isInvalid={errors.phone && touched.phone}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.phone || 'Please enter a valid 10-digit Indian phone number'}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Format: +91 XXXXX XXXXX (10-digit mobile number)
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>WhatsApp Number</Form.Label>
                <Form.Control
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={formatPhone(values.whatsappNumber || '')}
                  onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                  isInvalid={errors.whatsappNumber && touched.whatsappNumber}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.whatsappNumber || 'Please enter a valid 10-digit Indian phone number'}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
        </>
      )}

      {/* Address Fields */}
      {includeAddressFields && (
        <>
          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Street Address</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter street address"
                  value={values.streetAddress || ''}
                  onChange={(e) => handleChange('streetAddress', e.target.value)}
                  isInvalid={errors.streetAddress && touched.streetAddress}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.streetAddress}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>City *</Form.Label>
                <Form.Select
                  value={values.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  isInvalid={errors.city && touched.city}
                >
                  <option value="">Select City</option>
                  {INDIAN_CITIES.map((city, index) => (
                    <option key={index} value={city}>
                      {city}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.city}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>State *</Form.Label>
                <Form.Select
                  value={values.state || ''}
                  onChange={(e) => handleChange('state', e.target.value)}
                  isInvalid={errors.state && touched.state}
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((state, index) => (
                    <option key={index} value={state.name}>
                      {state.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.state}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>PIN Code *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="6-digit PIN code"
                  value={values.pincode || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    handleChange('pincode', value);
                  }}
                  isInvalid={errors.pincode && touched.pincode}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.pincode || 'Please enter a valid 6-digit PIN code'}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  6-digit Indian postal code
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Country</Form.Label>
                <Form.Control
                  type="text"
                  value="India"
                  disabled
                  className="bg-light"
                />
                <Form.Text className="text-muted">
                  System is configured for Indian institutions only
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </>
      )}

      {/* Financial Fields */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Amount (₹)</Form.Label>
            <Form.Control
              type="number"
              placeholder="0.00"
              value={values.amount || ''}
              onChange={(e) => handleChange('amount', e.target.value)}
              isInvalid={errors.amount && touched.amount}
            />
            <Form.Control.Feedback type="invalid">
              {errors.amount}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Amount in Indian Rupees (₹)
            </Form.Text>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Formatted Amount</Form.Label>
            <Form.Control
              type="text"
              value={values.amount ? INDIAN_CURRENCY.format(parseFloat(values.amount)) : ''}
              disabled
              className="bg-light"
            />
            <Form.Text className="text-muted">
              Indian currency format
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>
    </div>
  );
};

export default IndianFormFields;
