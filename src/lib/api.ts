import axios, { AxiosResponse } from 'axios';
import { LLMProvider, LLMResponse } from '@/types';
import { decryptApiKey } from './crypto';

// Utility function to make proxied requests to avoid CORS issues
async function makeProxiedRequest(url: string, options: {
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  data?: unknown;
}): Promise<AxiosResponse> {
  const { method, headers, data } = options;
  
  if (method === 'GET') {
    const params = new URLSearchParams({
      url,
      ...(headers && { headers: JSON.stringify(headers) })
    });
    
    return axios.get(`/api/proxy/llm?${params}`, {
      timeout: 300000, // 5 minute timeout for streaming requests
    });
  } else {
    return axios.post('/api/proxy/llm', {
      url,
      headers,
      data,
      method
    }, {
      timeout: 300000, // 5 minute timeout for streaming requests
    });
  }
}

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

export async function callLLM(
  provider: LLMProvider,
  request: LLMRequest
): Promise<LLMResponse> {
  const startTime = Date.now();
  const responseId = `${provider.id}-${Date.now()}`;
  
  try {
    const decryptedApiKey = provider.apiKey ? decryptApiKey(provider.apiKey) : undefined;
    
    let response: AxiosResponse;
    
    // Handle different provider formats
    if (provider.name.toLowerCase().includes('openai') || provider.name.toLowerCase().includes('gpt')) {
      response = await callOpenAI(provider, request, decryptedApiKey);
    } else if (provider.name.toLowerCase().includes('lm studio')) {
      response = await callLMStudio(provider, request);
    } else if (provider.name.toLowerCase().includes('anthropic') || provider.name.toLowerCase().includes('claude')) {
      response = await callAnthropic(provider, request, decryptedApiKey);
    } else if (provider.name.toLowerCase().includes('google') || provider.name.toLowerCase().includes('gemini')) {
      response = await callGoogle(provider, request, decryptedApiKey);
    } else if (provider.name.toLowerCase().includes('ollama')) {
      response = await callOllama(provider, request);
    } else if (provider.name.toLowerCase().includes('text generation webui')) {
      response = await callTextGenWebUI(provider, request);
    } else {
      // Generic API call
      response = await callGeneric(provider, request, decryptedApiKey);
    }
    
    const responseTime = Date.now() - startTime;
    
    return {
      id: responseId,
      providerId: provider.id,
      providerName: provider.name,
      content: extractContent(response.data, provider.name),
      timestamp: Date.now(),
      responseTime,
      tokenUsage: extractTokenUsage(response.data, provider.name),
      cost: calculateCost(response.data, provider.name),
      status: 'completed'
    };
    
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime;
    
    return {
      id: responseId,
      providerId: provider.id,
      providerName: provider.name,
      content: '',
      timestamp: Date.now(),
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      status: 'error'
    };
  }
}

async function callOpenAI(provider: LLMProvider, request: LLMRequest, apiKey?: string) {
  const messages = [];
  
  if (request.systemPrompt) {
    messages.push({ role: 'system', content: request.systemPrompt });
  }
  
  messages.push({ role: 'user', content: request.prompt });
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...provider.customHeaders,
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return makeProxiedRequest(`${provider.apiUrl}/v1/chat/completions`, {
    method: 'POST',
    headers,
    data: {
      model: provider.model,
      messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      top_p: request.topP,
    }
  });
}

async function callAnthropic(provider: LLMProvider, request: LLMRequest, apiKey?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
    ...provider.customHeaders,
  };
  
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  return makeProxiedRequest(`${provider.apiUrl}/v1/messages`, {
    method: 'POST',
    headers,
    data: {
      model: provider.model,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      top_p: request.topP,
      system: request.systemPrompt,
      messages: [
        { role: 'user', content: request.prompt }
      ],
    }
  });
}

