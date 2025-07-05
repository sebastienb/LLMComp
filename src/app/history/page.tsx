'use client';

import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { PromptRequest, LLMResponse } from '@/types';
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
  if (!isOpen || !response) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{response.providerName}</h2>
            <p className="text-sm text-gray-500">{new Date(response.timestamp).toLocaleString()}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-gray-900 mb-2">Original Prompt:</h3>
          <div className="text-sm text-gray-700 bg-white p-3 rounded border">
            {promptText}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">Response:</h3>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>⏱️ {response.responseTime}ms</span>
              {response.tokenUsage && (
                <>
                  <span>📝 {response.tokenUsage.promptTokens} prompt</span>
                  <span>💬 {response.tokenUsage.completionTokens} completion</span>
                  <span>🔢 {response.tokenUsage.totalTokens} total</span>
                </>
              )}
              {response.cost && <span>💰 ${response.cost.toFixed(4)}</span>}
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <MarkdownRenderer content={response.content} />
          </div>
        </div>

        <div className="flex justify-end items-center mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => navigator.clipboard.writeText(response.content)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-4"
          >
            Copy Response
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { history, clearHistory, setCurrentPrompt, setSystemPrompt, updatePromptSettings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<LLMResponse | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const router = useRouter();

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                ← Back to Comparison
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Response History</h1>
            </div>
            <button
              onClick={handleClearHistory}
              disabled={history.length === 0}
              className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Clear All History
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search prompts and responses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {history.length === 0 ? 'No history yet' : 'No results found'}
            </div>
            {history.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-400">
                  Run some prompts to see them appear here
                </p>
                <Link href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Start Comparing LLMs
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[300px]">
                      Prompt & Date
                    </th>
                    {allProviders.map(provider => (
                      <th key={provider} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                        {provider}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistory.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm">
                        <div className="space-y-2">
                          <div className="text-gray-900 line-clamp-3">
                            {request.prompt}
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{formatDate(request.timestamp)}</span>
                            <span>T: {request.settings.temperature}</span>
                            <span>Max: {request.settings.maxTokens}</span>
                          </div>
                          {request.systemPrompt && (
                            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              System prompt included
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {allProviders.map(provider => {
                        const response = request.responses.find(r => r.providerName === provider);
                        
                        return (
                          <td key={provider} className="px-4 py-4 text-sm">
                            {response && response.status === 'completed' && response.content ? (
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                                  <span className="text-xs text-gray-500">
                                    {response.responseTime}ms
                                  </span>
                                </div>
                                
                                {response.tokenUsage && (
                                  <div className="text-xs text-gray-500 space-y-1">
                                    <div>📝 {response.tokenUsage.promptTokens}</div>
                                    <div>💬 {response.tokenUsage.completionTokens}</div>
                                    <div>🔢 {response.tokenUsage.totalTokens}</div>
                                  </div>
                                )}
                                
                                {response.cost && (
                                  <div className="text-xs text-gray-500">
                                    💰 ${response.cost.toFixed(4)}
                                  </div>
                                )}
                                
                                <button
                                  onClick={() => handleViewResponse(response, request.prompt)}
                                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                  View Response
                                </button>
                              </div>
                            ) : response && response.status === 'error' ? (
                              <div className="flex items-center space-x-2">
                                <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                                <span className="text-xs text-red-600">Error</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="inline-block w-2 h-2 bg-gray-300 rounded-full"></span>
                                <span className="text-xs text-gray-400">No response</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                      
                      <td className="px-4 py-4 text-sm">
                        <button
                          onClick={() => handleReuseRequest(request)}
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                        >
                          Reuse
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