import { useState } from 'react';
import { Badge, Spinner } from '@/components/common';
import { RowContent } from '@/components/media';
import { AnnotationExample, EvaluationResponse, MultiQuestionResponse } from '@/types';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface ExamplesPanelProps {
  examples: AnnotationExample[];
  isLoading?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export function ExamplesPanel({ examples, isLoading = false, isOpen, onToggle }: ExamplesPanelProps) {
  const [expandedExample, setExpandedExample] = useState<string | null>(null);

  useKeyboardShortcuts([
    { key: 'e', handler: onToggle },
  ]);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-gradient-to-b from-primary-500 to-primary-600 text-white px-2.5 py-5 rounded-l-xl shadow-lg hover:from-primary-600 hover:to-primary-700 transition-all z-40 group"
        title="Show Examples (E)"
      >
        <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200/50 z-40 flex flex-col animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">Annotation Examples</h3>
        </div>
        <button
          onClick={onToggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          title="Close (E)"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner />
            <p className="mt-3 text-sm text-gray-500">Loading examples...</p>
          </div>
        ) : examples.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No examples available</p>
            <p className="text-sm text-gray-400 mt-1">Examples will appear here when added</p>
          </div>
        ) : (
          <div className="space-y-3">
            {examples.map((example) => (
              <ExampleCard
                key={example.id}
                example={example}
                isExpanded={expandedExample === example.id}
                onToggle={() =>
                  setExpandedExample(expandedExample === example.id ? null : example.id)
                }
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500 flex items-center gap-2">
        <span>Press</span>
        <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600 font-mono">E</kbd>
        <span>to toggle panel</span>
      </div>
    </div>
  );
}

interface ExampleCardProps {
  example: AnnotationExample;
  isExpanded: boolean;
  onToggle: () => void;
}

function ExampleCard({ example, isExpanded, onToggle }: ExampleCardProps) {
  const isPositive = example.is_positive;

  return (
    <div className={`
      rounded-xl border overflow-hidden transition-all duration-200
      ${isPositive ? 'border-success-200 bg-success-50/30' : 'border-danger-200 bg-danger-50/30'}
      ${isExpanded ? 'shadow-soft' : 'hover:shadow-soft'}
    `}>
      <button
        onClick={onToggle}
        className="w-full text-left p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
              ${isPositive ? 'bg-success-100' : 'bg-danger-100'}
            `}>
              {isPositive ? (
                <svg className="w-4 h-4 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <Badge variant={isPositive ? 'success' : 'danger'} size="sm">
                {isPositive ? 'Good Example' : 'Bad Example'}
              </Badge>
              <p className="font-medium text-gray-900 mt-1">{example.title}</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-200/50 pt-4">
          {/* Content */}
          <div className="bg-white rounded-lg p-3 border border-gray-200/50">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Content</div>
            <RowContent content={example.content} />
          </div>

          {/* Expected Response */}
          <div className="bg-white rounded-lg p-3 border border-gray-200/50">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Expected Response</div>
            <div className="text-sm text-gray-700">
              <ResponseDisplay response={example.example_response} />
            </div>
          </div>

          {/* Explanation */}
          {example.explanation && (
            <div className={`rounded-lg p-3 ${isPositive ? 'bg-success-50' : 'bg-danger-50'}`}>
              <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Explanation</div>
              <p className="text-sm text-gray-700 leading-relaxed">{example.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResponseDisplay({ response }: { response: EvaluationResponse | MultiQuestionResponse }) {
  if (!response) return <span className="text-gray-400">No response</span>;

  // Check for different response types
  if ('value' in response) {
    return <span>Value: {String((response as { value: unknown }).value)}</span>;
  }
  if ('selected' in response) {
    return <span>Selected: {(response as { selected: string[] }).selected.join(', ')}</span>;
  }
  if ('text' in response) {
    return <span>"{(response as { text: string }).text}"</span>;
  }
  if ('winner' in response) {
    return <span>Winner: {(response as { winner: string }).winner}</span>;
  }
  if ('criteria' in response) {
    const criteriaResp = response as { criteria: Record<string, number> };
    return (
      <div>
        {Object.entries(criteriaResp.criteria).map(([key, val]) => (
          <div key={key}>{key}: {val}</div>
        ))}
      </div>
    );
  }

  // Multi-question response - render as key-value pairs
  return (
    <div className="space-y-1">
      {Object.entries(response as Record<string, unknown>).map(([key, val]) => (
        <div key={key} className="text-xs">
          <span className="font-medium">{key}:</span>{' '}
          {formatResponseValue(val)}
        </div>
      ))}
    </div>
  );
}

function formatResponseValue(val: unknown): string {
  if (val && typeof val === 'object') {
    if ('value' in val) return String((val as { value: unknown }).value);
    if ('selected' in val) return (val as { selected: string[] }).selected.join(', ');
    if ('text' in val) return `"${(val as { text: string }).text}"`;
    if ('winner' in val) return `Winner: ${(val as { winner: string }).winner}`;
  }
  return String(val);
}
