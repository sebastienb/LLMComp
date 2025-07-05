import Link from 'next/link';
import { useStore } from '@/stores/useStore';
import { getThemeClasses } from '@/lib/themes';

interface HeaderProps {
  onAddProvider: () => void;
  onOpenSettings: () => void;
  onOpenThemePicker: () => void;
}

export default function Header({ onAddProvider, onOpenSettings, onOpenThemePicker }: HeaderProps) {
  const { theme } = useStore();
  const themeClasses = getThemeClasses(theme);

  return (
    <header className={
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
          <div className="flex items-center space-x-4">
            <h1 className={
              theme === 'tui' ? 'text-lg font-bold text-green-400 font-mono' : 
              theme === 'monitor' ? 'text-xl font-bold text-green-400 font-mono uppercase tracking-wide' :
              'text-2xl font-bold text-gray-900'
            }>
              {theme === 'tui' ? 'LLM-COMP' : 
               theme === 'monitor' ? '■ LLM COMPARISON MONITOR' :
               'Multi-LLM Comparison Tool'}
            </h1>
          </div>
          
          <div className={`flex items-center ${
            theme === 'tui' ? 'space-x-1' : 
            theme === 'monitor' ? 'space-x-2' :
            'space-x-4'
          }`}>
            <button
              onClick={onAddProvider}
              className={themeClasses.buttonPrimary}
            >
              {theme === 'tui' ? '+ PROV' : 
               theme === 'monitor' ? '+ PROVIDER' :
               'Add Provider'}
            </button>
            
            <Link
              href="/history"
              className={`${themeClasses.buttonIcon} ${
                theme === 'tui' ? 'p-1' : 
                theme === 'monitor' ? 'p-1' :
                'p-2 rounded-lg hover:bg-gray-100'
              } transition-colors`}
              title="Response History"
            >
              <svg className={
                theme === 'tui' ? 'w-4 h-4' : 
                theme === 'monitor' ? 'w-4 h-4' :
                'w-5 h-5'
              } fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Link>

            <button
              onClick={onOpenThemePicker}
              className={`${themeClasses.buttonIcon} ${
                theme === 'tui' ? 'p-1' : 
                theme === 'monitor' ? 'p-1' :
                'p-2 rounded-lg hover:bg-gray-100'
              } transition-colors`}
              title="Change Theme"
            >
              <svg className={
                theme === 'tui' ? 'w-4 h-4' : 
                theme === 'monitor' ? 'w-4 h-4' :
                'w-5 h-5'
              } fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
            </button>
            
            <button
              onClick={onOpenSettings}
              className={`${themeClasses.buttonIcon} ${
                theme === 'tui' ? 'p-1' : 
                theme === 'monitor' ? 'p-1' :
                'p-2 rounded-lg hover:bg-gray-100'
              } transition-colors`}
              title="Settings"
            >
              <svg className={
                theme === 'tui' ? 'w-4 h-4' : 
                theme === 'monitor' ? 'w-4 h-4' :
                'w-5 h-5'
              } fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}