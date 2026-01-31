import { EvaluationForm } from './EvaluationForm';
import {
  EvaluationQuestion,
  EvaluationResponse,
  MultiQuestionResponse,
  EvaluationType,
  EvaluationConfig,
} from '@/types';

interface MultiQuestionFormProps {
  questions: EvaluationQuestion[];
  value: MultiQuestionResponse | null;
  onChange: (value: MultiQuestionResponse) => void;
  disabled?: boolean;
}

export function MultiQuestionForm({
  questions,
  value,
  onChange,
  disabled = false,
}: MultiQuestionFormProps) {
  const responses = value ?? {};

  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  const handleQuestionChange = (questionKey: string, response: EvaluationResponse) => {
    onChange({
      ...responses,
      [questionKey]: response,
    });
  };

  const isQuestionVisible = (question: EvaluationQuestion): boolean => {
    if (!question.conditional) return true;

    const { question: conditionKey, equals } = question.conditional;
    const conditionResponse = responses[conditionKey];

    if (!conditionResponse) return false;

    // Check the response value based on type
    if ('value' in conditionResponse) {
      return conditionResponse.value === equals;
    }
    if ('selected' in conditionResponse) {
      return (conditionResponse as { selected: string[] }).selected.includes(String(equals));
    }
    if ('text' in conditionResponse) {
      return conditionResponse.text === equals;
    }
    if ('winner' in conditionResponse) {
      return conditionResponse.winner === equals;
    }
    if ('criteria' in conditionResponse) {
      // For multi-criteria, this doesn't make much sense as a condition
      return false;
    }

    return false;
  };

  return (
    <div className="space-y-6">
      {sortedQuestions.map((question) => {
        if (!isQuestionVisible(question)) {
          return null;
        }

        const questionResponse = responses[question.key] as EvaluationResponse | undefined;

        return (
          <div key={question.id} className="border rounded-lg p-4">
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900">{question.label}</h4>
                {question.required && (
                  <span className="text-red-500 text-sm">*</span>
                )}
              </div>
              {question.description && (
                <p className="text-sm text-gray-500 mt-1">{question.description}</p>
              )}
            </div>

            <EvaluationForm
              evaluationType={question.question_type as EvaluationType}
              config={question.config as EvaluationConfig}
              value={questionResponse ?? null}
              onChange={(response) => handleQuestionChange(question.key, response)}
              disabled={disabled}
            />
          </div>
        );
      })}
    </div>
  );
}
