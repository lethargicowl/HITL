import apiClient from './client';
import { Rating, RatingCreate } from '@/types';

export async function createOrUpdateRating(data: RatingCreate): Promise<Rating> {
  const response = await apiClient.post<Rating>('/ratings', data);
  return response.data;
}
