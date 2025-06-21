import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '3rem',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            maxWidth: '600px'
          }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
              🚨 Oops! Có lỗi xảy ra
            </h1>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
              Ứng dụng đã gặp lỗi không mong muốn. Vui lòng tải lại trang hoặc liên hệ hỗ trợ.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                fontSize: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(238, 90, 36, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              🔄 Tải lại trang
            </button>
            
            {process.env.NODE_ENV === 'development' && (
              <details style={{ 
                marginTop: '2rem', 
                textAlign: 'left',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '1rem',
                borderRadius: '10px'
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>
                  Chi tiết lỗi (Development)
                </summary>
                <pre style={{ 
                  fontSize: '0.8rem', 
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
