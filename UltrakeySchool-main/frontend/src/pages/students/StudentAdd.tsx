import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { studentService, type CreateStudentInput } from '../../services/studentService';

interface CreatedStudent {
  email: string;
  password: string;
  name: string;
  admissionNo: string;
}

interface StudentFormData {
  // Personal Information
  academicYear: string;
  admissionNo: string;
  admissionDate: string;
  rollNo: string;
  status: string;
  firstName: string;
  lastName: string;
  class: string;
  section: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup: string;
  house: string;
  religion: string;
  category: string;
  primaryContactNumber: string;
  email: string;
  caste: string;
  motherTongue: string;
  languageKnown: string[];
  studentPhoto: File | null;
  
  // Parent/Guardian Information
  fatherName: string;
  fatherEmail: string;
  fatherPhone: string;
  fatherOccupation: string;
  fatherPhoto: File | null;
  motherName: string;
  motherEmail: string;
  motherPhone: string;
  motherOccupation: string;
  motherPhoto: File | null;
  guardianType: string;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianOccupation: string;
  guardianAddress: string;
  guardianPhoto: File | null;
  
  // Sibling Information
  hasSibling: string;
  siblingName: string;
  siblingRollNo: string;
  siblingAdmissionNo: string;
  siblingClass: string;
  
  // Address Information
  currentAddress: string;
  permanentAddress: string;
  
  // Transport Information
  transportRequired: boolean;
  route: string;
  vehicleNumber: string;
  pickupPoint: string;
  
  // Hostel Information
  hostelRequired: boolean;
  hostel: string;
  roomNo: string;
  
  // Documents
  medicalConditionDoc: File | null;
  transferCertificateDoc: File | null;
  
  // Medical Information
  medicalCondition: string;
  allergies: string[];
  medications: string[];
  
  // Previous School Details
  previousSchoolName: string;
  previousSchoolAddress: string;
  
  // Other Details
  bankName: string;
  branch: string;
  ifscNumber: string;
  otherInformation: string;
}

