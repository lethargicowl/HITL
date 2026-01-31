import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as sessionsApi from '@/api/sessions';
import * as ratingsApi from '@/api/ratings';
import { FilterType, RatingCreate } from '@/types';

export function useProjectSessions(projectId: string) {
  return useQuery({
    queryKey: ['sessions', 'project', projectId],
    queryFn: () => sessionsApi.getProjectSessions(projectId),
    enabled: !!projectId,
  });
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ['sessions', sessionId],
    queryFn: () => sessionsApi.getSession(sessionId),
    enabled: !!sessionId,
  });
}

export function useSessionRows(
  sessionId: string,
  page: number = 1,
  perPage: number = 10,
  filter: FilterType = 'all'
) {
  return useQuery({
    queryKey: ['sessions', sessionId, 'rows', { page, perPage, filter }],
    queryFn: () => sessionsApi.getSessionRows(sessionId, page, perPage, filter),
    enabled: !!sessionId,
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => sessionsApi.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useUploadFile(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, sessionName }: { file: File; sessionName?: string }) =>
      sessionsApi.uploadFile(projectId, file, sessionName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', 'project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

export function useCreateRating(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RatingCreate) => ratingsApi.createOrUpdateRating(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', sessionId, 'rows'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', sessionId] });
    },
  });
}

export function useExportSession() {
  return useMutation({
    mutationFn: ({ sessionId, format }: { sessionId: string; format: 'xlsx' | 'csv' }) =>
      sessionsApi.exportSession(sessionId, format),
  });
}
