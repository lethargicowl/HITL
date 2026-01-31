import { useState } from 'react';
import { Badge, Card, CardBody, Spinner } from '@/components/common';
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
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-primary-600 text-white px-2 py-4 rounded-l-lg shadow-lg hover:bg-primary-700 transition-colors z-40"
        title="Show Examples (E)"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl border-l border-gray-200 z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-900">Annotation Examples</h3>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-700"
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
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : examples.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No examples available</p>
        ) : (
          <div className="space-y-4">
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

      <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
        Press <kbd className="px-1 bg-gray-200 rounded">E</kbd> to toggle panel
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
  const borderColor = example.is_positive ? 'border-l-green-500' : 'border-l-red-500';
  const bgColor = example.is_positive ? 'bg-green-50' : 'bg-red-50';

  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardBody className="p-3">
        <button
          onClick={onToggle}
          className="w-full text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={example.is_positive ? 'success' : 'danger'} size="sm">
                {example.is_positive ? 'Good' : 'Bad'}
              </Badge>
              <span className="font-medium text-gray-900">{example.title}</span>
            </div>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-3">
            {/* Content */}
            <div className={`p-3 rounded ${bgColor}`}>
              <div className="text-xs font-medium text-gray-500 mb-1">Content</div>
              <RowContent content={example.content} />
            </div>

            {/* Expected Response */}
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Expected Response</div>
              <div className="text-sm text-gray-700">
                <ResponseDisplay response={example.example_response} />
              </div>
            </div>

            {/* Explanation */}
            {example.explanation && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Explanation</div>
                <p className="text-sm text-gray-600">{example.explanation}</p>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
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
