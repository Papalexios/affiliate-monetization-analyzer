import React, { useState } from 'react';
import type { AIProvider, AIWorkerConfig } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { KeyIcon } from './icons/KeyIcon';
import { ModelIcon } from './icons/ModelIcon';
import { GeminiIcon } from './icons/GeminiIcon';
import { OpenAIIcon } from './icons/OpenAIIcon';
import { ClaudeIcon } from './icons/ClaudeIcon';
import { OpenRouterIcon } from './icons/OpenRouterIcon';
import { GroqIcon } from './icons/GroqIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { TrashIcon } from './icons/TrashIcon';


interface AIProviderSelectorProps {
  aiWorkers: AIWorkerConfig[];
  setAiWorkers: React.Dispatch<React.SetStateAction<AIWorkerConfig[]>>;
  concurrency: number;
  setConcurrency: (concurrency: number) => void;
  disabled: boolean;
}

const providers: { id: AIProvider; name: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'gemini', name: 'Gemini', icon: GeminiIcon },
  { id: 'openai', name: 'OpenAI', icon: OpenAIIcon },
  { id: 'claude', name: 'Claude', icon: ClaudeIcon },
  { id: 'openrouter', name: 'OpenRouter', icon: OpenRouterIcon },
  { id: 'groq', name: 'Groq', icon: GroqIcon },
];

const AIWorker: React.FC<{
  worker: AIWorkerConfig;
  index: number;
  onUpdate: (id: string, newConfig: Partial<Omit<AIWorkerConfig, 'id'>>) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
}> = ({ worker, index, onUpdate, onRemove, disabled }) => {
  const needsApiKey = worker.provider !== 'gemini';
  const needsCustomModel = worker.provider === 'openrouter' || worker.provider === 'groq';

  return (
    <fieldset className="border border-slate-700 p-4 rounded-lg space-y-4">
      <legend className="px-2 text-sm font-semibold text-slate-300 flex items-center justify-between w-full">
        <span className="mr-auto">AI Worker #{index + 1}</span>
        <button
          type="button"
          onClick={() => onRemove(worker.id)}
          disabled={disabled}
          className="text-slate-400 hover:text-red-400 disabled:text-slate-600 transition-colors"
          aria-label="Remove Worker"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </legend>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Provider</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {providers.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onUpdate(worker.id, { provider: p.id })}
              disabled={disabled}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-colors ${
                worker.provider === p.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-600 bg-slate-800 hover:border-slate-500'
              }`}
            >
              <p.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-semibold">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
      {needsApiKey && (
        <div>
          <label htmlFor={`api-key-${worker.id}`} className="block text-sm font-medium text-slate-300 mb-2">
            API Key for {providers.find(p => p.id === worker.provider)?.name}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <KeyIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="password"
              id={`api-key-${worker.id}`}
              value={worker.apiKey}
              onChange={(e) => onUpdate(worker.id, { apiKey: e.target.value })}
              disabled={disabled}
              placeholder="Enter your API key"
              className="block w-full rounded-md border-0 bg-white/5 py-2.5 pl-10 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm"
            />
          </div>
        </div>
      )}
      {needsCustomModel && (
         <div>
          <label htmlFor={`custom-model-${worker.id}`} className="block text-sm font-medium text-slate-300 mb-2">
            Model Name
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <ModelIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              id={`custom-model-${worker.id}`}
              value={worker.model}
              onChange={(e) => onUpdate(worker.id, { model: e.target.value })}
              disabled={disabled}
              placeholder={worker.provider === 'openrouter' ? 'e.g., mistralai/mixtral-8x7b-instruct' : 'e.g., llama3-8b-8192'}
              className="block w-full rounded-md border-0 bg-white/5 py-2.5 pl-10 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm"
            />
          </div>
        </div>
      )}
    </fieldset>
  );
};


export const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({
  aiWorkers, setAiWorkers, concurrency, setConcurrency, disabled
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const addWorker = () => {
    setAiWorkers(prev => [...prev, { id: crypto.randomUUID(), provider: 'gemini', apiKey: '', model: '' }]);
  };

  const removeWorker = (idToRemove: string) => {
    // Prevent removing the last worker
    if (aiWorkers.length > 1) {
        setAiWorkers(prev => prev.filter(w => w.id !== idToRemove));
    }
  };

  const updateWorker = (idToUpdate: string, newConfig: Partial<Omit<AIWorkerConfig, 'id'>>) => {
    setAiWorkers(prev => prev.map(w => w.id === idToUpdate ? { ...w, ...newConfig } : w));
  };


  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg transition-all">
      <button
        type="button"
        className="w-full flex justify-between items-center p-4"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-controls="ai-config-panel"
      >
        <span className="font-semibold text-white">AI & Concurrency Configuration</span>
        <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div
        id="ai-config-panel"
        className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[100rem]' : 'max-h-0'}`}
      >
        <div className="p-4 border-t border-slate-700 space-y-6">
           <div>
            <label htmlFor="concurrency-slider" className="block text-sm font-medium text-slate-300 mb-2">
              Global Concurrency Level: <span className="font-bold text-cyan-400">{concurrency}</span>
            </label>
            <input
              id="concurrency-slider"
              type="range"
              min="1"
              max="50"
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <p className="text-xs text-slate-500 mt-2">
              Total number of URLs to analyze in parallel across all AI workers. High values may hit API rate limits.
            </p>
          </div>
          
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-sm font-semibold">AI WORKER POOL</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>
          
          <div className="space-y-4">
            {aiWorkers.map((worker, index) => (
              <AIWorker
                key={worker.id}
                worker={worker}
                index={index}
                onUpdate={updateWorker}
                onRemove={removeWorker}
                disabled={disabled}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addWorker}
            disabled={disabled}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-slate-700/50 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-600/50 disabled:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-500 transition-colors border border-slate-600"
          >
            <PlusCircleIcon className="w-5 h-5" />
            Add AI Worker
          </button>

        </div>
      </div>
    </div>
  );
};
