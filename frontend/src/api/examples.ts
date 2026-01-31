import apiClient from './client';
import { AnnotationExample, AnnotationExampleCreate, AnnotationExampleUpdate } from '@/types';

export async function getExamples(projectId: string): Promise<AnnotationExample[]> {
  const response = await apiClient.get<AnnotationExample[]>(`/projects/${projectId}/examples`);
  return response.data;
}

export async function getExample(projectId: string, exampleId: string): Promise<AnnotationExample> {
  const response = await apiClient.get<AnnotationExample>(`/projects/${projectId}/examples/${exampleId}`);
  return response.data;
}

export async function createExample(
  projectId: string,
  data: AnnotationExampleCreate
): Promise<AnnotationExample> {
  const response = await apiClient.post<AnnotationExample>(`/projects/${projectId}/examples`, data);
  return response.data;
}

export async function updateExample(
  projectId: string,
  exampleId: string,
  data: AnnotationExampleUpdate
): Promise<AnnotationExample> {
  const response = await apiClient.patch<AnnotationExample>(
    `/projects/${projectId}/examples/${exampleId}`,
    data
  );
  return response.data;
}

export async function deleteExample(projectId: string, exampleId: string): Promise<void> {
  await apiClient.delete(`/projects/${projectId}/examples/${exampleId}`);
}

export async function reorderExamples(projectId: string, exampleIds: string[]): Promise<void> {
  await apiClient.post(`/projects/${projectId}/examples/reorder`, { example_ids: exampleIds });
}

export async function bulkCreateExamples(
  projectId: string,
  examples: AnnotationExampleCreate[]
): Promise<AnnotationExample[]> {
  const response = await apiClient.post<AnnotationExample[]>(
    `/projects/${projectId}/examples/bulk`,
    examples
  );
  return response.data;
}
