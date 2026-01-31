import { MultiCriteriaConfig, MultiCriteriaResponse } from '@/types';

interface MultiCriteriaRatingProps {
  config: MultiCriteriaConfig;
  value: MultiCriteriaResponse | null;
  onChange: (value: MultiCriteriaResponse) => void;
  disabled?: boolean;
}

export function MultiCriteriaRating({
  config,
  value,
  onChange,
  disabled = false,
}: MultiCriteriaRatingProps) {
  const { criteria } = config;
  const currentValues = value?.criteria ?? {};

  const handleCriterionChange = (key: string, rating: number) => {
    onChange({
      criteria: {
        ...currentValues,
        [key]: rating,
      },
    });
  };

  return (
    <div className="space-y-6">
      {criteria.map((criterion) => {
        const { key, label, min, max } = criterion;
        const currentValue = currentValues[key] ?? null;
        const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);

        return (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="flex items-center gap-2">
              {range.map((rating) => {
                  const isFilled = currentValue !== null && rating <= currentValue;

                return (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleCriterionChange(key, rating)}
                    disabled={disabled}
                    className={`
                      p-1 transition-transform hover:scale-110
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    `}
                    title={`${label}: ${rating}`}
                  >
                    <svg
                      className={`w-6 h-6 ${isFilled ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                );
              })}
              <span className="ml-2 text-sm text-gray-500">
                {currentValue !== null ? currentValue : '-'} / {max}
              </span>
            </div>
          </div>
        );
      })}

      <p className="text-xs text-gray-400">Rate each criterion from {criteria[0]?.min} to {criteria[0]?.max}</p>
    </div>
  );
}
