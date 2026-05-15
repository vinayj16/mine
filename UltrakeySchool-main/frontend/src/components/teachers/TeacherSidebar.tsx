import type { TeacherProfile } from '../../data/teachers'

type TeacherSidebarProps = {
  profile: TeacherProfile
}

const TeacherSidebar = ({ profile }: TeacherSidebarProps) => {
  const { name, id, joinedOn, avatar, basicInfo, contact, panNumber, hostel, transport } = profile

  return (
    <>
      <div className="card border-white">
        <div className="card-header">
          <div className="d-flex align-items-center flex-wrap row-gap-3">
            <div className="d-flex align-items-center justify-content-center avatar avatar-xxl border border-dashed me-2 flex-shrink-0">
              <img src={avatar} className="img-fluid rounded-circle" alt={name} />
            </div>
            <div>
              <h5 className="mb-1 text-truncate">{name}</h5>
              <p className="text-primary mb-1">{id}</p>
              <p className="mb-0">Joined : {joinedOn}</p>
            </div>
          </div>
        </div>
        <div className="card-body">
          <h5 className="mb-3">Basic Information</h5>
          <dl className="row mb-0">
            {basicInfo.map((info) => (
              <FragmentRow key={info.label} label={info.label} value={info.value} />
            ))}
          </dl>
        </div>
      </div>

      <div className="card border-white">
        <div className="card-body">
          <h5 className="mb-3">Primary Contact Info</h5>
          <ContactRow icon="ti ti-phone" title="Phone Number" value={contact.phone} />
          <ContactRow icon="ti ti-mail" title="Email Address" value={contact.email} />
        </div>
      </div>

      <div className="card border-white">
        <div className="card-body pb-1">
          <h5 className="mb-3">PAN Number / ID Number</h5>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center mb-3">
              <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                <i className="ti ti-id" />
              </span>
              <div>
                <p className="text-dark mb-0">{panNumber}</p>
              </div>
            </div>
            <button className="btn btn-primary btn-icon btn-sm mb-3" type="button" aria-label="Copy">
              <i className="ti ti-copy" />
            </button>
          </div>
        </div>
      </div>

      <div className="card border-white">
        <div className="card-body pb-1">
          <ul className="nav nav-tabs nav-tabs-bottom mb-3">
            <li className="nav-item">
              <button className="nav-link active" type="button">
                Hostel
              </button>
            </li>
            <li className="nav-item">
              <button className="nav-link" type="button">
                Transportation
              </button>
            </li>
          </ul>
          <div className="d-flex align-items-center mb-3">
            <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
              <i className="ti ti-building-fortress fs-16" />
            </span>
            <div>
              <h6 className="mb-1">{hostel.name}</h6>
              <p className="text-primary mb-0">{hostel.room}</p>
            </div>
          </div>
          <div className="d-flex align-items-center mb-3">
            <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
              <i className="ti ti-bus fs-16" />
            </span>
            <div>
              <span className="fs-12 mb-1 d-block">Route</span>
              <p className="text-dark mb-0">{transport.route}</p>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-6">
              <div className="mb-3">
                <span className="fs-12 mb-1 d-block">Bus Number</span>
                <p className="text-dark mb-0">{transport.busNumber}</p>
              </div>
            </div>
            <div className="col-sm-6">
              <div className="mb-3">
                <span className="fs-12 mb-1 d-block">Pickup Point</span>
                <p className="text-dark mb-0">{transport.pickupPoint}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const FragmentRow = ({ label, value }: { label: string; value: string }) => (
  <>
    <dt className="col-6 fw-medium text-dark mb-3">{label}</dt>
    <dd className="col-6 mb-3">{value}</dd>
  </>
)

const ContactRow = ({ icon, title, value }: { icon: string; title: string; value: string }) => (
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

export default TeacherSidebar