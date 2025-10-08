import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResultData, AIWorkerConfig } from '../types';

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        url: { type: Type.STRING },
        monetization_score: { type: Type.INTEGER, description: "Score from 1-100 for affiliate revenue potential. Be realistic." },
        summary: { type: Type.STRING, description: "A concise, 1-2 sentence summary explaining the score, focusing on the page's primary strengths and weaknesses for monetization." },
        priority: { type: Type.STRING, description: "Optimization priority based on potential impact. Must be 'High', 'Medium', or 'Low'." },
        suggested_actions: {
            type: Type.ARRAY,
            description: "An array of exactly THREE distinct, actionable suggestions to improve revenue.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "A short, clear headline for the action (e.g., 'Add a Product Comparison Table')." },
                    description: { type: Type.STRING, description: "A 1-2 sentence description of how to implement the action and why it works." },
                    impact: { type: Type.STRING, description: "The expected impact on revenue. Must be 'High', 'Medium', or 'Low'." },
                },
                required: ["title", "description", "impact"],
            }
        },
    },
    required: ["url", "monetization_score", "summary", "priority", "suggested_actions"]
};

const systemInstruction = `You are an expert affiliate monetization strategist. Your task is to analyze a webpage and provide a structured JSON response outlining its affiliate revenue potential.

**CRITICAL INSTRUCTIONS:**
1.  **Strictly Adhere to JSON Schema:** Your entire response MUST be a single JSON object that validates against the provided schema. Do not add any text, markdown, or explanations outside of the JSON object.
2.  **All Fields are Mandatory:** You must provide a valuable, non-placeholder response for every single field in the schema. Do not use "N/A", "Not applicable", or similar.
3.  **Provide Exactly Three Actions:** The 'suggested_actions' array must contain exactly three unique and impactful action items. Each item must be an object with 'title', 'description', and 'impact' fields.
4.  **Concise & Actionable:** Keep all text concise and focused on practical, actionable advice. The user is a professional marketer.

**Example \`suggested_actions\` item:**
{
  "title": "Embed a 'Best-Value' Product Box",
  "description": "Add a visually distinct product box highlighting the best-value option with a clear 'Check Price' affiliate link button to increase click-through rate.",
  "impact": "High"
}

Your analysis must be sharp, accurate, and directly help the user increase their affiliate income. Your reputation depends on it.`;

const parseJsonResponse = (responseText: string): AnalysisResultData => {
    try {
        let cleanText = responseText.trim();
        // Look for JSON within markdown code blocks (e.g., ```json ... ```) and extract it.
        const jsonMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            cleanText = jsonMatch[1];
        }

        const parsed = JSON.parse(cleanText);
        // Basic validation
        if (typeof parsed !== 'object' || parsed === null || !parsed.url || !parsed.suggested_actions) {
            throw new Error("Parsed JSON is missing required fields like 'url' or 'suggested_actions'.");
        }
        return parsed as AnalysisResultData;
    } catch (e) {
        console.error("Failed to parse JSON response:", responseText);
        const errorMessage = e instanceof Error ? e.message : 'Unknown parsing error.';
        throw new Error(`API returned invalid JSON. The response may be malformed or an error message. Details: ${errorMessage}`);
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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const analyzeWithOpenAICompatible = async (url: string, config: AIWorkerConfig): Promise<AnalysisResultData> => {
    const { provider, apiKey, model } = config;
    let apiUrl = '';
    let modelName = '';

    switch (provider) {
        case 'openai':
            apiUrl = 'https://api.openai.com/v1/chat/completions';
            modelName = 'gpt-4-turbo';
            break;
        case 'claude':
             apiUrl = 'https://api.anthropic.com/v1/messages';
             modelName = 'claude-3-haiku-20240307';
             break;
        case 'openrouter':
            apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
            modelName = model || 'mistralai/mistral-7b-instruct';
            break;
        case 'groq':
            apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
            modelName = model || 'llama3-8b-8192';
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

    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort('Request timed out after 60 seconds'), 60000);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.status === 429) {
                const errorBody = await response.json().catch(() => ({ error: { message: 'Rate limit details unavailable.' } }));
                const specificMessage = errorBody?.error?.message || 'Check your API plan limits.';
                throw new Error(`Rate limit hit. ${specificMessage} Lower your concurrency or wait.`);
            }
            
            if (response.status >= 400 && response.status < 500 && response.status !== 408) {
                const errorBody = await response.text();
                throw new Error(`API request failed with permanent client error ${response.status}: ${errorBody}`);
            }

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API request failed for ${provider} with server status ${response.status}: ${errorBody}`);
            }
            
            const data = await response.json();

            if (provider === 'claude') {
                if (data.content && data.content[0] && data.content[0].text) {
                     return parseJsonResponse(data.content[0].text);
                } else {
                    throw new Error('Invalid response structure from Claude API');
                }
            }

            if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                return parseJsonResponse(data.choices[0].message.content);
            }

            throw new Error('Invalid response structure from API');

        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < MAX_RETRIES) {
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                console.warn(`Attempt ${attempt}/${MAX_RETRIES} failed for ${url}. Retrying in ${Math.round(delay/1000)}s... Error: ${lastError.message}`);
                await sleep(delay);
            }
        }
    }
    
    throw lastError; // If all retries fail, throw the last error
};

export const analyzeUrl = async (url: string, config: AIWorkerConfig): Promise<AnalysisResultData> => {
    try {
        if (config.provider === 'gemini') {
            return await analyzeWithGemini(url);
        } else {
            return await analyzeWithOpenAICompatible(url, config);
        }
    } catch (error) {
        console.error(`Error analyzing URL ${url} with ${config.provider} after all retries:`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to analyze ${url}. Reason: ${error.message}`);
        }
        throw new Error(`An unknown error occurred while analyzing ${url}.`);
    }
};