async function callGoogle(provider: LLMProvider, request: LLMRequest, apiKey?: string) {
  return makeProxiedRequest(`${provider.apiUrl}/v1/models/${provider.model}:generateContent${apiKey ? `?key=${apiKey}` : ''}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...provider.customHeaders,
    },
    data: {
      contents: [
        {
          parts: [
            { text: request.systemPrompt ? `${request.systemPrompt}\n\n${request.prompt}` : request.prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: request.temperature,
        maxOutputTokens: request.maxTokens,
        topP: request.topP,
      },
    }
  });
}

async function callLMStudio(provider: LLMProvider, request: LLMRequest) {
  console.log('Calling LM Studio with:', { url: provider.apiUrl, model: provider.model });
  
  const messages = [];
  
  if (request.systemPrompt) {
    messages.push({ role: 'system', content: request.systemPrompt });
  }
  
  messages.push({ role: 'user', content: request.prompt });

  const requestData = {
    model: provider.model,
    messages,
    temperature: request.temperature,
    max_tokens: request.maxTokens,
    top_p: request.topP,
    stream: false,
  };

  console.log('LM Studio request data:', requestData);

  return makeProxiedRequest(`${provider.apiUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...provider.customHeaders,
    },
    data: requestData
  });
}

async function callOllama(provider: LLMProvider, request: LLMRequest) {
  return makeProxiedRequest(`${provider.apiUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...provider.customHeaders,
    },
    data: {
      model: provider.model,
      prompt: request.systemPrompt ? `${request.systemPrompt}\n\n${request.prompt}` : request.prompt,
      stream: false,
      options: {
        temperature: request.temperature,
        num_predict: request.maxTokens,
        top_p: request.topP,
      },
    }
  });
}

async function callTextGenWebUI(provider: LLMProvider, request: LLMRequest) {
  const messages = [];
  
  if (request.systemPrompt) {
    messages.push({ role: 'system', content: request.systemPrompt });
  }
  
  messages.push({ role: 'user', content: request.prompt });

  return makeProxiedRequest(`${provider.apiUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...provider.customHeaders,
    },
    data: {
      model: provider.model,
      messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      top_p: request.topP,
    }
  });
}

async function callGeneric(provider: LLMProvider, request: LLMRequest, apiKey?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...provider.customHeaders,
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return makeProxiedRequest(provider.apiUrl, {
    method: 'POST',
    headers,
    data: {
      prompt: request.prompt,
      system_prompt: request.systemPrompt,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      top_p: request.topP,
    }
  });
}

function extractContent(data: unknown, providerName: string): string {
  const dataObj = data as Record<string, unknown>;
  
  if (providerName.toLowerCase().includes('openai') || providerName.toLowerCase().includes('text generation webui')) {
    const choices = dataObj.choices as Record<string, unknown>[];
    const message = choices?.[0]?.message as Record<string, unknown>;
    return message?.content as string || '';
  } else if (providerName.toLowerCase().includes('lm studio')) {
    // LM Studio might have slightly different response format
    const choices = dataObj.choices as Record<string, unknown>[];
    if (choices && choices[0]) {
      const message = choices[0].message as Record<string, unknown>;
      return message?.content as string || '';
    }
    // Fallback for different response formats
    return (dataObj.content as string) || (dataObj.text as string) || '';
  } else if (providerName.toLowerCase().includes('anthropic')) {
    const content = dataObj.content as Record<string, unknown>[];
    return content?.[0]?.text as string || '';
  } else if (providerName.toLowerCase().includes('google')) {
    const candidates = dataObj.candidates as Record<string, unknown>[];
    const candidate = candidates?.[0] as Record<string, unknown>;
    const content = candidate?.content as Record<string, unknown>;
    const parts = content?.parts as Record<string, unknown>[];
    return parts?.[0]?.text as string || '';
  } else if (providerName.toLowerCase().includes('ollama')) {
    return dataObj.response as string || '';
  } else {
    return (dataObj.content as string) || (dataObj.text as string) || (dataObj.response as string) || '';
  }
}

