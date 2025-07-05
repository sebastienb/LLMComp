export interface LLMProvider {
  id: string;
  name: string;
  apiUrl: string;
  apiKey?: string; // Optional for unauthenticated endpoints
  model: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  customHeaders?: Record<string, string>;
  timeout?: number;
  isActive: boolean;
  requiresAuth?: boolean; // Flag to indicate if authentication is required
}

export interface LLMResponse {
  id: string;
  providerId: string;
  providerName: string;
  content: string;
  timestamp: number;
  responseTime: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
  error?: string;
  status: 'pending' | 'streaming' | 'completed' | 'error';
  isStreaming?: boolean;
}

export interface PromptRequest {
  id: string;
  prompt: string;
  systemPrompt?: string;
  timestamp: number;
  responses: LLMResponse[];
  settings: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };
}

export interface AppState {
  providers: LLMProvider[];
  currentPrompt: string;
  systemPrompt: string;
  promptSettings: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };
  currentRequest: PromptRequest | null;
  history: PromptRequest[];
  isLoading: boolean;
}