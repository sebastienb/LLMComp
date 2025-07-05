'use client';

import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { LLMProvider, LLMResponse } from '@/types';
import { callLLM } from '@/lib/api';
import { useStreamingLLM } from '@/hooks/useStreamingLLM';
import Header from '@/components/Header';
import PromptInput from '@/components/PromptInput';
import ResponseGrid from '@/components/ResponseGrid';
import ProviderModal from '@/components/ProviderModal';
import SettingsModal from '@/components/SettingsModal';
import RerunModal from '@/components/RerunModal';
import ThemePicker from '@/components/ThemePicker';
import { getThemeClasses } from '@/lib/themes';

export default function Home() {
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRerunModal, setShowRerunModal] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [rerunProvider, setRerunProvider] = useState<LLMProvider | null>(null);
  
  const { 
    providers, 
    currentRequest, 
    isLoading, 
    currentPrompt, 
    systemPrompt, 
    theme,
    setCurrentRequest,
    addToHistory,
    setLoading,
    updateResponse,
    updateProvider
  } = useStore();

  const themeClasses = getThemeClasses(theme);
  
  const { streamLLMResponse } = useStreamingLLM();

  const handleAddProvider = () => {
    setEditingProvider(null);
    setShowProviderModal(true);
  };

  const handleEditProvider = (providerId: string) => {
    setEditingProvider(providerId);
    setShowProviderModal(true);
  };

  const handleRerunProvider = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      setRerunProvider(provider);
      setShowRerunModal(true);
    }
  };

  const handleRerun = async (providerId: string, settings: {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
  }) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider || !currentPrompt.trim()) return;

    // Update provider model if it changed
    if (provider.model !== settings.model) {
      updateProvider(providerId, { model: settings.model });
    }

    setLoading(true);
    
    const requestId = currentRequest?.id || `req-${Date.now()}`;
    
    // Create or update response for this provider
    const responseId = `${providerId}-${Date.now()}`;
    const newResponse: LLMResponse = {
      id: responseId,
      providerId: providerId,
      providerName: provider.name,
      content: '',
      timestamp: Date.now(),
      responseTime: 0,
      status: 'pending' as const,
    };

    // If no current request, create a new one
    if (!currentRequest) {
      const newRequest = {
        id: requestId,
        prompt: currentPrompt,
        systemPrompt: systemPrompt || undefined,
        timestamp: Date.now(),
        responses: [newResponse],
        settings: {
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          topP: settings.topP,
        },
      };
      setCurrentRequest(newRequest);
      addToHistory(newRequest);
    } else {
      // Update existing request with new response
      const updatedRequest = {
        ...currentRequest,
        responses: [
          ...currentRequest.responses.filter(r => r.providerId !== providerId),
          newResponse
        ]
      };
      setCurrentRequest(updatedRequest);
      // Update history as well
      addToHistory(updatedRequest);
    }

    // Add the response to the store immediately
    updateResponse(requestId, newResponse);

    try {
      // Try streaming first
      try {
        await streamLLMResponse(requestId, {
          provider: { ...provider, model: settings.model },
          prompt: currentPrompt,
          systemPrompt: systemPrompt || undefined,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          topP: settings.topP,
        });
      } catch (streamingError) {
        console.warn(`[${provider.name}] Streaming failed, falling back to non-streaming:`, streamingError);
        
        // Fallback to non-streaming
        const response = await callLLM(
          { ...provider, model: settings.model },
          {
            prompt: currentPrompt,
            systemPrompt: systemPrompt || undefined,
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
            topP: settings.topP,
          }
        );
        
        // Add a note that this was a fallback
        const fallbackResult = {
          ...response,
          content: response.content + '\n\n_Note: This response used non-streaming fallback due to streaming issues._',
        };

        updateResponse(requestId, fallbackResult);
      }
    } catch (error) {
      const errorResponse: LLMResponse = {
        id: responseId,
        providerId: providerId,
        providerName: provider.name,
        content: '',
        timestamp: Date.now(),
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      };

      updateResponse(requestId, errorResponse);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={themeClasses.body}>
      <Header 
        onAddProvider={handleAddProvider}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenThemePicker={() => setShowThemePicker(true)}
      />
      
      <main className={themeClasses.container}>
        <div className={
          theme === 'tui' ? 'space-y-1' : 
          theme === 'monitor' ? 'space-y-2' :
          'space-y-8'
        }>
          <PromptInput />
          
          {providers.length === 0 ? (
            <div className={`text-center ${
              theme === 'tui' ? 'py-4' : 
              theme === 'monitor' ? 'py-6' :
              'py-12'
            }`}>
              <h2 className={`${themeClasses.heading} mb-4`}>
                {theme === 'tui' ? 'NO PROVIDERS' : 
                 theme === 'monitor' ? '■ NO PROVIDERS CONFIGURED' :
                 'No LLM Providers Configured'}
              </h2>
              <p className={`${themeClasses.textMuted} ${
                theme === 'tui' ? 'mb-2' : 
                theme === 'monitor' ? 'mb-4' :
                'mb-6'
              }`}>
                {theme === 'tui' ? 'Add provider to start' : 
                 theme === 'monitor' ? 'INITIALIZE FIRST PROVIDER TO BEGIN COMPARISON OPERATIONS' :
                 'Add your first LLM provider to start comparing responses'}
              </p>
              <button
                onClick={handleAddProvider}
                className={themeClasses.buttonPrimary}
              >
                {theme === 'tui' ? '+ PROVIDER' : 
                 theme === 'monitor' ? '+ INITIALIZE PROVIDER' :
                 'Add Provider'}
              </button>
            </div>
          ) : (
            <ResponseGrid 
              onEditProvider={handleEditProvider}
              onRerunProvider={handleRerunProvider}
              isLoading={isLoading}
              currentRequest={currentRequest}
            />
          )}
        </div>
      </main>

      {showProviderModal && (
        <ProviderModal
          isOpen={showProviderModal}
          onClose={() => setShowProviderModal(false)}
          editingId={editingProvider}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {showRerunModal && rerunProvider && (
        <RerunModal
          isOpen={showRerunModal}
          onClose={() => {
            setShowRerunModal(false);
            setRerunProvider(null);
          }}
          provider={rerunProvider}
          onRerun={handleRerun}
        />
      )}

      {showThemePicker && (
        <ThemePicker
          isOpen={showThemePicker}
          onClose={() => setShowThemePicker(false)}
        />
      )}
    </div>
  );
}
