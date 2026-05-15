import { useEffect, useState } from 'react';
import { useAuth } from '../store/authStore';
import apiClient from '../api/client';
import { toast } from 'react-toastify';

interface InstitutionData {
  _id: string;
  name: string;
  code: string;
  schoolCode: string;
  type: 'Educational Institution' | 'School' | 'College' | 'University';
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  website?: string;
  established?: string;
  principal?: {
    name: string;
    email: string;
    phone?: string;
  };
  admin?: {
    name: string;
    email: string;
    phone?: string;
  };
  settings?: {
    timezone: string;
    currency: string;
    language: string;
    academicYear?: string;
    currentSemester?: string;
  };
}

interface StaffData {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  qualification?: string;
  experience?: string;
  salary?: number;
  joiningDate?: string;
  skills?: string[];
  linkedinProfile?: string;
  status: 'active' | 'inactive' | 'suspended';
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export const useInstitutionData = () => {
  const { user } = useAuth();
  const [institutionData, setInstitutionData] = useState<InstitutionData | null>(null);
  const [staffData, setStaffData] = useState<StaffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    fetchInstitutionData();
  }, []);

  const fetchInstitutionData = async () => {
    // Prevent multiple simultaneous calls
    if (isFetching) {
      console.log('fetchInstitutionData: Already fetching, skipping...');
      return;
    }
    
    try {
      setIsFetching(true);
      setLoading(true);
      setError(null);
      
      // Add a small delay to prevent rapid successive calls
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Try to get institution data from multiple possible endpoints
      let apiResponse;
      
      // First try the dedicated institution endpoint
      try {
        apiResponse = await apiClient.get('/institutions/my');
        if (apiResponse.data.success) {
          setInstitutionData(apiResponse.data.data);
          console.log('Institution data from /institutions/my:', apiResponse.data.data);
          return;
        }
      } catch (err) {
        console.error('Error fetching from /institutions/my:', err);
        // Continue to next endpoint if this fails
      }
      
      // Fallback to user profile data
      apiResponse = await apiClient.get('/auth/profile');
      if (apiResponse.data.success) {
        const profileData = apiResponse.data.data;
        
        // Create institution data from profile
        const institutionFromProfile: InstitutionData = {
          _id: profileData.institutionId || '',
          name: profileData.institutionName || 'Your Institution',
          code: profileData.institutionCode || profileData.schoolCode || 'N/A',
          schoolCode: profileData.institutionCode || profileData.schoolCode || 'N/A',
          type: profileData.institutionType || 'Educational Institution',
          address: profileData.institutionAddress || 'Address not available',
          phone: profileData.institutionPhone || 'Phone not available',
          email: profileData.institutionEmail || 'Email not available',
          logo: profileData.institutionLogo || '/assets/img/logo.png',
          website: profileData.institutionWebsite || '',
          established: profileData.institutionEstablished || '',
          principal: profileData.principal ? {
            name: profileData.principal.name || '',
            email: profileData.principal.email || '',
            phone: profileData.principal.phone || ''
          } : undefined,
          admin: profileData.admin ? {
            name: profileData.admin.name || '',
            email: profileData.admin.email || '',
            phone: profileData.admin.phone || ''
          } : undefined,
          settings: {
            timezone: profileData.timezone || 'UTC',
            currency: profileData.currency || 'INR',
            language: profileData.language || 'en',
            academicYear: profileData.academicYear || new Date().getFullYear().toString(),
            currentSemester: profileData.currentSemester || ''
          },
        };
        
        setInstitutionData(institutionFromProfile);
        console.log('Institution data from profile fallback:', institutionFromProfile);
        
        // Extract staff data from profile
        if (profileData) {
          const staffFromProfile: StaffData = {
            _id: profileData.id || user?.id || '',
            name: profileData.name || user?.name || 'Staff Member',
            email: profileData.email || user?.email || '',
            role: profileData.role || user?.role || 'staff',
            department: profileData.department || 'General',
            designation: profileData.designation || 'Staff',
            employeeId: profileData.employeeId || user?.id?.slice(-6) || 'N/A',
            avatar: profileData.avatar || user?.avatar || '',
            phone: profileData.phone || '',
            address: profileData.address || '',
            dateOfBirth: profileData.dateOfBirth || '',
            gender: profileData.gender || '',
            bloodGroup: profileData.bloodGroup || '',
            qualification: profileData.qualification || '',
            experience: profileData.experience || '',
            salary: profileData.salary || 0,
            joiningDate: profileData.joiningDate || '',
            skills: profileData.skills || [],
            linkedinProfile: profileData.linkedinProfile || '',
            status: profileData.status || 'active',
            permissions: profileData.permissions || [],
            createdAt: profileData.createdAt || new Date().toISOString(),
            updatedAt: profileData.updatedAt || new Date().toISOString()
          };
          
          setStaffData(staffFromProfile);
          console.log('Staff data from profile:', staffFromProfile);
        }
      }
    } catch (profileErr) {
      console.error('Error fetching from profile:', profileErr);
    }
    
    // Final fallback to dashboard data
    try {
      const Response = await apiClient.get('/dashboard');
      if (Response.data.success) {
        const dashboardData = Response.data.data;
        
        // Extract institution data from dashboard
        if (dashboardData.institution) {
          setInstitutionData(dashboardData.institution);
          console.log('Institution data from dashboard:', dashboardData.institution);
        }
        
        // Extract staff data from dashboard
        if (dashboardData.staff) {
          setStaffData(dashboardData.staff);
          console.log('Staff data from dashboard:', dashboardData.staff);
        }
      }
    } catch (dashboardErr) {
      console.error('Error fetching from dashboard:', dashboardErr);
    }
    
    // If all else fails, create default data
    if (!institutionData) {
      const defaultInstitution: InstitutionData = {
        _id: 'default',
        name: 'Your Institution',
        code: 'INST001',
        schoolCode: 'INST001',
        type: 'Educational Institution',
        address: 'Address not available',
        phone: 'Phone not available',
        email: 'Email not available',
        logo: '/assets/img/logo.png',
        website: '',
        established: '',
        principal: {
          name: 'Principal Name',
          email: 'principal@institution.edu',
          phone: ''
        },
        admin: {
          name: 'Admin Name',
          email: 'admin@institution.edu',
          phone: ''
        },
        settings: {
          timezone: 'UTC',
          currency: 'INR',
          language: 'en',
          academicYear: new Date().getFullYear().toString(),
          currentSemester: ''
        },
      };
      
      setInstitutionData(defaultInstitution);
    }
    
    if (!staffData) {
      const defaultStaffData: StaffData = {
        _id: user?.id || '',
        name: user?.name || 'Staff Member',
        email: user?.email || '',
        role: user?.role || 'staff',
        department: 'General',
        designation: 'Staff',
        employeeId: user?.id?.slice(-6) || 'N/A',
        avatar: user?.avatar || '',
        phone: '',
        address: '',
        dateOfBirth: '',
        gender: '',
        bloodGroup: '',
        qualification: '',
        experience: '',
        salary: 0,
        joiningDate: '',
        skills: [],
        linkedinProfile: '',
        status: 'active',
        permissions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setStaffData(defaultStaffData);
      console.log('Default staff data created:', defaultStaffData);
  };

  const updateStaffProfile = async (profileData: Partial<StaffData>) => {
    try {
      const response = await apiClient.put('/auth/profile', profileData);
      
      if (response.data.success) {
        setStaffData(response.data.data);
        toast.success('Profile updated successfully');
      } else {
        toast.error(response.data.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const getWelcomeMessage = () => {
    if (institutionData && staffData) {
      const institutionName = institutionData.name || 'Your Institution';
      const staffName = staffData.name || 'Staff Member';
      
      return `Welcome back, ${staffName}! 👋 You are part of ${institutionName}`;
    }
    
    return 'Welcome back! 👋';
  };

  const getInstitutionStats = () => {
    if (!institutionData) return null;
    
    return {
      totalStudents: 0,
      activeStudents: 0,
      totalStaff: 0,
      activeStaff: 1,
      totalTeachers: 0,
      activeTeachers: 0,
      totalDepartments: 0,
      departments: ['General'],
      currentSemester: institutionData.settings?.currentSemester || 'N/A',
      academicYear: institutionData.settings?.academicYear || new Date().getFullYear().toString()
    };
  };

  return {
    institutionData,
    staffData,
    loading,
    error,
    isFetching,
    fetchInstitutionData,
    updateStaffProfile,
    getWelcomeMessage,
    getInstitutionStats
  };
};
}