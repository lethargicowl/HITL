import apiClient from './client';
import { MediaFile, MediaUploadResponse } from '@/types';

export async function uploadMedia(projectId: string, files: File[]): Promise<MediaUploadResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await apiClient.post<MediaUploadResponse>(`/projects/${projectId}/media`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function getProjectMedia(projectId: string): Promise<MediaFile[]> {
  const response = await apiClient.get<MediaFile[]>(`/projects/${projectId}/media`);
  return response.data;
}

export async function getMediaInfo(mediaId: string): Promise<MediaFile> {
  const response = await apiClient.get<MediaFile>(`/media/${mediaId}/info`);
  return response.data;
}

export async function deleteMedia(mediaId: string): Promise<void> {
  await apiClient.delete(`/media/${mediaId}`);
}

export function getMediaUrl(mediaId: string): string {
  return `/api/media/${mediaId}`;
}
