import React, { useState } from 'react';
import type { AnalysisResult, AnalysisResultData, ActionItem } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

// Small inline icons for clarity
const LightbulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 9 6c0 1.3.5 2.6 1.5 3.5.7.8 1.3 1.5 1.5 2.5"></path><path d="M9 18h6"></path><path d="M10 22h4"></path></svg>
);


// Fix: Define ResultCardProps interface to resolve TypeScript error.
interface ResultCardProps {
  result: AnalysisResult;
}

const getScoreColor = (score: number): string => {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
};

const getPriorityClasses = (priority: 'High' | 'Medium' | 'Low'): string => {
  switch (priority) {
    case 'High': return 'bg-red-500/20 text-red-300 border-red-500';
    case 'Medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500';
    case 'Low': return 'bg-sky-500/20 text-sky-300 border-sky-500';
    default: return 'bg-slate-500/20 text-slate-300 border-slate-500';
  }
};

const getImpactClasses = (impact: 'High' | 'Medium' | 'Low'): string => {
  switch (impact) {
    case 'High': return 'text-red-400';
    case 'Medium': return 'text-yellow-400';
    case 'Low': return 'text-sky-400';
    default: return 'text-slate-400';
  }
};


const ActionCard: React.FC<{ action: ActionItem }> = ({ action }) => (
    <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between gap-3">
            <h5 className="font-semibold text-white">{action.title}</h5>
            <span className={`text-xs font-bold ${getImpactClasses(action.impact)}`}>{action.impact} Impact</span>
        </div>
        <p className="text-sm text-slate-400 mt-1">{action.description}</p>
    </div>
);


const SuccessContent: React.FC<{ data: AnalysisResultData }> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex-shrink-0">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${getScoreColor(data.monetization_score).replace('text-', 'border-')}`}>
            <span className={`text-2xl font-bold ${getScoreColor(data.monetization_score)}`}>{data.monetization_score}</span>
          </div>
        </div>
        <div className="flex-grow min-w-0">
          <a href={data.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-white truncate block hover:text-cyan-400 transition-colors" onClick={(e) => e.stopPropagation()}>{data.url}</a>
        </div>
        <div className="flex-shrink-0 ml-auto flex items-center gap-4">
            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getPriorityClasses(data.priority)}`}>
              {data.priority} Priority
            </span>
          <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1500px] mt-6' : 'max-h-0'}`}>
        <div className="border-t border-slate-700 pt-6 space-y-6">
            
            <div>
              <h4 className="text-base font-semibold text-slate-300 mb-2">Summary</h4>
              <p className="text-slate-400 text-sm">{data.summary}</p>
            </div>
            
            <div>
                <h4 className="text-base font-semibold text-slate-300 mb-3 flex items-center gap-2"><LightbulbIcon className="w-5 h-5 text-cyan-400" /> Action Plan</h4>
                <div className="space-y-3">
                    {Array.isArray(data.suggested_actions) && data.suggested_actions.map((action, i) => (
                        <ActionCard key={i} action={action} />
                    ))}
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

export const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 sm:p-6 shadow-md transition-all duration-300 hover:bg-slate-800 hover:border-slate-600">
      {result.status === 'success' && result.data && <SuccessContent data={result.data} />}
      {result.status === 'pending' && (
        <div className="flex items-center gap-4 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-slate-700"></div>
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