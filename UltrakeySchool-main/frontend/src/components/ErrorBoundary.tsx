import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="d-flex align-items-center justify-content-center vh-100">
          <div className="card text-center p-5" style={{ maxWidth: '500px' }}>
            <div className="card-body">
              <div className="mb-4">
                <i className="ti ti-alert-triangle fs-1 text-danger mb-3"></i>
              </div>
              <h4 className="mb-3">Something went wrong</h4>
              <p className="text-muted mb-4">
                An unexpected error occurred. Please refresh the page and try again.
              </p>
              <div className="d-flex gap-2 justify-content-center">
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.reload()}
                >
                  <i className="ti ti-refresh me-2"></i>
                  Refresh Page
                </button>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => this.setState({ hasError: false })}
                >
                  <i className="ti ti-home me-2"></i>
                  Go to Dashboard
                </button>
              </div>
              
              {import.meta.env.DEV && this.state.error && (
                <div className="mt-4">
                  <details className="text-start">
                    <summary className="cursor-pointer text-muted">
                      <small>Error Details (Development Only)</small>
                    </summary>
                    <pre className="text-start mt-2 p-3 bg-light rounded">
                      <code>{this.state.error.toString()}</code>
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
