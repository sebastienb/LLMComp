'use client';

import { useState, useEffect } from 'react';
import { LLMProvider, PromptRequest } from '@/types';
import { useStore } from '@/stores/useStore';
import { fetchModels } from '@/lib/api';

interface RerunModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: LLMProvider;
  onRerun: (providerId: string, settings: {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
  }) => void;
}

export default function RerunModal({ isOpen, onClose, provider, onRerun }: RerunModalProps) {
  const { promptSettings } = useStore();
  const [model, setModel] = useState(provider.model);
  const [temperature, setTemperature] = useState(promptSettings.temperature);
  const [maxTokens, setMaxTokens] = useState(promptSettings.maxTokens);
  const [topP, setTopP] = useState(promptSettings.topP);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset values when modal opens
      setModel(provider.model);
      setTemperature(promptSettings.temperature);
      setMaxTokens(promptSettings.maxTokens);
      setTopP(promptSettings.topP);
      setAvailableModels([]);
      
      // Load available models
      loadModels();
    }
  }, [isOpen, provider, promptSettings]);

  const loadModels = async () => {
    try {
      setIsLoadingModels(true);
      const models = await fetchModels(provider);
      setAvailableModels(models);
    } catch (error) {
      console.error('Failed to fetch models:', error);
      // Fallback to current model if fetching fails
      setAvailableModels([provider.model]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleRerun = () => {
    onRerun(provider.id, {
      model,
      temperature,
      maxTokens,
      topP,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Rerun: {provider.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <div className="flex space-x-2">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoadingModels}
              >
                <option value={provider.model}>{provider.model}</option>
                {availableModels.filter(m => m !== provider.model).map((modelName) => (
                  <option key={modelName} value={modelName}>
                    {modelName}
                  </option>
                ))}
              </select>
              <button
                onClick={loadModels}
                disabled={isLoadingModels}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh models"
              >
                {isLoadingModels ? (
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature: {temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Deterministic</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Tokens
            </label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1000)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="4000"
            />
          </div>

          {/* Top P */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Top P: {topP}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={topP}
              onChange={(e) => setTopP(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Focused</span>
              <span>Diverse</span>
            </div>
          </div>

          {/* Current Model Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-700 mb-1">Current Configuration</div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Model: {provider.model}</div>
              <div>Temperature: {promptSettings.temperature}</div>
              <div>Max Tokens: {promptSettings.maxTokens}</div>
              <div>Top P: {promptSettings.topP}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRerun}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Rerun
          </button>
        </div>
      </div>
    </div>
  );
}