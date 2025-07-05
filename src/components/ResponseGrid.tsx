'use client';

import { PromptRequest } from '@/types';
import { useStore } from '@/stores/useStore';
import { getThemeClasses } from '@/lib/themes';
import ResponseCard from './ResponseCard';

interface ResponseGridProps {
  onEditProvider: (providerId: string) => void;
  onRerunProvider: (providerId: string) => void;
  isLoading: boolean;
  currentRequest: PromptRequest | null;
}

export default function ResponseGrid({ onEditProvider, onRerunProvider, isLoading, currentRequest }: ResponseGridProps) {
  const { providers, theme } = useStore();
  const themeClasses = getThemeClasses(theme);
  
  const activeProviders = providers.filter(p => p.isActive);
  
  if (providers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No providers configured. Please add a provider to get started.</p>
      </div>
    );
  }
  
  if (activeProviders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No active providers. Please activate at least one provider to run comparisons.</p>
        </div>
        
        <div className={themeClasses.grid}>
          {providers.map((provider) => (
            <ResponseCard
              key={provider.id}
              provider={provider}
              response={undefined}
              isLoading={false}
              onEditProvider={onEditProvider}
              onRerunProvider={onRerunProvider}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={theme === 'tui' ? 'space-y-1' : 'space-y-6'}>
      {currentRequest && (
        <div className={`${themeClasses.card} ${theme === 'tui' ? 'p-2' : 'p-4'}`}>
          <div className={`flex justify-between items-start ${theme === 'tui' ? 'mb-1' : 'mb-4'}`}>
            <div>
              <h3 className={`${themeClasses.subheading} ${theme === 'tui' ? 'text-sm' : 'text-lg'}`}>
                {theme === 'tui' ? 'CURRENT REQ' : 'Current Request'}
              </h3>
              <p className={themeClasses.textSmall}>
                {theme === 'tui' 
                  ? new Date(currentRequest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : new Date(currentRequest.timestamp).toLocaleString()
                }
              </p>
            </div>
            <div className={themeClasses.textSmall}>
              {theme === 'tui' 
                ? `T:${currentRequest.settings.temperature} M:${currentRequest.settings.maxTokens} P:${currentRequest.settings.topP}`
                : `Settings: T=${currentRequest.settings.temperature}, Max=${currentRequest.settings.maxTokens}, P=${currentRequest.settings.topP}`
              }
            </div>
          </div>
          
          <div className={theme === 'tui' 
            ? 'border border-green-400 bg-gray-900 p-1 mb-1' 
            : 'bg-gray-50 rounded-lg p-4 mb-4'
          }>
            <div className={`${themeClasses.textSmall} font-medium ${theme === 'tui' ? 'mb-1' : 'mb-2'}`}>
              {theme === 'tui' ? 'PROMPT:' : 'Prompt:'}
            </div>
            <div className={`${themeClasses.textSmall} whitespace-pre-wrap ${theme === 'tui' ? 'max-h-16 overflow-y-auto' : ''}`}>
              {currentRequest.prompt}
            </div>
          </div>

          {currentRequest.systemPrompt && (
            <div className={theme === 'tui' 
              ? 'border border-cyan-400 bg-gray-900 p-1' 
              : 'bg-blue-50 rounded-lg p-4'
            }>
              <div className={`${themeClasses.textSmall} font-medium ${theme === 'tui' ? 'text-cyan-400 mb-1' : 'text-blue-700 mb-2'}`}>
                {theme === 'tui' ? 'SYS:' : 'System Prompt:'}
              </div>
              <div className={`${themeClasses.textSmall} ${theme === 'tui' ? 'text-cyan-400 max-h-12 overflow-y-auto' : 'text-blue-900'} whitespace-pre-wrap`}>
                {currentRequest.systemPrompt}
              </div>
            </div>
          )}
        </div>
      )}

      <div className={themeClasses.grid}>
        {providers.map((provider) => {
          const response = currentRequest?.responses.find(r => r.providerId === provider.id);
          
          return (
            <ResponseCard
              key={provider.id}
              provider={provider}
              response={response}
              isLoading={isLoading && response?.status === 'pending'}
              onEditProvider={onEditProvider}
              onRerunProvider={onRerunProvider}
            />
          );
        })}
      </div>

      {currentRequest && (
        <div className={`${themeClasses.card} ${theme === 'tui' ? 'p-2' : 'p-4'}`}>
          <h3 className={`${themeClasses.subheading} ${theme === 'tui' ? 'text-sm mb-1' : 'text-lg mb-4'}`}>
            {theme === 'tui' ? 'COMPARISON' : 'Response Comparison'}
          </h3>
          <div className={`grid ${theme === 'tui' ? 'grid-cols-2 md:grid-cols-4 gap-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
            {currentRequest.responses
              .filter(r => r.status === 'completed')
              .map((response) => (
                <div key={response.id} className="text-center">
                  <div className={`${themeClasses.text} font-medium ${theme === 'tui' ? 'text-xs' : ''}`}>
                    {theme === 'tui' ? response.providerName.slice(0, 8).toUpperCase() : response.providerName}
                  </div>
                  <div className={`${themeClasses.textSmall} ${theme === 'tui' ? 'space-y-0' : 'space-y-1'}`}>
                    <div>{theme === 'tui' ? `${response.responseTime}ms` : `⏱️ ${response.responseTime}ms`}</div>
                    {response.tokenUsage && (
                      <div>{theme === 'tui' ? `${response.tokenUsage.totalTokens}t` : `🔢 ${response.tokenUsage.totalTokens} tokens`}</div>
                    )}
                    {response.cost && (
                      <div>{theme === 'tui' ? `$${response.cost.toFixed(4)}` : `💰 $${response.cost.toFixed(4)}`}</div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}