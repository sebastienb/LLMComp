'use client';

import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { PromptRequest, LLMResponse } from '@/types';
import { getThemeClasses } from '@/lib/themes';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  response: LLMResponse | null;
  promptText: string;
}

function ResponseModal({ isOpen, onClose, response, promptText }: ResponseModalProps) {
  const { theme } = useStore();
  const themeClasses = getThemeClasses(theme);
  
  if (!isOpen || !response) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${themeClasses.card} ${
        theme === 'tui' ? 'p-2' : 
        theme === 'monitor' ? 'p-4' :
        'bg-white rounded-lg p-6'
      } w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className={`flex justify-between items-center ${
          theme === 'tui' ? 'mb-2' : 
          theme === 'monitor' ? 'mb-4' :
          'mb-6'
        }`}>
          <div>
            <h2 className={`${themeClasses.subheading} ${
              theme === 'tui' ? 'text-base' : 
              theme === 'monitor' ? 'text-lg' :
              'text-xl'
            }`}>
              {theme === 'monitor' ? `■ ${response.providerName.toUpperCase()}` : response.providerName}
            </h2>
            <p className={themeClasses.textSmall}>
              {theme === 'tui' 
                ? new Date(response.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : new Date(response.timestamp).toLocaleString()
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className={`${themeClasses.buttonIcon} text-xl`}
          >
            ×
          </button>
        </div>

        <div className={
          theme === 'tui' ? 'border border-green-400 bg-gray-900 p-1 mb-1' : 
          theme === 'monitor' ? 'border border-gray-600 bg-gray-800 p-3 mb-3' :
          'bg-gray-50 rounded-lg p-4 mb-4'
        }>
          <h3 className={`${themeClasses.text} font-medium ${
            theme === 'tui' ? 'mb-1 text-xs' : 
            theme === 'monitor' ? 'mb-2 text-sm' :
            'mb-2'
          }`}>
            {theme === 'tui' ? 'PROMPT:' : 
             theme === 'monitor' ? 'ORIGINAL PROMPT:' :
             'Original Prompt:'}
          </h3>
          <div className={`${themeClasses.textSmall} ${
            theme === 'tui' ? 'max-h-16 overflow-y-auto' : 
            theme === 'monitor' ? 'bg-gray-900 p-2 border border-gray-600' :
            'text-gray-700 bg-white p-3 rounded border'
          }`}>
            {promptText}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className={`flex justify-between items-center ${
            theme === 'tui' ? 'mb-1' : 
            theme === 'monitor' ? 'mb-3' :
            'mb-4'
          }`}>
            <h3 className={`${themeClasses.text} font-medium`}>
              {theme === 'tui' ? 'RESP:' : 
               theme === 'monitor' ? 'RESPONSE DATA:' :
               'Response:'}
            </h3>
            <div className={`flex items-center ${
              theme === 'tui' ? 'space-x-1' : 
              theme === 'monitor' ? 'space-x-2' :
              'space-x-4'
            } ${themeClasses.textSmall}`}>
              <span>{theme === 'tui' ? `${response.responseTime}ms` : `⏱️ ${response.responseTime}ms`}</span>
              {response.tokenUsage && (
                <>
                  {theme === 'tui' ? (
                    <>
                      <span>P:{response.tokenUsage.promptTokens}</span>
                      <span>C:{response.tokenUsage.completionTokens}</span>
                      <span>T:{response.tokenUsage.totalTokens}</span>
                    </>
                  ) : theme === 'monitor' ? (
                    <>
                      <span>PROMPT: {response.tokenUsage.promptTokens}</span>
                      <span>COMP: {response.tokenUsage.completionTokens}</span>
                      <span>TOTAL: {response.tokenUsage.totalTokens}</span>
                    </>
                  ) : (
                    <>
                      <span>📝 {response.tokenUsage.promptTokens} prompt</span>
                      <span>💬 {response.tokenUsage.completionTokens} completion</span>
                      <span>🔢 {response.tokenUsage.totalTokens} total</span>
                    </>
                  )}
                </>
              )}
              {response.cost && (
                <span>
                  {theme === 'tui' ? `$${response.cost.toFixed(4)}` : 
                   theme === 'monitor' ? `COST: $${response.cost.toFixed(4)}` :
                   `💰 $${response.cost.toFixed(4)}`}
                </span>
              )}
            </div>
          </div>

          <div className={
            theme === 'tui' ? 'border border-green-400 bg-black p-1' : 
            theme === 'monitor' ? 'bg-gray-900 border border-gray-600 p-3' :
            'bg-white border rounded-lg p-4'
          }>
            <MarkdownRenderer content={response.content} />
          </div>
        </div>

        <div className={`flex justify-end items-center ${
          theme === 'tui' ? 'mt-1 pt-1 border-t border-green-400' : 
          theme === 'monitor' ? 'mt-3 pt-3 border-t border-gray-600' :
          'mt-4 pt-4 border-t border-gray-200'
        }`}>
          <button
            onClick={() => navigator.clipboard.writeText(response.content)}
            className={`${themeClasses.buttonPrimary} ${theme === 'tui' || theme === 'monitor' ? 'mr-2' : 'mr-4'}`}
          >
            {theme === 'tui' ? 'COPY' : 
             theme === 'monitor' ? 'COPY RESPONSE' :
             'Copy Response'}
          </button>
          <button
            onClick={onClose}
            className={themeClasses.buttonSecondary}
          >
            {theme === 'monitor' ? 'CLOSE' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { history, clearHistory, setCurrentPrompt, setSystemPrompt, updatePromptSettings, theme } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<LLMResponse | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const router = useRouter();
  const themeClasses = getThemeClasses(theme);

  const filteredHistory = history.filter(request => 
    request.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.systemPrompt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.responses.some(r => r.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleReuseRequest = async (request: PromptRequest) => {
    // Update the store with the historical request data
    setCurrentPrompt(request.prompt);
    if (request.systemPrompt) {
      setSystemPrompt(request.systemPrompt);
    } else {
      setSystemPrompt(''); // Clear system prompt if not present
    }
    updatePromptSettings(request.settings);
    
    // Use Next.js router to navigate back
    router.push('/');
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      clearHistory();
    }
  };

  const handleViewResponse = (response: LLMResponse, promptText: string) => {
    setSelectedResponse(response);
    setSelectedPrompt(promptText);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get unique providers across all history
  const allProviders = Array.from(
    new Set(
      history.flatMap(request => 
        request.responses.map(response => response.providerName)
      )
    )
  ).sort();

  return (
    <div className={themeClasses.body}>
      {/* Header */}
      <div className={
        theme === 'tui' ? 'bg-black border-b border-green-400' : 
        theme === 'monitor' ? 'bg-gray-900 border-b border-gray-600' :
        'bg-white shadow-sm border-b border-gray-200'
      }>
        <div className={
          theme === 'tui' ? 'px-2 py-1' : 
          theme === 'monitor' ? 'px-3 py-2' :
          'container mx-auto px-4 py-4'
        }>
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${
              theme === 'tui' ? 'space-x-2' : 
              theme === 'monitor' ? 'space-x-3' :
              'space-x-4'
            }`}>
              <Link href="/" className={
                theme === 'tui' ? 'text-green-400 hover:text-green-300 font-mono text-sm' : 
                theme === 'monitor' ? 'text-green-400 hover:text-green-300 font-mono text-sm uppercase' :
                'text-blue-600 hover:text-blue-800'
              }>
                {theme === 'tui' ? '← BACK' : 
                 theme === 'monitor' ? '← BACK TO MONITOR' :
                 '← Back to Comparison'}
              </Link>
              <h1 className={
                theme === 'tui' ? 'text-lg font-bold text-green-400 font-mono' : 
                theme === 'monitor' ? 'text-xl font-bold text-green-400 font-mono uppercase tracking-wide' :
                'text-2xl font-bold text-gray-900'
              }>
                {theme === 'tui' ? 'HISTORY' : 
                 theme === 'monitor' ? '■ RESPONSE HISTORY LOG' :
                 'Response History'}
              </h1>
            </div>
            <button
              onClick={handleClearHistory}
              disabled={history.length === 0}
              className={
                theme === 'tui' 
                  ? 'px-2 py-1 text-red-400 border border-red-400 hover:bg-red-400 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed font-mono text-xs'
                  : theme === 'monitor'
                  ? 'px-3 py-1 text-red-400 border border-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm'
                  : 'px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              }
            >
              {theme === 'tui' ? 'CLEAR' : 
               theme === 'monitor' ? 'CLEAR LOG' :
               'Clear All History'}
            </button>
          </div>
        </div>
      </div>

      <div className={
        theme === 'tui' ? 'px-2 py-1' : 
        theme === 'monitor' ? 'px-3 py-2' :
        'container mx-auto px-4 py-8'
      }>
        {/* Search */}
        <div className={
          theme === 'tui' ? 'mb-1' : 
          theme === 'monitor' ? 'mb-2' :
          'mb-6'
        }>
          <input
            type="text"
            placeholder={
              theme === 'tui' ? 'Search...' : 
              theme === 'monitor' ? 'SEARCH LOGS...' :
              'Search prompts and responses...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={
              theme === 'tui' 
                ? 'w-full max-w-md p-1 border border-green-400 bg-black text-green-400 placeholder-green-600 focus:ring-1 focus:ring-green-400 focus:border-transparent font-mono text-xs'
                : theme === 'monitor'
                ? 'w-full max-w-md p-2 border border-gray-600 bg-gray-900 text-gray-200 placeholder-gray-500 focus:ring-1 focus:ring-green-500 focus:border-transparent font-mono text-sm'
                : 'w-full max-w-md p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            }
          />
        </div>

        {filteredHistory.length === 0 ? (
          <div className={`text-center ${
            theme === 'tui' ? 'py-4' : 
            theme === 'monitor' ? 'py-6' :
            'py-12'
          }`}>
            <div className={`${
              theme === 'tui' ? 'text-green-600 mb-1 font-mono text-sm' : 
              theme === 'monitor' ? 'text-gray-400 mb-2 font-mono text-sm' :
              'text-gray-500 mb-4'
            }`}>
              {history.length === 0 ? 
                (theme === 'tui' ? 'NO HISTORY' : 
                 theme === 'monitor' ? 'NO HISTORY LOGS' :
                 'No history yet') : 
                (theme === 'tui' ? 'NO RESULTS' : 
                 theme === 'monitor' ? 'NO MATCHING RECORDS' :
                 'No results found')
              }
            </div>
            {history.length === 0 && (
              <div className={
                theme === 'tui' ? 'space-y-1' : 
                theme === 'monitor' ? 'space-y-2' :
                'space-y-2'
              }>
                <p className={
                  theme === 'tui' ? 'text-xs text-green-700 font-mono' : 
                  theme === 'monitor' ? 'text-sm text-gray-500 font-mono' :
                  'text-sm text-gray-400'
                }>
                  {theme === 'tui' ? 'Run prompts to populate' : 
                   theme === 'monitor' ? 'EXECUTE PROMPTS TO GENERATE LOG ENTRIES' :
                   'Run some prompts to see them appear here'}
                </p>
                <Link href="/" className={
                  theme === 'tui' 
                    ? 'inline-block px-2 py-1 bg-green-400 text-black hover:bg-green-300 font-mono text-xs'
                    : theme === 'monitor'
                    ? 'inline-block px-3 py-1 bg-green-600 text-white hover:bg-green-500 font-mono text-sm'
                    : 'inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                }>
                  {theme === 'tui' ? 'START' : 
                   theme === 'monitor' ? 'START COMPARISON' :
                   'Start Comparing LLMs'}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className={
            theme === 'tui' ? 'border border-green-400 bg-black overflow-hidden' : 
            theme === 'monitor' ? 'border border-gray-600 bg-gray-900 overflow-hidden' :
            'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'
          }>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={
                  theme === 'tui' ? 'bg-gray-900 border-b border-green-400' : 
                  theme === 'monitor' ? 'bg-gray-800 border-b border-gray-600' :
                  'bg-gray-50'
                }>
                  <tr>
                    <th className={
                      theme === 'tui' 
                        ? 'px-2 py-1 text-left text-xs font-medium text-green-400 uppercase tracking-wider min-w-[200px] font-mono'
                        : theme === 'monitor'
                        ? 'px-3 py-2 text-left text-xs font-medium text-green-400 uppercase tracking-wider min-w-[250px] font-mono'
                        : 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[300px]'
                    }>
                      {theme === 'tui' ? 'PROMPT' : 
                       theme === 'monitor' ? 'PROMPT & METADATA' :
                       'Prompt & Date'}
                    </th>
                    {allProviders.map(provider => (
                      <th key={provider} className={
                        theme === 'tui' 
                          ? 'px-2 py-1 text-left text-xs font-medium text-green-400 uppercase tracking-wider min-w-[150px] font-mono'
                          : theme === 'monitor'
                          ? 'px-3 py-2 text-left text-xs font-medium text-green-400 uppercase tracking-wider min-w-[180px] font-mono'
                          : 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]'
                      }>
                        {theme === 'monitor' ? `■ ${provider.toUpperCase()}` : provider}
                      </th>
                    ))}
                    <th className={
                      theme === 'tui' 
                        ? 'px-2 py-1 text-left text-xs font-medium text-green-400 uppercase tracking-wider font-mono'
                        : theme === 'monitor'
                        ? 'px-3 py-2 text-left text-xs font-medium text-green-400 uppercase tracking-wider font-mono'
                        : 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    }>
                      {theme === 'monitor' ? 'ACTIONS' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className={
                  theme === 'tui' ? 'bg-black divide-y divide-green-400' : 
                  theme === 'monitor' ? 'bg-gray-900 divide-y divide-gray-600' :
                  'bg-white divide-y divide-gray-200'
                }>
                  {filteredHistory.map((request) => (
                    <tr key={request.id} className={
                      theme === 'tui' ? 'hover:bg-gray-900' : 
                      theme === 'monitor' ? 'hover:bg-gray-800' :
                      'hover:bg-gray-50'
                    }>
                      <td className={
                        theme === 'tui' ? 'px-2 py-1 text-xs' : 
                        theme === 'monitor' ? 'px-3 py-2 text-sm' :
                        'px-4 py-4 text-sm'
                      }>
                        <div className={
                          theme === 'tui' ? 'space-y-1' : 
                          theme === 'monitor' ? 'space-y-1' :
                          'space-y-2'
                        }>
                          <div className={
                            theme === 'tui' ? 'text-green-400 line-clamp-2 font-mono' : 
                            theme === 'monitor' ? 'text-gray-200 line-clamp-2 font-mono' :
                            'text-gray-900 line-clamp-3'
                          }>
                            {request.prompt}
                          </div>
                          <div className={`flex items-center ${
                            theme === 'tui' ? 'space-x-2 text-xs text-green-600 font-mono' : 
                            theme === 'monitor' ? 'space-x-2 text-xs text-gray-400 font-mono' :
                            'space-x-4 text-xs text-gray-500'
                          }`}>
                            <span>{theme === 'tui' ? new Date(request.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : formatDate(request.timestamp)}</span>
                            <span>T: {request.settings.temperature}</span>
                            <span>Max: {request.settings.maxTokens}</span>
                          </div>
                          {request.systemPrompt && (
                            <div className={
                              theme === 'tui' 
                                ? 'text-xs text-cyan-400 border border-cyan-400 px-1 py-0 font-mono'
                                : theme === 'monitor'
                                ? 'text-xs text-blue-400 border border-blue-600 px-1 py-0 font-mono'
                                : 'text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded'
                            }>
                              {theme === 'tui' ? 'SYS' : 
                               theme === 'monitor' ? 'SYSTEM PROMPT' :
                               'System prompt included'}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {allProviders.map(provider => {
                        const response = request.responses.find(r => r.providerName === provider);
                        
                        return (
                          <td key={provider} className={
                            theme === 'tui' ? 'px-2 py-1 text-xs' : 
                            theme === 'monitor' ? 'px-3 py-2 text-sm' :
                            'px-4 py-4 text-sm'
                          }>
                            {response && response.status === 'completed' && response.content ? (
                              <div className={
                                theme === 'tui' ? 'space-y-1' : 
                                theme === 'monitor' ? 'space-y-1' :
                                'space-y-2'
                              }>
                                <div className="flex items-center space-x-2">
                                  <span className={
                                    theme === 'tui' ? 'inline-block w-1 h-1 bg-green-400 rounded-full' : 
                                    theme === 'monitor' ? 'inline-block w-1 h-1 bg-green-500 rounded-full' :
                                    'inline-block w-2 h-2 bg-green-500 rounded-full'
                                  }></span>
                                  <span className={
                                    theme === 'tui' ? 'text-xs text-green-600 font-mono' : 
                                    theme === 'monitor' ? 'text-xs text-gray-400 font-mono' :
                                    'text-xs text-gray-500'
                                  }>
                                    {response.responseTime}ms
                                  </span>
                                </div>
                                
                                {response.tokenUsage && (
                                  <div className={`text-xs space-y-1 ${
                                    theme === 'tui' ? 'text-green-600 font-mono' : 
                                    theme === 'monitor' ? 'text-gray-400 font-mono' :
                                    'text-gray-500'
                                  }`}>
                                    {theme === 'tui' ? (
                                      <>
                                        <div>P:{response.tokenUsage.promptTokens}</div>
                                        <div>C:{response.tokenUsage.completionTokens}</div>
                                        <div>T:{response.tokenUsage.totalTokens}</div>
                                      </>
                                    ) : theme === 'monitor' ? (
                                      <>
                                        <div>P: {response.tokenUsage.promptTokens}</div>
                                        <div>C: {response.tokenUsage.completionTokens}</div>
                                        <div>T: {response.tokenUsage.totalTokens}</div>
                                      </>
                                    ) : (
                                      <>
                                        <div>📝 {response.tokenUsage.promptTokens}</div>
                                        <div>💬 {response.tokenUsage.completionTokens}</div>
                                        <div>🔢 {response.tokenUsage.totalTokens}</div>
                                      </>
                                    )}
                                  </div>
                                )}
                                
                                {response.cost && (
                                  <div className={
                                    theme === 'tui' ? 'text-xs text-green-600 font-mono' : 
                                    theme === 'monitor' ? 'text-xs text-gray-400 font-mono' :
                                    'text-xs text-gray-500'
                                  }>
                                    {theme === 'tui' ? `$${response.cost.toFixed(4)}` : 
                                     theme === 'monitor' ? `$${response.cost.toFixed(4)}` :
                                     `💰 $${response.cost.toFixed(4)}`}
                                  </div>
                                )}
                                
                                <button
                                  onClick={() => handleViewResponse(response, request.prompt)}
                                  className={
                                    theme === 'tui' 
                                      ? 'text-xs text-cyan-400 hover:text-cyan-300 underline font-mono'
                                      : theme === 'monitor'
                                      ? 'text-xs text-blue-400 hover:text-blue-300 underline font-mono'
                                      : 'text-xs text-blue-600 hover:text-blue-800 underline'
                                  }
                                >
                                  {theme === 'tui' ? 'VIEW' : 
                                   theme === 'monitor' ? 'VIEW' :
                                   'View Response'}
                                </button>
                              </div>
                            ) : response && response.status === 'error' ? (
                              <div className="flex items-center space-x-2">
                                <span className={
                                  theme === 'tui' ? 'inline-block w-1 h-1 bg-red-400 rounded-full' : 
                                  theme === 'monitor' ? 'inline-block w-1 h-1 bg-red-500 rounded-full' :
                                  'inline-block w-2 h-2 bg-red-500 rounded-full'
                                }></span>
                                <span className={
                                  theme === 'tui' ? 'text-xs text-red-400 font-mono' : 
                                  theme === 'monitor' ? 'text-xs text-red-400 font-mono' :
                                  'text-xs text-red-600'
                                }>
                                  {theme === 'monitor' ? 'ERROR' : 'Error'}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className={
                                  theme === 'tui' ? 'inline-block w-1 h-1 bg-gray-600 rounded-full' : 
                                  theme === 'monitor' ? 'inline-block w-1 h-1 bg-gray-500 rounded-full' :
                                  'inline-block w-2 h-2 bg-gray-300 rounded-full'
                                }></span>
                                <span className={
                                  theme === 'tui' ? 'text-xs text-gray-600 font-mono' : 
                                  theme === 'monitor' ? 'text-xs text-gray-500 font-mono' :
                                  'text-xs text-gray-400'
                                }>
                                  {theme === 'tui' ? 'NONE' : 
                                   theme === 'monitor' ? 'NO DATA' :
                                   'No response'}
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                      
                      <td className={
                        theme === 'tui' ? 'px-2 py-1 text-xs' : 
                        theme === 'monitor' ? 'px-3 py-2 text-sm' :
                        'px-4 py-4 text-sm'
                      }>
                        <button
                          onClick={() => handleReuseRequest(request)}
                          className={
                            theme === 'tui' 
                              ? 'text-xs bg-green-400 text-black px-2 py-0 hover:bg-green-300 font-mono'
                              : theme === 'monitor'
                              ? 'text-xs bg-green-600 text-white px-2 py-1 hover:bg-green-500 font-mono'
                              : 'text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors'
                          }
                        >
                          {theme === 'monitor' ? 'REUSE' : 'Reuse'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ResponseModal
        isOpen={!!selectedResponse}
        onClose={() => {
          setSelectedResponse(null);
          setSelectedPrompt('');
        }}
        response={selectedResponse}
        promptText={selectedPrompt}
      />
    </div>
  );
}