import React from 'react';
import { TextConfig, TextResponse } from '@/types';
import { Textarea, Input } from '@/components/common';

interface TextInputProps {
  config: TextConfig;
  value: TextResponse | null;
  onChange: (value: TextResponse) => void;
  disabled?: boolean;
}

export function TextInput({ config, value, onChange, disabled = false }: TextInputProps) {
  const { placeholder = 'Enter your response...', max_length, multiline = true } = config;
  const currentText = value?.text ?? '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let newText = e.target.value;
    if (max_length && newText.length > max_length) {
      newText = newText.slice(0, max_length);
    }
    onChange({ text: newText });
  };

  return (
    <div className="space-y-2">
      {multiline ? (
        <Textarea
          value={currentText}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
        />
      ) : (
        <Input
          value={currentText}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}

      {max_length && (
        <div className="text-xs text-gray-500 text-right">
          {currentText.length} / {max_length}
        </div>
      )}
    </div>
  );
}
