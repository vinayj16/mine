import { Fragment, useState } from 'react'
import type { StudentProfile } from '../../data/students'

type StudentSidebarProps = {
  profile: StudentProfile
  onAddFees?: () => void
}

const StudentSidebar = ({ profile, onAddFees }: StudentSidebarProps) => {
  const [activeTab, setActiveTab] = useState<'hostel' | 'transportation'>('hostel')
  const avatar = profile.avatar || '/assets/img/students/student-default.jpg'
  const basicInfo = profile.basicInfo || []
  const primaryContact = profile.primaryContact || { phone: '-', email: '-' }
  const siblings = profile.siblings || []
  const hostel = profile.hostel
  const transport = profile.transport

  const handleTabClick = (tab: 'hostel' | 'transportation') => {
    setActiveTab(tab)
  }
  return (
    <>
      <div className="card border-white">
        <div className="card-header">
          <div className="d-flex align-items-center flex-wrap row-gap-3">
            <div className="d-flex align-items-center justify-content-center avatar avatar-xxl border border-dashed me-2 flex-shrink-0 text-dark frames">
              <img src={avatar} className="img-fluid" alt={profile.name} />
            </div>
            <div className="overflow-hidden">
              <span className={`badge badge-soft-${profile.status === 'Active' ? 'success' : 'danger'} d-inline-flex align-items-center mb-1`}>
                <i className="ti ti-circle-filled fs-5 me-1" />
                {profile.status}
              </span>
              <h5 className="mb-1 text-truncate">{profile.name}</h5>
              <p className="text-primary">{profile.admissionNo}</p>
            </div>
          </div>
        </div>

        <div className="card-body">
          <h5 className="mb-3">Basic Information</h5>
          <dl className="row mb-0">
            <dt className="col-6 fw-medium text-dark mb-3">Roll No</dt>
            <dd className="col-6 mb-3">{profile.rollNo}</dd>
            {basicInfo.map((item) => (
              <Fragment key={item.label}>
                <dt className="col-6 fw-medium text-dark mb-3">{item.label}</dt>
                <dd className="col-6 mb-3">{item.value}</dd>
              </Fragment>
            ))}
          </dl>
          <button className="btn btn-primary btn-sm w-100" type="button" onClick={onAddFees}>
            Add Fees
          </button>
        </div>
      </div>

      <div className="card border-white">
        <div className="card-body">
          <h5 className="mb-3">Primary Contact Info</h5>
          <SidebarContactRow icon="ti ti-phone" title="Phone Number" value={primaryContact.phone || '-'} />
          <SidebarContactRow icon="ti ti-mail" title="Email Address" value={primaryContact.email || '-'} />
        </div>
      </div>

      <div className="card border-white">
        <div className="card-body">
          <h5 className="mb-3">Sibling Information</h5>
          {siblings.length === 0 ? (
            <p className="text-muted mb-0">No sibling details available.</p>
          ) : siblings.map((sibling) => (
            <div className="d-flex align-items-center bg-light-300 rounded p-3 mb-3" key={sibling.name}>
              <span className="avatar avatar-lg">
                <img src={sibling.avatar || '/assets/img/students/student-default.jpg'} className="img-fluid rounded" alt={sibling.name} />
              </span>
              <div className="ms-2">
                <h5 className="fs-14 mb-0">{sibling.name}</h5>
                <p className="mb-0">{sibling.classLabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card border-white">
        <div className="card-body pb-1">
          <ul className="nav nav-tabs nav-tabs-bottom mb-3">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'hostel' ? 'active' : ''}`} 
                type="button"
                onClick={() => handleTabClick('hostel')}
              >
                Hostel
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'transportation' ? 'active' : ''}`} 
                type="button"
                onClick={() => handleTabClick('transportation')}
              >
                Transportation
              </button>
            </li>
          </ul>
          <div>
            {activeTab === 'hostel' && (
              hostel ? (
                <div className="d-flex align-items-center mb-3">
                  <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                    <i className="ti ti-building-fortress fs-16" />
                  </span>
                  <div>
                    <h6 className="fs-14 mb-1">{hostel.name || '-'}</h6>
                    <p className="text-primary mb-0">{hostel.room || '-'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted mb-3">No hostel details available.</p>
              )
            )}
            {activeTab === 'transportation' && (
              transport ? (
              <>
                <div className="d-flex align-items-center mb-3">
                  <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                    <i className="ti ti-bus fs-16" />
                  </span>
                  <div>
                    <span className="fs-12 mb-1 d-block">Route</span>
                    <p className="mb-0">{transport.route || '-'}</p>
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-6">
                    <div className="mb-3">
                      <span className="fs-12 mb-1 d-block">Bus Number</span>
                      <p className="mb-0">{transport.busNumber || '-'}</p>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="mb-3">
                      <span className="fs-12 mb-1 d-block">Pickup Point</span>
                      <p className="mb-0">{transport.pickupPoint || '-'}</p>
                    </div>
                  </div>
                </div>
              </>
              ) : (
                <p className="text-muted mb-3">No transportation details available.</p>
              )
            )}
          </div>
        </div>
      </div>
    </>
  )
}

const SidebarContactRow = ({ icon, title, value }: { icon: string; title: string; value: string }) => (
  <div className="d-flex align-items-center mb-3">
    <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
      <i className={icon} />
    </span>
    <div>
      <span className="text-dark fw-medium mb-1 d-block">{title}</span>
      <p className="mb-0">{value}</p>
    </div>
  </div>
)

export default StudentSidebar
