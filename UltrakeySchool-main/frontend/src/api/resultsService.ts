import apiClient from './client';

export interface ResultData {
  id?: string;
  studentName: string;
  subject: string;
  score: number | string;
  grade: string;
}

export const getResults = (params?: any) => apiClient.get('/results', { params });
export const createResult = (data: ResultData) => apiClient.post('/results', data);
export const updateResult = (id: string, data: Partial<ResultData>) => apiClient.patch(`/results/${id}`, data);
export const deleteResult = (id: string) => apiClient.delete(`/results/${id}`);

export default {
  getResults,
  createResult,
  updateResult,
  deleteResult
};
