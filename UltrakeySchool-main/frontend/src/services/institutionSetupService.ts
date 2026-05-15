import apiService from './api.js';

export interface Institution {
  _id: string;
  name: string;
  type: string;
  instituteCode: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  status: string;
  createdAt: string;
  subscription?: {
    planName: string;
    startDate: string;
    endDate: string;
    status: string;
  };
}

export interface InstitutionUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  department?: string;
  class?: string;
  section?: string;
  status: string;
  temporaryPassword?: string;
}

export interface CreateInstitutionData {
  name: string;
  type: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  adminName: string;
  adminEmail: string;
  principalName: string;
  principalEmail: string;
}

export interface CreateUsersData {
  users: {
    name: string;
    email: string;
    role: string;
    phone?: string;
    department?: string;
    class?: string;
    section?: string;
  }[];
}

export interface InstitutionDetails {
  institution: Institution;
  users: InstitutionUser[];
  stats: {
    totalUsers: number;
    teachers: number;
    students: number;
    parents: number;
    admins: number;
  };
}

class InstitutionSetupService {
  // Create a new institution with admin
  async createInstitution(data: CreateInstitutionData) {
    const response = await apiService.post('/institution-setup/create', data);
    return response.data;
  }

  // Create multiple users under an institution
  async createUsers(institutionId: string, data: CreateUsersData) {
    const response = await apiService.post(`/institution-setup/${institutionId}/users`, data);
    return response.data;
  }

  // Get all users under an institution
  async getInstitutionUsers(institutionId: string, role?: string) {
    const params = role ? { role } : {};
    const response = await apiService.get(`/institution-setup/${institutionId}/users`, { params });
    return response.data;
  }

  // Get institution details with all members
  async getInstitutionDetails(institutionId: string) {
    const response = await apiService.get(`/institution-setup/${institutionId}/details`);
    return response.data;
  }
}

export default new InstitutionSetupService();  
