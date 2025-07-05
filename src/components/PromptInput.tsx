'use client';

import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { PromptRequest, LLMResponse } from '@/types';
import { callLLM } from '@/lib/api';
import { useStreamingLLM } from '@/hooks/useStreamingLLM';
import { getThemeClasses } from '@/lib/themes';
import Link from 'next/link';

export default function PromptInput() {
  const {
    currentPrompt,
    systemPrompt,
    promptSettings,
    providers,
    theme,
    setCurrentPrompt,
    setSystemPrompt,
    updatePromptSettings,
    setCurrentRequest,
    addToHistory,
    setLoading,
    updateResponse,
  } = useStore();

  const themeClasses = getThemeClasses(theme);

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
    <div className={`${themeClasses.card} ${theme === 'tui' ? 'p-2' : 'p-6'}`}>
      <div className={theme === 'tui' ? 'space-y-1' : 'space-y-4'}>
        <div>
          <label htmlFor="prompt" className={`block ${themeClasses.textSmall} ${theme === 'tui' ? 'mb-1' : 'mb-2'} font-medium`}>
            {theme === 'tui' ? 'PROMPT:' : 'Prompt'}
          </label>
          <textarea
            id="prompt"
            value={currentPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder={theme === 'tui' ? 'prompt...' : 'Enter your prompt here...'}
            className={`${themeClasses.textarea} ${theme === 'tui' ? 'h-20' : 'h-32'}`}
            rows={theme === 'tui' ? 3 : 6}
          />
          <div className={`flex justify-between items-center ${theme === 'tui' ? 'mt-1' : 'mt-2'}`}>
            <span className={themeClasses.textSmall}>
              {theme === 'tui' ? `${characterCount}c` : `${characterCount} characters`}
            </span>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`${themeClasses.text} ${theme === 'tui' ? 'text-xs hover:text-green-300' : 'text-sm hover:text-blue-800'}`}
            >
              {showAdvanced ? (theme === 'tui' ? '[-]' : 'Hide') : (theme === 'tui' ? '[+]' : 'Show')} {theme === 'tui' ? 'ADV' : 'Advanced Options'}
            </button>
          </div>
        </div>

        {showAdvanced && (
          <div className={`${theme === 'tui' ? 'space-y-1 pt-1 border-t border-green-400' : 'space-y-4 pt-4 border-t border-gray-200'}`}>
            <div>
              <label htmlFor="systemPrompt" className={`block ${themeClasses.textSmall} ${theme === 'tui' ? 'mb-1' : 'mb-2'} font-medium`}>
                {theme === 'tui' ? 'SYS:' : 'System Prompt (Optional)'}
              </label>
              <textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder={theme === 'tui' ? 'system...' : 'Enter system prompt...'}
                className={`${themeClasses.textarea} ${theme === 'tui' ? 'h-16' : 'h-24'}`}
                rows={theme === 'tui' ? 2 : 3}
              />
            </div>

            <div className={`grid ${theme === 'tui' ? 'grid-cols-3 gap-1' : 'grid-cols-1 md:grid-cols-3 gap-4'}`}>
              <div>
                <label htmlFor="temperature" className={`block ${themeClasses.textSmall} ${theme === 'tui' ? 'mb-1' : 'mb-2'} font-medium`}>
                  {theme === 'tui' ? `T:${promptSettings.temperature}` : `Temperature: ${promptSettings.temperature}`}
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
                <label htmlFor="maxTokens" className={`block ${themeClasses.textSmall} ${theme === 'tui' ? 'mb-1' : 'mb-2'} font-medium`}>
                  {theme === 'tui' ? 'MAX:' : 'Max Tokens'}
                </label>
                <input
                  type="number"
                  id="maxTokens"
                  value={promptSettings.maxTokens}
                  onChange={(e) => updatePromptSettings({ maxTokens: parseInt(e.target.value) || 1000 })}
                  className={`${themeClasses.input} ${theme === 'tui' ? 'p-1' : 'p-2'}`}
                  min="1"
                  max="4000"
                />
              </div>

              <div>
                <label htmlFor="topP" className={`block ${themeClasses.textSmall} ${theme === 'tui' ? 'mb-1' : 'mb-2'} font-medium`}>
                  {theme === 'tui' ? `P:${promptSettings.topP}` : `Top P: ${promptSettings.topP}`}
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

            <div className={`flex items-center ${theme === 'tui' ? 'space-x-2 pt-1 border-t border-green-400' : 'space-x-4 pt-4 border-t border-gray-200'}`}>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={useStreaming}
                  onChange={(e) => setUseStreaming(e.target.checked)}
                  className={theme === 'tui' ? 'mr-1' : 'mr-2'}
                />
                <span className={`${themeClasses.textSmall} font-medium`}>
                  {theme === 'tui' ? 'STREAM' : 'Enable Streaming'}
                </span>
              </label>
              <span className={themeClasses.textSmall}>
                {theme === 'tui' ? 'real-time' : 'Streams responses in real-time to prevent timeouts'}
              </span>
            </div>
          </div>
        )}

        <div className={`flex justify-between items-center ${theme === 'tui' ? 'pt-1' : 'pt-4'}`}>
          <div className={themeClasses.textSmall}>
            {theme === 'tui' 
              ? `${activeProviders.length}p` 
              : `${activeProviders.length} active provider${activeProviders.length !== 1 ? 's' : ''}`
            }
          </div>
          
          <div className={`flex ${theme === 'tui' ? 'space-x-1' : 'space-x-4'}`}>
            <button
              onClick={handleClear}
              className={themeClasses.buttonSecondary}
            >
              {theme === 'tui' ? 'CLR' : 'Clear'}
            </button>
            
            <Link
              href="/history"
              className={`${themeClasses.buttonSecondary} flex items-center ${theme === 'tui' ? 'space-x-1' : 'space-x-2'}`}
            >
              <svg className={theme === 'tui' ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{theme === 'tui' ? 'HIST' : 'History'}</span>
            </Link>
            
            <button
              onClick={handleRunAll}
              disabled={!currentPrompt.trim() || activeProviders.length === 0}
              className={`${themeClasses.buttonPrimary} ${(!currentPrompt.trim() || activeProviders.length === 0) 
                ? (theme === 'tui' ? 'opacity-50 cursor-not-allowed' : 'disabled:bg-gray-400 disabled:cursor-not-allowed') 
                : ''
              }`}
            >
              {theme === 'tui' ? 'RUN' : 'Run All'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}