import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState, LLMProvider, PromptRequest, LLMResponse } from '@/types';

interface AppStore extends AppState {
  // Provider management
  addProvider: (provider: LLMProvider) => void;
  updateProvider: (id: string, updates: Partial<LLMProvider>) => void;
  removeProvider: (id: string) => void;
  toggleProvider: (id: string) => void;
  
  // Prompt management
  setCurrentPrompt: (prompt: string) => void;
  setSystemPrompt: (prompt: string) => void;
  updatePromptSettings: (settings: Partial<AppState['promptSettings']>) => void;
  
  // Request management
  setCurrentRequest: (request: PromptRequest | null) => void;
  addToHistory: (request: PromptRequest) => void;
  clearHistory: () => void;
  
  // Loading state
  setLoading: (loading: boolean) => void;
  
  // Response management
  updateResponse: (requestId: string, response: LLMResponse) => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      // Initial state
      providers: [],
      currentPrompt: '',
      systemPrompt: '',
      promptSettings: {
        temperature: 0.7,
        maxTokens: 1000,
        topP: 1.0,
      },
      currentRequest: null,
      history: [],
      isLoading: false,

      // Provider management
      addProvider: (provider) =>
        set((state) => ({
          providers: [...state.providers, provider],
        })),

      updateProvider: (id, updates) =>
        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      removeProvider: (id) =>
        set((state) => ({
          providers: state.providers.filter((p) => p.id !== id),
        })),

      toggleProvider: (id) =>
        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === id ? { ...p, isActive: !p.isActive } : p
          ),
        })),

      // Prompt management
      setCurrentPrompt: (prompt) =>
        set({ currentPrompt: prompt }),

      setSystemPrompt: (prompt) =>
        set({ systemPrompt: prompt }),

      updatePromptSettings: (settings) =>
        set((state) => ({
          promptSettings: { ...state.promptSettings, ...settings },
        })),

      // Request management
      setCurrentRequest: (request) =>
        set({ currentRequest: request }),

      addToHistory: (request) =>
        set((state) => ({
          history: [request, ...state.history.slice(0, 99)], // Keep last 100 requests
        })),

      clearHistory: () =>
        set({ history: [] }),

      // Loading state
      setLoading: (loading) =>
        set({ isLoading: loading }),

      // Response management
      updateResponse: (requestId, response) =>
        set((state) => {
          const updatedHistory = state.history.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  responses: req.responses.map((r) =>
                    r.id === response.id ? response : r
                  ),
                }
              : req
          );

          const updatedCurrentRequest =
            state.currentRequest?.id === requestId
              ? {
                  ...state.currentRequest,
                  responses: state.currentRequest.responses.map((r) =>
                    r.id === response.id ? response : r
                  ),
                }
              : state.currentRequest;

          return {
            history: updatedHistory,
            currentRequest: updatedCurrentRequest,
          };
        }),
    }),
    {
      name: 'llm-comparison-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        providers: state.providers,
        history: state.history,
        promptSettings: state.promptSettings,
        systemPrompt: state.systemPrompt,
      }),
    }
  )
);