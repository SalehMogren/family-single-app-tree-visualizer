import { useCallback, useState } from 'react';

interface UseErrorHandlerReturn {
  error: Error | null;
  clearError: () => void;
  handleError: (error: Error) => void;
  withErrorHandling: <T extends any[], R>(
    fn: (...args: T) => R | Promise<R>
  ) => (...args: T) => Promise<R | undefined>;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<Error | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('Error caught by useErrorHandler:', error);
    setError(error);
  }, []);

  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => R | Promise<R>
  ) => {
    return async (...args: T): Promise<R | undefined> => {
      try {
        const result = await fn(...args);
        // Clear any previous errors on success
        if (error) {
          clearError();
        }
        return result;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        handleError(errorObj);
        return undefined;
      }
    };
  }, [error, clearError, handleError]);

  return {
    error,
    clearError,
    handleError,
    withErrorHandling
  };
};

// Specialized error handlers for different contexts
export const useTreeErrorHandler = () => {
  const { error, clearError, handleError, withErrorHandling } = useErrorHandler();

  const handleTreeError = useCallback((error: Error) => {
    console.error('Tree error:', error);
    // You can add tree-specific error handling here
    // For example, reset tree state, show specific error messages, etc.
    handleError(error);
  }, [handleError]);

  const withTreeErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => R | Promise<R>
  ) => {
    return withErrorHandling(fn);
  }, [withErrorHandling]);

  return {
    error,
    clearError,
    handleError: handleTreeError,
    withErrorHandling: withTreeErrorHandling
  };
};

export const useFormErrorHandler = () => {
  const { error, clearError, handleError, withErrorHandling } = useErrorHandler();

  const handleFormError = useCallback((error: Error) => {
    console.error('Form error:', error);
    // You can add form-specific error handling here
    // For example, reset form state, show specific validation errors, etc.
    handleError(error);
  }, [handleError]);

  const withFormErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => R | Promise<R>
  ) => {
    return withErrorHandling(fn);
  }, [withErrorHandling]);

  return {
    error,
    clearError,
    handleError: handleFormError,
    withErrorHandling: withFormErrorHandling
  };
};