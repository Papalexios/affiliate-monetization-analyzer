
export interface AnalysisResultData {
  url: string;
  monetization_score: number;
  justification: string;
  priority: 'High' | 'Medium' | 'Low';
  suggested_actions: string[];
  affiliate_niche: string;
  content_gap_analysis: string;
  conversion_booster: string;
}

export interface AnalysisResult {
  status: 'success' | 'error' | 'pending';
  url: string;
  data?: AnalysisResultData;
  error?: string;
}

export type AIProvider = 'gemini' | 'openai' | 'claude' | 'openrouter' | 'groq';
