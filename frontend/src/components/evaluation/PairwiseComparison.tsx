import React from 'react';
import { PairwiseConfig, PairwiseResponse } from '@/types';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface PairwiseComparisonProps {
  config: PairwiseConfig;
  value: PairwiseResponse | null;
  onChange: (value: PairwiseResponse) => void;
  disabled?: boolean;
}

export function PairwiseComparison({
  config,
  value,
  onChange,
  disabled = false,
}: PairwiseComparisonProps) {
  const { show_confidence = false, allow_tie = true } = config;
  const winner = value?.winner ?? null;
  const confidence = value?.confidence ?? '';

  const handleWinnerSelect = (selected: 'A' | 'B' | 'tie') => {
    onChange({
      winner: selected,
      confidence: show_confidence ? confidence : undefined,
    });
  };

  const handleConfidenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!winner) return;
    onChange({
      winner,
      confidence: e.target.value,
    });
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'a',
      handler: () => !disabled && handleWinnerSelect('A'),
      enabled: !disabled,
    },
    {
      key: 'b',
      handler: () => !disabled && handleWinnerSelect('B'),
      enabled: !disabled,
    },
    {
      key: 't',
      handler: () => !disabled && allow_tie && handleWinnerSelect('tie'),
      enabled: !disabled && allow_tie,
    },
    {
      key: '1',
      handler: () => !disabled && handleWinnerSelect('A'),
      enabled: !disabled,
    },
    {
      key: '2',
      handler: () => !disabled && handleWinnerSelect('B'),
      enabled: !disabled,
    },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => handleWinnerSelect('A')}
          disabled={disabled}
          className={`
            flex-1 py-4 px-6 rounded-lg border-2 font-medium transition-all
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              winner === 'A'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }
          `}
        >
          <span className="text-2xl font-bold">A</span>
          <span className="block text-xs mt-1 text-gray-500">(Press A or 1)</span>
        </button>

        {allow_tie && (
          <button
            type="button"
            onClick={() => handleWinnerSelect('tie')}
            disabled={disabled}
            className={`
              py-4 px-6 rounded-lg border-2 font-medium transition-all
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                winner === 'tie'
                  ? 'border-gray-500 bg-gray-100 text-gray-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-500'
              }
            `}
          >
            <span className="text-lg">=</span>
            <span className="block text-xs mt-1">Tie (T)</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => handleWinnerSelect('B')}
          disabled={disabled}
          className={`
            flex-1 py-4 px-6 rounded-lg border-2 font-medium transition-all
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              winner === 'B'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }
          `}
        >
          <span className="text-2xl font-bold">B</span>
          <span className="block text-xs mt-1 text-gray-500">(Press B or 2)</span>
        </button>
      </div>

      {show_confidence && winner && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confidence Level</label>
          <select
            value={confidence}
            onChange={handleConfidenceChange}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select confidence...</option>
            <option value="very_confident">Very Confident</option>
            <option value="somewhat_confident">Somewhat Confident</option>
            <option value="not_confident">Not Confident</option>
          </select>
        </div>
      )}
    </div>
  );
}
