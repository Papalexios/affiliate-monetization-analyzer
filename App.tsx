import React, { useState, useCallback } from 'react';
import { SitemapDataInput } from './components/SitemapDataInput';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Loader } from './components/Loader';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { AIProviderSelector } from './components/AIProviderSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { AnalysisResult, AIProvider } from './types';
import { parseSitemap } from './utils/sitemapParser';
import { analyzeUrl } from './services/aiService';

const App: React.FC = () => {
  const [sitemapXml, setSitemapXml] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);

  // AI Provider State
  const [provider, setProvider] = useState<AIProvider>('gemini');
  const [apiKey, setApiKey] = useState<string>('');
  const [customModel, setCustomModel] = useState<string>('');


  const handleAnalyze = useCallback(async () => {
    if (!sitemapXml.trim()) {
      setError('Please paste your sitemap XML content or fetch it from a URL.');
      return;
    }
    if (!apiKey && provider !== 'gemini') {
        setError(`Please enter an API key for ${provider}.`);
        return;
    }
     if ((provider === 'openrouter' || provider === 'groq') && !customModel) {
      setError(`Please enter a model name for ${provider}.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setProgress(null);

    try {
      const urls = parseSitemap(sitemapXml);
      if (urls.length === 0) {
        setError('No URLs found in the sitemap XML or failed to parse. Please check the content.');
        setIsLoading(false);
        return;
      }

      setProgress({ processed: 0, total: urls.length });
      
      const initialResults: AnalysisResult[] = urls.map(url => ({ url, status: 'pending' }));
      setResults(initialResults);

      const CONCURRENCY_LIMIT = 50;
      const tasks = urls.map((url, index) => ({ url, index }));

      const worker = async () => {
        while (tasks.length > 0) {
          const task = tasks.shift();
          if (!task) continue;

          const { url, index } = task;

          try {
            const analysisData = await analyzeUrl(url, { provider, apiKey, model: customModel });
            setResults(prev => {
              const newResults = [...prev];
              newResults[index] = { url, status: 'success', data: analysisData };
              return newResults;
            });
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
            setResults(prev => {
              const newResults = [...prev];
              newResults[index] = { url, status: 'error', error: errorMessage };
              return newResults;
            });
          } finally {
            setProgress(prev => prev ? { ...prev, processed: prev.processed + 1 } : null);
          }
        }
      };

      const workerPromises = Array(CONCURRENCY_LIMIT).fill(null).map(worker);
      await Promise.all(workerPromises);

      // --- ROBUST FINALIZATION LOGIC ---
      // This new logic prevents the "blank screen" crash.
      // It ensures all state updates are processed before hiding the loader.
      setProgress(prev => prev ? { processed: prev.total, total: prev.total } : null);
      
      setTimeout(() => {
        setIsLoading(false);
      }, 100);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during sitemap processing.';
      setError(`Failed to process sitemap. ${errorMessage}`);
      setIsLoading(false);
    }
  }, [sitemapXml, provider, apiKey, customModel]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <div className="relative isolate overflow-hidden bg-gray-900">
        <svg className="absolute inset-0 -z-10 h-full w-full stroke-white/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]" aria-hidden="true">
          <defs>
            <pattern id="983e3e4c-de6d-4c3f-8d64-b9761d1534cc" width="200" height="200" x="50%" y="-1" patternUnits="userSpaceOnUse">
              <path d="M.5 200V.5H200" fill="none" />
            </pattern>
          </defs>
          <svg x="50%" y="-1" className="overflow-visible fill-gray-800/20">
            <path d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z" strokeWidth="0" />
          </svg>
          <rect width="100%" height="100%" strokeWidth="0" fill="url(#983e3e4c-de6d-4c3f-8d64-b9761d1534cc)" />
        </svg>
      </div>

      <main className="container mx-auto px-4 py-8 md:py-16">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3">
            <SparklesIcon className="w-10 h-10 text-cyan-400" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              Affiliate Monetization Analyzer
            </h1>
          </div>
           <p className="text-base text-slate-400 mt-2 mb-6">
            From the creators of <a href="https://affiliatemarketingforsuccess.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">AffiliateMarketingForSuccess.com</a>
          </p>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto">
            Instantly crawl any sitemap to uncover hidden affiliate revenue opportunities. Our AI-powered analysis scores each page and provides actionable strategies to boost your earnings.
          </p>
        </header>

        <div className="max-w-3xl mx-auto space-y-6">
          <SitemapDataInput
            sitemapXml={sitemapXml}
            setSitemapXml={setSitemapXml}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
          />
          <AIProviderSelector 
            provider={provider}
            setProvider={setProvider}
            apiKey={apiKey}
            setApiKey={setApiKey}
            customModel={customModel}
            setCustomModel={setCustomModel}
            disabled={isLoading}
          />
        </div>


        {error && (
          <div className="mt-8 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center max-w-3xl mx-auto" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {isLoading && progress && <Loader progress={progress} />}

        <ErrorBoundary>
          {!isLoading && results.length > 0 && <ResultsDisplay results={results} />}
        </ErrorBoundary>

        <footer className="text-center mt-24 pt-12 border-t border-slate-800 text-slate-500">
          <div className="flex flex-col items-center gap-6">
            <a href="https://affiliatemarketingforsuccess.com" target="_blank" rel="noopener noreferrer" className="block">
              <img 
                src="https://affiliatemarketingforsuccess.com/wp-content/uploads/2023/03/cropped-Affiliate-Marketing-for-Success-Logo-Edited.png?lm=6666FEE0" 
                alt="Affiliate Marketing for Success Logo" 
                className="h-16 w-auto mx-auto hover:opacity-80 transition-opacity"
              />
            </a>
            <p className="text-base">
              This App is Created by Alexios Papaioannou, Owner of <a href="https://affiliatemarketingforsuccess.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-300 hover:text-cyan-400 transition-colors">affiliatemarketingforsuccess.com</a>
            </p>
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-base">
              <span className="text-slate-400 font-medium">Learn more about:</span>
              <a href="https://affiliatemarketingforsuccess.com/affiliate-marketing" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-cyan-400 transition-colors">Affiliate Marketing</a>
              <span className="text-slate-600 hidden sm:inline">·</span>
              <a href="https://affiliatemarketingforsuccess.com/ai" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-cyan-400 transition-colors">AI</a>
              <span className="text-slate-600 hidden sm:inline">·</span>
              <a href="https://affiliatemarketingforsuccess.com/seo" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-cyan-400 transition-colors">SEO</a>
              <span className="text-slate-600 hidden sm:inline">·</span>
              <a href="https://affiliatemarketingforsuccess.com/blogging" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-cyan-400 transition-colors">Blogging</a>
              <span className="text-slate-600 hidden sm:inline">·</span>
              <a href="https://affiliatemarketingforsuccess.com/review" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-cyan-400 transition-colors">Reviews</a>
            </nav>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;