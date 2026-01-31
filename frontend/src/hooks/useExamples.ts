import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as examplesApi from '@/api/examples';
import { AnnotationExampleCreate, AnnotationExampleUpdate } from '@/types';

export function useExamples(projectId: string) {
  return useQuery({
    queryKey: ['examples', projectId],
    queryFn: () => examplesApi.getExamples(projectId),
    enabled: !!projectId,
  });
}

export function useCreateExample(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AnnotationExampleCreate) => examplesApi.createExample(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examples', projectId] });
    },
  });
}

export function useUpdateExample(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ exampleId, data }: { exampleId: string; data: AnnotationExampleUpdate }) =>
      examplesApi.updateExample(projectId, exampleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examples', projectId] });
    },
  });
}

export function useDeleteExample(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (exampleId: string) => examplesApi.deleteExample(projectId, exampleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examples', projectId] });
    },
  });
}

export function useReorderExamples(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (exampleIds: string[]) => examplesApi.reorderExamples(projectId, exampleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examples', projectId] });
    },
  });
}
