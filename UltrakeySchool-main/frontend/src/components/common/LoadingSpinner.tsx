import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullPage?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  overlay?: boolean;
  progress?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  fullPage = false,
  variant = 'primary',
  overlay = false,
  progress
}) => {
  const sizeClass = `spinner-${size}`;
  const variantClass = `spinner-${variant}`;
  
  const spinner = (
    <div className={`loading-container ${overlay ? 'loading-overlay' : ''}`}>
      <div className={`spinner-border ${sizeClass} ${variantClass}`} role="status">
        {progress !== undefined && (
          <div className="spinner-progress">
            <div 
              className="spinner-progress-bar" 
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && (
        <div className="loading-message-container">
          <p className="loading-message">{message}</p>
          {progress !== undefined && (
            <span className="loading-progress-text">{progress}%</span>
          )}
        </div>
      )}
    </div>
  );

  if (fullPage) {
    return <div className="loading-full-page">{spinner}</div>;
  }

  return spinner;
};

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  variant?: 'primary' | 'secondary' | 'warning' | 'danger';
  icon?: string;
  title?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry, 
  variant = 'danger',
  icon = 'ti ti-alert-circle',
  title = 'Error'
}) => {
  return (
    <div className="error-container">
      <div className="error-content">
        <div className="error-header">
          <i className={icon}></i>
          <h5>{title}</h5>
        </div>
        <div className="error-body">
          <p>{message}</p>
          {onRetry && (
            <button className={`btn btn-${variant}`} onClick={onRetry}>
              <i className="ti ti-refresh me-1"></i>
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  };
  variant?: 'primary' | 'secondary' | 'info' | 'warning';
  illustration?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data',
  message = 'There is no data to display',
  icon,
  action,
  variant = 'info',
  illustration
}) => {
  const variantClass = `empty-state-${variant}`;
  
  return (
    <div className={`empty-state-container ${variantClass}`}>
      <div className="empty-state-content">
        {illustration && (
          <div className="empty-state-illustration">
            <img src={illustration} alt="Empty state illustration" />
          </div>
        )}
        {icon && <div className="empty-state-icon">{icon}</div>}
        <div className="empty-state-text">
          <h5>{title}</h5>
          <p>{message}</p>
        </div>
        {action && (
          <div className="empty-state-action">
            <button 
              className={`btn btn-${action.variant || 'primary'}`} 
              onClick={action.onClick}
            >
              <i className="ti ti-plus me-1"></i>
              {action.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Loading Component
export const EnhancedLoading: React.FC<{message?: string; size?: 'small' | 'medium' | 'large'; className?: string}> = ({
  message = 'Loading...',
  className = ''
}) => {
  return (
    <div className={`enhanced-loading ${className}`}>
      <div className="enhanced-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {message && <p className="enhanced-loading-message">{message}</p>}
    </div>
  );
};

// Skeleton Loading Component
export const SkeletonLoader: React.FC<{lines?: number; height?: number}> = ({
  lines = 3,
  height = 20
}) => {
  return (
    <div className="skeleton-loader">
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index} 
          className="skeleton-line" 
          style={{ height: `${height}px` }}
        ></div>
      ))}
    </div>
  );
};

export default LoadingSpinner;
