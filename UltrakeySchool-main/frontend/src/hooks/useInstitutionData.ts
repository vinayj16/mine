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

const mapApiInstitution = (raw: Record<string, unknown>): InstitutionData => ({
  _id: String(raw._id || raw.id || ''),
  name: String(raw.name || 'Your Institution'),
  code: String(raw.code || raw.instituteCode || raw.schoolCode || 'N/A'),
  schoolCode: String(raw.schoolCode || raw.instituteCode || raw.code || 'N/A'),
  type: (raw.type as InstitutionData['type']) || 'School',
  email: raw.contact && typeof raw.contact === 'object' && 'email' in raw.contact
    ? String((raw.contact as { email?: string }).email || '')
    : undefined,
  phone: raw.contact && typeof raw.contact === 'object' && 'phone' in raw.contact
    ? String((raw.contact as { phone?: string }).phone || '')
    : undefined,
  logo: raw.logo ? String(raw.logo) : undefined
});

export const useInstitutionData = () => {
  const { user, institutionData: authInstitution } = useAuth();
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

      // Use institution from login response immediately
      const loginInstitution = authInstitution || user?.institutionData;
      if (loginInstitution?.name || loginInstitution?.id) {
        setInstitutionData(mapApiInstitution(loginInstitution as Record<string, unknown>));
      }

      // Try to get institution data from multiple possible endpoints
      let apiResponse;

      // 1. Try dedicated institution endpoint
      try {
        apiResponse = await apiClient.get('/institutions/my');
        if (apiResponse.data.success && apiResponse.data.data) {
          setInstitutionData(mapApiInstitution(apiResponse.data.data));
          return;
        }
      } catch (err) {
        console.error('Error fetching from /institutions/my:', err);
      }

      // 2. Fallback to user profile data
      try {
        apiResponse = await apiClient.get('/auth/profile');
        if (apiResponse.data.success) {
          const profileData = apiResponse.data.data;

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
          }
        }
      } catch (err) {
        console.error('Error fetching from profile:', err);
      }

      // 3. Fallback to dashboard data
      try {
        const Response = await apiClient.get('/dashboard');
        if (Response.data.success) {
          const dashboardData = Response.data.data;
          if (dashboardData.institution) setInstitutionData(dashboardData.institution);
          if (dashboardData.staff) setStaffData(dashboardData.staff);
        }
      } catch (err) {
        console.error('Error fetching from dashboard:', err);
      }

      // 4. Default data if all failed
      if (!institutionData) {
        setInstitutionData({
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
          settings: {
            timezone: 'UTC',
            currency: 'INR',
            language: 'en',
            academicYear: new Date().getFullYear().toString(),
            currentSemester: ''
          },
        });
      }

      if (!staffData) {
        setStaffData({
          _id: user?.id || '',
          name: user?.name || 'Staff Member',
          email: user?.email || '',
          role: user?.role || 'staff',
          department: 'General',
          designation: 'Staff',
          employeeId: user?.id?.slice(-6) || 'N/A',
          avatar: user?.avatar || '',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as StaffData);
      }

    } catch (err) {
      console.error('Critical error in fetchInstitutionData:', err);
      setError('Failed to load institution data');
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
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

      return `Welcome back, ${staffName}! You are part of ${institutionName}`;
    }

    return 'Welcome back!';
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