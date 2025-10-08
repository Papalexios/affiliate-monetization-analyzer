export interface ActionItem {
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface AnalysisResultData {
  url: string;
  monetization_score: number;
  summary: string;
  priority: 'High' | 'Medium' | 'Low';
  suggested_actions: ActionItem[];
}

export interface AnalysisResult {
  status: 'success' | 'error' | 'pending';
  url:string;
  data?: AnalysisResultData;
  error?: string;
}

export type AIProvider = 'gemini' | 'openai' | 'claude' | 'openrouter' | 'groq';

export interface AIWorkerConfig {
  id: string;
  provider: AIProvider;
  apiKey: string;
  model: string;
}