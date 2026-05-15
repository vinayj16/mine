export type TopStatCardProps = {
  label: string
  value: string
  delta: string
  deltaTone: string
  icon: string
  active: string
  inactive: string
  avatarTone: string
}

const TopStatCard = ({ label, value, delta, deltaTone, icon, active, inactive, avatarTone }: TopStatCardProps) => {
  return (
    <div className="col-xxl-3 col-xl-4 col-sm-6 d-flex">
      <div className="card flex-fill animate-card border-0">
        <div className="card-body">
          <div className="d-flex align-items-center">
            <div className={`avatar avatar-xl ${avatarTone} me-2 p-1 flex-shrink-0`}>
              <img src={icon} alt={label} />
            </div>
            <div className="overflow-hidden flex-fill">
              <div className="d-flex align-items-center justify-content-between">
                <h4 className="counter mb-0">{value}</h4>
                <span className={`badge ${deltaTone}`} style={{ fontSize: 10 }}>{delta}</span>
              </div>
              <p className="mb-0" style={{ fontSize: 12 }}>{label}</p>
              <small className="text-muted">Active: {active} | Inactive: {inactive}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopStatCard
