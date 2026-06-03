import apiClient from '../api/client';

export interface StaffLeave {
  _id: string;
  leaveId?: string;
  staffId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  staffName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffTask {
  _id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dueDate: string;
  createdAt?: string;
  updatedAt?: string;
  assignedBy?: { _id: string; name: string; email: string };
  notes?: string;
}

const mapTodoStatus = (status?: string): StaffTask['status'] => {
  const s = (status || '').toLowerCase();
  if (s === 'done' || s === 'completed') return 'completed';
  if (s === 'inprogress' || s === 'in_progress') return 'in-progress';
  if (s === 'cancelled' || s === 'trash') return 'cancelled';
  return 'pending';
};

const mapTodoToTask = (todo: any): StaffTask => ({
  _id: todo._id,
  title: todo.title || 'Untitled',
  description: todo.description || '',
  priority: (todo.priority === 'high' ? 'high' : todo.priority === 'low' ? 'low' : 'medium') as StaffTask['priority'],
  status: mapTodoStatus(todo.status),
  dueDate: todo.dueDate || todo.createdAt || new Date().toISOString(),
  createdAt: todo.createdAt,
  updatedAt: todo.updatedAt,
  assignedBy: todo.userName
    ? { _id: todo.userId, name: todo.userName, email: '' }
    : undefined,
  notes: todo.description
});

const extractList = (response: any): any[] => {
  const data = response?.data?.data ?? response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.notifications)) return data.notifications;
  if (Array.isArray(data?.todos)) return data.todos;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.leaves)) return data.leaves;
  return [];
};

export const staffService = {
  async getMyLeaves(): Promise<StaffLeave[]> {
    const response = await apiClient.get('/hrm/my-leaves');
    return extractList(response).map((l) => ({
      ...l,
      _id: l._id || l.leaveId
    }));
  },

  async applyLeave(payload: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<StaffLeave> {
    const response = await apiClient.post('/hrm/my-leaves', payload);
    const item = response.data?.data || response.data;
    return { ...item, _id: item._id || item.leaveId };
  },

  async cancelLeave(leaveId: string): Promise<void> {
    await apiClient.put(`/hrm/my-leaves/${leaveId}/cancel`);
  },

  async getMyTasks(userId: string): Promise<StaffTask[]> {
    const response = await apiClient.get('/todos', {
      params: { userId, limit: 100 }
    });
    return extractList(response).map(mapTodoToTask);
  },

  async createTask(
    userId: string,
    userName: string,
    institutionId: string | undefined,
    payload: {
      title: string;
      description: string;
      priority: string;
      dueDate: string;
      notes?: string;
    }
  ): Promise<StaffTask> {
    const response = await apiClient.post('/todos', {
      title: payload.title,
      description: payload.description || payload.notes || '',
      priority: payload.priority === 'urgent' ? 'high' : payload.priority,
      dueDate: payload.dueDate,
      status: 'pending',
      userId,
      userName,
      institutionId
    });
    const todo = response.data?.data || response.data;
    return mapTodoToTask(todo);
  },

  async updateTaskStatus(taskId: string, status: StaffTask['status']): Promise<void> {
    const statusMap: Record<string, string> = {
      pending: 'pending',
      'in-progress': 'inprogress',
      completed: 'done',
      cancelled: 'cancelled'
    };
    await apiClient.put(`/todos/${taskId}`, {
      status: statusMap[status] || status
    });
  },

  async getMyDocuments(staffId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/staff-documents/staff/${staffId}`);
      return extractList(response);
    } catch {
      const response = await apiClient.get('/staff/staff-documents', {
        params: { staffId }
      });
      return extractList(response);
    }
  },

  async getNotifications(limit = 20): Promise<any[]> {
    const response = await apiClient.get('/notifications', { params: { limit } });
    return extractList(response);
  }
};

export default staffService;
