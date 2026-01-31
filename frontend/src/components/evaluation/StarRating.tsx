import { RatingConfig, RatingResponse } from '@/types';
import { useRatingShortcuts } from '@/hooks/useKeyboardShortcuts';

interface StarRatingProps {
  config: RatingConfig;
  value: RatingResponse | null;
  onChange: (value: RatingResponse) => void;
  disabled?: boolean;
}

export function StarRating({ config, value, onChange, disabled = false }: StarRatingProps) {
  const { min, max, labels } = config;
  const currentValue = value?.value ?? null;
  const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  useRatingShortcuts(
    (rating) => {
      if (!disabled && rating >= min && rating <= max) {
        onChange({ value: rating });
      }
    },
    max,
    !disabled
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {range.map((rating) => {
          const isSelected = currentValue === rating;
          const isFilled = currentValue !== null && rating <= currentValue;

          return (
            <button
              key={rating}
              type="button"
              onClick={() => onChange({ value: rating })}
              disabled={disabled}
              className={`
                relative p-1 transition-transform hover:scale-110
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              `}
              title={labels?.[String(rating)] || `Rating ${rating}`}
            >
              <svg
                className={`w-8 h-8 ${isFilled ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {isSelected && (
                <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600">
                  {rating}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {labels && (
        <div className="flex justify-between text-xs text-gray-500 px-1">
          <span>{labels[String(min)] || min}</span>
          <span>{labels[String(max)] || max}</span>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Keyboard: Press {min}-{max} to rate
      </p>
    </div>
  );
}
