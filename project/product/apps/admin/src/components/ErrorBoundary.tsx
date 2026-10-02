import { Component, ErrorInfo, ReactNode } from 'react';

interface State { has_error: boolean; error?: Error; }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { has_error: false };
  static getDerivedStateFromError(error: Error): State { return { has_error: true, error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Render error', error, info);
  }
  render() {
    if (this.state.has_error) {
      return (
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-2">The screen you were viewing crashed. Your data is safe.</p>
          <pre className="text-xs bg-gray-50 p-2 overflow-x-auto mb-3">{this.state.error?.message}</pre>
          <button onClick={() => this.setState({ has_error: false })} className="px-4 py-2 bg-primary-600 text-white rounded">Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