function extractTokenUsage(data: unknown, providerName: string) {
  const dataObj = data as Record<string, unknown>;
  
  if (providerName.toLowerCase().includes('openai')) {
    const usage = dataObj.usage as Record<string, number>;
    return usage ? {
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
    } : undefined;
  } else if (providerName.toLowerCase().includes('anthropic')) {
    const usage = dataObj.usage as Record<string, number>;
    return usage ? {
      promptTokens: usage.input_tokens,
      completionTokens: usage.output_tokens,
      totalTokens: usage.input_tokens + usage.output_tokens,
    } : undefined;
  } else if (providerName.toLowerCase().includes('google')) {
    const usageMetadata = dataObj.usageMetadata as Record<string, number>;
    return usageMetadata ? {
      promptTokens: usageMetadata.promptTokenCount,
      completionTokens: usageMetadata.candidatesTokenCount,
      totalTokens: usageMetadata.totalTokenCount,
    } : undefined;
  }
  
  return undefined;
}

function calculateCost(data: unknown, providerName: string): number | undefined {
  // Basic cost calculation - would need real pricing data
  const usage = extractTokenUsage(data, providerName);
  if (!usage) return undefined;
  
  // Rough estimates - should be configurable
  const costPer1kTokens = 0.002; // $0.002 per 1k tokens
  return (usage.totalTokens / 1000) * costPer1kTokens;
}

export async function testConnection(provider: LLMProvider): Promise<boolean> {
  try {
    console.log('Testing connection for provider:', provider.name, provider.apiUrl);
    
    // For local providers without models, try to fetch models first
    if (provider.name.toLowerCase().includes('lm studio') || 
        provider.name.toLowerCase().includes('ollama') ||
        provider.name.toLowerCase().includes('text generation webui')) {
      
      // First try to fetch models to see if the endpoint is reachable
      try {
        const models = await fetchModels(provider.name, provider.apiUrl, provider.apiKey);
        console.log('Fetched models for connection test:', models);
        
        if (models.length === 0) {
          console.log('No models found, but endpoint appears reachable');
          return true; // Endpoint is reachable even if no models
        }
        
        // Use the first available model for testing
        const testProvider = { ...provider, model: models[0] };
        const testRequest: LLMRequest = {
          prompt: 'Hello',
          temperature: 0.1,
          maxTokens: 10,
          topP: 1.0,
        };
        
        const response = await callLLM(testProvider, testRequest);
        return response.status === 'completed';
        
      } catch (error) {
        console.error('Model fetch failed during connection test:', error);
        return false;
      }
    }
    
    // For cloud providers, use the configured model
    const testRequest: LLMRequest = {
      prompt: 'Hello, this is a test message. Please respond with "Test successful".',
      temperature: 0.1,
      maxTokens: 50,
      topP: 1.0,
    };
    
    const response = await callLLM(provider, testRequest);
    return response.status === 'completed';
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

export async function fetchModels(
  providerName: string,
  apiUrl: string,
  apiKey?: string
): Promise<string[]> {
  try {
    const decryptedApiKey = apiKey && apiKey.includes('U2FsdGVk') ? decryptApiKey(apiKey) : apiKey;
    
    if (providerName.toLowerCase().includes('openai')) {
      return await fetchOpenAIModels(apiUrl, decryptedApiKey);
    } else if (providerName.toLowerCase().includes('lm studio')) {
      return await fetchLMStudioModels(apiUrl);
    } else if (providerName.toLowerCase().includes('anthropic')) {
      return await fetchAnthropicModels(apiUrl, decryptedApiKey);
    } else if (providerName.toLowerCase().includes('google')) {
      return await fetchGoogleModels(apiUrl, decryptedApiKey);
    } else if (providerName.toLowerCase().includes('ollama')) {
      return await fetchOllamaModels(apiUrl);
    } else if (providerName.toLowerCase().includes('text generation webui')) {
      return await fetchTextGenWebUIModels(apiUrl);
    } else {
      // For custom providers, try to fetch from a common endpoint
      return await fetchGenericModels(apiUrl, decryptedApiKey);
    }
  } catch (error) {
    console.error('Failed to fetch models:', error);
    return [];
  }
}

async function fetchOpenAIModels(apiUrl: string, apiKey?: string): Promise<string[]> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await makeProxiedRequest(`${apiUrl}/v1/models`, {
    method: 'GET',
    headers,
  });
  
  return response.data.data
    .filter((model: { id: string }) => 
      model.id.includes('gpt') || 
      model.id.includes('text-davinci') || 
      model.id.includes('text-curie')
    )
    .map((model: { id: string }) => model.id)
    .sort();
}

async function fetchAnthropicModels(apiUrl: string, apiKey?: string): Promise<string[]> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    };
    
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    const response = await makeProxiedRequest(`${apiUrl}/v1/models`, {
      method: 'GET',
      headers,
    });
    
    // Handle Anthropic's models API response format
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data
        .filter((model: { id: string; type?: string }) => 
          model.id.includes('claude') && model.type === 'model'
        )
        .map((model: { id: string }) => model.id)
        .sort();
    }
    
    // If API call fails, fallback to known models
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ];
  } catch (error) {
    console.warn('Failed to fetch Anthropic models via API, using fallback:', error);
    // Return known models as fallback
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ];
  }
}

