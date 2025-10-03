
import React from 'react';

interface LoaderProps {
  progress: {
    processed: number;
    total: number;
  };
}

export const Loader: React.FC<LoaderProps> = ({ progress }) => {
  const percentage = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <div className="mt-12 text-center text-slate-300">
      <div className="flex justify-center items-center gap-4">
        <svg className="animate-spin h-8 w-8 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-lg font-semibold">Analyzing...</span>
      </div>
      <div className="w-full max-w-md mx-auto bg-slate-700 rounded-full h-2.5 mt-4">
        <div className="bg-cyan-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }}></div>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        {progress.processed} of {progress.total} URLs analyzed
      </p>
    </div>
  );
};
