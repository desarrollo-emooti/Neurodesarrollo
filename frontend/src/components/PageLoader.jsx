import React from 'react';

/**
 * PageLoader Component
 *
 * Loading fallback for lazy-loaded pages with Suspense.
 * Uses EMOOTI brand colors (blue/green gradient).
 */
const PageLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        {/* Animated spinner */}
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin"></div>
        </div>

        {/* Loading text with gradient */}
        <p className="text-lg font-medium bg-gradient-to-r from-blue-600 to-green-600 dark:from-blue-400 dark:to-green-400 bg-clip-text text-transparent">
          Cargando...
        </p>
      </div>
    </div>
  );
};

export default PageLoader;
