// Evaluation Types
export type EvaluationType = 'rating' | 'binary' | 'multi_label' | 'multi_criteria' | 'pairwise' | 'text';

// Rating Configuration
export interface RatingConfig {
  min: number;
  max: number;
  labels?: Record<string, string>;
}

// Binary Configuration
export interface BinaryOption {
  value: string;
  label: string;
}

export interface BinaryConfig {
  options: BinaryOption[];
}

// Multi-Label Configuration
export interface MultiLabelOption {
  value: string;
  label: string;
}

export interface MultiLabelConfig {
  options: MultiLabelOption[];
  min_select?: number;
  max_select?: number | null;
}

// Multi-Criteria Configuration
export interface CriteriaItem {
  key: string;
  label: string;
  min: number;
  max: number;
}

export interface MultiCriteriaConfig {
  criteria: CriteriaItem[];
}

// Pairwise Configuration
export interface PairwiseConfig {
  show_confidence?: boolean;
  allow_tie?: boolean;
}

// Text Configuration
export interface TextConfig {
  placeholder?: string;
  max_length?: number;
  multiline?: boolean;
}

// Union type for all configs
export type EvaluationConfig =
  | RatingConfig
  | BinaryConfig
  | MultiLabelConfig
  | MultiCriteriaConfig
  | PairwiseConfig
  | TextConfig;

// Response Types
export interface RatingResponse {
  value: number;
}

export interface BinaryResponse {
  value: string;
}

export interface MultiLabelResponse {
  selected: string[];
}

export interface MultiCriteriaResponse {
  criteria: Record<string, number>;
}

export interface PairwiseResponse {
  winner: 'A' | 'B' | 'tie';
  confidence?: string;
}

export interface TextResponse {
  text: string;
}

export type EvaluationResponse =
  | RatingResponse
  | BinaryResponse
  | MultiLabelResponse
  | MultiCriteriaResponse
  | PairwiseResponse
  | TextResponse;

// Multi-Question Response (mapping of question key to response)
export type MultiQuestionResponse = Record<string, EvaluationResponse>;

// Conditional logic for questions
export interface ConditionalConfig {
  question: string;
  equals: string | number | boolean;
}

// Evaluation Question (Multi-Question Mode)
export interface EvaluationQuestion {
  id: string;
  project_id: string;
  order: number;
  key: string;
  label: string;
  description?: string;
  question_type: EvaluationType;
  config: EvaluationConfig;
  required: boolean;
  conditional?: ConditionalConfig;
  created_at: string;
}

export interface EvaluationQuestionCreate {
  key: string;
  label: string;
  description?: string;
  question_type: EvaluationType;
  config: EvaluationConfig;
  required: boolean;
  conditional?: ConditionalConfig;
  order?: number;
}

export interface EvaluationQuestionUpdate {
  label?: string;
  description?: string;
  config?: EvaluationConfig;
  required?: boolean;
  conditional?: ConditionalConfig;
  order?: number;
}
