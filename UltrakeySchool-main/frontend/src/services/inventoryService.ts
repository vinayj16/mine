import api from './api';

export interface InventoryItem {
  _id?: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
  location?: string;
  status?: string;
}

const inventoryService = {
  getAll: async (params?: any) => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  create: async (data: InventoryItem) => {
    const response = await api.post('/inventory', data);
    return response.data;
  },

  update: async (id: string, data: Partial<InventoryItem>) => {
    const response = await api.put(`/inventory/${id}`, data);
    return response.data;
  },

  adjust: async (id: string, adjustment: number, type: 'in' | 'out', notes?: string) => {
    const response = await api.post(`/inventory/${id}/adjust`, { quantity: adjustment, type, notes });
    return response.data;
  }
};

export default inventoryService;
