import { useCallback } from 'react';
import { LLMProvider, LLMResponse } from '@/types';
import { useStore } from '@/stores/useStore';
import { decryptApiKey } from '@/lib/crypto';

export interface StreamingRequest {
  provider: LLMProvider;
  prompt: string;
  systemPrompt?: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

export function useStreamingLLM() {
  const { updateResponse } = useStore();
  
  const streamLLMResponse = useCallback(async (
    requestId: string,
    request: StreamingRequest,
    onChunk?: (content: string) => void
  ): Promise<LLMResponse> => {
    const startTime = Date.now();
    const isDebugMode = process.env.NODE_ENV === 'development';
    
    // Find existing response for this provider in the current request
    const store = useStore.getState();
    const currentRequest = store.currentRequest;
    const existingResponse = currentRequest?.responses.find(r => r.providerId === request.provider.id);
    const responseId = existingResponse?.id || `${request.provider.id}-${Date.now()}`;
    
    if (isDebugMode) {
      console.log(`[${request.provider.name}] Using response ID:`, responseId, existingResponse ? '(existing)' : '(new)');
    }
    
    const initialResponse: LLMResponse = {
      ...(existingResponse || {}),
      id: responseId,
      providerId: request.provider.id,
      providerName: request.provider.name,
      content: '',
      timestamp: existingResponse?.timestamp || Date.now(),
      responseTime: 0,
      status: 'streaming',
      isStreaming: true,
    };

    // Add initial response to store immediately
    updateResponse(requestId, initialResponse);

    try {
      const apiKey = request.provider.apiKey ? decryptApiKey(request.provider.apiKey) : undefined;
      
      if (isDebugMode) {
        console.log(`[${request.provider.name}] Starting streaming request for:`, {
          requestId,
          provider: request.provider.name,
          model: request.provider.model,
          promptLength: request.prompt.length,
          hasApiKey: !!apiKey
        });
      }
      
      // Determine the correct streaming endpoint and format
      const { url, headers, data } = buildStreamingRequest(request, apiKey);
      
      const response = await fetch('/api/proxy/llm-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, headers, data }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        console.error(`[${request.provider.name}] Streaming request failed:`, {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url,
          headers: Object.keys(headers)
        });
        
        // Create user-friendly error messages
        let errorMessage = `${request.provider.name} request failed`;
        if (errorData.error) {
          errorMessage += `: ${errorData.error}`;
        }
        if (errorData.details) {
          errorMessage += ` (${errorData.details})`;
        }
        if (response.status === 401) {
          errorMessage += ` - Check your API key`;
        }
        if (response.status === 429) {
          errorMessage += ` - Rate limit exceeded or out of credits`;
        }
        if (response.status === 403) {
          errorMessage += ` - Access denied, check your API key permissions`;
        }
        if (!errorData.error && !errorData.details) {
          errorMessage += `: HTTP ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error('No response body for streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let buffer = '';
      let chunkCount = 0;

      if (isDebugMode) {
        console.log(`[${request.provider.name}] Starting to read streaming response`);
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          if (isDebugMode) {
            console.log(`[${request.provider.name}] Streaming completed. Total chunks: ${chunkCount}, Content length: ${accumulatedContent.length}`);
          }
          break;
        }
        
        chunkCount++;
        buffer += decoder.decode(value, { stream: true });
        
        if (isDebugMode && chunkCount <= 5) {
          console.log(`[${request.provider.name}] Chunk ${chunkCount}:`, decoder.decode(value, { stream: true }));
        }
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (isDebugMode) {
            console.log(`[${request.provider.name}] Processing line:`, line);
          }
          
          try {
            const content = parseStreamingLine(line, request.provider.name);
            if (content) {
              accumulatedContent += content;
              
              if (isDebugMode) {
                console.log(`[${request.provider.name}] Accumulated content so far (${accumulatedContent.length} chars):`, accumulatedContent.substring(0, 100) + (accumulatedContent.length > 100 ? '...' : ''));
              }
              
              // Update the response with new content
              const updatedResponse: LLMResponse = {
                ...initialResponse,
                content: accumulatedContent,
                responseTime: Date.now() - startTime,
              };
              
              updateResponse(requestId, updatedResponse);
              onChunk?.(accumulatedContent);
            }
          } catch (parseError) {
            console.error(`[${request.provider.name}] Failed to parse streaming line:`, {
              line,
              error: parseError,
              provider: request.provider.name
            });
            
            // Don't throw here, continue processing other lines
          }
        }
      }
      
      // Process any remaining buffer content
      if (buffer.trim()) {
        if (isDebugMode) {
          console.log(`[${request.provider.name}] Processing remaining buffer:`, buffer);
        }
        
        try {
          const content = parseStreamingLine(buffer, request.provider.name);
          if (content) {
            accumulatedContent += content;
          }
        } catch (parseError) {
          console.error(`[${request.provider.name}] Failed to parse remaining buffer:`, {
            buffer,
            error: parseError
          });
        }
      }

      // Final response
      const finalResponse: LLMResponse = {
        ...initialResponse,
        content: accumulatedContent,
        responseTime: Date.now() - startTime,
        status: 'completed',
        isStreaming: false,
      };
      
      if (isDebugMode) {
        console.log(`[${request.provider.name}] Final response:`, {
          contentLength: accumulatedContent.length,
          responseTime: finalResponse.responseTime,
          chunkCount
        });
      }

      updateResponse(requestId, finalResponse);
      return finalResponse;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error';
      
      console.error(`[${request.provider.name}] Streaming error:`, {
        error: errorMessage,
        requestId,
        provider: request.provider.name,
        responseTime: Date.now() - startTime
      });
      
      const errorResponse: LLMResponse = {
        ...initialResponse,
        error: errorMessage,
        status: 'error',
        responseTime: Date.now() - startTime,
        isStreaming: false,
      };

      updateResponse(requestId, errorResponse);
      return errorResponse;
    }
  }, [updateResponse]);

  return { streamLLMResponse };
}

function buildStreamingRequest(request: StreamingRequest, apiKey?: string) {
  const { provider, prompt, systemPrompt, temperature, maxTokens, topP } = request;
  const isDebugMode = process.env.NODE_ENV === 'development';
  
  if (isDebugMode) {
    console.log(`[${provider.name}] Building streaming request:`, {
      url: provider.apiUrl,
      model: provider.model,
      hasApiKey: !!apiKey,
      customHeaders: provider.customHeaders
    });
  }
  
  if (provider.name.toLowerCase().includes('openai') || 
      provider.name.toLowerCase().includes('lm studio') ||
      provider.name.toLowerCase().includes('text generation webui')) {
    
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...provider.customHeaders,
    };
    
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    
    // LM Studio specific headers
    if (provider.name.toLowerCase().includes('lm studio')) {
      // LM Studio might need specific headers
      headers['Accept'] = 'text/event-stream';
      headers['Cache-Control'] = 'no-cache';
    }

    const requestData = {
      model: provider.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stream: true,
    };
    
    if (isDebugMode) {
      console.log(`[${provider.name}] OpenAI-compatible request:`, { headers, data: requestData });
    }

    return {
      url: `${provider.apiUrl}/v1/chat/completions`,
      headers,
      data: requestData,
    };
  }
  
  if (provider.name.toLowerCase().includes('anthropic')) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
      ...provider.customHeaders,
    };
    
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    } else {
      console.warn('[Anthropic] No API key provided - request will likely fail');
    }
    
    // Anthropic requires messages to be non-empty
    if (!prompt.trim()) {
      throw new Error('Prompt cannot be empty for Anthropic');
    }
    
    const requestData = {
      model: provider.model,
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
      ...(systemPrompt && { system: systemPrompt }),
    };
    
    if (isDebugMode) {
      console.log(`[${provider.name}] Anthropic request:`, { headers, data: requestData });
    }

    return {
      url: `${provider.apiUrl}/v1/messages`,
      headers,
      data: requestData,
    };
  }

  if (provider.name.toLowerCase().includes('ollama')) {
    const requestData = {
      model: provider.model,
      prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
      stream: true,
      options: {
        temperature,
        num_predict: maxTokens,
        top_p: topP,
      },
    };
    
    if (isDebugMode) {
      console.log(`[${provider.name}] Ollama request:`, { data: requestData });
    }
    
    return {
      url: `${provider.apiUrl}/api/generate`,
      headers: {
        'Content-Type': 'application/json',
        ...provider.customHeaders,
      },
      data: requestData,
    };
  }

  // Fallback for other providers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...provider.customHeaders,
  };
  
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
  
  const requestData = {
    prompt,
    system_prompt: systemPrompt,
    temperature,
    max_tokens: maxTokens,
    top_p: topP,
    stream: true,
  };
  
  if (isDebugMode) {
    console.log(`[${provider.name}] Generic request:`, { headers, data: requestData });
  }

  return {
    url: provider.apiUrl,
    headers,
    data: requestData,
  };
}

function parseStreamingLine(line: string, providerName: string): string | null {
  // Enhanced debug logging
  const isDebugMode = process.env.NODE_ENV === 'development';
  
  if (isDebugMode) {
    console.log(`[${providerName}] Parsing line:`, line);
  }
  
  // Handle Server-Sent Events format
  if (line.startsWith('data: ')) {
    const data = line.slice(6).trim();
    
    if (data === '[DONE]') {
      if (isDebugMode) console.log(`[${providerName}] Stream completed`);
      return null;
    }
    
    // Handle empty data lines
    if (data === '' || data === '{}') {
      return null;
    }
    
    try {
      const parsed = JSON.parse(data);
      
      if (isDebugMode) {
        console.log(`[${providerName}] Parsed JSON:`, parsed);
      }
      
      if (providerName.toLowerCase().includes('openai') || 
          providerName.toLowerCase().includes('lm studio') ||
          providerName.toLowerCase().includes('text generation webui')) {
        
        // Enhanced OpenAI/LM Studio parsing
        const content = parsed.choices?.[0]?.delta?.content;
        
        if (isDebugMode) {
          console.log(`[${providerName}] Parsing choices:`, parsed.choices);
          console.log(`[${providerName}] Delta content:`, content);
        }
        
        if (content !== undefined) {
          if (isDebugMode) console.log(`[${providerName}] Extracted content:`, content);
          return content;
        }
        
        // Check for different LM Studio response formats
        if (providerName.toLowerCase().includes('lm studio')) {
          // Some LM Studio versions might have different response formats
          if (parsed.choices?.[0]?.message?.content) {
            const messageContent = parsed.choices[0].message.content;
            if (isDebugMode) console.log(`[${providerName}] Using message content:`, messageContent);
            return messageContent;
          }
          
          // Check for direct content field
          if (parsed.content) {
            if (isDebugMode) console.log(`[${providerName}] Using direct content:`, parsed.content);
            return parsed.content;
          }
        }
        
        // Check for errors
        if (parsed.error) {
          console.error(`[${providerName}] API Error:`, parsed.error);
          const errorMessage = parsed.error.message || 
                              (typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error));
          throw new Error(`${providerName} API Error: ${errorMessage}`);
        }
        
        return '';
      }
      
      if (providerName.toLowerCase().includes('anthropic')) {
        // Enhanced Anthropic parsing
        // Handle empty objects or objects without type
        if (!parsed.type && Object.keys(parsed).length === 0) {
          if (isDebugMode) console.log(`[${providerName}] Empty object received, skipping`);
          return '';
        }
        
        if (parsed.type === 'content_block_delta') {
          const content = parsed.delta?.text;
          if (isDebugMode) console.log(`[${providerName}] Extracted content:`, content);
          return content || '';
        }
        
        if (parsed.type === 'content_block_start') {
          if (isDebugMode) console.log(`[${providerName}] Content block started`);
          return '';
        }
        
        if (parsed.type === 'content_block_stop') {
          if (isDebugMode) console.log(`[${providerName}] Content block stopped`);
          return '';
        }
        
        if (parsed.type === 'message_start') {
          if (isDebugMode) console.log(`[${providerName}] Message started`);
          return '';
        }
        
        if (parsed.type === 'message_stop') {
          if (isDebugMode) console.log(`[${providerName}] Message stopped`);
          return '';
        }
        
        if (parsed.type === 'message_delta') {
          if (isDebugMode) console.log(`[${providerName}] Message delta:`, parsed.delta);
          return '';
        }
        
        if (parsed.type === 'ping') {
          if (isDebugMode) console.log(`[${providerName}] Ping received`);
          return '';
        }
        
        // Check for errors
        if (parsed.error) {
          console.error(`[${providerName}] API Error:`, parsed.error);
          const errorMessage = parsed.error.message || 
                              (typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error));
          throw new Error(`${providerName} API Error: ${errorMessage}`);
        }
        
        if (isDebugMode) {
          console.log(`[${providerName}] Unhandled Anthropic event type:`, parsed.type);
        }
        
        return '';
      }
      
      if (providerName.toLowerCase().includes('ollama')) {
        const content = parsed.response;
        if (isDebugMode) console.log(`[${providerName}] Extracted content:`, content);
        return content || '';
      }
      
      // Generic fallback
      const content = parsed.content || parsed.text || parsed.delta?.content || '';
      if (isDebugMode) console.log(`[${providerName}] Generic fallback content:`, content);
      return content;
      
    } catch (parseError) {
      console.error(`[${providerName}] Failed to parse JSON in streaming line:`, {
        data,
        error: parseError,
        line
      });
      return null;
    }
  }
  
  // Try to parse as direct JSON (some providers don't use SSE format)
  try {
    const parsed = JSON.parse(line);
    const content = parsed.response || parsed.content || parsed.text || '';
    if (isDebugMode) console.log(`[${providerName}] Direct JSON content:`, content);
    return content;
  } catch {
    // Not JSON, might be raw text
    if (isDebugMode) console.log(`[${providerName}] Non-JSON line, ignoring:`, line);
    return null;
  }
}