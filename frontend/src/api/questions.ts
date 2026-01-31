import apiClient from './client';
import {
  EvaluationQuestion,
  EvaluationQuestionCreate,
  EvaluationQuestionUpdate,
} from '@/types';

export async function getQuestions(projectId: string): Promise<EvaluationQuestion[]> {
  const response = await apiClient.get<EvaluationQuestion[]>(`/projects/${projectId}/questions`);
  return response.data;
}

export async function getQuestion(projectId: string, questionId: string): Promise<EvaluationQuestion> {
  const response = await apiClient.get<EvaluationQuestion>(`/projects/${projectId}/questions/${questionId}`);
  return response.data;
}

export async function createQuestion(
  projectId: string,
  data: EvaluationQuestionCreate
): Promise<EvaluationQuestion> {
  const response = await apiClient.post<EvaluationQuestion>(`/projects/${projectId}/questions`, data);
  return response.data;
}

export async function updateQuestion(
  projectId: string,
  questionId: string,
  data: EvaluationQuestionUpdate
): Promise<EvaluationQuestion> {
  const response = await apiClient.patch<EvaluationQuestion>(
    `/projects/${projectId}/questions/${questionId}`,
    data
  );
  return response.data;
}

export async function deleteQuestion(projectId: string, questionId: string): Promise<void> {
  await apiClient.delete(`/projects/${projectId}/questions/${questionId}`);
}

export async function reorderQuestions(projectId: string, questionIds: string[]): Promise<void> {
  await apiClient.post(`/projects/${projectId}/questions/reorder`, { question_ids: questionIds });
}

export async function bulkCreateQuestions(
  projectId: string,
  questions: EvaluationQuestionCreate[]
): Promise<EvaluationQuestion[]> {
  const response = await apiClient.post<EvaluationQuestion[]>(
    `/projects/${projectId}/questions/bulk`,
    questions
  );
  return response.data;
}
