import { MultiLabelConfig, MultiLabelResponse } from '@/types';

interface MultiLabelSelectProps {
  config: MultiLabelConfig;
  value: MultiLabelResponse | null;
  onChange: (value: MultiLabelResponse) => void;
  disabled?: boolean;
}

export function MultiLabelSelect({ config, value, onChange, disabled = false }: MultiLabelSelectProps) {
  const { options, min_select = 0, max_select } = config;
  const selected = value?.selected ?? [];

  const handleToggle = (optionValue: string) => {
    const newSelected = selected.includes(optionValue)
      ? selected.filter((v) => v !== optionValue)
      : [...selected, optionValue];

    // Check max constraint
    if (max_select !== null && max_select !== undefined && newSelected.length > max_select) {
      return;
    }

    onChange({ selected: newSelected });
  };

  const isValid = selected.length >= min_select;
  const atMax = max_select !== null && max_select !== undefined && selected.length >= max_select;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          const isDisabled = disabled || (!isSelected && atMax);

          return (
            <label
              key={option.value}
              className={`
                flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
                ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(option.value)}
                disabled={isDisabled}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className={`ml-3 ${isSelected ? 'text-primary-700 font-medium' : 'text-gray-700'}`}>
                {option.label}
              </span>
            </label>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>
          {min_select > 0 && `Select at least ${min_select}`}
          {min_select > 0 && max_select && ' and '}
          {max_select && `at most ${max_select}`}
        </span>
        <span className={isValid ? 'text-green-600' : 'text-orange-500'}>
          {selected.length} selected
        </span>
      </div>
    </div>
  );
}
