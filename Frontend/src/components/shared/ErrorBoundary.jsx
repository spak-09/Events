import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 rounded-3xl bg-destructive/10 text-destructive mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">Something went wrong</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <Button
            size="sm"
            onClick={this.handleReset}
            className="mt-6 gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
