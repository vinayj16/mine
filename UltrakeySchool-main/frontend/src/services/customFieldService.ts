import api from './api';

export interface CustomField {
  _id: string;
  institutionId: string;
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
  getFields: async (institutionId: string, entityType: string) => {
    const response = await api.get(`/custom-fields/institutions/${institutionId}/${entityType}`);
    return response.data;
  },

  getFieldById: async (institutionId: string, entityType: string, fieldId: string) => {
    const response = await api.get(`/custom-fields/institutions/${institutionId}/${entityType}/${fieldId}`);
    return response.data;
  },

  createField: async (institutionId: string, data: CustomFieldFormData) => {
    const response = await api.post(`/custom-fields/institutions/${institutionId}`, data);
    return response.data;
  },

  updateField: async (institutionId: string, entityType: string, fieldId: string, data: Partial<CustomFieldFormData>) => {
    const response = await api.put(`/custom-fields/institutions/${institutionId}/${entityType}/${fieldId}`, data);
    return response.data;
  },

  deleteField: async (institutionId: string, entityType: string, fieldId: string) => {
    const response = await api.delete(`/custom-fields/institutions/${institutionId}/${entityType}/${fieldId}`);
    return response.data;
  },

  reorderFields: async (institutionId: string, entityType: string, orderedIds: string[]) => {
    const response = await api.patch(`/custom-fields/institutions/${institutionId}/${entityType}/reorder`, { orderedIds });
    return response.data;
  }
};

export default customFieldService;
