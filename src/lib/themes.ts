import { Theme } from '@/types';

export const themes = {
  default: {
    name: 'Modern UI',
    description: 'Clean, spacious interface with cards and shadows',
    classes: {
      // Layout
      body: 'min-h-screen bg-gray-50',
      container: 'container mx-auto px-4 py-8',
      
      // Cards
      card: 'bg-white rounded-lg shadow-sm border border-gray-200',
      cardHeader: 'p-4 border-b border-gray-200',
      cardBody: 'p-4',
      
      // Buttons
      buttonPrimary: 'px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium',
      buttonSecondary: 'px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors',
      buttonIcon: 'text-gray-400 hover:text-gray-600 p-1 rounded',
      
      // Form inputs
      input: 'w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      textarea: 'w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none',
      
      // Grid
      grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
      
      // Text
      heading: 'text-2xl font-bold text-gray-900',
      subheading: 'text-lg font-medium text-gray-900',
      text: 'text-gray-900',
      textMuted: 'text-gray-500',
      textSmall: 'text-sm text-gray-500',
      
      // Status
      statusCompleted: 'bg-green-100 text-green-800',
      statusError: 'bg-red-100 text-red-800',
      statusPending: 'bg-yellow-100 text-yellow-800',
      statusStreaming: 'bg-blue-100 text-blue-800',
    }
  },
  
  tui: {
    name: 'Terminal UI',
    description: 'Compact, terminal-inspired interface for maximum efficiency',
    classes: {
      // Layout
      body: 'min-h-screen bg-black text-green-400 font-mono',
      container: 'max-w-none px-2 py-1',
      
      // Cards
      card: 'border border-green-400 bg-black mb-1',
      cardHeader: 'border-b border-green-400 px-2 py-1 bg-gray-900',
      cardBody: 'p-2',
      
      // Buttons
      buttonPrimary: 'px-3 py-1 bg-green-400 text-black hover:bg-green-300 border border-green-400 font-mono text-sm',
      buttonSecondary: 'px-3 py-1 text-green-400 border border-green-400 hover:bg-green-400 hover:text-black font-mono text-sm',
      buttonIcon: 'text-green-400 hover:text-green-300',
      
      // Form inputs
      input: 'w-full p-1 border border-green-400 bg-black text-green-400 focus:outline-none focus:border-green-300 font-mono text-sm',
      textarea: 'w-full p-1 border border-green-400 bg-black text-green-400 focus:outline-none focus:border-green-300 resize-none font-mono text-sm',
      
      // Grid - More compact for TUI
      grid: 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-1',
      
      // Text
      heading: 'text-lg font-bold text-green-400 font-mono',
      subheading: 'text-base font-semibold text-green-400 font-mono',
      text: 'text-green-400 font-mono text-sm',
      textMuted: 'text-green-600 font-mono text-xs',
      textSmall: 'text-xs text-green-600 font-mono',
      
      // Status
      statusCompleted: 'text-green-400 bg-black',
      statusError: 'text-red-400 bg-black',
      statusPending: 'text-yellow-400 bg-black',
      statusStreaming: 'text-cyan-400 bg-black',
    }
  },
  
  monitor: {
    name: 'Terminal Monitor',
    description: 'Dark monitoring interface with professional status indicators',
    classes: {
      // Layout
      body: 'min-h-screen bg-gray-800 text-gray-300 font-mono',
      container: 'max-w-none px-3 py-2',
      
      // Cards
      card: 'border border-gray-600 bg-gray-900 mb-2',
      cardHeader: 'border-b border-gray-600 px-3 py-2 bg-gray-800',
      cardBody: 'p-3',
      
      // Buttons
      buttonPrimary: 'px-4 py-2 bg-green-600 text-white hover:bg-green-500 border border-green-600 font-mono text-sm',
      buttonSecondary: 'px-3 py-1 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:text-white font-mono text-sm',
      buttonIcon: 'text-gray-400 hover:text-gray-200',
      
      // Form inputs
      input: 'w-full p-2 border border-gray-600 bg-gray-800 text-gray-200 focus:outline-none focus:border-green-500 font-mono text-sm',
      textarea: 'w-full p-2 border border-gray-600 bg-gray-800 text-gray-200 focus:outline-none focus:border-green-500 resize-none font-mono text-sm',
      
      // Grid - More compact for monitoring
      grid: 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2',
      
      // Text
      heading: 'text-lg font-bold text-white font-mono uppercase tracking-wide',
      subheading: 'text-base font-semibold text-green-400 font-mono uppercase',
      text: 'text-gray-200 font-mono text-sm',
      textMuted: 'text-gray-400 font-mono text-xs',
      textSmall: 'text-xs text-gray-400 font-mono',
      
      // Status
      statusCompleted: 'text-green-400 bg-gray-900',
      statusError: 'text-red-400 bg-gray-900',
      statusPending: 'text-yellow-400 bg-gray-900',
      statusStreaming: 'text-cyan-400 bg-gray-900',
    }
  }
} as const;

export function getThemeClasses(theme: Theme) {
  return themes[theme].classes;
}

export function getThemeInfo(theme: Theme) {
  return {
    name: themes[theme].name,
    description: themes[theme].description,
  };
}