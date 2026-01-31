import apiClient from './client';
import {
  Project,
  ProjectListItem,
  ProjectWithQuestions,
  ProjectCreate,
  ProjectUpdate,
  UserBasic,
  AssignRatersRequest,
} from '@/types';

export async function getProjects(): Promise<ProjectListItem[]> {
  const response = await apiClient.get<ProjectListItem[]>('/projects');
  return response.data;
}

export async function getProject(projectId: string): Promise<ProjectWithQuestions> {
  const response = await apiClient.get<ProjectWithQuestions>(`/projects/${projectId}`);
  return response.data;
}

export async function createProject(data: ProjectCreate): Promise<Project> {
  const response = await apiClient.post<Project>('/projects', data);
  return response.data;
}

export async function updateProject(projectId: string, data: ProjectUpdate): Promise<Project> {
  const response = await apiClient.patch<Project>(`/projects/${projectId}`, data);
  return response.data;
}

export async function deleteProject(projectId: string): Promise<void> {
  await apiClient.delete(`/projects/${projectId}`);
}

export async function assignRaters(projectId: string, raterIds: string[]): Promise<void> {
  await apiClient.post(`/projects/${projectId}/assign`, { rater_ids: raterIds } as AssignRatersRequest);
}

export async function removeRater(projectId: string, raterId: string): Promise<void> {
  await apiClient.delete(`/projects/${projectId}/raters/${raterId}`);
}

export async function getRaters(): Promise<UserBasic[]> {
  const response = await apiClient.get<UserBasic[]>('/users/raters');
  return response.data;
}
