import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import institutionService, { type InstitutionFormData } from '../../services/institutionService'

// ─── STEP META ────────────────────────────────────────────────────────────────
const STEPS = [
  { id:1,  label:'Basic Info',  icon:'ti ti-building'         },
  { id:2,  label:'Address',     icon:'ti ti-map-pin'          },
  { id:3,  label:'Admin',       icon:'ti ti-user-shield'      },
  { id:4,  label:'Plan',        icon:'ti ti-crown'            },
  { id:5,  label:'Modules',     icon:'ti ti-puzzle'           },
  { id:6,  label:'Academic',    icon:'ti ti-school'           },
  { id:7,  label:'System',      icon:'ti ti-settings'         },
  { id:8,  label:'Branding',    icon:'ti ti-palette'          },
  { id:9,  label:'Security',    icon:'ti ti-shield-lock'      },
  { id:10, label:'Status',      icon:'ti ti-toggle-right'     },
  { id:11, label:'Review',      icon:'ti ti-clipboard-check'  },
]

const INIT = {
  institutionName:'', institutionCode:'', institutionType:'School',
  email:'', phoneNumber:'', alternatePhone:'', website:'',
  country:'', state:'', district:'', city:'', area:'', fullAddress:'', pincode:'', googleMapsLocation:'',
  adminName:'', adminEmail:'', adminPhone:'', password:'', confirmPassword:'',
  autoGeneratePassword:false, sendCredentialsByEmail:true,
  selectedPlan:'Basic', billingType:'Monthly',
  startDate: new Date().toISOString().split('T')[0], endDate:'',
  isTrial:false, trialExpiryDate:'', maxStudentsLimit:500, maxStaffLimit:50, storageLimit:50,
  selectedModules:['Student Management', 'Staff Management', 'Attendance'],
  board:'CBSE', classes:['1','2','3','4','5','6','7','8','9','10'], sections:'A,B,C', academicYearFormat:'YYYY-YY',
  streams:['MPC','BIPC','CEC','MEC'], yearStructure:['1st Year','2nd Year'], semesters:[],
  universityAffiliation:'', coursesOffered:[], departments:[], semesterSystem:true,
  timezone:'Asia/Kolkata', currency:'INR', dateFormat:'DD/MM/YYYY', language:'English',
  gradingSystem:'Percentage', attendanceCalculationType:'Daily',
  primaryColor:'#6366f1', secondaryColor:'#10b981', customDomain:'', subdomain:'',
  allowStudentLogin:true, allowParentLogin:true, require2FA:false,
  passwordPolicy:'Medium', sessionTimeoutDuration:30,
  status:'Active', suspensionReason:'', allowImpersonation:false, allowAPIAccess:false,
}

// ─── VALIDATION RULES ─────────────────────────────────────────────────────────
const validate = (step: number, data: any) => {
  const errs: any = {}
  const req  = (field: string, label: string) => { if (!data[field]?.toString().trim()) errs[field] = `${label} is required` }
  const email = (field: string, label: string) => {
    req(field, label)
    if (data[field] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data[field])) errs[field] = 'Invalid email address'
  }
  const phone = (field: string, label: string) => {
    req(field, label)
    if (data[field] && !/^[+\d][\d\s\-()]{7,14}$/.test(data[field])) errs[field] = 'Invalid phone number'
  }
  const url = (field: string) => {
    if (data[field] && !/^https?:\/\/.+/.test(data[field])) errs[field] = 'Must start with http:// or https://'
  }

  switch (step) {
    case 1:
      req('institutionName','Institution name')
      if (data.institutionName && data.institutionName.length < 3) errs.institutionName = 'Name must be at least 3 characters'
      req('institutionCode','Institution code')
      if (data.institutionCode && !/^[A-Z0-9_-]{3,12}$/i.test(data.institutionCode)) errs.institutionCode = 'Code: 3–12 alphanumeric/dash/underscore'
      req('institutionType','Institution type')
      email('email','Email')
      phone('phoneNumber','Phone number')
      url('website')
      break
    case 2:
      req('country','Country')
      req('state','State')
      req('district','District')
      req('city','City')
      req('fullAddress','Full address')
      req('pincode','Pincode')
      if (data.pincode && !/^\d{5,10}$/.test(data.pincode)) errs.pincode = 'Pincode must be 5–10 digits'
      break
    case 3:
      req('adminName','Admin name')
      if (data.adminName && data.adminName.trim().split(' ').length < 2) errs.adminName = 'Please enter full name (first & last)'
      email('adminEmail','Admin email')
      phone('adminPhone','Admin phone')
      if (!data.autoGeneratePassword) {
        req('password','Password')
        if (data.password && data.password.length < 8) errs.password = 'Password must be at least 8 characters'
        if (data.password && !/(?=.*[A-Z])(?=.*\d)/.test(data.password)) errs.password = 'Must include uppercase letter and number'
        req('confirmPassword','Confirm password')
        if (data.password && data.confirmPassword && data.password !== data.confirmPassword) errs.confirmPassword = 'Passwords do not match'
      }
      break
    case 4:
      req('selectedPlan','Plan')
      req('billingType','Billing type')
      req('startDate','Start date')
      req('endDate','End date')
      if (data.isTrial && !data.trialExpiryDate) errs.trialExpiryDate = 'Trial expiry date is required'
      break
    case 5:
      if (data.selectedModules.length === 0) errs.selectedModules = 'Select at least one module'
      break
    case 6:
      if (data.institutionType === 'School') {
        req('board','Board')
        if (data.classes.length === 0) errs.classes = 'Select at least one class'
      }
      if (data.institutionType === 'Inter College') {
        if (data.classes.length === 0) errs.classes = 'Select at least one class'
      }
      if (data.institutionType === 'Degree College') {
        if (data.yearStructure.length === 0) errs.yearStructure = 'Select at least one year'
      }
      if (data.institutionType === 'Engineering College') {
        if (data.semesters?.length === 0) errs.semesters = 'Select at least one semester'
      }
      req('academicYearFormat','Academic year format')
      break
    case 7:
      req('timezone','Timezone')
      req('currency','Currency')
      req('dateFormat','Date format')
      req('language','Language')
      break
    case 8:
      req('primaryColor','Primary color')
      req('secondaryColor','Secondary color')
      if (data.customDomain && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.customDomain)) errs.customDomain = 'Invalid domain format'
      break
    case 9:
      req('passwordPolicy','Password policy')
      req('sessionTimeoutDuration','Session timeout')
      break
    case 10:
      req('status','Status')
      if (data.status === 'Suspended' && !data.suspensionReason) errs.suspensionReason = 'Suspension reason is required'
      break
  }
  return errs
}

