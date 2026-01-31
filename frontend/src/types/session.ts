import { EvaluationResponse, MultiQuestionResponse } from './evaluation';

export interface Session {
  id: string;
  name: string;
  filename: string;
  columns: string[];
  project_id: string;
  created_at: string;
}

export interface SessionListItem extends Session {
  row_count: number;
  rated_count: number;
}

export interface SessionDetail extends Session {
  project: ProjectForSession;
  row_count: number;
  rated_count: number;
}

export interface ProjectForSession {
  id: string;
  name: string;
  evaluation_type: string;
  evaluation_config: Record<string, unknown>;
  instructions?: string;
  use_multi_questions: boolean;
  questions: Array<{
    id: string;
    key: string;
    label: string;
    description?: string;
    question_type: string;
    config: Record<string, unknown>;
    required: boolean;
    conditional?: { question: string; equals: unknown };
    order: number;
  }>;
}

export interface Rating {
  id: string;
  rating_value?: number;
  response?: EvaluationResponse | MultiQuestionResponse;
  comment?: string;
  rated_at: string;
  rater_id: string;
  rater_username: string;
}

export interface DataRow {
  id: string;
  row_index: number;
  content: Record<string, unknown>;
  ratings: Rating[];
  my_rating?: Rating;
}

export interface PaginatedRows {
  items: DataRow[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  rated_count: number;
}

export interface RatingCreate {
  data_row_id: string;
  session_id: string;
  rating_value?: number;
  response?: EvaluationResponse | MultiQuestionResponse;
  comment?: string;
  time_spent_ms?: number;
}

export interface UploadResponse {
  session_id: string;
  session_name: string;
  filename: string;
  row_count: number;
  columns: string[];
  project_id: string;
  message: string;
}

export type FilterType = 'all' | 'rated' | 'unrated';
