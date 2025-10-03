import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in component tree:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="mt-8 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center max-w-3xl mx-auto" role="alert">
          <strong className="font-bold">Something went wrong</strong>
          <p className="mt-2">
            A critical error occurred while displaying the results. This can happen with very large sitemaps or if the data returned from the AI is malformed.
          </p>
          <p className="mt-1 text-sm text-red-400">
             Please try analyzing again. If the problem persists, check the console for more details.
          </p>
          {this.state.error && (
            <pre className="mt-4 text-left text-xs bg-black/30 p-2 rounded overflow-auto">
                <code>{this.state.error.name}: {this.state.error.message}</code>
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}