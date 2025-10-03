import React, { useState } from 'react';
import type { AnalysisResult, AnalysisResultData } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface ResultCardProps {
  result: AnalysisResult;
}

const getScoreColor = (score: number): string => {
  if (score >= 70) return 'text-green-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-red-400';
};

const getPriorityClasses = (priority: 'High' | 'Medium' | 'Low'): string => {
  switch (priority) {
    case 'High':
      return 'bg-red-500/20 text-red-300 border-red-500';
    case 'Medium':
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500';
    case 'Low':
      return 'bg-sky-500/20 text-sky-300 border-sky-500';
    default:
      return 'bg-slate-500/20 text-slate-300 border-slate-500';
  }
};

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="py-4">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">{title}</h4>
        <div className="text-slate-300 space-y-2">{children}</div>
    </div>
);

const SuccessContent: React.FC<{ data: AnalysisResultData }> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Helper to robustly render action items. The AI can sometimes return an array of objects
  // (e.g., [{action: '...'}]) instead of an array of strings, which would crash React.
  // This function handles both formats gracefully to make the UI crash-proof.
  const renderActionItem = (item: any, index: number) => {
    if (typeof item === 'string') {
      return <li key={index}>{item}</li>;
    }
    if (typeof item === 'object' && item !== null && typeof item.action === 'string') {
      return <li key={index}>{item.action}</li>;
    }
    // Log and ignore other malformed data to prevent crashes.
    console.warn("Malformed item in suggested_actions array:", item);
    return null;
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex-shrink-0">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${getScoreColor(data.monetization_score).replace('text-', 'border-')}`}>
            <span className={`text-3xl font-bold ${getScoreColor(data.monetization_score)}`}>{data.monetization_score}</span>
          </div>
        </div>
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-1">
            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getPriorityClasses(data.priority)}`}>
              {data.priority} Priority
            </span>
          </div>
          <p className="font-semibold text-white break-all">{data.url}</p>
          <p className="text-sm text-slate-400">{data.justification}</p>
        </div>
        <div className="flex-shrink-0 ml-auto">
          <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px] mt-4' : 'max-h-0'}`}>
        <div className="border-t border-slate-700 mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <DetailSection title="Suggested Actions">
                <ul className="list-disc list-inside space-y-1">
                    {Array.isArray(data.suggested_actions) && data.suggested_actions.length > 0
                      ? data.suggested_actions.map(renderActionItem).filter(Boolean)
                      : <li>No specific actions were suggested.</li>
                    }
                </ul>
            </DetailSection>
            <DetailSection title="Affiliate Niche">
                <p className="font-medium text-cyan-400">{data.affiliate_niche || 'N/A'}</p>
            </DetailSection>
            <DetailSection title="Content Gap Analysis">
                <p>{data.content_gap_analysis || 'N/A'}</p>
            </DetailSection>
            <DetailSection title="Conversion Booster">
                 <p>{data.conversion_booster || 'N/A'}</p>
            </DetailSection>
        </div>
      </div>
    </>
  );
};

export const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 shadow-md transition-all duration-300 hover:bg-slate-800 hover:border-slate-600">
      {result.status === 'success' && result.data && <SuccessContent data={result.data} />}
      {result.status === 'pending' && (
        <div className="flex items-center gap-4 animate-pulse">
            <div className="w-20 h-20 rounded-full bg-slate-700"></div>
            <div className="flex-grow space-y-3">
                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                <div className="h-4 bg-slate-700 rounded w-1/2"></div>
            </div>
        </div>
      )}
      {result.status === 'error' && (
        <div className="flex flex-col">
            <p className="font-semibold text-red-400 break-all">{result.url}</p>
            <p className="text-sm text-red-300 mt-1">
                <span className="font-bold">Failed to analyze:</span> {result.error}
            </p>
        </div>
      )}
    </div>
  );
};