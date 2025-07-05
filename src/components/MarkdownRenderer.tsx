'use client';

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { useStore } from '@/stores/useStore';
import { getThemeClasses } from '@/lib/themes';

// Import highlight.js CSS
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer = memo(({ content, className = '' }: MarkdownRendererProps) => {
  const { theme } = useStore();
  const themeClasses = getThemeClasses(theme);
  
  return (
    <div className={`${theme === 'tui' ? '' : 'prose prose-sm'} max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Custom code block styling
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <pre className={
                theme === 'tui' 
                  ? 'bg-gray-900 text-green-400 border border-green-400 p-1 overflow-x-auto text-xs font-mono' 
                  : theme === 'monitor'
                  ? 'bg-gray-800 text-gray-200 border border-gray-600 p-2 overflow-x-auto text-sm font-mono'
                  : 'bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm'
              }>
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className={
                theme === 'tui' 
                  ? 'bg-gray-900 text-green-400 border border-green-400 px-1 text-xs font-mono' 
                  : theme === 'monitor'
                  ? 'bg-gray-800 text-gray-200 border border-gray-600 px-1 text-sm font-mono'
                  : 'bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono'
              } {...props}>
                {children}
              </code>
            );
          },
          // Custom heading styling
          h1: ({ children }) => (
            <h1 className={
              theme === 'tui' 
                ? 'text-sm font-bold text-green-400 mb-1 mt-2 first:mt-0 font-mono' 
                : theme === 'monitor'
                ? 'text-base font-bold text-green-400 mb-2 mt-3 first:mt-0 font-mono uppercase'
                : 'text-xl font-bold text-gray-900 mb-4 mt-6 first:mt-0'
            }>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className={theme === 'tui' 
              ? 'text-xs font-semibold text-green-400 mb-1 mt-2 font-mono' 
              : 'text-lg font-semibold text-gray-900 mb-3 mt-5'
            }>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={theme === 'tui' 
              ? 'text-xs font-semibold text-green-400 mb-1 mt-1 font-mono' 
              : 'text-base font-semibold text-gray-900 mb-2 mt-4'
            }>
              {children}
            </h3>
          ),
          // Custom paragraph styling
          p: ({ children }) => (
            <p className={
              theme === 'tui' 
                ? 'text-green-400 mb-1 leading-tight text-xs font-mono' 
                : theme === 'monitor'
                ? 'text-gray-200 mb-2 leading-normal text-sm font-mono'
                : 'text-gray-900 mb-3 leading-relaxed'
            }>
              {children}
            </p>
          ),
          // Custom list styling
          ul: ({ children }) => (
            <ul className={theme === 'tui' 
              ? 'list-disc list-inside mb-1 space-y-0 text-green-400 text-xs font-mono' 
              : 'list-disc list-inside mb-3 space-y-1 text-gray-900'
            }>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className={theme === 'tui' 
              ? 'list-decimal list-inside mb-1 space-y-0 text-green-400 text-xs font-mono' 
              : 'list-decimal list-inside mb-3 space-y-1 text-gray-900'
            }>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className={theme === 'tui' ? 'text-green-400 text-xs font-mono' : 'text-gray-900'}>
              {children}
            </li>
          ),
          // Custom blockquote styling
          blockquote: ({ children }) => (
            <blockquote className={theme === 'tui' 
              ? 'border-l border-cyan-400 pl-1 py-0 mb-1 bg-gray-900 text-cyan-400 italic text-xs font-mono' 
              : 'border-l-4 border-blue-500 pl-4 py-2 mb-3 bg-blue-50 text-gray-800 italic'
            }>
              {children}
            </blockquote>
          ),
          // Custom table styling
          table: ({ children }) => (
            <div className={theme === 'tui' ? 'overflow-x-auto mb-1' : 'overflow-x-auto mb-3'}>
              <table className={theme === 'tui' 
                ? 'min-w-full border border-green-400' 
                : 'min-w-full border border-gray-300 rounded-lg'
              }>
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={theme === 'tui' ? 'bg-gray-900' : 'bg-gray-50'}>
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className={theme === 'tui' 
              ? 'border border-green-400 px-1 py-0 text-left font-semibold text-green-400 text-xs font-mono' 
              : 'border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900'
            }>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className={theme === 'tui' 
              ? 'border border-green-400 px-1 py-0 text-green-400 text-xs font-mono' 
              : 'border border-gray-300 px-4 py-2 text-gray-900'
            }>
              {children}
            </td>
          ),
          // Custom link styling
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className={theme === 'tui' 
                ? 'text-cyan-400 hover:text-cyan-300 underline font-mono text-xs' 
                : 'text-blue-600 hover:text-blue-800 underline'
              }
            >
              {children}
            </a>
          ),
          // Custom strong/bold styling
          strong: ({ children }) => (
            <strong className={theme === 'tui' 
              ? 'font-semibold text-green-400 font-mono text-xs' 
              : 'font-semibold text-gray-900'
            }>
              {children}
            </strong>
          ),
          // Custom emphasis/italic styling
          em: ({ children }) => (
            <em className={theme === 'tui' 
              ? 'italic text-green-400 font-mono text-xs' 
              : 'italic text-gray-900'
            }>
              {children}
            </em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';

export default MarkdownRenderer;