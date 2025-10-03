
import React, { useState } from 'react';
import type { AIProvider } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { KeyIcon } from './icons/KeyIcon';
import { ModelIcon } from './icons/ModelIcon';
import { GeminiIcon } from './icons/GeminiIcon';
import { OpenAIIcon } from './icons/OpenAIIcon';
import { ClaudeIcon } from './icons/ClaudeIcon';
import { OpenRouterIcon } from './icons/OpenRouterIcon';
import { GroqIcon } from './icons/GroqIcon';

interface AIProviderSelectorProps {
  provider: AIProvider;
  setProvider: (provider: AIProvider) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  customModel: string;
  setCustomModel: (model: string) => void;
  disabled: boolean;
}

const providers: { id: AIProvider; name: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'gemini', name: 'Gemini', icon: GeminiIcon },
  { id: 'openai', name: 'OpenAI', icon: OpenAIIcon },
  { id: 'claude', name: 'Claude', icon: ClaudeIcon },
  { id: 'openrouter', name: 'OpenRouter', icon: OpenRouterIcon },
  { id: 'groq', name: 'Groq', icon: GroqIcon },
];

export const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({
  provider, setProvider, apiKey, setApiKey, customModel, setCustomModel, disabled
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const needsApiKey = provider !== 'gemini';
  const needsCustomModel = provider === 'openrouter' || provider === 'groq';

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
        <span className="font-semibold text-white">AI Configuration</span>
        <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div
        id="ai-config-panel"
        className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px]' : 'max-h-0'}`}
      >
        <div className="p-4 border-t border-slate-700 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Provider</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {providers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id)}
                  disabled={disabled}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-colors ${
                    provider === p.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-600 bg-slate-800 hover:border-slate-500'
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
              <label htmlFor="api-key" className="block text-sm font-medium text-slate-300 mb-2">
                API Key for {providers.find(p => p.id === provider)?.name}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <KeyIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  id="api-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={disabled}
                  placeholder="Enter your API key"
                  className="block w-full rounded-md border-0 bg-white/5 py-2.5 pl-10 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm"
                />
              </div>
            </div>
          )}
          {needsCustomModel && (
             <div>
              <label htmlFor="custom-model" className="block text-sm font-medium text-slate-300 mb-2">
                Model Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <ModelIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  id="custom-model"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  disabled={disabled}
                  placeholder={provider === 'openrouter' ? 'e.g., mistralai/mixtral-8x7b-instruct' : 'e.g., llama3-8b-8192'}
                  className="block w-full rounded-md border-0 bg-white/5 py-2.5 pl-10 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
