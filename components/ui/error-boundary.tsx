"use client"

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo;
  resetError: () => void;
  showDetails?: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console for development
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  errorInfo, 
  resetError, 
  showDetails = false 
}) => {
  const [showErrorDetails, setShowErrorDetails] = React.useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="max-w-lg w-full p-6 text-center">
        <div className="mb-4">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We're sorry, but something unexpected happened. Please try refreshing the page or go back to the home page.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <Button onClick={resetError} className="w-full" variant="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Button 
            onClick={() => window.location.href = '/'} 
            className="w-full" 
            variant="outline"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Home
          </Button>

          {showDetails && (
            <Button
              onClick={() => setShowErrorDetails(!showErrorDetails)}
              variant="ghost"
              className="w-full text-sm"
            >
              {showErrorDetails ? 'Hide' : 'Show'} Error Details
            </Button>
          )}
        </div>

        {showDetails && showErrorDetails && (
          <div className="text-left bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <h3 className="font-semibold text-sm mb-2">Error Details:</h3>
            <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-40 whitespace-pre-wrap">
              {error.message}
            </pre>
            {errorInfo.componentStack && (
              <>
                <h4 className="font-semibold text-sm mt-3 mb-2">Component Stack:</h4>
                <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-40 whitespace-pre-wrap">
                  {errorInfo.componentStack}
                </pre>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

// Specialized error boundaries for specific use cases
export const TreeErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={TreeErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Tree visualization error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

const TreeErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
      <div className="text-center p-6">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Tree Visualization Error
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
          Unable to render the family tree. This might be due to invalid data or a visualization issue.
        </p>
        <Button onClick={resetError} size="sm" variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    </div>
  );
};

export const FormErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={FormErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Form error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

const FormErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-center">
        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
            Form Error
          </h4>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            There was an error processing your form. Please try again.
          </p>
        </div>
        <Button onClick={resetError} size="sm" variant="outline">
          Retry
        </Button>
      </div>
    </div>
  );
};