import { EvaluationType, EvaluationConfig, EvaluationQuestion } from './evaluation';

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  evaluation_type: EvaluationType;
  evaluation_config: EvaluationConfig;
  instructions?: string;
  use_multi_questions: boolean;
}

export interface ProjectListItem extends Project {
  session_count: number;
  total_rows: number;
  rated_rows: number;
}

export interface ProjectWithQuestions extends Project {
  questions: EvaluationQuestion[];
  assigned_raters: UserBasic[];
  session_count: number;
  total_rows: number;
  rated_rows: number;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  evaluation_type?: EvaluationType;
  evaluation_config?: EvaluationConfig;
  instructions?: string;
  use_multi_questions?: boolean;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  evaluation_type?: EvaluationType;
  evaluation_config?: EvaluationConfig;
  instructions?: string;
  use_multi_questions?: boolean;
}

export interface UserBasic {
  id: string;
  username: string;
}

export interface AssignRatersRequest {
  rater_ids: string[];
}
