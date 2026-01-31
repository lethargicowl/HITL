import apiClient from './client';
import { SessionListItem, SessionDetail, PaginatedRows, UploadResponse, FilterType } from '@/types';

export async function getProjectSessions(projectId: string): Promise<SessionListItem[]> {
  const response = await apiClient.get<SessionListItem[]>(`/projects/${projectId}/sessions`);
  return response.data;
}

export async function getSession(sessionId: string): Promise<SessionDetail> {
  const response = await apiClient.get<SessionDetail>(`/sessions/${sessionId}`);
  return response.data;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/sessions/${sessionId}`);
}

export async function getSessionRows(
  sessionId: string,
  page: number = 1,
  perPage: number = 10,
  filter: FilterType = 'all'
): Promise<PaginatedRows> {
  const response = await apiClient.get<PaginatedRows>(`/sessions/${sessionId}/rows`, {
    params: { page, per_page: perPage, filter },
  });
  return response.data;
}

export async function uploadFile(
  projectId: string,
  file: File,
  sessionName?: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (sessionName) {
    formData.append('session_name', sessionName);
  }

  const response = await apiClient.post<UploadResponse>(`/projects/${projectId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function exportSession(sessionId: string, format: 'xlsx' | 'csv'): Promise<Blob> {
  const response = await apiClient.get(`/sessions/${sessionId}/export`, {
    params: { format },
    responseType: 'blob',
  });
  return response.data;
}
