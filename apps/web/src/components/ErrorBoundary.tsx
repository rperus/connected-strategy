import React, { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[CS ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', padding: 40,
        }}>
          <div style={{
            maxWidth: 480, textAlign: 'center',
            background: 'var(--cs-surface)', borderRadius: 12, padding: 40,
            border: '1px solid rgba(239,68,68,0.3)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
            <h2 style={{ color: '#ef4444', marginBottom: 8, fontSize: 18 }}>Algo salió mal</h2>
            <p style={{ color: 'var(--cs-text-muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
              {this.state.error?.message ?? 'Error desconocido'}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              ↻ Recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