const StudentAdd: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<CreatedStudent | null>(null);
  
  const [formData, setFormData] = useState<StudentFormData>({
    academicYear: 'June 2024/25',
    admissionNo: '',
    admissionDate: '',
    rollNo: '',
    status: '',
    firstName: '',
    lastName: '',
    class: '',
    section: '',
    gender: '',
    dateOfBirth: '',
    bloodGroup: '',
    house: '',
    religion: '',
    category: '',
    primaryContactNumber: '',
    email: '',
    caste: '',
    motherTongue: '',
    languageKnown: [],
    studentPhoto: null,
    fatherName: '',
    fatherEmail: '',
    fatherPhone: '',
    fatherOccupation: '',
    fatherPhoto: null,
    motherName: '',
    motherEmail: '',
    motherPhone: '',
    motherOccupation: '',
    motherPhoto: null,
    guardianType: 'parents',
    guardianName: '',
    guardianRelation: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianOccupation: '',
    guardianAddress: '',
    guardianPhoto: null,
    hasSibling: 'no',
    siblingName: '',
    siblingRollNo: '',
    siblingAdmissionNo: '',
    siblingClass: '',
    currentAddress: '',
    permanentAddress: '',
    transportRequired: false,
    route: '',
    vehicleNumber: '',
    pickupPoint: '',
    hostelRequired: false,
    hostel: '',
    roomNo: '',
    medicalConditionDoc: null,
    transferCertificateDoc: null,
    medicalCondition: 'good',
    allergies: [],
    medications: [],
    previousSchoolName: '',
    previousSchoolAddress: '',
    bankName: '',
    branch: '',
    ifscNumber: '',
    otherInformation: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'languageKnown') {
      // Handle languageKnown as array - split comma-separated values
      const languages = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
      setFormData(prev => ({
        ...prev,
        [name]: languages
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!formData.lastName.trim()) {
      toast.error('Last name is required');
      return;
    }
    if (!formData.gender) {
      toast.error('Gender is required');
      return;
    }
    if (!formData.class || formData.class === 'Select') {
      toast.error('Class is required');
      return;
    }

    try {
      setLoading(true);

      // Parse date strings to ISO format (YYYY-MM-DD)
      const parseDate = (dateStr: string): string => {
        if (!dateStr) return new Date().toISOString();
        // Try to parse various date formats
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
        return new Date().toISOString();
      };

      // Prepare data for backend (matching CreateStudentInput interface)
      const studentData: CreateStudentInput = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.primaryContactNumber,
        class: formData.class,
        section: formData.section,
        rollNumber: formData.rollNo,
        gender: formData.gender.toLowerCase() as 'male' | 'female' | 'other',
        dateOfBirth: parseDate(formData.dateOfBirth),
        address: formData.currentAddress,
        city: '',
        state: '',
        zipCode: '',
        country: '',
        guardianName: formData.guardianName || formData.fatherName || formData.motherName,
        guardianPhone: formData.guardianPhone || formData.fatherPhone || formData.motherPhone,
        guardianEmail: formData.guardianEmail || formData.fatherEmail || formData.motherEmail,
        admissionDate: parseDate(formData.admissionDate)
      };

      const response = await studentService.create(studentData);

      toast.success('Student added successfully');
      
      // Show credentials modal
      const studentPassword = (response as any).defaultPassword || `STU${Date.now().toString().slice(-6)}`;
      setCreatedStudent({
        email: formData.email || `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}@student.com`,
        password: studentPassword,
        name: `${formData.firstName} ${formData.lastName}`,
        admissionNo: formData.admissionNo || `ADM${Date.now().toString().slice(-8)}`
      });
      setShowCredentials(true);
    } catch (err: any) {
      console.error('Error adding student:', err);
      const errorMessage = err.message || 'Failed to add student';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content content-two">
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="mb-1">Add Student</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/students">Students</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Add Student</li>
            </ol>
          </nav>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-12">
          <form onSubmit={handleSubmit}>
            
            {/* Personal Information */}
            <div className="card">
              <div className="card-header bg-light">
                <div className="d-flex align-items-center">
                  <span className="bg-white avatar avatar-sm me-2 text-gray-7 flex-shrink-0">
                    <i className="ti ti-info-square-rounded fs-16"></i>
                  </span>
                  <h4 className="text-dark">Personal Information</h4>
                </div>
              </div>
              <div className="card-body pb-1">
                <div className="row">
                  <div className="col-md-12">
                    <div className="d-flex align-items-center flex-wrap row-gap-3 mb-3">                                                
                      <div className="d-flex align-items-center justify-content-center avatar avatar-xxl border border-dashed me-2 flex-shrink-0 text-dark frames">
                        <i className="ti ti-photo-plus fs-16"></i>
                      </div>                                              
                      <div className="profile-upload">
                        <div className="profile-uploader d-flex align-items-center">
                          <div className="drag-upload-btn mb-3">
                            Upload
                            <input type="file" className="form-control image-sign" multiple />
                          </div>
                          <a href="javascript:void(0);" className="btn btn-primary mb-3">Remove</a>
                        </div>
                        <p className="fs-12">Upload image size 4MB, Format JPG, PNG, SVG</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row row-cols-xxl-5 row-cols-md-6">
                  <div className="col-xxl col-xl-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Academic Year</label>
                      <select className="form-select" name="academicYear" value={formData.academicYear} onChange={handleInputChange}>
                        <option>June 2024/25</option>
                        <option>June 2023/24</option>
                        <option>June 2022/23</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-xxl col-xl-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Admission Number</label>
                      <input type="text" className="form-control" name="admissionNo" value={formData.admissionNo} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="col-xxl col-xl-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Admission Date</label>
                      <div className="input-icon position-relative">
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar"></i>
                        </span>
                        <input type="text" className="form-control datetimepicker" name="admissionDate" value={formData.admissionDate} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>
                  <div className="col-xxl col-xl-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Roll Number</label>
                      <input type="text" className="form-control" name="rollNo" value={formData.rollNo} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="col-xxl col-xl-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                        <option>Select</option>
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-xxl col-xl-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">First Name</label>
                      <input type="text" className="form-control" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="col-xxl col-xl-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Last Name</label>
                      <input type="text" className="form-control" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="col-xxl col-xl-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Class</label>
                      <select className="form-select" name="class" value={formData.class} onChange={handleInputChange}>
                        <option>Select</option>
                        <option>I</option>
                        <option>II</option>
                        <option>III</option>
                        <option>IV</option>
                        <option>V</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-xxl col-xl-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Section</label>
                      <select className="form-select" name="section" value={formData.section} onChange={handleInputChange}>
                        <option>Select</option>
                        <option>A</option>
                        <option>B</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-xxl col-xl-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Gender</label>
                      <select className="form-select" name="gender" value={formData.gender} onChange={handleInputChange}>
                        <option>Select</option>
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-xxl col-xl-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Date of Birth</label>
                      <div className="input-icon position-relative">
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar"></i>
                        </span>
                        <input type="text" className="form-control datetimepicker" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>
                  <div className="col-xxl col-xl-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Blood Group</label>
                      <select className="form-select" name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange}>
                        <option>Select</option>
                        <option>O +ve</option>
                        <option>B +ve</option>
                        <option>B -ve</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-xxl col-xl-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">House</label>
                      <select className="form-select" name="house" value={formData.house} onChange={handleInputChange}>
                        <option>Select</option>
                        <option>Red</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-xxl col-xl-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Religion</label>
                      <select className="form-select" name="religion" value={formData.religion} onChange={handleInputChange}>
                        <option>Select</option>
                        <option>Christianity</option>
                        <option>Buddhism</option>
                        <option>Irreligion</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-xxl col-xl-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Category</label>
                      <select className="form-select" name="category" value={formData.category} onChange={handleInputChange}>
                        <option>Select</option>
                        <option>OBC</option>
                        <option>BC</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-xxl col-xl-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Primary Contact Number</label>
                      <input type="text" className="form-control" name="primaryContactNumber" value={formData.primaryContactNumber} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="col-xxl col-xl-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Email Address</label>
                      <input type="email" className="form-control" name="email" value={formData.email} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="col-xxl col-xl-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Caste</label>
                      <input type="text" className="form-control" name="caste" value={formData.caste} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="col-xxl col-xl-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Mother Tongue</label>
                      <select className="form-select" name="motherTongue" value={formData.motherTongue} onChange={handleInputChange}>
                        <option>Select</option>
                        <option>English</option>
                        <option>Spanish</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-xxl col-xl-3 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Language Known</label>
                      <input className="input-tags form-control" type="text" data-role="tagsinput" name="languageKnown" value={Array.isArray(formData.languageKnown) ? formData.languageKnown.join(', ') : ''} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Personal Information */}

            {/* Parents & Guardian Information */}
            <div className="card">
              <div className="card-header bg-light">
                <div className="d-flex align-items-center">
                  <span className="bg-white avatar avatar-sm me-2 text-gray-7 flex-shrink-0">
                    <i className="ti ti-user-shield fs-16"></i>
                  </span>
                  <h4 className="text-dark">Parents & Guardian Information</h4>
                </div>
              </div>
              <div className="card-body pb-0">
                <div className="border-bottom mb-3">
                  <h5 className="mb-3">Father's Info</h5>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="d-flex align-items-center flex-wrap row-gap-3 mb-3">                                                
                        <div className="d-flex align-items-center justify-content-center avatar avatar-xxl border border-dashed me-2 flex-shrink-0 text-dark frames">
                          <i className="ti ti-photo-plus fs-16"></i>
                        </div>                                              
                        <div className="profile-upload">
                          <div className="profile-uploader d-flex align-items-center">
                            <div className="drag-upload-btn mb-3">
                              Upload
                              <input type="file" className="form-control image-sign" multiple />
                            </div>
                            <a href="javascript:void(0);" className="btn btn-primary mb-3">Remove</a>
                          </div>
                          <p className="fs-12">Upload image size 4MB, Format JPG, PNG, SVG</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Father Name</label>
                        <input type="text" className="form-control" name="fatherName" value={formData.fatherName} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input type="text" className="form-control" name="fatherEmail" value={formData.fatherEmail} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Phone Number</label>
                        <input type="text" className="form-control" name="fatherPhone" value={formData.fatherPhone} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Father Occupation</label>
                        <input type="text" className="form-control" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-bottom mb-3">
                  <h5 className="mb-3">Mother's Info</h5>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="d-flex align-items-center flex-wrap row-gap-3 mb-3">                                                
                        <div className="d-flex align-items-center justify-content-center avatar avatar-xxl border border-dashed me-2 flex-shrink-0 text-dark frames">
                          <i className="ti ti-photo-plus fs-16"></i>
                        </div>                                              
                        <div className="profile-upload">
                          <div className="profile-uploader d-flex align-items-center">
                            <div className="drag-upload-btn mb-3">
                              Upload
                              <input type="file" className="form-control image-sign" multiple />
                            </div>
                            <a href="javascript:void(0);" className="btn btn-primary mb-3">Remove</a>
                          </div>
                          <p className="fs-12">Upload image size 4MB, Format JPG, PNG, SVG</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Mother Name</label>
                        <input type="text" className="form-control" name="motherName" value={formData.motherName} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input type="text" className="form-control" name="motherEmail" value={formData.motherEmail} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Phone Number</label>
                        <input type="text" className="form-control" name="motherPhone" value={formData.motherPhone} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Mother Occupation</label>
                        <input type="text" className="form-control" name="motherOccupation" value={formData.motherOccupation} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h5 className="mb-3">Guardian Details</h5>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-2">
                        <div className="d-flex align-items-center flex-wrap">
                          <label className="form-label text-dark fw-normal me-2">If Guardian Is</label>
                          <div className="form-check me-3 mb-2">
                            <input className="form-check-input" type="radio" name="guardianType" id="parents" checked={formData.guardianType === 'parents'} onChange={handleInputChange} value="parents" />
                            <label className="form-check-label" htmlFor="parents">
                              Parents
                            </label>
                          </div>
                          <div className="form-check me-3 mb-2">
                            <input className="form-check-input" type="radio" name="guardianType" id="guardian" checked={formData.guardianType === 'guardian'} onChange={handleInputChange} value="guardian" />
                            <label className="form-check-label" htmlFor="guardian">
                              Guardian
                            </label>
                          </div>
                          <div className="form-check mb-2">
                            <input className="form-check-input" type="radio" name="guardianType" id="other" checked={formData.guardianType === 'other'} onChange={handleInputChange} value="other" />
                            <label className="form-check-label" htmlFor="other">
                              Others
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center flex-wrap row-gap-3 mb-3">                                                
                        <div className="d-flex align-items-center justify-content-center avatar avatar-xxl border border-dashed me-2 flex-shrink-0 text-dark frames">
                          <i className="ti ti-photo-plus fs-16"></i>
                        </div>                                              
                        <div className="profile-upload">
                          <div className="profile-uploader d-flex align-items-center">
                            <div className="drag-upload-btn mb-3">
                              Upload
                              <input type="file" className="form-control image-sign" multiple />
                            </div>
                            <a href="javascript:void(0);" className="btn btn-primary mb-3">Remove</a>
                          </div>
                          <p className="fs-12">Upload image size 4MB, Format JPG, PNG, SVG</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Guardian Name</label>
                        <input type="text" className="form-control" name="guardianName" value={formData.guardianName} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Guardian Relation</label>
                        <input type="text" className="form-control" name="guardianRelation" value={formData.guardianRelation} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Phone Number</label>
                        <input type="text" className="form-control" name="guardianPhone" value={formData.guardianPhone} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-control" name="guardianEmail" value={formData.guardianEmail} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Occupation</label>
                        <input type="text" className="form-control" name="guardianOccupation" value={formData.guardianOccupation} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Address</label>
                        <input type="text" className="form-control" name="guardianAddress" value={formData.guardianAddress} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Parents & Guardian Information */}

            {/* Sibilings */}
            <div className="card">
              <div className="card-header bg-light">
                <div className="d-flex align-items-center">
                  <span className="bg-white avatar avatar-sm me-2 text-gray-7 flex-shrink-0">
                    <i className="ti ti-users fs-16"></i>
                  </span>
                  <h4 className="text-dark">Sibilings</h4>
                </div>
              </div>
              <div className="card-body">
                <div className="addsibling-info">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-2">
                        <label className="form-label">Sibiling Info</label>
                        <div className="d-flex align-items-center flex-wrap">
                          <label className="form-label text-dark fw-normal me-2">Is Sibiling studying in same school</label>
                          <div className="form-check me-3 mb-2">
                            <input className="form-check-input" type="radio" name="hasSibling" id="yes" checked={formData.hasSibling === 'yes'} onChange={handleInputChange} value="yes" />
                            <label className="form-check-label" htmlFor="yes">
                              Yes
                            </label>
                          </div>
                          <div className="form-check mb-2">
                            <input className="form-check-input" type="radio" name="hasSibling" id="no" checked={formData.hasSibling === 'no'} onChange={handleInputChange} value="no" />
                            <label className="form-check-label" htmlFor="no">
                              No
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Name</label>
                        <select className="form-select" name="siblingName" value={formData.siblingName} onChange={handleInputChange}>
                          <option>Select</option>
                          <option>Ralph Claudia</option>
                          <option>Julie Scott</option>
                          <option>Maria</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Roll No</label>
                        <select className="form-select" name="siblingRollNo" value={formData.siblingRollNo} onChange={handleInputChange}>
                          <option>Select</option>
                          <option>35013</option>
                          <option>35011</option>
                          <option>35010</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Admission No</label>
                        <select className="form-select" name="siblingAdmissionNo" value={formData.siblingAdmissionNo} onChange={handleInputChange}>
                          <option>Select</option>
                          <option>AD9892434</option>
                          <option>AD9892433</option>
                          <option>AD9892432</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                      <div className="mb-3">
                        <div className="d-flex align-items-center">
                          <div className="w-100">
                            <label className="form-label">Class</label>
                            <select className="form-select w-100" name="siblingClass" value={formData.siblingClass} onChange={handleInputChange}>
                              <option>Select</option>
                              <option>I</option>
                              <option>II</option>
                              <option>III</option>
                            </select>
                          </div>
                          <div>
                            <label className="form-label">&nbsp;</label>
                            <a href="javascript:void(0);" className="trash-icon ms-3"><i className="ti ti-trash-x"></i></a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-top pt-3"> 
                  <a href="javascript:void(0);" className="add-sibling btn btn-primary d-inline-flex align-items-center"><i className="ti ti-circle-plus me-2"></i>Add New</a>
                </div>
              </div>
            </div>
            {/* /Sibilings */}

            {/* Address */}
            <div className="card">
              <div className="card-header bg-light">
                <div className="d-flex align-items-center">
                  <span className="bg-white avatar avatar-sm me-2 text-gray-7 flex-shrink-0">
                    <i className="ti ti-map fs-16"></i>
                  </span>
                  <h4 className="text-dark">Address</h4>
                </div>
              </div>
              <div className="card-body pb-1">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Current Address</label>
                      <input type="text" className="form-control" name="currentAddress" value={formData.currentAddress} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Permanent Address</label>
                      <input type="text" className="form-control" name="permanentAddress" value={formData.permanentAddress} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Address */}

            {/* Transport Information */}
            <div className="card">
              <div className="card-header bg-light d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <span className="bg-white avatar avatar-sm me-2 text-gray-7 flex-shrink-0">
                    <i className="ti ti-bus-stop fs-16"></i>
                  </span>
                  <h4 className="text-dark">Transport Information</h4>
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" name="transportRequired" checked={formData.transportRequired} onChange={handleInputChange} />
                </div>
              </div>
              <div className="card-body pb-1">
                <div className="row">
                  <div className="col-lg-4 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Route</label>
                      <select className="form-select" name="route" value={formData.route} onChange={handleInputChange}>
                        <option>Select</option>
                        <option>Newyork</option>
                        <option>Denver</option>
                        <option>Chicago</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Vehicle Number</label>
                      <select className="form-select" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleInputChange}>
                        <option>Select</option>
                        <option>AM 54548</option>
                        <option>AM 64528</option>
                        <option>AM 123548</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Pickup Point</label>
                      <select className="form-select" name="pickupPoint" value={formData.pickupPoint} onChange={handleInputChange}>
                        <option>Select</option>
                        <option>Cincinatti</option>
                        <option>Illinois</option>
                        <option>Morgan</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Transport Information */}

            {/* Hostel Information */}
            <div className="card">
              <div className="card-header bg-light d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <span className="bg-white avatar avatar-sm me-2 text-gray-7 flex-shrink-0">
                    <i className="ti ti-building-fortress fs-16"></i>
                  </span>
                  <h4 className="text-dark">Hostel Information</h4>
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" name="hostelRequired" checked={formData.hostelRequired} onChange={handleInputChange} />
                </div>
              </div>
              <div className="card-body pb-1">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Hostel</label>
                      <select className="form-select" name="hostel" value={formData.hostel} onChange={handleInputChange}>
                        <option>Select</option>
                        <option>Phoenix Residence</option>
                        <option>Tranquil Haven</option>
                        <option>Radiant Towers</option>
                        <option>Nova Nest</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Room No</label>
                      <select className="form-select" name="roomNo" value={formData.roomNo} onChange={handleInputChange}>
                        <option>Select</option>
                        <option>20</option>
                        <option>22</option>
                        <option>24</option>
                        <option>26</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Hostel Information */}

            {/* Documents */}
            <div className="card">
              <div className="card-header bg-light">
                <div className="d-flex align-items-center">
                  <span className="bg-white avatar avatar-sm me-2 text-gray-7 flex-shrink-0">
                    <i className="ti ti-file fs-16"></i>
                  </span>
                  <h4 className="text-dark">Documents</h4>
                </div>
              </div>
              <div className="card-body pb-1">
                <div className="row">
                  <div className="col-lg-6">
                    <div className="mb-2">
                      <div className="mb-3">
                        <label className="form-label mb-1">Medical Condition</label>
                        <p>Upload image size of 4MB, Accepted Format PDF</p>
                      </div>
                      <div className="d-flex align-items-center flex-wrap">
                        <div className="btn btn-primary drag-upload-btn mb-2 me-2">
                          <i className="ti ti-file-upload me-1"></i>Change
                          <input type="file" className="form-control image_sign" multiple />
                        </div>
                        <p className="mb-2">BirthCertificate.pdf</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-2">
                      <div className="mb-3">
                        <label className="form-label mb-1">Upload Transfer Certificate</label>
                        <p>Upload image size of 4MB, Accepted Format PDF</p>
                      </div>
                      <div className="d-flex align-items-center flex-wrap">
                        <div className="btn btn-primary drag-upload-btn mb-2">
                          <i className="ti ti-file-upload me-1"></i>Upload Document
                          <input type="file" className="form-control image_sign" multiple />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Documents */}

            {/* Medical History */}
            <div className="card">
              <div className="card-header bg-light">
                <div className="d-flex align-items-center">
                  <span className="bg-white avatar avatar-sm me-2 text-gray-7 flex-shrink-0">
                    <i className="ti ti-medical-cross fs-16"></i>
                  </span>
                  <h4 className="text-dark">Medical History</h4>
                </div>
              </div>
              <div className="card-body pb-1">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-2">
                      <label className="form-label">Medical Condition</label>
                      <div className="d-flex align-items-center flex-wrap">
                        <label className="form-label text-dark fw-normal me-2">Medical Condition of a Student</label>
                        <div className="form-check me-3 mb-2">
                          <input className="form-check-input" type="radio" name="medicalCondition" id="good" checked={formData.medicalCondition === 'good'} onChange={handleInputChange} value="good" />
                          <label className="form-check-label" htmlFor="good">
                            Good
                          </label>
                        </div>
                        <div className="form-check me-3 mb-2">
                          <input className="form-check-input" type="radio" name="medicalCondition" id="bad" checked={formData.medicalCondition === 'bad'} onChange={handleInputChange} value="bad" />
                          <label className="form-check-label" htmlFor="bad">
                            Bad
                          </label>
                        </div>
                        <div className="form-check mb-2">
                          <input className="form-check-input" type="radio" name="medicalCondition" id="others" checked={formData.medicalCondition === 'others'} onChange={handleInputChange} value="others" />
                          <label className="form-check-label" htmlFor="others">
                            Others
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Allergies</label>
                    <input className="input-tags form-control" type="text" data-role="tagsinput" name="allergies" value={Array.isArray(formData.allergies) ? formData.allergies.join(', ') : ''} onChange={handleInputChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Medications</label>
                    <input className="input-tags form-control" type="text" data-role="tagsinput" name="medications" value={Array.isArray(formData.medications) ? formData.medications.join(', ') : ''} onChange={handleInputChange} />
                  </div>
                </div>
              </div>
            </div>
            {/* /Medical History */}

            {/* Previous School details */}
            <div className="card">
              <div className="card-header bg-light">
                <div className="d-flex align-items-center">
                  <span className="bg-white avatar avatar-sm me-2 text-gray-7 flex-shrink-0">
                    <i className="ti ti-building fs-16"></i>
                  </span>
                  <h4 className="text-dark">Previous School Details</h4>
                </div>
              </div>
              <div className="card-body pb-1">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">School Name</label>
                      <input type="text" className="form-control" name="previousSchoolName" value={formData.previousSchoolName} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Address</label>
                      <input type="text" className="form-control" name="previousSchoolAddress" value={formData.previousSchoolAddress} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Previous School details */}

            {/* Other Details */}
            <div className="card">
              <div className="card-header bg-light">
                <div className="d-flex align-items-center">
                  <span className="bg-white avatar avatar-sm me-2 text-gray-7 flex-shrink-0">
                    <i className="ti ti-building-bank fs-16"></i>
                  </span>
                  <h4 className="text-dark">Other Details</h4>
                </div>
              </div>
              <div className="card-body pb-1">
                <div className="row">
                  <div className="col-md-5">
                    <div className="mb-3">
                      <label className="form-label">Bank Name</label>
                      <input type="text" className="form-control" name="bankName" value={formData.bankName} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="mb-3">
                      <label className="form-label">Branch</label>
                      <input type="text" className="form-control" name="branch" value={formData.branch} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="col-md-5">
                    <div className="mb-3">
                      <label className="form-label">IFSC Number</label>
                      <input type="text" className="form-control" name="ifscNumber" value={formData.ifscNumber} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Other Information</label>
                      <textarea className="form-control" rows={3} name="otherInformation" value={formData.otherInformation} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Other Details */}

            <div className="text-end">
              <button type="button" className="btn btn-light me-3" onClick={() => navigate('/students')} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Adding Student...
                  </>
                ) : (
                  'Add Student'
                )}
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* Credentials Modal */}
      {showCredentials && createdStudent && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Student Created Successfully!</h5>
                  <button type="button" className="btn-close" onClick={() => { setShowCredentials(false); navigate('/institution/students'); }}></button>
                </div>
                <div className="modal-body">
                  <div className="text-center mb-4">
                    <div className="avatar avatar-lg bg-success rounded-circle mx-auto mb-3">
                      <i className="ti ti-check fs-24 text-white"></i>
                    </div>
                    <h5>Student Login Credentials</h5>
                    <p className="text-muted">Please save these credentials. They will be needed for login.</p>
                  </div>
                  
                  <div className="bg-light rounded p-3 mb-3">
                    <div className="row">
                      <div className="col-md-6 mb-2 mb-md-0">
                        <label className="text-muted small">Name</label>
                        <p className="mb-0 fw-bold">{createdStudent.name}</p>
                      </div>
                      <div className="col-md-6">
                        <label className="text-muted small">Admission No</label>
                        <p className="mb-0 fw-bold">{createdStudent.admissionNo}</p>
                      </div>
                    </div>
                    <hr />
                    <div className="row">
                      <div className="col-md-6 mb-2 mb-md-0">
                        <label className="text-muted small">Email (Username)</label>
                        <p className="mb-0 fw-bold">{createdStudent.email}</p>
                      </div>
                      <div className="col-md-6">
                        <label className="text-muted small">Password</label>
                        <p className="mb-0 fw-bold text-primary">{createdStudent.password}</p>
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-info mb-0">
                    <i className="ti ti-info-circle me-2"></i>
                    Student can login at the login page using these credentials.
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={() => {
                      navigator.clipboard.writeText(`Email: ${createdStudent.email}\nPassword: ${createdStudent.password}\nAdmission No: ${createdStudent.admissionNo}`);
                      toast.success('Credentials copied to clipboard!');
                    }}
                  >
                    <i className="ti ti-copy me-1"></i> Copy Credentials
                  </button>
                  <Link 
                    to="/login" 
                    className="btn btn-success"
                  >
                    <i className="ti ti-login me-1"></i> Go to Login
                  </Link>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary" 
                    onClick={() => { setShowCredentials(false); navigate('/institution/students'); }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentAdd;
