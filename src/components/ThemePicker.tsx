'use client';

import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { Theme } from '@/types';
import { getThemeInfo, getThemeClasses } from '@/lib/themes';

interface ThemePickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ThemePicker({ isOpen, onClose }: ThemePickerProps) {
  const { theme, setTheme } = useStore();
  const [selectedTheme, setSelectedTheme] = useState<Theme>(theme);
  const themeClasses = getThemeClasses(theme);

  const themes: Theme[] = ['default', 'tui', 'monitor'];

  const handleApply = () => {
    setTheme(selectedTheme);
    onClose();
  };

  const handlePreview = (newTheme: Theme) => {
    setSelectedTheme(newTheme);
    // Temporarily apply theme for preview
    setTheme(newTheme);
  };

  const handleCancel = () => {
    // Revert to original theme if previewing
    setTheme(theme);
    setSelectedTheme(theme);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${
        theme === 'tui' ? 'bg-black border border-green-400 text-green-400' : 
        theme === 'monitor' ? 'bg-gray-900 border border-gray-600 text-gray-200' :
        'bg-white'
      } rounded-lg p-6 w-full max-w-md`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-semibold ${
            theme === 'tui' ? 'text-green-400 font-mono' : 
            theme === 'monitor' ? 'text-green-400 font-mono uppercase' :
            'text-gray-900'
          }`}>
            {theme === 'monitor' ? 'THEME SELECTOR' : 'Choose Theme'}
          </h2>
          <button
            onClick={handleCancel}
            className={`${
              theme === 'tui' ? 'text-green-400 hover:text-green-300' : 
              theme === 'monitor' ? 'text-gray-400 hover:text-gray-200' :
              'text-gray-500 hover:text-gray-700'
            } text-xl`}
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {themes.map((themeOption) => {
            const info = getThemeInfo(themeOption);
            const isSelected = selectedTheme === themeOption;
            
            return (
              <div
                key={themeOption}
                onClick={() => handlePreview(themeOption)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  theme === 'tui'
                    ? `border-green-400 ${isSelected ? 'bg-green-400 text-black' : 'hover:bg-gray-900'}`
                    : theme === 'monitor'
                    ? `border-gray-600 ${isSelected ? 'border-green-500 bg-gray-800' : 'hover:border-gray-500'}`
                    : `border-gray-200 ${isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'}`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-semibold ${
                      theme === 'tui' || theme === 'monitor' ? 'font-mono' : ''
                    } ${
                      isSelected && theme === 'tui' ? 'text-black' : 
                      isSelected && theme === 'monitor' ? 'text-green-400' :
                      theme === 'tui' ? 'text-green-400' : 
                      theme === 'monitor' ? 'text-gray-200' :
                      'text-gray-900'
                    }`}>
                      {info.name}
                    </h3>
                    <p className={`text-sm ${
                      theme === 'tui' || theme === 'monitor' ? 'font-mono' : ''
                    } ${
                      isSelected && theme === 'tui' ? 'text-black' : 
                      isSelected && theme === 'monitor' ? 'text-gray-300' :
                      theme === 'tui' ? 'text-green-600' : 
                      theme === 'monitor' ? 'text-gray-400' :
                      'text-gray-600'
                    }`}>
                      {info.description}
                    </p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    isSelected 
                      ? theme === 'tui' ? 'bg-black border-black' : 
                        theme === 'monitor' ? 'bg-green-500 border-green-500' :
                        'bg-blue-500 border-blue-500'
                      : theme === 'tui' ? 'border-green-400' : 
                        theme === 'monitor' ? 'border-gray-600' :
                        'border-gray-300'
                  }`} />
                </div>

                {/* Theme Preview */}
                <div className="mt-3 p-2 rounded border">
                  {themeOption === 'default' ? (
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="bg-white border border-gray-200 rounded p-2 mb-2">
                        <div className="text-sm text-gray-900 font-medium">Provider Card</div>
                        <div className="text-xs text-gray-500">Clean, spacious layout</div>
                      </div>
                      <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs">
                        Button
                      </button>
                    </div>
                  ) : themeOption === 'tui' ? (
                    <div className="bg-black p-2 rounded border border-green-400">
                      <div className="border border-green-400 p-1 mb-1 bg-gray-900">
                        <div className="text-xs text-green-400 font-mono">PROVIDER</div>
                        <div className="text-xs text-green-600 font-mono">compact layout</div>
                      </div>
                      <button className="px-2 py-0 bg-green-400 text-black text-xs font-mono">
                        BTN
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gray-800 p-2 rounded border border-gray-600">
                      <div className="border border-gray-600 p-2 mb-2 bg-gray-900">
                        <div className="text-xs text-green-400 font-mono font-semibold">■ OPENAI GPT-4</div>
                        <div className="text-xs text-gray-400 font-mono">STATUS: ✓ COMPLETED</div>
                      </div>
                      <button className="px-3 py-1 bg-green-600 text-white text-xs font-mono">
                        EXECUTE
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end space-x-4 mt-6 pt-4 border-t">
          <button
            onClick={handleCancel}
            className={
              theme === 'tui' 
                ? 'px-3 py-1 text-green-400 border border-green-400 hover:bg-green-400 hover:text-black font-mono text-sm'
                : theme === 'monitor'
                ? 'px-3 py-1 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:text-white font-mono text-sm'
                : 'px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
            }
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className={
              theme === 'tui'
                ? 'px-3 py-1 bg-green-400 text-black hover:bg-green-300 border border-green-400 font-mono text-sm'
                : theme === 'monitor'
                ? 'px-4 py-2 bg-green-600 text-white hover:bg-green-500 border border-green-600 font-mono text-sm'
                : 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            }
          >
            {theme === 'monitor' ? 'APPLY THEME' : 'Apply Theme'}
          </button>
        </div>
      </div>
    </div>
  );
}