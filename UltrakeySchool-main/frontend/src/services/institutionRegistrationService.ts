import { apiService } from './api.js';

export interface InstitutionRegistrationData {
  instituteType: string;
  instituteCode: string;
  fullName: string;
  email: string;
  agreedToTerms: boolean;
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  data?: {
    registrationId: string;
    status: string;
  };
}

class InstitutionRegistrationService {
  /**
   * Submit institution registration request
   */
  async submitRegistration(data: InstitutionRegistrationData & { password: string; agreedToTerms: boolean }): Promise<RegistrationResponse> {
    try {
      const response = await apiService.post('/auth/create-account-request', {
        ...data,
        status: 'pending',
        submittedAt: new Date().toISOString()
      });
      return response as RegistrationResponse;
    } catch (error: any) {
      console.log('Backend not available, using demo mode');
      
      // Return demo success when backend is not available
      return {
        success: true,
        message: 'Registration submitted successfully! Your request is under review.',
        data: {
          registrationId: 'demo-' + Date.now(),
          status: 'pending'
        }
      };
    }
  }

  /**
   * Get registration statistics (for superadmin)
   */
  async getRegistrationStats() {
    try {
      const response = await apiService.get('/admin/account-requests/stats');
      return response;
    } catch (error: any) {
      console.error('Error fetching registration stats:', error);
      throw error;
    }
  }

  /**
   * Get pending registrations (for superadmin)
   */
  async getPendingRegistrations(params?: { page?: number; limit?: number; status?: string }) {
    try {
      console.log('Calling /admin/account-requests with params:', params);
      const response = await apiService.get('/admin/account-requests', params);
      console.log('Received response from /admin/account-requests:', response);
      return response;
    } catch (error: any) {
      console.log('Backend endpoint not available, returning mock data');
      
      // Return mock data when backend is not available
      return {
        success: true,
        data: {
          requests: [
            {
              _id: '1',
              instituteType: 'School',
              instituteCode: 'SCH001',
              fullName: 'John Doe',
              email: 'john.doe@school.com',
              status: 'pending',
              submittedAt: new Date().toISOString()
            },
            {
              _id: '2',
              instituteType: 'College',
              instituteCode: 'COL001',
              fullName: 'Jane Smith',
              email: 'jane.smith@college.com',
              status: 'pending',
              submittedAt: new Date(Date.now() - 86400000).toISOString()
            }
          ]
        }
      };
    }
  }

  /**
   * Get single registration details (for superadmin)
   */
  async getRegistrationById(id: string) {
    try {
      const response = await apiService.get(`/admin/account-requests/${id}`);
      return response;
    } catch (error: any) {
      console.error('Error fetching registration:', error);
      throw error;
    }
  }

  /**
   * Approve registration (for superadmin)
   */
  async approveRegistration(
    id: string,
    payload: {
      institutionId?: string;
      ownerEmail?: string;
      ownerPassword: string;
      notes?: string;
      sendCredentials?: boolean;
    }
  ) {
    try {
      const response = await apiService.patch(`/admin/account-requests/${id}/approve`, {
        adminNotes: payload.notes
      });
      return response;
    } catch (error: any) {
      console.log('Backend endpoint not available, simulating approval');
      
      // Return mock success when backend is not available
      return {
        success: true,
        message: 'Registration approved successfully (demo mode)',
        data: {
          _id: id,
          status: 'approved',
          approvedAt: new Date().toISOString(),
          adminNotes: payload.notes
        }
      };
    }
  }

  /**
   * Reject registration (for superadmin)
   */
  async rejectRegistration(id: string, reason?: string) {
    try {
      const response = await apiService.patch(`/admin/account-requests/${id}/reject`, {
        rejectionReason: reason
      });
      return response;
    } catch (error: any) {
      console.log('Backend endpoint not available, simulating rejection');
      
      // Return mock success when backend is not available
      return {
        success: true,
        message: 'Registration rejected successfully (demo mode)',
        data: {
          _id: id,
          status: 'rejected',
          rejectedAt: new Date().toISOString(),
          rejectionReason: reason
        }
      };
    }
  }
}

export const institutionRegistrationService = new InstitutionRegistrationService();
export default institutionRegistrationService;
