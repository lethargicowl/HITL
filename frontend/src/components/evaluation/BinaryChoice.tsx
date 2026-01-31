import { BinaryConfig, BinaryResponse } from '@/types';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface BinaryChoiceProps {
  config: BinaryConfig;
  value: BinaryResponse | null;
  onChange: (value: BinaryResponse) => void;
  disabled?: boolean;
}

export function BinaryChoice({ config, value, onChange, disabled = false }: BinaryChoiceProps) {
  const { options } = config;
  const currentValue = value?.value ?? null;

  // Keyboard shortcuts: first letter of each option, or 1/2
  useKeyboardShortcuts([
    {
      key: '1',
      handler: () => !disabled && options[0] && onChange({ value: options[0].value }),
      enabled: !disabled,
    },
    {
      key: '2',
      handler: () => !disabled && options[1] && onChange({ value: options[1].value }),
      enabled: !disabled,
    },
    {
      key: 'y',
      handler: () => {
        const yesOption = options.find((o) => o.value.toLowerCase() === 'yes');
        if (!disabled && yesOption) onChange({ value: yesOption.value });
      },
      enabled: !disabled,
    },
    {
      key: 'n',
      handler: () => {
        const noOption = options.find((o) => o.value.toLowerCase() === 'no');
        if (!disabled && noOption) onChange({ value: noOption.value });
      },
      enabled: !disabled,
    },
  ]);

  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        {options.map((option, index) => {
          const isSelected = currentValue === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ value: option.value })}
              disabled={disabled}
              className={`
                flex-1 py-3 px-6 rounded-lg border-2 font-medium transition-all
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }
              `}
            >
              {option.label}
              <span className="ml-2 text-xs text-gray-400">({index + 1})</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400">
        Keyboard: Press 1 or 2 to select, or Y/N for Yes/No options
      </p>
    </div>
  );
}
