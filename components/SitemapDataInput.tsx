import React, { useState } from 'react';
import { fetchSitemap } from '../utils/sitemapParser';
import { FileCodeIcon } from './icons/FileCodeIcon';
import { GlobeIcon } from './icons/GlobeIcon';

interface SitemapDataInputProps {
  sitemapXml: string;
  setSitemapXml: (xml: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

export const SitemapDataInput: React.FC<SitemapDataInputProps> = ({ sitemapXml, setSitemapXml, onAnalyze, isLoading }) => {
  const [fetchUrl, setFetchUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleFetchSitemap = async () => {
    if (!fetchUrl) {
      setFetchError('Please enter a URL to fetch.');
      return;
    }
    setIsFetching(true);
    setFetchError(null);
    try {
      const xml = await fetchSitemap(fetchUrl);
      setSitemapXml(xml);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setFetchError(errorMessage);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 shadow-lg space-y-4">
      {/* --- Primary Input: Paste XML --- */}
      <div>
        <label htmlFor="sitemap-xml" className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
          <FileCodeIcon className="w-5 h-5" />
          <span>Paste Sitemap XML Content</span>
        </label>
        <textarea
          id="sitemap-xml"
          rows={8}
          className="block w-full rounded-md border-0 bg-white/5 py-2.5 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6 transition-all font-mono"
          placeholder={`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://example.com/page1</loc>\n  </url>\n  <url>\n    <loc>https://example.com/page2</loc>\n  </url>\n</urlset>`}
          value={sitemapXml}
          onChange={(e) => setSitemapXml(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="relative flex items-center">
        <div className="flex-grow border-t border-slate-700"></div>
        <span className="flex-shrink mx-4 text-slate-400 text-sm">OR</span>
        <div className="flex-grow border-t border-slate-700"></div>
      </div>

      {/* --- Secondary Input: Fetch from URL --- */}
      <div>
         <label htmlFor="sitemap-url" className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
           <GlobeIcon className="w-5 h-5" />
           <span>Fetch Sitemap from URL (Convenience Option)</span>
        </label>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="url"
            id="sitemap-url"
            className="block w-full rounded-md border-0 bg-white/5 py-2.5 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm transition-all"
            placeholder="https://example.com/sitemap.xml"
            value={fetchUrl}
            onChange={(e) => setFetchUrl(e.target.value)}
            disabled={isLoading || isFetching}
          />
          <button
            type="button"
            onClick={handleFetchSitemap}
            className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center rounded-md bg-slate-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
            disabled={isLoading || isFetching}
          >
            {isFetching ? 'Fetching...' : 'Fetch'}
          </button>
        </div>
        {fetchError && <p className="text-red-400 text-sm mt-2">{fetchError}</p>}
      </div>

      {/* --- Main Analyze Button --- */}
       <div className="pt-2">
         <button
          type="button"
          onClick={onAnalyze}
          className="w-full inline-flex items-center justify-center gap-x-2 rounded-md bg-cyan-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          disabled={isLoading || isFetching}
        >
          {isLoading ? 'Analyzing...' : 'Analyze Sitemap'}
        </button>
      </div>
    </div>
  );
};
