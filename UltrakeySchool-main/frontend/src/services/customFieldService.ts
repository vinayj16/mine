import api from './api';

export interface CustomField {
  _id: string;
  schoolId: string;
  entityType: 'student' | 'teacher' | 'guardian' | 'staff' | 'user';
  fieldName: string;
  fieldLabel: string;
  fieldType: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'textarea' | 'checkbox' | 'radio' | 'email' | 'phone' | 'file';
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  options?: string[];
  isRequired: boolean;
  isUnique: boolean;
  isActive: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldFormData {
  entityType: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  options?: string[];
  isRequired: boolean;
  isUnique: boolean;
  isActive: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  displayOrder?: number;
}

const customFieldService = {
  getFields: async (schoolId: string, entityType: string) => {
    const response = await api.get(`/custom-fields/schools/${schoolId}/${entityType}`);
    return response.data;
  },

  getFieldById: async (schoolId: string, entityType: string, fieldId: string) => {
    const response = await api.get(`/custom-fields/schools/${schoolId}/${entityType}/${fieldId}`);
    return response.data;
  },

  createField: async (schoolId: string, data: CustomFieldFormData) => {
    const response = await api.post(`/custom-fields/schools/${schoolId}`, data);
    return response.data;
  },

  updateField: async (schoolId: string, entityType: string, fieldId: string, data: Partial<CustomFieldFormData>) => {
    const response = await api.put(`/custom-fields/schools/${schoolId}/${entityType}/${fieldId}`, data);
    return response.data;
  },

  deleteField: async (schoolId: string, entityType: string, fieldId: string) => {
    const response = await api.delete(`/custom-fields/schools/${schoolId}/${entityType}/${fieldId}`);
    return response.data;
  },

  reorderFields: async (schoolId: string, entityType: string, orderedIds: string[]) => {
    const response = await api.patch(`/custom-fields/schools/${schoolId}/${entityType}/reorder`, { orderedIds });
    return response.data;
  }
};

export default customFieldService;
