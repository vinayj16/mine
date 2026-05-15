import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../config/api';

export interface Ticket {
    id: number;
    category: string;
    priority: string;
    ticketNumber: string;
    title: string;
    status: string;
    assignedTo: { name: string; avatar: string };
    updatedAt: string;
    commentCount: number;
}

export interface Category {
    name: string;
    openTickets: number;
    closedTickets: number;
}

export interface Agent {
    name: string;
    avatar: string;
    openTickets: number;
    closedTickets: number;
}

export const fetchTickets = async (): Promise<Ticket[]> => {
    const response = await apiClient.get<Ticket[]>(API_ENDPOINTS.SUPPORT.LIST);
    if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch tickets');
    return response.data.data || [];
};

export const fetchCategories = async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>(`${API_ENDPOINTS.SUPPORT.LIST}/categories`);
    if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch categories');
    return response.data.data || [];
};

export const fetchAgents = async (): Promise<Agent[]> => {
    const response = await apiClient.get<Agent[]>(`${API_ENDPOINTS.SUPPORT.LIST}/agents`);
    if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch agents');
    return response.data.data || [];
};

export const createTicket = async (ticket: Omit<Ticket, 'id' | 'ticketNumber' | 'updatedAt' | 'commentCount'>): Promise<Ticket> => {
    const response = await apiClient.post<Ticket>(API_ENDPOINTS.SUPPORT.CREATE, ticket);
    if (!response.data.success || !response.data.data) throw new Error(response.data.message || 'Failed to create ticket');
    return response.data.data;
};

export const deleteTicket = async (id: number): Promise<void> => {
    const response = await apiClient.delete(`${API_ENDPOINTS.SUPPORT.LIST}/${id}`);
    if (!response.data.success) throw new Error(response.data.message || 'Failed to delete ticket');
};

export const updateTicketStatus = async (id: number, status: string): Promise<Ticket> => {
    const response = await apiClient.patch<Ticket>(`${API_ENDPOINTS.SUPPORT.LIST}/${id}/status`, { status });
    if (!response.data.success || !response.data.data) throw new Error(response.data.message || 'Failed to update status');
    return response.data.data;
};
