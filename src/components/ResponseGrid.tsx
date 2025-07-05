'use client';

import { PromptRequest } from '@/types';
import { useStore } from '@/stores/useStore';
import ResponseCard from './ResponseCard';

interface ResponseGridProps {
  onEditProvider: (providerId: string) => void;
  onRerunProvider: (providerId: string) => void;
  isLoading: boolean;
  currentRequest: PromptRequest | null;
}

export default function ResponseGrid({ onEditProvider, onRerunProvider, isLoading, currentRequest }: ResponseGridProps) {
  const { providers } = useStore();
  
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    <div className="space-y-6">
      {currentRequest && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Current Request</h3>
              <p className="text-sm text-gray-500">
                {new Date(currentRequest.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Settings: T={currentRequest.settings.temperature}, Max={currentRequest.settings.maxTokens}, P={currentRequest.settings.topP}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Prompt:</div>
            <div className="text-sm text-gray-900 whitespace-pre-wrap">{currentRequest.prompt}</div>
          </div>

          {currentRequest.systemPrompt && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-700 mb-2">System Prompt:</div>
              <div className="text-sm text-blue-900 whitespace-pre-wrap">{currentRequest.systemPrompt}</div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Response Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentRequest.responses
              .filter(r => r.status === 'completed')
              .map((response) => (
                <div key={response.id} className="text-center">
                  <div className="font-medium text-gray-900">{response.providerName}</div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div>⏱️ {response.responseTime}ms</div>
                    {response.tokenUsage && (
                      <div>🔢 {response.tokenUsage.totalTokens} tokens</div>
                    )}
                    {response.cost && (
                      <div>💰 ${response.cost.toFixed(4)}</div>
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