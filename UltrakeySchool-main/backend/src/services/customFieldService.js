import CustomField from '../models/CustomField.js';

class CustomFieldService {
  async createField(schoolId, data) {
    return await CustomField.create({ ...data, schoolId });
  }

  async getFields(schoolId, entityType) {
    return await CustomField.find({ schoolId, entityType, isActive: true })
      .sort({ displayOrder: 1 });
  }

  async getFieldById(fieldId, schoolId) {
    const field = await CustomField.findOne({ _id: fieldId, schoolId });
    if (!field) throw new Error('Custom field not found');
    return field;
  }

  async updateField(fieldId, schoolId, updates) {
    const field = await CustomField.findOneAndUpdate(
      { _id: fieldId, schoolId },
      { $set: updates },
      { new: true }
    );
    if (!field) throw new Error('Custom field not found');
    return field;
  }

  async deleteField(fieldId, schoolId) {
    const field = await CustomField.findOneAndDelete({ _id: fieldId, schoolId });
    if (!field) throw new Error('Custom field not found');
    return field;
  }

  async reorderFields(schoolId, entityType, orderedIds) {
    await Promise.all(orderedIds.map((id, index) => 
      CustomField.updateOne({ _id: id, schoolId, entityType }, { displayOrder: index })
    ));
    return await this.getFields(schoolId, entityType);
  }

  /**
   * Get all fields for a school
   */
  async getAllFields(schoolId) {
    return await CustomField.find({ schoolId, isActive: true })
      .sort({ displayOrder: 1, createdAt: 1 });
  }

  /**
   * Bulk create fields
   */
  async bulkCreateFields(schoolId, fieldsData) {
    const fields = await CustomField.insertMany(
      fieldsData.map(data => ({ ...data, schoolId }))
    );
    return fields;
  }

  /**
   * Bulk delete fields
   */
  async bulkDeleteFields(schoolId, fieldIds) {
    const result = await CustomField.deleteMany({ 
      _id: { $in: fieldIds }, 
      schoolId 
    });
    return result;
  }

  /**
   * Clone fields from one entity to another
   */
  async cloneFields(schoolId, fromEntityType, toEntityType) {
    const sourceFields = await CustomField.find({ 
      schoolId, 
      entityType: fromEntityType, 
      isActive: true 
    });
    
    const clonedFields = await CustomField.insertMany(
      sourceFields.map(field => ({
        ...field.toObject(),
        _id: undefined,
        entityType: toEntityType,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    );
    
    return clonedFields;
  }

  /**
   * Get field statistics
   */
  async getFieldStatistics(schoolId) {
    const stats = await CustomField.aggregate([
      { $match: { schoolId } },
      {
        $group: {
          _id: '$entityType',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          required: {
            $sum: { $cond: [{ $eq: ['$isRequired', true] }, 1, 0] }
          }
        }
      }
    ]);

    const totalFields = await CustomField.countDocuments({ schoolId });
    const activeFields = await CustomField.countDocuments({ schoolId, isActive: true });
    const requiredFields = await CustomField.countDocuments({ schoolId, isRequired: true });

    return {
      total: totalFields,
      active: activeFields,
      required: requiredFields,
      byEntityType: stats
    };
  }

  /**
   * Validate field value
   */
  async validateFieldValue(schoolId, fieldId, value) {
    const field = await CustomField.findOne({ _id: fieldId, schoolId, isActive: true });
    if (!field) throw new Error('Custom field not found');

    const errors = [];

    // Check if required and empty
    if (field.isRequired && (!value || value.toString().trim() === '')) {
      errors.push(`${field.fieldName} is required`);
    }

    // Type validation
    if (value && value.toString().trim() !== '') {
      switch (field.fieldType) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(`${field.fieldName} must be a valid email`);
          }
          break;
        case 'number':
          if (isNaN(Number(value))) {
            errors.push(`${field.fieldName} must be a number`);
          }
          break;
        case 'date':
          if (isNaN(Date.parse(value))) {
            errors.push(`${field.fieldName} must be a valid date`);
          }
          break;
        case 'select':
          if (field.options && field.options.length > 0 && !field.options.includes(value)) {
            errors.push(`${field.fieldName} must be one of: ${field.options.join(', ')}`);
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      field: field.fieldName
    };
  }

  /**
   * Export fields data
   */
  async exportFields(schoolId, format = 'json') {
    const fields = await CustomField.find({ schoolId, isActive: true })
      .sort({ displayOrder: 1 });

    if (format === 'csv') {
      const csvHeader = 'Field Name,Entity Type,Field Type,Required,Options,Display Order,Created At\n';
      const csvData = fields.map(field => {
        return `"${field.fieldName}","${field.entityType}","${field.fieldType}",${field.isRequired},"${field.options?.join(';') || ''}",${field.displayOrder},"${field.createdAt}"`;
      }).join('\n');
      return csvHeader + csvData;
    }

    return {
      fields: fields.map(field => ({
        fieldName: field.fieldName,
        entityType: field.entityType,
        fieldType: field.fieldType,
        isRequired: field.isRequired,
        options: field.options,
        displayOrder: field.displayOrder,
        defaultValue: field.defaultValue,
        description: field.description,
        createdAt: field.createdAt
      }))
    };
  }

  /**
   * Toggle required status
   */
  async toggleRequired(schoolId, fieldId) {
    const field = await CustomField.findOne({ _id: fieldId, schoolId });
    if (!field) throw new Error('Custom field not found');

    const updatedField = await CustomField.findOneAndUpdate(
      { _id: fieldId, schoolId },
      { $set: { isRequired: !field.isRequired } },
      { new: true }
    );

    return updatedField;
  }
}

export default new CustomFieldService();
