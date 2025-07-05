'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/stores/useStore';
import { LLMProvider } from '@/types';
import { encryptApiKey, decryptApiKey } from '@/lib/crypto';
import { testConnection, fetchModels } from '@/lib/api';

interface ProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId?: string | null;
}

const PROVIDER_PRESETS = {
  openai: {
    name: 'OpenAI',
    apiUrl: 'https://api.openai.com',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    requiresAuth: true,
  },
  anthropic: {
    name: 'Anthropic',
    apiUrl: 'https://api.anthropic.com',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    requiresAuth: true,
  },
  google: {
    name: 'Google',
    apiUrl: 'https://generativelanguage.googleapis.com',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
    requiresAuth: true,
  },
  lmstudio: {
    name: 'LM Studio',
    apiUrl: 'http://localhost:1234',
    models: [],
    requiresAuth: false,
  },
  ollama: {
    name: 'Ollama',
    apiUrl: 'http://localhost:11434',
    models: [],
    requiresAuth: false,
  },
  textgenwebui: {
    name: 'Text Generation WebUI',
    apiUrl: 'http://localhost:5000',
    models: [],
    requiresAuth: false,
  },
  custom: {
    name: 'Custom',
    apiUrl: '',
    models: [],
    requiresAuth: true,
  },
};

