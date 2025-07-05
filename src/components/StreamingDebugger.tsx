'use client';

import { useState } from 'react';
import { LLMProvider } from '@/types';
import { useStore } from '@/stores/useStore';
import { decryptApiKey } from '@/lib/crypto';

interface StreamingDebuggerProps {
  provider: LLMProvider;
  onClose: () => void;
}

export default function StreamingDebugger({ provider, onClose }: StreamingDebuggerProps) {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testType, setTestType] = useState<'connection' | 'streaming' | 'parsing'>('connection');

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addResult('Testing basic connection...');
      
      // Test if the endpoint is reachable
      const response = await fetch('/api/proxy/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: provider.name.toLowerCase().includes('lm studio') 
            ? `${provider.apiUrl}/v1/models`
            : provider.name.toLowerCase().includes('anthropic')
            ? `${provider.apiUrl}/v1/models`
            : `${provider.apiUrl}/v1/models`,
          method: 'GET',
          headers: provider.apiKey ? {
            'Authorization': provider.name.toLowerCase().includes('anthropic') 
              ? undefined 
              : `Bearer ${decryptApiKey(provider.apiKey)}`,
            'x-api-key': provider.name.toLowerCase().includes('anthropic') 
              ? decryptApiKey(provider.apiKey) 
              : undefined,
            'anthropic-version': provider.name.toLowerCase().includes('anthropic') 
              ? '2023-06-01' 
              : undefined,
          } : {},
        }),
      });

      if (response.ok) {
        const data = await response.json();
        addResult('✅ Connection successful');
        addResult(`Response: ${JSON.stringify(data, null, 2)}`);
      } else {
        addResult(`❌ Connection failed: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        addResult(`Error details: ${errorText}`);
      }
    } catch (error) {
      addResult(`❌ Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testStreaming = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addResult('Testing streaming endpoint...');
      
      const apiKey = provider.apiKey ? decryptApiKey(provider.apiKey) : undefined;
      
      // Build request based on provider type
      let url: string;
      let headers: Record<string, string>;
      let data: any;
      
      if (provider.name.toLowerCase().includes('lm studio')) {
        url = `${provider.apiUrl}/v1/chat/completions`;
        headers = {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        };
        data = {
          model: provider.model,
          messages: [{ role: 'user', content: 'Hello, this is a test.' }],
          temperature: 0.7,
          max_tokens: 50,
          stream: true,
        };
      } else if (provider.name.toLowerCase().includes('anthropic')) {
        url = `${provider.apiUrl}/v1/messages`;
        headers = {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        };
        if (apiKey) headers['x-api-key'] = apiKey;
        data = {
          model: provider.model,
          max_tokens: 50,
          temperature: 0.7,
          messages: [{ role: 'user', content: 'Hello, this is a test.' }],
          stream: true,
        };
      } else {
        throw new Error('Unsupported provider for streaming test');
      }
      
      addResult(`Making streaming request to: ${url}`);
      addResult(`Headers: ${JSON.stringify(Object.keys(headers))}`);
      addResult(`Data: ${JSON.stringify(data, null, 2)}`);
      
      const response = await fetch('/api/proxy/llm-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, headers, data }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        addResult(`❌ Streaming request failed: ${response.status} ${response.statusText}`);
        addResult(`Error: ${JSON.stringify(errorData, null, 2)}`);
        return;
      }

      if (!response.body) {
        addResult('❌ No response body received');
        return;
      }

      addResult('✅ Streaming response received, reading chunks...');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let chunkCount = 0;
      let accumulatedContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        
        addResult(`Chunk ${chunkCount}: ${chunk.substring(0, 100)}${chunk.length > 100 ? '...' : ''}`);
        
        // Try to parse the chunk
        const lines = chunk.split('\\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data !== '[DONE]' && data.trim()) {
              try {
                const parsed = JSON.parse(data);
                addResult(`Parsed: ${JSON.stringify(parsed, null, 2)}`);
                
                // Extract content based on provider
                if (provider.name.toLowerCase().includes('lm studio')) {
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) accumulatedContent += content;
                } else if (provider.name.toLowerCase().includes('anthropic')) {
                  if (parsed.type === 'content_block_delta') {
                    const content = parsed.delta?.text;
                    if (content) accumulatedContent += content;
                  }
                }
              } catch (parseError) {
                addResult(`Parse error: ${parseError}`);
              }
            }
          }
        }
        
        if (chunkCount >= 10) {
          addResult('Limiting output to first 10 chunks...');
          break;
        }
      }
      
      addResult(`✅ Streaming completed. Total chunks: ${chunkCount}`);
      addResult(`Accumulated content: ${accumulatedContent}`);
      
    } catch (error) {
      addResult(`❌ Streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testParsing = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    // Test parsing with sample data
    const sampleData = {
      'lm-studio': [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}',
        'data: {"choices":[{"delta":{"content":" world"}}]}',
        'data: [DONE]',
      ],
      'anthropic': [
        'data: {"type":"message_start","message":{"id":"msg_123","type":"message","role":"assistant","content":[],"model":"claude-3-sonnet-20240229","stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":10,"output_tokens":0}}}',
        'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}',
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}',
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" world"}}',
        'data: {"type":"content_block_stop","index":0}',
        'data: {"type":"message_stop"}',
      ],
    };
    
    const providerType = provider.name.toLowerCase().includes('lm studio') ? 'lm-studio' : 'anthropic';
    const testLines = sampleData[providerType];
    
    addResult(`Testing parsing for ${providerType}...`);
    
    for (const line of testLines) {
      try {
        addResult(`Testing line: ${line}`);
        
        // Simulate the parsing logic
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            addResult('✅ Detected end of stream');
            continue;
          }
          
          const parsed = JSON.parse(data);
          
          if (providerType === 'lm-studio') {
            const content = parsed.choices?.[0]?.delta?.content;
            addResult(`✅ Extracted content: "${content}"`);
          } else {
            if (parsed.type === 'content_block_delta') {
              const content = parsed.delta?.text;
              addResult(`✅ Extracted content: "${content}"`);
            } else {
              addResult(`ℹ️ Event type: ${parsed.type}`);
            }
          }
        }
      } catch (error) {
        addResult(`❌ Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    setIsLoading(false);
  };

  const runTest = () => {
    switch (testType) {
      case 'connection':
        testConnection();
        break;
      case 'streaming':
        testStreaming();
        break;
      case 'parsing':
        testParsing();
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Streaming Debugger - {provider.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Type
            </label>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="connection">Connection Test</option>
              <option value="streaming">Streaming Test</option>
              <option value="parsing">Response Parsing Test</option>
            </select>
          </div>

          <div>
            <button
              onClick={runTest}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Running Test...' : 'Run Test'}
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Test Results</h3>
            <div className="space-y-1 text-sm font-mono max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500">No test results yet. Click "Run Test" to start.</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="whitespace-pre-wrap break-words">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}