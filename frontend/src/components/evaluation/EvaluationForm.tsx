import { StarRating } from './StarRating';
import { BinaryChoice } from './BinaryChoice';
import { MultiLabelSelect } from './MultiLabelSelect';
import { MultiCriteriaRating } from './MultiCriteriaRating';
import { PairwiseComparison } from './PairwiseComparison';
import { TextInput } from './TextInput';
import {
  EvaluationType,
  EvaluationConfig,
  EvaluationResponse,
  RatingConfig,
  BinaryConfig,
  MultiLabelConfig,
  MultiCriteriaConfig,
  PairwiseConfig,
  TextConfig,
  RatingResponse,
  BinaryResponse,
  MultiLabelResponse,
  MultiCriteriaResponse,
  PairwiseResponse,
  TextResponse,
} from '@/types';

interface EvaluationFormProps {
  evaluationType: EvaluationType;
  config: EvaluationConfig;
  value: EvaluationResponse | null;
  onChange: (value: EvaluationResponse) => void;
  disabled?: boolean;
}

export function EvaluationForm({
  evaluationType,
  config,
  value,
  onChange,
  disabled = false,
}: EvaluationFormProps) {
  switch (evaluationType) {
    case 'rating':
      return (
        <StarRating
          config={config as RatingConfig}
          value={value as RatingResponse | null}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case 'binary':
      return (
        <BinaryChoice
          config={config as BinaryConfig}
          value={value as BinaryResponse | null}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case 'multi_label':
      return (
        <MultiLabelSelect
          config={config as MultiLabelConfig}
          value={value as MultiLabelResponse | null}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case 'multi_criteria':
      return (
        <MultiCriteriaRating
          config={config as MultiCriteriaConfig}
          value={value as MultiCriteriaResponse | null}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case 'pairwise':
      return (
        <PairwiseComparison
          config={config as PairwiseConfig}
          value={value as PairwiseResponse | null}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case 'text':
      return (
        <TextInput
          config={config as TextConfig}
          value={value as TextResponse | null}
          onChange={onChange}
          disabled={disabled}
        />
      );

    default:
      return (
        <div className="text-red-500">
          Unknown evaluation type: {evaluationType}
        </div>
      );
  }
}