// ─── UI COMPONENTS ───────────────────────────────────────────────────────────
const Field = ({ label, required, error, children }: any) => (
  <div className="mb-3">
    <label className="form-label">
      {label}
      {required && <span className="text-danger ms-1">*</span>}
    </label>
    {children}
    {error && <div className="text-danger small mt-1">{error}</div>}
  </div>
)

const Input = ({ field, formData, update, errors, placeholder, type = 'text' }: any) => (
  <input
    type={type}
    className={`form-control ${errors[field] ? 'is-invalid' : ''}`}
    placeholder={placeholder}
    value={formData[field] || ''}
    onChange={(e) => update(field, e.target.value)}
  />
)

const Select = ({ field, formData, update, errors, options, placeholder }: any) => (
  <select
    className={`form-select ${errors[field] ? 'is-invalid' : ''}`}
    value={formData[field] || ''}
    onChange={(e) => update(field, e.target.value)}
  >
    <option value="">{placeholder}</option>
    {options.map((opt: any) => (
      <option key={opt.value || opt} value={opt.value || opt}>
        {opt.label || opt}
      </option>
    ))}
  </select>
)

const Check = ({ field, formData, update, label }: any) => (
  <div className="form-check">
    <input
      type="checkbox"
      className="form-check-input"
      id={field}
      checked={formData[field] || false}
      onChange={(e) => update(field, e.target.checked)}
    />
    <label className="form-check-label" htmlFor={field}>
      {label}
    </label>
  </div>
)

const ModuleCheck = ({ field, formData, update, label, module }: any) => {
  const isChecked = Array.isArray(formData[field]) ? formData[field].includes(module) : false;
  
  return (
    <div className="form-check">
      <input
        type="checkbox"
        className="form-check-input"
        id={`${field}-${module}`}
        checked={isChecked}
        onChange={(e) => update(field, e.target.checked, module)}
      />
      <label className="form-check-label" htmlFor={`${field}-${module}`}>
        {label}
      </label>
    </div>
  );
}

const SectionHeader = ({ icon, title, desc }: any) => (
  <div className="d-flex align-items-center mb-4">
    <div className="avatar avatar-sm bg-primary-transparent rounded-circle me-3">
      <i className={`${icon} text-primary fs-4`} />
    </div>
    <div>
      <h5 className="mb-1">{title}</h5>
      <p className="text-muted mb-0">{desc}</p>
    </div>
  </div>
)

const ReviewRow = ({ label, value }: any) => (
  <div className="d-flex justify-content-between py-2 border-bottom">
    <span className="text-muted">{label}</span>
    <span className="fw-medium">{value}</span>
  </div>
)

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────
interface InstitutionCreationWizardProps {
  context?: 'superadmin' | 'agent';
  agentId?: string;
  onInstitutionCreated?: (institution: any) => void;
  onError?: (error: string) => void;
  setLoading?: (loading: boolean) => void;
}

