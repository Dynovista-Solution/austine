import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('=== APP CRASH DETECTED ===')
    console.error('Error:', error)
    console.error('Error name:', error?.name)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    console.error('Component stack:', errorInfo?.componentStack)
    console.error('==========================')
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
          <h1 style={{ fontSize: 20, marginBottom: 12, color: '#dc2626' }}>Something went wrong.</h1>
          <div style={{ background: '#fee', padding: 12, borderRadius: 4, marginBottom: 12, fontSize: 13, fontFamily: 'monospace' }}>
            <div><strong>Error:</strong> {String(this.state.error?.message || this.state.error)}</div>
            {this.state.error?.stack && (
              <details style={{ marginTop: 8 }}>
                <summary style={{ cursor: 'pointer', color: '#b91c1c' }}>Stack trace</summary>
                <pre style={{ marginTop: 8, fontSize: 11, overflow: 'auto', maxHeight: 200 }}>
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
          <p style={{ marginTop: 12, fontSize: 14, color: '#666' }}>
            📋 Please copy the error details above and share them.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Reload Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
