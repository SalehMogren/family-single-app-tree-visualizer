"use client";

import { Provider } from "react-redux";
import { store } from "../lib/store/store";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Toaster } from "@/components/ui/sonner";
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n/config';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Application error:', error, errorInfo);
        // Here you could send error to monitoring service
      }}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>
          {children}
          <Toaster />
        </Provider>
      </I18nextProvider>
    </ErrorBoundary>
  );
}