const InstitutionCreationWizard: React.FC<InstitutionCreationWizardProps> = ({ 
  context = 'superadmin',
  agentId,
  onInstitutionCreated,
  onError,
  setLoading,
}) => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState(INIT)
  const [errors, setErrors] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const update = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }))
    }
  }

  const goNext = () => {
    const errs = validate(currentStep, formData)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setCurrentStep((prev: number) => Math.min(prev + 1, 11))
  }

  const goPrev = () => {
    setCurrentStep((prev: number) => Math.max(prev - 1, 1))
    setErrors({})
  }

  const handleSubmit = async () => {
    const errs = validate(10, formData)
    if (Object.keys(errs).length > 0) { 
      setErrors(errs)
      toast.error('Please fix validation errors before submitting')
      return 
    }
    
    setIsSubmitting(true)
    
    // Set loading state if parent provided setLoading callback
    if (setLoading) {
      setLoading(true)
    }
    
    try {
      // Create institution via API based on context
      let result;
      if (context === 'agent') {
        result = await institutionService.createAgentInstitution(formData as InstitutionFormData, agentId);
      } else {
        result = await institutionService.createInstitution(formData as InstitutionFormData);
      }
      
      toast.success('Institution added successfully!')
      setSubmitted(true)
      
      if (result) {
        // For agent context, use callback and don't store in localStorage
        if (context === 'agent') {
          if (onInstitutionCreated) {
            onInstitutionCreated(result)
          }
        } else {
          // For superadmin context, keep existing localStorage behavior
          const existingInstitutions = JSON.parse(localStorage.getItem('demo_institutions') || '[]')
          const newInstitution = {
            ...result,
            _id: result._id || `school_${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'Active'
          }
          existingInstitutions.push(newInstitution)
          localStorage.setItem('demo_institutions', JSON.stringify(existingInstitutions))
          
          // Navigate to institutions list to see the created data
          let dashboardRoute = '/super-admin/institutions'
          
          // Show success then navigate
          setTimeout(() => {
            setSubmitted(false)
            setCurrentStep(1)
            setFormData(INIT)
            setErrors({})
            setIsSubmitting(false)
            
            toast.success(`${formData.institutionName || 'Institution'} has been added successfully! Redirecting to institutions list...`)
            navigate(dashboardRoute)
          }, 2000)
        }
      }
    } catch (error: any) {
      console.error('Failed to create institution:', error)
      
      // Handle different types of errors
      let errorMessage = 'Failed to create institution';
      
      if (error.response?.data) {
        // Handle validation errors (400 status)
        if (error.response.data.error?.code === 'VALIDATION_ERROR') {
          const validationErrors = error.response.data.error?.details || [];
          if (validationErrors.length > 0) {
            errorMessage = validationErrors.join(', ');
          } else {
            errorMessage = error.response.data.error?.message || errorMessage;
          }
        } 
        // Handle other API errors
        else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Call error callback for agent context
      if (context === 'agent' && onError) {
        onError(errorMessage)
      } else {
        toast.error(errorMessage)
      }
      
      setIsSubmitting(false);
      setSubmitted(false)
      
      // Clear loading state
      if (setLoading) {
        setLoading(false)
      }
    }
  }

  // ── STEP CONTENT ────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch(currentStep) {

      // ①────────────────────────────────────────────────────────── BASIC INFO
      case 1: return (
        <>
          <SectionHeader icon="ti ti-building" title="Basic Information" desc="Core details about the institution" />
          <div className="row g-3">
            <div className="col-md-6">
              <Field label="Institution Name" required error={errors.institutionName}>
                <Input field="institutionName" formData={formData} update={update} errors={errors} placeholder="e.g. Springfield High School" />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Institution Code" required error={errors.institutionCode}>
                <Input field="institutionCode" formData={formData} update={update} errors={errors} placeholder="e.g. SHS001" />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Institution Type" required error={errors.institutionType}>
                <Select
                  field="institutionType"
                  formData={formData}
                  update={update}
                  errors={errors}
                  placeholder="Select type"
                  options={['School', 'Inter College', 'Degree College', 'Engineering College']}
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Email" required error={errors.email}>
                <Input field="email" formData={formData} update={update} errors={errors} placeholder="institution@example.com" type="email" />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Phone Number" required error={errors.phoneNumber}>
                <Input field="phoneNumber" formData={formData} update={update} errors={errors} placeholder="+1 234 567 8900" />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Website" error={errors.website}>
                <Input field="website" formData={formData} update={update} errors={errors} placeholder="https://www.example.com" />
              </Field>
            </div>
          </div>
        </>
      )

      // ②────────────────────────────────────────────────────────── ADDRESS
      case 2: return (
        <>
          <SectionHeader icon="ti ti-map-pin" title="Address Information" desc="Physical location details" />
          <div className="row g-3">
            <div className="col-md-4">
              <Field label="Country" required error={errors.country}>
                <Select
                  field="country"
                  formData={formData}
                  update={update}
                  errors={errors}
                  placeholder="Select country"
                  options={['United States', 'India', 'United Kingdom', 'Canada', 'Australia']}
                />
              </Field>
            </div>
            <div className="col-md-4">
              <Field label="State" required error={errors.state}>
                <Input field="state" formData={formData} update={update} errors={errors} placeholder="State/Province" />
              </Field>
            </div>
            <div className="col-md-4">
              <Field label="District" required error={errors.district}>
                <Input field="district" formData={formData} update={update} errors={errors} placeholder="District" />
              </Field>
            </div>
            <div className="col-md-4">
              <Field label="City" required error={errors.city}>
                <Input field="city" formData={formData} update={update} errors={errors} placeholder="City" />
              </Field>
            </div>
            <div className="col-md-4">
              <Field label="Area" error={errors.area}>
                <Input field="area" formData={formData} update={update} errors={errors} placeholder="Area/Locality" />
              </Field>
            </div>
            <div className="col-md-4">
              <Field label="Pincode" required error={errors.pincode}>
                <Input field="pincode" formData={formData} update={update} errors={errors} placeholder="123456" />
              </Field>
            </div>
            <div className="col-12">
              <Field label="Full Address" required error={errors.fullAddress}>
                <textarea
                  className={`form-control ${errors.fullAddress ? 'is-invalid' : ''}`}
                  rows={3}
                  placeholder="Complete street address"
                  value={formData.fullAddress || ''}
                  onChange={(e) => update('fullAddress', e.target.value)}
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Google Maps Location" error={errors.googleMapsLocation}>
                <Input field="googleMapsLocation" formData={formData} update={update} errors={errors} placeholder="Google Maps URL" />
              </Field>
            </div>
          </div>
        </>
      )

      // ③────────────────────────────────────────────────────────── ADMIN
      case 3: return (
        <>
          <SectionHeader icon="ti ti-user-shield" title="Administrator Information" desc="Primary admin account details" />
          <div className="row g-3">
            <div className="col-md-6">
              <Field label="Admin Name" required error={errors.adminName}>
                <Input field="adminName" formData={formData} update={update} errors={errors} placeholder="John Doe" />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Admin Email" required error={errors.adminEmail}>
                <Input field="adminEmail" formData={formData} update={update} errors={errors} placeholder="admin@example.com" type="email" />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Admin Phone" required error={errors.adminPhone}>
                <Input field="adminPhone" formData={formData} update={update} errors={errors} placeholder="+1 234 567 8900" />
              </Field>
            </div>
            <div className="col-md-6">
              <Check field="autoGeneratePassword" formData={formData} update={update} label="Auto-generate password" />
            </div>
            {!formData.autoGeneratePassword && (
              <>
                <div className="col-md-6">
                  <Field label="Password" required error={errors.password}>
                    <Input field="password" formData={formData} update={update} errors={errors} placeholder="Min 8 characters" type="password" />
                  </Field>
                </div>
                <div className="col-md-6">
                  <Field label="Confirm Password" required error={errors.confirmPassword}>
                    <Input field="confirmPassword" formData={formData} update={update} errors={errors} placeholder="Re-enter password" type="password" />
                  </Field>
                </div>
              </>
            )}
            <div className="col-md-6">
              <Check field="sendCredentialsByEmail" formData={formData} update={update} label="Send credentials via email" />
            </div>
          </div>
        </>
      )

      // ④────────────────────────────────────────────────────────── PLAN
      case 4: return (
        <>
          <SectionHeader icon="ti ti-crown" title="Subscription Plan" desc="Choose your pricing plan" />
          <div className="row g-3">
            <div className="col-md-6">
              <Field label="Plan" required error={errors.selectedPlan}>
                <Select
                  field="selectedPlan"
                  formData={formData}
                  update={update}
                  errors={errors}
                  placeholder="Select plan"
                  options={['Basic', 'Professional', 'Premium']}
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Billing Type" required error={errors.billingType}>
                <Select
                  field="billingType"
                  formData={formData}
                  update={update}
                  errors={errors}
                  placeholder="Select billing"
                  options={['Monthly', 'Quarterly', 'Annually']}
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Start Date" required error={errors.startDate}>
                <Input field="startDate" formData={formData} update={update} errors={errors} type="date" />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="End Date" required error={errors.endDate}>
                <Input field="endDate" formData={formData} update={update} errors={errors} type="date" />
              </Field>
            </div>
            <div className="col-md-6">
              <Check field="isTrial" formData={formData} update={update} label="Trial Period" />
            </div>
            {formData.isTrial && (
              <div className="col-md-6">
                <Field label="Trial Expiry Date" required error={errors.trialExpiryDate}>
                  <Input field="trialExpiryDate" formData={formData} update={update} errors={errors} type="date" />
                </Field>
              </div>
            )}
          </div>
        </>
      )

      // ⑤────────────────────────────────────────────────────────── MODULES
      case 5: return (
        <>
          <SectionHeader icon="ti ti-puzzle" title="Modules Selection" desc="Choose features you need" />
          <div className="row">
            <div className="col-12">
              <Field label="Select Modules" required error={errors.selectedModules}>
                <div className="row">
                  {[
                    'Student Management', 'Staff Management', 'Attendance', 'Examination',
                    'Library', 'Transport', 'Hostel', 'Finance', 'HR', 'Inventory'
                  ].map((module) => (
                    <div key={module} className="col-md-4 mb-2">
                      <ModuleCheck
                        field="selectedModules"
                        formData={formData}
                        update={(field: string, value: any, moduleName: string) => {
                          const current = (formData.selectedModules as string[]) || []
                          if (value) {
                            setFormData((prev: any) => ({ ...prev, [field]: [...current, moduleName] }))
                          } else {
                            setFormData((prev: any) => ({ ...prev, [field]: current.filter((m: string) => m !== moduleName) }))
                          }
                        }}
                        label={module}
                        module={module}
                      />
                    </div>
                  ))}
                </div>
              </Field>
            </div>
          </div>
        </>
      )

      // ⑥────────────────────────────────────────────────────────── ACADEMIC
      case 6: return (
        <>
          <SectionHeader icon="ti ti-school" title="Academic Settings" desc="Educational configuration" />
          <div className="row g-3">
            {/* Show Board only for School */}
            {formData.institutionType === 'School' && (
              <div className="col-md-6">
                <Field label="Board" required error={errors.board}>
                  <Select
                    field="board"
                    formData={formData}
                    update={update}
                    errors={errors}
                    placeholder="Select board"
                    options={['CBSE', 'ICSE', 'State Board', 'IB', 'Cambridge']}
                  />
                </Field>
              </div>
            )}
            
            {/* Show University Affiliation for Colleges */}
            {(formData.institutionType === 'Inter College' || formData.institutionType === 'Degree College' || formData.institutionType === 'Engineering College') && (
              <div className="col-md-6">
                <Field label="University Affiliation" error={errors.universityAffiliation}>
                  <Input field="universityAffiliation" formData={formData} update={update} errors={errors} placeholder="Affiliated University Name" />
                </Field>
              </div>
            )}

            <div className="col-md-6">
              <Field label="Academic Year Format" required error={errors.academicYearFormat}>
                <Select
                  field="academicYearFormat"
                  formData={formData}
                  update={update}
                  errors={errors}
                  placeholder="Select format"
                  options={['YYYY-YY', 'YYYY-YYYY']}
                />
              </Field>
            </div>

            {/* SCHOOL: Classes 1-10 + LKG, UKG */}
            {formData.institutionType === 'School' && (
              <div className="col-12">
                <Field label="Classes" required error={errors.classes}>
                  <div className="row">
                    {['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((cls) => (
                      <div key={cls} className="col-md-2 mb-2">
                        <ModuleCheck
                          field="classes"
                          formData={formData}
                          update={(field: string, value: any, className: string) => {
                            const current = (formData.classes as string[]) || []
                            if (value) {
                              setFormData((prev: any) => ({ ...prev, [field]: [...current, className] }))
                            } else {
                              setFormData((prev: any) => ({ ...prev, [field]: current.filter((c: string) => c !== className) }))
                            }
                          }}
                          label={cls === 'LKG' || cls === 'UKG' ? cls : `Class ${cls}`}
                          module={cls}
                        />
                      </div>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {/* INTER COLLEGE: Classes 11, 12 with Streams */}
            {formData.institutionType === 'Inter College' && (
              <>
                <div className="col-12">
                  <Field label="Classes" required error={errors.classes}>
                    <div className="row">
                      {['11', '12'].map((cls) => (
                        <div key={cls} className="col-md-3 mb-2">
                          <ModuleCheck
                            field="classes"
                            formData={formData}
                            update={(field: string, value: any, className: string) => {
                              const current = (formData.classes as string[]) || []
                              if (value) {
                                setFormData((prev: any) => ({ ...prev, [field]: [...current, className] }))
                              } else {
                                setFormData((prev: any) => ({ ...prev, [field]: current.filter((c: string) => c !== className) }))
                              }
                            }}
                            label={`Class ${cls}`}
                            module={cls}
                          />
                        </div>
                      ))}
                    </div>
                  </Field>
                </div>
                <div className="col-12">
                  <Field label="Streams" error={errors.streams}>
                    <div className="row">
                      {['MPC', 'BIPC', 'CEC', 'MEC', 'Arts', 'Commerce'].map((stream) => (
                        <div key={stream} className="col-md-3 mb-2">
                          <ModuleCheck
                            field="streams"
                            formData={formData}
                            update={(field: string, value: any, streamName: string) => {
                              const current = (formData.streams as string[]) || []
                              if (value) {
                                setFormData((prev: any) => ({ ...prev, [field]: [...current, streamName] }))
                              } else {
                                setFormData((prev: any) => ({ ...prev, [field]: current.filter((s: string) => s !== streamName) }))
                              }
                            }}
                            label={stream}
                            module={stream}
                          />
                        </div>
                      ))}
                    </div>
                  </Field>
                </div>
              </>
            )}

            {/* DEGREE COLLEGE: Years and Branches */}
            {formData.institutionType === 'Degree College' && (
              <>
                <div className="col-12">
                  <Field label="Years" required error={errors.yearStructure}>
                    <div className="row">
                      {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((year) => (
                        <div key={year} className="col-md-3 mb-2">
                          <ModuleCheck
                            field="yearStructure"
                            formData={formData}
                            update={(field: string, value: any, yearName: string) => {
                              const current = (formData.yearStructure as string[]) || []
                              if (value) {
                                setFormData((prev: any) => ({ ...prev, [field]: [...current, yearName] }))
                              } else {
                                setFormData((prev: any) => ({ ...prev, [field]: current.filter((y: string) => y !== yearName) }))
                              }
                            }}
                            label={year}
                            module={year}
                          />
                        </div>
                      ))}
                    </div>
                  </Field>
                </div>
                <div className="col-12">
                  <Field label="Branches" error={errors.departments}>
                    <div className="row">
                      {['B.Sc', 'B.Com', 'B.A', 'BBA', 'BCA', 'M.Sc', 'M.Com', 'M.A'].map((branch) => (
                        <div key={branch} className="col-md-3 mb-2">
                          <ModuleCheck
                            field="departments"
                            formData={formData}
                            update={(field: string, value: any, deptName: string) => {
                              const current = (formData.departments as string[]) || []
                              if (value) {
                                setFormData((prev: any) => ({ ...prev, [field]: [...current, deptName] }))
                              } else {
                                setFormData((prev: any) => ({ ...prev, [field]: current.filter((d: string) => d !== deptName) }))
                              }
                            }}
                            label={branch}
                            module={branch}
                          />
                        </div>
                      ))}
                    </div>
                  </Field>
                </div>
              </>
            )}

            {/* ENGINEERING COLLEGE: Semesters and 4 Years */}
            {formData.institutionType === 'Engineering College' && (
              <>
                <div className="col-12">
                  <Field label="Duration" required>
                    <div className="alert alert-info">
                      <i className="ti ti-info-circle me-2"></i>
                      Engineering College is typically a 4-year program with 8 semesters
                    </div>
                  </Field>
                </div>
                <div className="col-12">
                  <Field label="Semesters" required error={errors.semesterSystem}>
                    <div className="row">
                      {['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester'].map((sem) => (
                        <div key={sem} className="col-md-3 mb-2">
                          <ModuleCheck
                            field="semesters"
                            formData={formData}
                            update={(field: string, value: any, semName: string) => {
                              const current = (formData.semesters as string[]) || []
                              if (value) {
                                setFormData((prev: any) => ({ ...prev, [field]: [...current, semName] }))
                              } else {
                                setFormData((prev: any) => ({ ...prev, [field]: current.filter((s: string) => s !== semName) }))
                              }
                            }}
                            label={sem}
                            module={sem}
                          />
                        </div>
                      ))}
                    </div>
                  </Field>
                </div>
                <div className="col-12">
                  <Field label="Engineering Branches" error={errors.departments}>
                    <div className="row">
                      {['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'CSE-AI', 'CSE-DS', 'Data Science', 'Artificial Intelligence'].map((branch) => (
                        <div key={branch} className="col-md-3 mb-2">
                          <ModuleCheck
                            field="departments"
                            formData={formData}
                            update={(field: string, value: any, deptName: string) => {
                              const current = (formData.departments as string[]) || []
                              if (value) {
                                setFormData((prev: any) => ({ ...prev, [field]: [...current, deptName] }))
                              } else {
                                setFormData((prev: any) => ({ ...prev, [field]: current.filter((d: string) => d !== deptName) }))
                              }
                            }}
                            label={branch}
                            module={branch}
                          />
                        </div>
                      ))}
                    </div>
                  </Field>
                </div>
              </>
            )}
          </div>
        </>
      )

      // ⑦────────────────────────────────────────────────────────── SYSTEM
      case 7: return (
        <>
          <SectionHeader icon="ti ti-settings" title="System Settings" desc="Platform configuration" />
          <div className="row g-3">
            <div className="col-md-6">
              <Field label="Timezone" required error={errors.timezone}>
                <Select
                  field="timezone"
                  formData={formData}
                  update={update}
                  errors={errors}
                  placeholder="Select timezone"
                  options={['UTC', 'Asia/Kolkata', 'America/New_York', 'Europe/London']}
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Currency" required error={errors.currency}>
                <Select
                  field="currency"
                  formData={formData}
                  update={update}
                  errors={errors}
                  placeholder="Select currency"
                  options={['USD', 'INR', 'EUR', 'GBP']}
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Date Format" required error={errors.dateFormat}>
                <Select
                  field="dateFormat"
                  formData={formData}
                  update={update}
                  errors={errors}
                  placeholder="Select format"
                  options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']}
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Language" required error={errors.language}>
                <Select
                  field="language"
                  formData={formData}
                  update={update}
                  errors={errors}
                  placeholder="Select language"
                  options={['English', 'Spanish', 'French', 'German']}
                />
              </Field>
            </div>
          </div>
        </>
      )

      // ⑧────────────────────────────────────────────────────────── BRANDING
      case 8: return (
        <>
          <SectionHeader icon="ti ti-palette" title="Branding" desc="Customize appearance" />
          <div className="row g-3">
            <div className="col-md-6">
              <Field label="Primary Color" required error={errors.primaryColor}>
                <Input field="primaryColor" formData={formData} update={update} errors={errors} placeholder="#6366f1" />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Secondary Color" required error={errors.secondaryColor}>
                <Input field="secondaryColor" formData={formData} update={update} errors={errors} placeholder="#10b981" />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Custom Domain" error={errors.customDomain}>
                <Input field="customDomain" formData={formData} update={update} errors={errors} placeholder="school.example.com" />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Subdomain" error={errors.subdomain}>
                <Input field="subdomain" formData={formData} update={update} errors={errors} placeholder="myschool" />
              </Field>
            </div>
          </div>
        </>
      )

      // ⑨────────────────────────────────────────────────────────── SECURITY
      case 9: return (
        <>
          <SectionHeader icon="ti ti-shield-lock" title="Security Settings" desc="Access and authentication" />
          <div className="row g-3">
            <div className="col-md-6">
              <Field label="Password Policy" required error={errors.passwordPolicy}>
                <Select
                  field="passwordPolicy"
                  formData={formData}
                  update={update}
                  errors={errors}
                  placeholder="Select policy"
                  options={['Weak', 'Medium', 'Strong']}
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Session Timeout (minutes)" required error={errors.sessionTimeoutDuration}>
                <Input field="sessionTimeoutDuration" formData={formData} update={update} errors={errors} placeholder="30" type="number" />
              </Field>
            </div>
            <div className="col-md-6">
              <Check field="allowStudentLogin" formData={formData} update={update} label="Allow Student Login" />
            </div>
            <div className="col-md-6">
              <Check field="allowParentLogin" formData={formData} update={update} label="Allow Parent Login" />
            </div>
            <div className="col-md-6">
              <Check field="require2FA" formData={formData} update={update} label="Require Two-Factor Authentication" />
            </div>
          </div>
        </>
      )

      // ⑩────────────────────────────────────────────────────────── STATUS
      case 10: return (
        <>
          <SectionHeader icon="ti ti-toggle-right" title="Final Status" desc="Set institution status" />
          <div className="row g-3">
            <div className="col-md-6">
              <Field label="Status" required error={errors.status}>
                <Select
                  field="status"
                  formData={formData}
                  update={update}
                  errors={errors}
                  placeholder="Select status"
                  options={['Active', 'Suspended', 'Inactive']}
                />
              </Field>
            </div>
            {formData.status === 'Suspended' && (
              <div className="col-md-6">
                <Field label="Suspension Reason" required error={errors.suspensionReason}>
                  <Input field="suspensionReason" formData={formData} update={update} errors={errors} placeholder="Reason for suspension" />
                </Field>
              </div>
            )}
            <div className="col-md-6">
              <Check field="allowImpersonation" formData={formData} update={update} label="Allow Super Admin Impersonation" />
            </div>
            <div className="col-md-6">
              <Check field="allowAPIAccess" formData={formData} update={update} label="Allow API Access" />
            </div>
          </div>
        </>
      )

      // ⑪────────────────────────────────────────────────────────── REVIEW
      case 11: return (
        <>
          <SectionHeader icon="ti ti-clipboard-check" title="Review & Submit" desc="Confirm all details before creating" />
          <div className="row">
            <div className="col-md-6">
              <h6 className="mb-3">Basic Information</h6>
              <ReviewRow label="Institution Name" value={formData.institutionName} />
              <ReviewRow label="Institution Code" value={formData.institutionCode} />
              <ReviewRow label="Type" value={formData.institutionType} />
              <ReviewRow label="Email" value={formData.email} />
              <ReviewRow label="Phone" value={formData.phoneNumber} />
            </div>
            <div className="col-md-6">
              <h6 className="mb-3">Plan & Billing</h6>
              <ReviewRow label="Plan" value={formData.selectedPlan} />
              <ReviewRow label="Billing Type" value={formData.billingType} />
              <ReviewRow label="Start Date" value={formData.startDate} />
              <ReviewRow label="End Date" value={formData.endDate} />
              <ReviewRow label="Status" value={formData.status} />
            </div>
          </div>
          <div className="row mt-4">
            <div className="col-12">
              <div className="alert alert-info">
                <i className="ti ti-info-circle me-2"></i>
                Please review all information carefully. Once submitted, the institution will be created and cannot be deleted without admin intervention.
              </div>
            </div>
          </div>
        </>
      )
    }
  }

  const errCount = Object.keys(errors).length

  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Create New Institution</h4>
            </div>
            <div className="card-body">
              {/* ── WIZARD HEADER ── */}
              <div className="wizard-header mb-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="mb-0">Institution Setup Wizard</h5>
                  <span className="badge bg-primary">Step {currentStep} of 11</span>
                </div>
                <div className="d-flex align-items-center">
                  {STEPS.map((s) => {
                    const active = s.id === currentStep
                    const done = s.id < currentStep
                    return (
                      <div key={s.id} className="d-flex align-items-center">
                        <div
                          className={`avatar avatar-sm rounded-circle d-flex align-items-center justify-content-center ${
                            active ? 'bg-primary' : done ? 'bg-success' : 'bg-light'
                          }`}
                        >
                          <i className={`${s.icon} ${active || done ? 'text-white' : 'text-muted'} fs-4`} />
                        </div>
                        <div className="mx-2">
                          <div style={{fontSize:9,fontWeight: active?700:400, color: active?'#6366f1':done?'#10b981':'#94a3b8', whiteSpace:'nowrap'}}>
                            {s.label}
                          </div>
                        </div>
                        {s.id < 11 && <div className="mx-2 text-muted">→</div>}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── WIZARD BODY ── */}
              <div className="wizard-body">
                {/* Validation error summary */}
                {errCount > 0 && (
                  <div className="alert border-danger bg-danger-transparent d-flex align-items-center mb-4" role="alert">
                    <i className="ti ti-alert-triangle text-danger fs-18 me-2 flex-shrink-0" />
                    <div>
                      <strong className="text-danger">Please fix {errCount} error{errCount>1?'s':''} before continuing</strong>
                      <ul className="mb-0 mt-1 ps-3" style={{fontSize:12}}>
                        {Object.entries(errors).map(([key, value]: [string, any], _i: number) => (
                          <li key={key}>{value}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {submitted ? (
                  <div className="text-center py-5">
                    <div className="avatar avatar-xl bg-success-transparent rounded-circle mb-3 mx-auto">
                      <i className="ti ti-check fs-36 text-success" />
                    </div>
                    <h4 className="text-success fw-bold mb-1">Institution Created!</h4>
                    <p className="text-muted">Setting up your institution…</p>
                    <div className="progress mx-auto mt-3" style={{height:4,width:200}}>
                      <div className="progress-bar bg-success progress-bar-animated progress-bar-striped" style={{width:'100%'}} />
                    </div>
                  </div>
                ) : renderStep()}
              </div>

              {/* ── WIZARD FOOTER ── */}
              {!submitted && (
                <div className="wizard-footer mt-4 pt-3 border-top d-flex justify-content-between">
                  <div className="d-flex gap-2">
                    <button className="btn btn-light" onClick={() => window.history.back()}>
                      <i className="ti ti-x me-1" />Cancel
                    </button>
                    <button className="btn btn-outline-secondary" onClick={goPrev} disabled={currentStep===1}>
                      <i className="ti ti-chevron-left me-1" />Previous
                    </button>
                  </div>

                  <div className="d-flex align-items-center gap-3">
                    
                    <span className="text-muted" style={{fontSize:12}}>
                      {currentStep} / 11 steps
                    </span>
                    {currentStep === 11 ? (
                      <button className="btn btn-success d-flex align-items-center" onClick={handleSubmit} disabled={isSubmitting}>
                        <i className="ti ti-building-plus me-2" />Create Institution
                      </button>
                    ) : (
                      <button className="btn btn-primary d-flex align-items-center" onClick={goNext}>
                        Next<i className="ti ti-chevron-right ms-2" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstitutionCreationWizard
