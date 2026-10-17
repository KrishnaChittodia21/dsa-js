import { Component } from 'react';
import { useLocation } from 'react-router-dom';

class Boundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (this.state.error) {
      return (
        <div className="page">
          <div className="callout callout-danger">
            <div className="callout-title">This page didn&apos;t load.</div>
            <p className="small">The first line of the error usually tells you why:</p>
            <pre className="mono small" style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error?.message || this.state.error)}</pre>
            <button type="button" className="btn btn-sm" onClick={() => this.setState({ error: null })}>
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Resets automatically when the route changes.
export default function ErrorBoundary({ children }) {
  const location = useLocation();
  return <Boundary resetKey={location.pathname}>{children}</Boundary>;
}
