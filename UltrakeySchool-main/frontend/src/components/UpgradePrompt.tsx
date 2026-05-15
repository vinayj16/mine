import React from 'react'
import { getUpgradeMessage } from '../utils/permissions'

interface UpgradePromptProps {
  moduleKey: string
  currentPlan: string
  message?: string
  onUpgrade?: () => void
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ 
  moduleKey, 
  currentPlan, 
  message, 
  onUpgrade 
}) => {
  const upgradeMessage = message || getUpgradeMessage(moduleKey, currentPlan)
  
  return (
    <div className="alert alert-warning d-flex align-items-center justify-content-between" role="alert">
      <div className="d-flex align-items-center">
        <i className="ti ti-lock me-2"></i>
        <div>
          <strong>Upgrade Required</strong>
          <div className="text-muted small">{upgradeMessage}</div>
        </div>
      </div>
      {onUpgrade && (
        <button 
          className="btn btn-sm btn-warning ms-3"
          onClick={onUpgrade}
        >
          Upgrade Now
        </button>
      )}
    </div>
  )
}

export default UpgradePrompt
