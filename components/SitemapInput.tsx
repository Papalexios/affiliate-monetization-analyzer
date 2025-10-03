
import React from 'react';
import { LinkIcon } from './icons/LinkIcon';

interface SitemapInputProps {
  sitemapUrl: string;
  setSitemapUrl: (url: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

export const SitemapInput: React.FC<SitemapInputProps> = ({ sitemapUrl, setSitemapUrl, onAnalyze, isLoading }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAnalyze();
    }
  };

  return (
    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 shadow-lg">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
             <LinkIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>
          <input
            type="url"
            name="sitemap"
            id="sitemap"
            className="block w-full rounded-md border-0 bg-white/5 py-2.5 pl-10 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6 transition-all"
            placeholder="https://example.com/sitemap.xml"
            value={sitemapUrl}
            onChange={(e) => setSitemapUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            required
          />
        </div>
        <button
          type="button"
          onClick={onAnalyze}
          className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center gap-x-2 rounded-md bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Analyzing...' : 'Analyze Sitemap'}
        </button>
      </div>
    </div>
  );
};