export default function ProviderModal({ isOpen, onClose, editingId }: ProviderModalProps) {
  const { providers, addProvider, updateProvider, removeProvider } = useStore();
  
  const [formData, setFormData] = useState({
    name: '',
    apiUrl: '',
    apiKey: '',
    model: '',
    maxTokens: 1000,
    temperature: 0.7,
    topP: 1.0,
    timeout: 30000,
    customHeaders: '',
    isActive: true,
    requiresAuth: true,
  });

  const [selectedPreset, setSelectedPreset] = useState<keyof typeof PROVIDER_PRESETS>('openai');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<'success' | 'error' | null>(null);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsFetched, setModelsFetched] = useState(false);

  const editingProvider = editingId ? providers.find(p => p.id === editingId) : null;

  useEffect(() => {
    if (!isOpen) {
      // Reset all state when modal closes
      setAvailableModels([]);
      setModelsFetched(false);
      setConnectionTestResult(null);
      return;
    }

    if (editingProvider) {
      // Decrypt the API key for editing
      let decryptedApiKey = '';
      if (editingProvider.apiKey) {
        try {
          decryptedApiKey = decryptApiKey(editingProvider.apiKey);
          console.log('Successfully decrypted API key for editing');
        } catch (error) {
          console.warn('Could not decrypt API key for editing:', error);
          // Keep it empty if decryption fails
        }
      }
      
      setFormData({
        name: editingProvider.name,
        apiUrl: editingProvider.apiUrl,
        apiKey: decryptedApiKey,
        model: editingProvider.model,
        maxTokens: editingProvider.maxTokens || 1000,
        temperature: editingProvider.temperature || 0.7,
        topP: editingProvider.topP || 1.0,
        timeout: editingProvider.timeout || 30000,
        customHeaders: editingProvider.customHeaders ? JSON.stringify(editingProvider.customHeaders, null, 2) : '',
        isActive: editingProvider.isActive,
        requiresAuth: editingProvider.requiresAuth ?? true,
      });
    } else {
      // Reset form for new provider
      handlePresetChange('openai');
    }
  }, [editingProvider, isOpen]);

  const handleApiKeyChange = (value: string) => {
    setFormData(prev => ({ ...prev, apiKey: value }));
  };

  const handlePresetChange = (preset: keyof typeof PROVIDER_PRESETS) => {
    setSelectedPreset(preset);
    const presetData = PROVIDER_PRESETS[preset];
    setFormData(prev => ({
      ...prev,
      name: presetData.name,
      apiUrl: presetData.apiUrl,
      model: presetData.models[0] || '',
      requiresAuth: presetData.requiresAuth ?? true,
      apiKey: presetData.requiresAuth === false ? '' : prev.apiKey,
    }));
    
    // Reset model fetching state when preset changes
    setAvailableModels([]);
    setModelsFetched(false);
  };

  const handleFetchModels = async () => {
    if (!formData.apiUrl || !formData.name) {
      alert('Please provide provider name and API URL before fetching models');
      return;
    }

    if (formData.requiresAuth && !formData.apiKey) {
      alert('Please provide API key for this provider before fetching models');
      return;
    }

    setIsFetchingModels(true);
    try {
      const models = await fetchModels(formData.name, formData.apiUrl, formData.apiKey);
      setAvailableModels(models);
      setModelsFetched(true);
      
      if (models.length > 0 && !formData.model) {
        setFormData(prev => ({ ...prev, model: models[0] }));
      }
    } catch (error: unknown) {
      console.error('Failed to fetch models:', error);
      
      let errorMessage = 'Failed to fetch models. ';
      if (error instanceof Error) {
        errorMessage += error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string; details?: string; status?: number } } };
        if (axiosError.response?.data) {
          const { error: apiError, details, status } = axiosError.response.data;
          errorMessage += `${apiError || 'Unknown API error'}`;
          if (details) errorMessage += ` - ${details}`;
          if (status) errorMessage += ` (Status: ${status})`;
        }
      }
      
      // Add specific guidance for common issues
      if (formData.apiUrl.includes('localhost') || formData.apiUrl.includes('127.0.0.1')) {
        errorMessage += '\n\nFor local providers:\n• Make sure the server is running\n• Check the correct port number\n• Verify the API endpoint is accessible';
      }
      
      alert(errorMessage);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.apiUrl) {
      alert('Please provide API URL');
      return;
    }

    if (formData.requiresAuth && !formData.apiKey) {
      alert('Please provide API key for this provider');
      return;
    }

    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      const testProvider: LLMProvider = {
        id: 'test',
        name: formData.name,
        apiUrl: formData.apiUrl,
        apiKey: formData.apiKey ? encryptApiKey(formData.apiKey) : undefined,
        model: formData.model || 'test-model',
        maxTokens: formData.maxTokens,
        temperature: formData.temperature,
        topP: formData.topP,
        timeout: formData.timeout,
        customHeaders: formData.customHeaders ? JSON.parse(formData.customHeaders) : undefined,
        isActive: true,
        requiresAuth: formData.requiresAuth,
      };

      const success = await testConnection(testProvider);
      setConnectionTestResult(success ? 'success' : 'error');
    } catch {
      setConnectionTestResult('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.apiUrl || !formData.model) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.requiresAuth && !formData.apiKey) {
      alert('API key is required for this provider');
      return;
    }

    try {
      const customHeaders = formData.customHeaders ? JSON.parse(formData.customHeaders) : undefined;
      
      // Handle API key encryption - simplified logic
      let encryptedApiKey: string | undefined;
      if (formData.apiKey) {
        // Always encrypt the current form API key value
        encryptedApiKey = encryptApiKey(formData.apiKey);
      } else if (editingId && editingProvider?.apiKey) {
        // If no API key in form but we're editing, keep the original
        encryptedApiKey = editingProvider.apiKey;
      } else {
        encryptedApiKey = undefined;
      }

      const providerData: LLMProvider = {
        id: editingId || `provider-${Date.now()}`,
        name: formData.name,
        apiUrl: formData.apiUrl,
        apiKey: encryptedApiKey,
        model: formData.model,
        maxTokens: formData.maxTokens,
        temperature: formData.temperature,
        topP: formData.topP,
        timeout: formData.timeout,
        customHeaders,
        isActive: formData.isActive,
        requiresAuth: formData.requiresAuth,
      };

      if (editingId) {
        updateProvider(editingId, providerData);
      } else {
        addProvider(providerData);
      }

      onClose();
    } catch {
      alert('Invalid custom headers JSON');
    }
  };

  const handleDelete = () => {
    if (editingId && confirm('Are you sure you want to delete this provider?')) {
      removeProvider(editingId);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {editingId ? 'Edit Provider' : 'Add New Provider'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider Preset
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value as keyof typeof PROVIDER_PRESETS)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(PROVIDER_PRESETS).map(([key, preset]) => (
                  <option key={key} value={key}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API URL *
            </label>
            <input
              type="url"
              value={formData.apiUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, apiUrl: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://api.example.com"
              required
            />
          </div>

          {formData.requiresAuth && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key *
              </label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={editingId ? 'Current API key is loaded - modify to change' : 'Enter API key'}
                required={formData.requiresAuth && !editingId}
              />
            </div>
          )}

          {!formData.requiresAuth && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm font-medium text-green-800 mb-1">No Authentication Required</div>
              <div className="text-sm text-green-700">This provider does not require an API key.</div>
              {formData.name.toLowerCase().includes('lm studio') && (
                <div className="text-sm text-green-700 mt-2">
                  <strong>LM Studio Setup:</strong>
                  <ul className="list-disc list-inside mt-1 text-xs">
                    <li>Start LM Studio and load a model</li>
                    <li>Go to Local Server tab and start server</li>
                    <li>Default URL is usually http://localhost:1234</li>
                    <li>Make sure CORS is enabled in LM Studio settings</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Model *
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleFetchModels}
                  disabled={isFetchingModels || !formData.apiUrl || (formData.requiresAuth && !formData.apiKey)}
                  className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isFetchingModels ? 'Fetching...' : 'Fetch Models'}
                </button>
                
                {modelsFetched && (
                  <button
                    type="button"
                    onClick={() => {
                      setModelsFetched(false);
                      setAvailableModels([]);
                    }}
                    className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
                    title="Switch to manual model entry"
                  >
                    Manual Entry
                  </button>
                )}
              </div>
            </div>
            
            {modelsFetched && availableModels.length > 0 ? (
              <select
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a model</option>
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={
                  formData.name.toLowerCase().includes('lm studio') 
                    ? "Enter model name (e.g., local-model, loaded-model) or click Fetch Models"
                    : "Enter model name (e.g., gpt-4) or click Fetch Models"
                }
                required
              />
            )}
            
            {modelsFetched && availableModels.length === 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
                <div className="text-sm font-medium text-orange-800 mb-1">No models found</div>
                <div className="text-sm text-orange-700">
                  The endpoint is accessible but no models were returned. You can enter a model name manually below.
                  {formData.name.toLowerCase().includes('lm studio') && (
                    <div className="mt-2">
                      <strong>For LM Studio:</strong> Try common names like:
                      <ul className="list-disc list-inside mt-1 text-xs">
                        <li><code>local-model</code></li>
                        <li><code>loaded-model</code></li>
                        <li>The exact model name from LM Studio&apos;s chat tab</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              Click &quot;Fetch Models&quot; to automatically load available models from the provider
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                value={formData.maxTokens}
                onChange={(e) => setFormData(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 1000 }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="4000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeout (ms)
              </label>
              <input
                type="number"
                value={formData.timeout}
                onChange={(e) => setFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30000 }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1000"
                max="120000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Headers (JSON)
            </label>
            <textarea
              value={formData.customHeaders}
              onChange={(e) => setFormData(prev => ({ ...prev, customHeaders: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder='{"Authorization": "Bearer token", "X-Custom-Header": "value"}'
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>

            {selectedPreset === 'custom' && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requiresAuth"
                  checked={formData.requiresAuth}
                  onChange={(e) => setFormData(prev => ({ ...prev, requiresAuth: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="requiresAuth" className="text-sm font-medium text-gray-700">
                  Requires Authentication
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                {isTestingConnection ? 'Testing...' : 'Test Connection'}
              </button>
              
              {connectionTestResult && (
                <div className={`px-3 py-2 rounded-lg text-sm ${
                  connectionTestResult === 'success' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {connectionTestResult === 'success' ? '✓ Connected' : '✗ Connection failed'}
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              {editingId && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              )}
              
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Update' : 'Add'} Provider
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}