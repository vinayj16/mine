import { create } from 'zustand';
import * as resultsApi from '../api/resultsService';
import type { ResultData } from '../api/resultsService';

interface ResultsState {
  list: ResultData[];
  loading: boolean;
  error: any;
  fetchResults: (params?: any) => Promise<void>;
  addResult: (payload: ResultData) => Promise<void>;
  editResult: (id: string, payload: Partial<ResultData>) => Promise<void>;
  removeResult: (id: string) => Promise<void>;
}

export const useResultsStore = create<ResultsState>((set, get) => ({
  list: [],
  loading: false,
  error: null,

  fetchResults: async (params?: any) => {
    set({ loading: true, error: null });
    try {
      // If endpoint is not ready, we can mock or catch gracefully
      const res = await resultsApi.getResults(params);
      set({ list: res.data?.data || [], loading: false });
    } catch (err: any) {
      console.warn('Failed to fetch results (mocking empty for now):', err.message);
      set({ loading: false, error: err });
    }
  },

  addResult: async (payload: ResultData) => {
    set({ loading: true, error: null });
    try {
      const res = await resultsApi.createResult(payload);
      const newResult = res.data?.data || { ...payload, id: Date.now().toString() };
      set((state) => ({ list: [...state.list, newResult], loading: false }));
    } catch (err: any) {
      console.warn('Failed to add result:', err.message);
      // Mocked addition for frontend UI demonstration
      const newResult = { ...payload, id: Date.now().toString() };
      set((state) => ({ list: [...state.list, newResult], loading: false, error: err }));
    }
  },

  editResult: async (id: string, payload: Partial<ResultData>) => {
    set({ loading: true, error: null });
    try {
      const res = await resultsApi.updateResult(id, payload);
      const updated = res.data?.data;
      set((state) => ({
        list: state.list.map((r) => (r.id === id ? { ...r, ...payload, ...(updated || {}) } : r)),
        loading: false
      }));
    } catch (err: any) {
      console.warn('Failed to edit result:', err.message);
      set((state) => ({
        list: state.list.map((r) => (r.id === id ? { ...r, ...payload } : r)),
        loading: false,
        error: err
      }));
    }
  },

  removeResult: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await resultsApi.deleteResult(id);
      set((state) => ({
        list: state.list.filter((r) => r.id !== id),
        loading: false
      }));
    } catch (err: any) {
      console.warn('Failed to remove result:', err.message);
      set((state) => ({
        list: state.list.filter((r) => r.id !== id),
        loading: false,
        error: err
      }));
    }
  }
}));
