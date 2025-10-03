import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResultData, AIProvider } from '../types';

interface AIConfig {
    provider: AIProvider;
    apiKey: string;
    model?: string;
}

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        url: { type: Type.STRING },
        monetization_score: { type: Type.INTEGER, description: "A score from 1-100 estimating the page's potential to generate affiliate revenue" },
        justification: { type: Type.STRING, description: "A clear, expert-level explanation of why this score was assigned. Reference page intent, audience, product relevance, and affiliate viability." },
        priority: { type: Type.STRING, description: "High, Medium, or Low, based on urgency and opportunity" },
        suggested_actions: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List specific, high-impact affiliate optimization steps. Examples: 'Add product comparison table for hiking boots', 'Insert affiliate links for software tools mentioned'."
        },
        affiliate_niche: { type: Type.STRING, description: "Identify the most relevant affiliate niche for this page (e.g., SaaS, outdoor gear, finance, health supplements)" },
        content_gap_analysis: { type: Type.STRING, description: "Briefly identify missing elements that could boost affiliate performance (e.g., lack of buyer intent keywords, missing product links, no visual CTAs)" },
        conversion_booster: { type: Type.STRING, description: "Suggest one advanced tactic to increase conversions (e.g., interactive quiz, exit-intent popup, urgency timer, trust badges)" }
    },
    required: ["url", "monetization_score", "justification", "priority", "suggested_actions", "affiliate_niche", "content_gap_analysis", "conversion_booster"]
};

const systemInstruction = `You are a world-class affiliate marketing strategist and monetization analyst. Your task is to analyze a webpage and determine its potential for affiliate monetization. Act as a hybrid of a CRO expert, SEO strategist, and affiliate revenue optimizer.
Your analysis must be strategic, data-driven, actionable, and tailored to affiliate marketing best practices. Do not return vague advice. Every suggestion must be specific, monetization-focused, and backed by rationale.
Assume the page content is accessible and relevant. Analyze based on the URL's likely topic and intent.
Return your response in the structured JSON format defined by the schema.`;

const parseJsonResponse = (responseText: string): AnalysisResultData => {
    try {
        return JSON.parse(responseText.trim());
    } catch (e) {
        console.error("Failed to parse JSON response:", responseText);
        throw new Error("API returned invalid JSON. The response may be malformed or an error message.");
    }
}

const analyzeWithGemini = async (url: string): Promise<AnalysisResultData> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set for Gemini.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Please perform an affiliate monetization analysis for the following URL: ${url}`,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
            temperature: 0.2,
        }
    });

    if (!response.text) {
        throw new Error("Received an empty response from the Gemini model.");
    }
    return parseJsonResponse(response.text);
};

const analyzeWithOpenAICompatible = async (url: string, config: AIConfig): Promise<AnalysisResultData> => {
    const { provider, apiKey, model } = config;
    let apiUrl = '';
    let modelName = '';

    switch (provider) {
        case 'openai':
            apiUrl = 'https://api.openai.com/v1/chat/completions';
            modelName = 'gpt-4-turbo';
            break;
        case 'claude':
             apiUrl = 'https://api.anthropic.com/v1/messages'; // Note: Claude API is slightly different
             modelName = 'claude-3-haiku-20240307'; // Use Haiku for speed and cost-effectiveness
             break;
        case 'openrouter':
            apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
            modelName = model || 'mistralai/mistral-7b-instruct'; // Default model
            break;
        case 'groq':
            apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
            modelName = model || 'llama3-8b-8192'; // Default model
            break;
        default:
            throw new Error(`Unsupported provider: ${provider}`);
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    
    if (provider === 'claude') {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
    } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const body = provider === 'claude' ? {
        model: modelName,
        max_tokens: 4096,
        system: systemInstruction,
        messages: [{ role: 'user', content: `Please perform an affiliate monetization analysis for the following URL: ${url}. Respond ONLY with the JSON object, without any markdown formatting or extra text.` }],
    } : {
        model: modelName,
        messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: `Please perform an affiliate monetization analysis for the following URL: ${url}` }
        ],
        response_format: { type: "json_object" }
    };
    
    // Add a timeout controller for resilience
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('Request timed out after 30 seconds'), 30000);

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
        signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API request failed for ${provider} with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();

    if (provider === 'claude') {
        if (data.content && data.content[0] && data.content[0].text) {
             // Claude may wrap JSON in a code block, so we extract it.
            const textContent = data.content[0].text;
            const jsonMatch = textContent.match(/```json\n([\s\S]*?)\n```/);
            const jsonString = jsonMatch ? jsonMatch[1] : textContent;
            return parseJsonResponse(jsonString);
        } else {
             throw new Error('Invalid response structure from Claude API');
        }
    }

    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        return parseJsonResponse(data.choices[0].message.content);
    }

    throw new Error('Invalid response structure from API');
};


export const analyzeUrl = async (url: string, config: AIConfig): Promise<AnalysisResultData> => {
    try {
        if (config.provider === 'gemini') {
            return await analyzeWithGemini(url);
        } else {
            return await analyzeWithOpenAICompatible(url, config);
        }
    } catch (error) {
        console.error(`Error analyzing URL ${url} with ${config.provider}:`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to analyze ${url}. Reason: ${error.message}`);
        }
        throw new Error(`An unknown error occurred while analyzing ${url}.`);
    }
};
