'use client';

import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { PromptRequest, LLMResponse } from '@/types';
import { callLLM } from '@/lib/api';
import { useStreamingLLM } from '@/hooks/useStreamingLLM';
import Link from 'next/link';

export default function PromptInput() {
  const {
    currentPrompt,
    systemPrompt,
    promptSettings,
    providers,
    setCurrentPrompt,
    setSystemPrompt,
    updatePromptSettings,
    setCurrentRequest,
    addToHistory,
    setLoading,
    updateResponse,
  } = useStore();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [useStreaming, setUseStreaming] = useState(true);
  const { streamLLMResponse } = useStreamingLLM();

  const activeProviders = providers.filter(p => p.isActive);

  const handlePromptChange = (value: string) => {
    setCurrentPrompt(value);
    setCharacterCount(value.length);
  };

  const handleRunAll = async () => {
    if (!currentPrompt.trim() || activeProviders.length === 0) return;

    setLoading(true);
    
    const requestId = `req-${Date.now()}`;
    const responses: LLMResponse[] = activeProviders.map(provider => ({
      id: `${provider.id}-${Date.now()}`,
      providerId: provider.id,
      providerName: provider.name,
      content: '',
      timestamp: Date.now(),
      responseTime: 0,
      status: 'pending' as const,
    }));

    const newRequest: PromptRequest = {
      id: requestId,
      prompt: currentPrompt,
      systemPrompt: systemPrompt || undefined,
      timestamp: Date.now(),
      responses,
      settings: promptSettings,
    };

    setCurrentRequest(newRequest);
    addToHistory(newRequest);

    const promises = activeProviders.map(async (provider) => {
      try {
        if (useStreaming) {
          try {
            // Try streaming first
            await streamLLMResponse(requestId, {
              provider,
              prompt: currentPrompt,
              systemPrompt: systemPrompt || undefined,
              temperature: promptSettings.temperature,
              maxTokens: promptSettings.maxTokens,
              topP: promptSettings.topP,
            });
          } catch (streamingError) {
            console.warn(`[${provider.name}] Streaming failed, falling back to non-streaming:`, streamingError);
            
            // Update status to show fallback attempt
            const fallbackResponse: LLMResponse = {
              id: `${provider.id}-${Date.now()}`,
              providerId: provider.id,
              providerName: provider.name,
              content: '',
              timestamp: Date.now(),
              responseTime: 0,
              status: 'pending',
            };
            updateResponse(requestId, fallbackResponse);
            
            // Fallback to non-streaming
            const response = await callLLM(provider, {
              prompt: currentPrompt,
              systemPrompt: systemPrompt || undefined,
              temperature: promptSettings.temperature,
              maxTokens: promptSettings.maxTokens,
              topP: promptSettings.topP,
            });
            
            // Add a note that this was a fallback
            const fallbackResult = {
              ...response,
              content: response.content + '\n\n_Note: This response used non-streaming fallback due to streaming issues._',
            };

            updateResponse(requestId, fallbackResult);
          }
        } else {
          // Use non-streaming directly
          const response = await callLLM(provider, {
            prompt: currentPrompt,
            systemPrompt: systemPrompt || undefined,
            temperature: promptSettings.temperature,
            maxTokens: promptSettings.maxTokens,
            topP: promptSettings.topP,
          });

          updateResponse(requestId, response);
        }
      } catch (error) {
        const errorResponse: LLMResponse = {
          id: `${provider.id}-${Date.now()}`,
          providerId: provider.id,
          providerName: provider.name,
          content: '',
          timestamp: Date.now(),
          responseTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
        };

        updateResponse(requestId, errorResponse);
      }
    });

    await Promise.all(promises);
    setLoading(false);
  };

  const handleClear = () => {
    setCurrentPrompt('');
    setCharacterCount(0);
    setCurrentRequest(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Prompt
          </label>
          <textarea
            id="prompt"
            value={currentPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="Enter your prompt here..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={6}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">
              {characterCount} characters
            </span>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
          </div>
        </div>

        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div>
              <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                System Prompt (Optional)
              </label>
              <textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Enter system prompt..."
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature: {promptSettings.temperature}
                </label>
                <input
                  type="range"
                  id="temperature"
                  min="0"
                  max="2"
                  step="0.1"
                  value={promptSettings.temperature}
                  onChange={(e) => updatePromptSettings({ temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  id="maxTokens"
                  value={promptSettings.maxTokens}
                  onChange={(e) => updatePromptSettings({ maxTokens: parseInt(e.target.value) || 1000 })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="4000"
                />
              </div>

              <div>
                <label htmlFor="topP" className="block text-sm font-medium text-gray-700 mb-2">
                  Top P: {promptSettings.topP}
                </label>
                <input
                  type="range"
                  id="topP"
                  min="0"
                  max="1"
                  step="0.1"
                  value={promptSettings.topP}
                  onChange={(e) => updatePromptSettings({ topP: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={useStreaming}
                  onChange={(e) => setUseStreaming(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Enable Streaming</span>
              </label>
              <span className="text-xs text-gray-500">
                Streams responses in real-time to prevent timeouts
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-gray-600">
            {activeProviders.length} active provider{activeProviders.length !== 1 ? 's' : ''}
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear
            </button>
            
            <Link
              href="/history"
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>History</span>
            </Link>
            
            <button
              onClick={handleRunAll}
              disabled={!currentPrompt.trim() || activeProviders.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Run All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}