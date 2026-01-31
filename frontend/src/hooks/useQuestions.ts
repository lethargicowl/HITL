import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as questionsApi from '@/api/questions';
import { EvaluationQuestionCreate, EvaluationQuestionUpdate } from '@/types';

export function useQuestions(projectId: string) {
  return useQuery({
    queryKey: ['questions', projectId],
    queryFn: () => questionsApi.getQuestions(projectId),
    enabled: !!projectId,
  });
}

export function useCreateQuestion(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EvaluationQuestionCreate) => questionsApi.createQuestion(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

export function useUpdateQuestion(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, data }: { questionId: string; data: EvaluationQuestionUpdate }) =>
      questionsApi.updateQuestion(projectId, questionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

export function useDeleteQuestion(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: string) => questionsApi.deleteQuestion(projectId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

export function useReorderQuestions(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionIds: string[]) => questionsApi.reorderQuestions(projectId, questionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', projectId] });
    },
  });
}

export function useBulkCreateQuestions(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questions: EvaluationQuestionCreate[]) =>
      questionsApi.bulkCreateQuestions(projectId, questions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}
