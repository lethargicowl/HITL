import { EvaluationResponse, MultiQuestionResponse } from './evaluation';

export interface AnnotationExample {
  id: string;
  project_id: string;
  title: string;
  content: Record<string, unknown>;
  example_response: EvaluationResponse | MultiQuestionResponse;
  explanation?: string;
  is_positive: boolean;
  order: number;
  created_at: string;
}

export interface AnnotationExampleCreate {
  title: string;
  content: Record<string, unknown>;
  example_response: EvaluationResponse | MultiQuestionResponse;
  explanation?: string;
  is_positive?: boolean;
  order?: number;
}

export interface AnnotationExampleUpdate {
  title?: string;
  content?: Record<string, unknown>;
  example_response?: EvaluationResponse | MultiQuestionResponse;
  explanation?: string;
  is_positive?: boolean;
  order?: number;
}