async function fetchGoogleModels(apiUrl: string, apiKey?: string): Promise<string[]> {
  const response = await makeProxiedRequest(`${apiUrl}/v1/models${apiKey ? `?key=${apiKey}` : ''}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return response.data.models
    .filter((model: { name: string; supportedGenerationMethods?: string[] }) => 
      (model.name.includes('gemini') || 
       model.name.includes('chat-bison') ||
       model.name.includes('text-bison')) &&
      model.supportedGenerationMethods?.includes('generateContent')
    )
    .map((model: { name: string }) => {
      const modelName = model.name.split('/').pop();
      return modelName || model.name;
    })
    .sort();
}

async function fetchLMStudioModels(apiUrl: string): Promise<string[]> {
  try {
    console.log('Fetching LM Studio models from:', apiUrl);
    const response = await makeProxiedRequest(`${apiUrl}/v1/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('LM Studio models response:', response.data);
    
    // Handle standard OpenAI-compatible format
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      const models = response.data.data
        .map((model: { id: string }) => model.id)
        .sort();
      
      // If we get models, return them
      if (models.length > 0) {
        return models;
      }
    }
    
    // Handle direct array format
    if (response.data && Array.isArray(response.data)) {
      const models = response.data
        .map((model: { id?: string; name?: string }) => model.id || model.name)
        .filter(Boolean) as string[];
      
      if (models.length > 0) {
        return models;
      }
    }
    
    // If no models found but endpoint responded, return a default
    // This allows users to manually specify model names
    console.log('No models found in response, but endpoint is accessible');
    return [];
    
  } catch (error) {
    console.error('Failed to fetch LM Studio models:', error);
    throw error; // Re-throw to show user the specific error
  }
}

async function fetchOllamaModels(apiUrl: string): Promise<string[]> {
  try {
    const response = await makeProxiedRequest(`${apiUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.data.models
      .map((model: { name: string }) => model.name)
      .sort();
  } catch {
    return [];
  }
}

async function fetchTextGenWebUIModels(apiUrl: string): Promise<string[]> {
  try {
    const response = await makeProxiedRequest(`${apiUrl}/v1/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.data.data
      .map((model: { id: string }) => model.id)
      .sort();
  } catch {
    return [];
  }
}

async function fetchGenericModels(apiUrl: string, apiKey?: string): Promise<string[]> {
  try {
    // Try common endpoints for model listing
    const endpoints = ['/v1/models', '/models', '/api/models'];
    
    for (const endpoint of endpoints) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await makeProxiedRequest(`${apiUrl}${endpoint}`, {
          method: 'GET',
          headers,
        });
        
        // Try to extract model names from various response formats
        if (response.data.data && Array.isArray(response.data.data)) {
          return response.data.data.map((model: { id?: string; name?: string }) => 
            model.id || model.name
          ).filter(Boolean) as string[];
        } else if (response.data.models && Array.isArray(response.data.models)) {
          return response.data.models.map((model: { id?: string; name?: string }) => 
            model.id || model.name
          ).filter(Boolean) as string[];
        } else if (Array.isArray(response.data)) {
          return response.data.map((model: string | { id?: string; name?: string }) => 
            typeof model === 'string' ? model : (model.id || model.name)
          ).filter(Boolean) as string[];
        }
      } catch {
        continue;
      }
    }
    
    return [];
  } catch {
    return [];
  }
}