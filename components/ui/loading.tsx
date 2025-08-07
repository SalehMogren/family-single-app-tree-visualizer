"use client";

import React from "react";
import { TreePine, Loader2, Users, Clock } from "lucide-react";
import { useTheme } from "@/hooks/useConfig";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = "md",
  className = ""
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${className}`}
    />
  );
};

interface TreeLoadingProps {
  isDarkMode?: boolean;
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export const TreeLoading: React.FC<TreeLoadingProps> = ({
  isDarkMode = false,
  message = "Loading family tree...",
  showProgress = false,
  progress = 0
}) => {
  const { theme } = useTheme();
  const colors = theme ? (isDarkMode ? theme.colors.dark : theme.colors.light) : null;

  return (
    <div 
      className="flex items-center justify-center h-96"
      style={{
        backgroundColor: colors ? colors.background : (isDarkMode ? '#111827' : '#FFFBEB')
      }}
    >
      <div className='text-center'>
        <div className="relative mb-4">
          <TreePine
            className="mx-auto h-12 w-12 animate-pulse"
            style={{
              color: colors ? colors.accent : (isDarkMode ? '#60a5fa' : '#2563eb')
            }}
          />
          <LoadingSpinner 
            className="absolute -bottom-1 -right-1"
            size="sm"
            style={{
              color: colors ? colors.primary : (isDarkMode ? '#3b82f6' : '#2563eb')
            }}
          />
        </div>
        
        <p
          className="text-lg font-semibold mb-2"
          style={{
            color: colors ? colors.text : (isDarkMode ? '#F9FAFB' : '#1F2937'),
            fontFamily: colors?.fonts?.primary || 'Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif'
          }}
        >
          {message}
        </p>

        {showProgress && (
          <div className="w-48 mx-auto">
            <div 
              className="h-2 rounded-full overflow-hidden"
              style={{
                backgroundColor: colors ? colors.border : (isDarkMode ? '#374151' : '#E5E7EB')
              }}
            >
              <div
                className="h-full transition-all duration-300 ease-out rounded-full"
                style={{
                  width: `${progress}%`,
                  backgroundColor: colors ? colors.primary : (isDarkMode ? '#3b82f6' : '#2563eb')
                }}
              />
            </div>
            <p 
              className="text-xs mt-2"
              style={{
                color: colors ? colors.textSecondary : (isDarkMode ? '#D1D5DB' : '#6B7280')
              }}
            >
              {Math.round(progress)}% complete
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface DataLoadingProps {
  isDarkMode?: boolean;
  operation?: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

export const DataLoading: React.FC<DataLoadingProps> = ({
  isDarkMode = false,
  operation = "Processing",
  icon: Icon = Users
}) => {
  const { theme } = useTheme();
  const colors = theme ? (isDarkMode ? theme.colors.dark : theme.colors.light) : null;

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="relative mb-4">
          <Icon
            className="mx-auto h-8 w-8"
            style={{
              color: colors ? colors.primary : (isDarkMode ? '#3b82f6' : '#2563eb')
            }}
          />
          <LoadingSpinner 
            className="absolute -top-1 -right-1"
            size="sm"
            style={{
              color: colors ? colors.accent : (isDarkMode ? '#60a5fa' : '#2563eb')
            }}
          />
        </div>
        
        <p
          className="text-sm font-medium"
          style={{
            color: colors ? colors.text : (isDarkMode ? '#F9FAFB' : '#1F2937')
          }}
        >
          {operation}...
        </p>
      </div>
    </div>
  );
};

interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  [key: string]: any;
}

export const LoadingButton: React.FC<ButtonLoadingProps> = ({
  isLoading,
  children,
  loadingText = "Loading...",
  className = "",
  ...props
}) => {
  return (
    <button
      className={`inline-flex items-center justify-center ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
};

interface SkeletonProps {
  className?: string;
  rows?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = "h-4 w-full", 
  rows = 1 
}) => {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`bg-gray-300 dark:bg-gray-600 rounded ${className}`}
        />
      ))}
    </div>
  );
};

// Skeleton specifically for tree nodes
export const TreeNodeSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-12 w-12"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};