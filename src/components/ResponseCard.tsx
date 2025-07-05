'use client';

import { useState } from 'react';
import { LLMProvider, LLMResponse } from '@/types';
import { useStore } from '@/stores/useStore';
import MarkdownRenderer from './MarkdownRenderer';
import StreamingDebugger from './StreamingDebugger';

interface ResponseCardProps {
  provider: LLMProvider;
  response?: LLMResponse;
  isLoading: boolean;
  onEditProvider: (providerId: string) => void;
  onRerunProvider: (providerId: string) => void;
}

export default function ResponseCard({ provider, response, isLoading, onEditProvider, onRerunProvider }: ResponseCardProps) {
  const { toggleProvider } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'streaming':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      case 'pending':
        return 'Pending';
      case 'streaming':
        return 'Streaming...';
      default:
        return 'Ready';
    }
  };

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${
        provider.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'
      }`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium text-gray-900">{provider.name}</h3>
              <p className="text-sm text-gray-500">{provider.model}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleProvider(provider.id)}
                className={`w-4 h-4 rounded-full border-2 ${
                  provider.isActive
                    ? 'bg-green-500 border-green-500'
                    : 'bg-gray-200 border-gray-300'
                }`}
                title={provider.isActive ? 'Active' : 'Inactive'}
              />
              <button
                onClick={() => onRerunProvider(provider.id)}
                className="text-gray-400 hover:text-gray-600"
                title="Rerun with this provider"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={() => setShowDebugger(true)}
                className="text-gray-400 hover:text-gray-600"
                title="Debug streaming"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </button>
              <button
                onClick={() => onEditProvider(provider.id)}
                className="text-gray-400 hover:text-gray-600"
                title="Edit provider"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(response?.status)}`}>
              {getStatusText(response?.status)}
            </span>
            
            {response?.responseTime && (
              <span className="text-xs text-gray-500">
                {response.responseTime}ms
              </span>
            )}
          </div>
        </div>

        <div className="p-4">
          {(isLoading || response?.status === 'streaming') && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              {response?.status === 'streaming' && (
                <span className="ml-2 text-sm text-blue-600">Streaming response...</span>
              )}
            </div>
          )}

          {response?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-sm font-medium text-red-800 mb-1">Error</div>
              <div className="text-sm text-red-700">{response.error}</div>
            </div>
          )}

          {response?.content && (
            <div className="space-y-3">
              <div className="relative">
                <div className={`${!isExpanded ? 'max-h-48 overflow-hidden' : ''}`}>
                  <MarkdownRenderer 
                    content={response.content} 
                    className="text-sm"
                  />
                  {response.status === 'streaming' && (
                    <span className="inline-block w-2 h-4 bg-blue-600 ml-1 animate-pulse"></span>
                  )}
                </div>
                
                {response.content.length > 300 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>

              {response.tokenUsage && (
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>📝 {response.tokenUsage.promptTokens} prompt</span>
                  <span>💬 {response.tokenUsage.completionTokens} completion</span>
                  <span>🔢 {response.tokenUsage.totalTokens} total</span>
                </div>
              )}

              {response.cost && (
                <div className="text-xs text-gray-500">
                  💰 Estimated cost: ${response.cost.toFixed(4)}
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(response.content)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded"
                    title="Copy response"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => setShowFullscreen(true)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded"
                    title="View fullscreen"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                </div>
                
                <div className="text-xs text-gray-500">
                  {new Date(response.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {!response && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              {provider.isActive ? (
                <div className="text-sm">Ready to receive response</div>
              ) : (
                <div className="text-sm">
                  <div className="text-gray-400">Provider is inactive</div>
                  <div className="text-xs text-gray-400 mt-1">Click the dot above to activate</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showFullscreen && response?.content && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{provider.name} - {provider.model}</h2>
              <button
                onClick={() => setShowFullscreen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="max-w-none">
              <div className="bg-gray-50 p-4 rounded-lg">
                <MarkdownRenderer content={response.content} />
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <div className="flex space-x-4 text-sm text-gray-500">
                {response.tokenUsage && (
                  <>
                    <span>📝 {response.tokenUsage.promptTokens} prompt</span>
                    <span>💬 {response.tokenUsage.completionTokens} completion</span>
                    <span>🔢 {response.tokenUsage.totalTokens} total</span>
                  </>
                )}
                <span>⏱️ {response.responseTime}ms</span>
                {response.cost && <span>💰 ${response.cost.toFixed(4)}</span>}
              </div>
              
              <button
                onClick={() => copyToClipboard(response.content)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Copy Response
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showDebugger && (
        <StreamingDebugger
          provider={provider}
          onClose={() => setShowDebugger(false)}
        />
      )}
    </>
  );
}