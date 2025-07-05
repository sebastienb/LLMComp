'use client';

import { useState } from 'react';
import { LLMProvider, LLMResponse } from '@/types';
import { useStore } from '@/stores/useStore';
import { getThemeClasses } from '@/lib/themes';
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
  const { toggleProvider, theme } = useStore();
  const themeClasses = getThemeClasses(theme);
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
      <div className={`${themeClasses.card} overflow-hidden ${
        provider.isActive ? '' : 'opacity-60'
      }`}>
        <div className={themeClasses.cardHeader}>
          <div className={`flex justify-between items-start ${theme === 'tui' ? 'mb-1' : 'mb-2'}`}>
            <div>
              <h3 className={`${themeClasses.text} font-medium ${theme === 'tui' ? 'text-xs' : ''}`}>
                {theme === 'tui' ? provider.name.toUpperCase().slice(0, 8) : provider.name}
              </h3>
              <p className={`${themeClasses.textMuted} ${theme === 'tui' ? 'text-xs' : 'text-sm'}`}>
                {theme === 'tui' ? provider.model.slice(0, 12) : provider.model}
              </p>
            </div>
            <div className={`flex items-center ${theme === 'tui' ? 'space-x-1' : 'space-x-2'}`}>
              <button
                onClick={() => toggleProvider(provider.id)}
                className={`${theme === 'tui' ? 'w-3 h-3' : 'w-4 h-4'} rounded-full border-2 ${
                  provider.isActive
                    ? theme === 'tui' ? 'bg-green-400 border-green-400' : 'bg-green-500 border-green-500'
                    : theme === 'tui' ? 'bg-black border-green-400' : 'bg-gray-200 border-gray-300'
                }`}
                title={provider.isActive ? 'Active' : 'Inactive'}
              />
              <button
                onClick={() => onRerunProvider(provider.id)}
                className={themeClasses.buttonIcon}
                title="Rerun with this provider"
              >
                <svg className={theme === 'tui' ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={() => setShowDebugger(true)}
                className={themeClasses.buttonIcon}
                title="Debug streaming"
              >
                <svg className={theme === 'tui' ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </button>
              <button
                onClick={() => onEditProvider(provider.id)}
                className={themeClasses.buttonIcon}
                title="Edit provider"
              >
                <svg className={theme === 'tui' ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`inline-flex ${theme === 'tui' ? 'px-1 py-0 text-xs' : 'px-2 py-1 text-xs'} font-medium ${theme === 'tui' ? '' : 'rounded-full'} ${getStatusColor(response?.status)}`}>
              {theme === 'tui' ? getStatusText(response?.status).slice(0, 4).toUpperCase() : getStatusText(response?.status)}
            </span>
            
            {response?.responseTime && (
              <span className={themeClasses.textSmall}>
                {theme === 'tui' ? `${response.responseTime}ms` : `${response.responseTime}ms`}
              </span>
            )}
          </div>
        </div>

        <div className={themeClasses.cardBody}>
          {(isLoading || response?.status === 'streaming') && (
            <div className={`flex items-center justify-center ${theme === 'tui' ? 'py-2' : 'py-8'}`}>
              <div className={`animate-spin rounded-full border-b-2 ${theme === 'tui' ? 'h-4 w-4 border-green-400' : 'h-8 w-8 border-blue-600'}`}></div>
              {response?.status === 'streaming' && (
                <span className={`ml-2 ${themeClasses.textSmall} ${theme === 'tui' ? 'text-cyan-400' : 'text-blue-600'}`}>
                  {theme === 'tui' ? 'STREAM...' : 'Streaming response...'}
                </span>
              )}
            </div>
          )}

          {response?.error && (
            <div className={`${theme === 'tui' ? 'border border-red-400 bg-black p-1' : 'bg-red-50 border border-red-200 rounded-lg p-3'}`}>
              <div className={`${themeClasses.textSmall} font-medium ${theme === 'tui' ? 'text-red-400' : 'text-red-800'} mb-1`}>
                {theme === 'tui' ? 'ERR:' : 'Error'}
              </div>
              <div className={`${themeClasses.textSmall} ${theme === 'tui' ? 'text-red-400' : 'text-red-700'}`}>
                {theme === 'tui' ? response.error.slice(0, 50) + '...' : response.error}
              </div>
            </div>
          )}

          {response?.content && (
            <div className={theme === 'tui' ? 'space-y-1' : 'space-y-3'}>
              <div className="relative">
                <div className={`${!isExpanded ? (theme === 'tui' ? 'max-h-24 overflow-hidden' : 'max-h-48 overflow-hidden') : ''}`}>
                  <MarkdownRenderer 
                    content={response.content} 
                    className={theme === 'tui' ? 'text-xs' : 'text-sm'}
                  />
                  {response.status === 'streaming' && (
                    <span className={`inline-block w-2 h-4 ml-1 animate-pulse ${theme === 'tui' ? 'bg-cyan-400' : 'bg-blue-600'}`}></span>
                  )}
                </div>
                
                {response.content.length > (theme === 'tui' ? 150 : 300) && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`${themeClasses.text} ${theme === 'tui' ? 'text-xs mt-1 hover:text-green-300' : 'text-sm mt-2 hover:text-blue-800'}`}
                  >
                    {isExpanded ? (theme === 'tui' ? '[-]' : 'Show less') : (theme === 'tui' ? '[+]' : 'Show more')}
                  </button>
                )}
              </div>

              {response.tokenUsage && (
                <div className={`flex items-center ${theme === 'tui' ? 'space-x-1' : 'space-x-4'} ${themeClasses.textSmall}`}>
                  {theme === 'tui' ? (
                    <>
                      <span>P:{response.tokenUsage.promptTokens}</span>
                      <span>C:{response.tokenUsage.completionTokens}</span>
                      <span>T:{response.tokenUsage.totalTokens}</span>
                    </>
                  ) : (
                    <>
                      <span>📝 {response.tokenUsage.promptTokens} prompt</span>
                      <span>💬 {response.tokenUsage.completionTokens} completion</span>
                      <span>🔢 {response.tokenUsage.totalTokens} total</span>
                    </>
                  )}
                </div>
              )}

              {response.cost && (
                <div className={themeClasses.textSmall}>
                  {theme === 'tui' ? `$${response.cost.toFixed(4)}` : `💰 Estimated cost: $${response.cost.toFixed(4)}`}
                </div>
              )}

              <div className={`flex justify-between items-center ${theme === 'tui' ? 'pt-1 border-t border-green-400' : 'pt-3 border-t border-gray-200'}`}>
                <div className={`flex ${theme === 'tui' ? 'space-x-1' : 'space-x-2'}`}>
                  <button
                    onClick={() => copyToClipboard(response.content)}
                    className={`${themeClasses.buttonIcon} ${theme === 'tui' ? 'p-0' : 'p-1 rounded'}`}
                    title="Copy response"
                  >
                    <svg className={theme === 'tui' ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => setShowFullscreen(true)}
                    className={`${themeClasses.buttonIcon} ${theme === 'tui' ? 'p-0' : 'p-1 rounded'}`}
                    title="View fullscreen"
                  >
                    <svg className={theme === 'tui' ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                </div>
                
                <div className={themeClasses.textSmall}>
                  {theme === 'tui' 
                    ? new Date(response.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : new Date(response.timestamp).toLocaleTimeString()
                  }
                </div>
              </div>
            </div>
          )}

          {!response && !isLoading && (
            <div className={`text-center ${theme === 'tui' ? 'py-2' : 'py-8'} ${themeClasses.textMuted}`}>
              {provider.isActive ? (
                <div className={themeClasses.textSmall}>
                  {theme === 'tui' ? 'READY' : 'Ready to receive response'}
                </div>
              ) : (
                <div className={themeClasses.textSmall}>
                  <div>{theme === 'tui' ? 'INACTIVE' : 'Provider is inactive'}</div>
                  {theme !== 'tui' && (
                    <div className="text-xs mt-1">Click the dot above to activate</div>
                  )}
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