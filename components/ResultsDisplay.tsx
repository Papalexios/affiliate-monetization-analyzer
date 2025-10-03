
import React from 'react';
import { ResultCard } from './ResultCard';
import type { AnalysisResult } from '../types';

interface ResultsDisplayProps {
  results: AnalysisResult[];
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  const successfulAnalyses = results.filter(r => r.status === 'success').length;
  const totalAnalyses = results.length;

  return (
    <div className="mt-12">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-white">Analysis Results</h2>
        <p className="text-slate-400">
          Successfully analyzed <span className="text-cyan-400 font-semibold">{successfulAnalyses}</span> out of <span className="text-cyan-400 font-semibold">{totalAnalyses}</span> URLs.
        </p>
      </div>
      <div className="space-y-4">
        {results.map((result, index) => (
          <ResultCard key={result.url + index} result={result} />
        ))}
      </div>
    </div>
  );
};
