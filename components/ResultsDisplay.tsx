import React, { useState, useMemo } from 'react';
import { ResultCard } from './ResultCard';
import type { AnalysisResult } from '../types';

type SortKey = 'default' | 'score_desc' | 'score_asc' | 'priority';

const priorityOrder: Record<string, number> = { High: 1, Medium: 2, Low: 3 };

export const ResultsDisplay: React.FC<{ results: AnalysisResult[] }> = ({ results }) => {
  const [sortKey, setSortKey] = useState<SortKey>('default');

  const { successfulAnalyses, summary, sortedResults } = useMemo(() => {
    const successResults = results.filter(r => r.status === 'success' && r.data);
    
    const summaryData = {
      high: successResults.filter(r => r.data?.priority === 'High').length,
      medium: successResults.filter(r => r.data?.priority === 'Medium').length,
      low: successResults.filter(r => r.data?.priority === 'Low').length,
    };

    const sorted = [...results].sort((a, b) => {
      // Keep pending and error items at their original relative positions, but sorted after success items if sorting is active.
      if (sortKey !== 'default') {
          if (a.status !== 'success') return 1;
          if (b.status !== 'success') return -1;
      }
      if (a.status !== 'success' || !a.data) return 1;
      if (b.status !== 'success' || !b.data) return -1;
      
      switch (sortKey) {
        case 'score_desc':
          return b.data.monetization_score - a.data.monetization_score;
        case 'score_asc':
          return a.data.monetization_score - b.data.monetization_score;
        case 'priority':
          return priorityOrder[a.data.priority] - priorityOrder[b.data.priority];
        case 'default':
        default:
          return 0; // Keep original order
      }
    });

    return {
      successfulAnalyses: successResults.length,
      summary: summaryData,
      sortedResults: sorted,
    };
  }, [results, sortKey]);

  const totalAnalyses = results.length;

  return (
    <div className="mt-12">
      <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold text-white">Analysis Report</h2>
            <p className="text-slate-400 mt-1">
              Successfully analyzed <span className="text-cyan-400 font-semibold">{successfulAnalyses}</span> of <span className="text-cyan-400 font-semibold">{totalAnalyses}</span> URLs.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-sm">
                <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    <span className="text-slate-300">{summary.high} High Priority</span>
                </span>
                 <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                    <span className="text-slate-300">{summary.medium} Medium Priority</span>
                </span>
                 <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-500"></span>
                    <span className="text-slate-300">{summary.low} Low Priority</span>
                </span>
            </div>
          </div>
          <div className="flex-shrink-0 w-full md:w-auto">
            <label htmlFor="sort-by" className="block text-sm font-medium text-slate-300 mb-2">Sort by</label>
            <select
                id="sort-by"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="w-full md:w-48 rounded-md border-0 bg-white/5 py-2 pl-3 pr-8 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm transition-all"
            >
                <option value="default">Default Order</option>
                <option value="priority">Priority</option>
                <option value="score_desc">Score (High-Low)</option>
                <option value="score_asc">Score (Low-High)</option>
            </select>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {sortedResults.map((result, index) => (
          <ResultCard key={result.url + index} result={result} />
        ))}
      </div>
    </div>
  );
};
