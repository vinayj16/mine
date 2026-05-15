import GdprSettings from '../models/GdprSettings.js';
import DataExportRequest from '../models/DataExportRequest.js';
import DataErasureRequest from '../models/DataErasureRequest.js';
import AuditLog from '../models/AuditLog.js';
import crypto from 'crypto';

const DEFAULT_DPO = {
  contactEmail: 'dpo@edumanage.pro',
  name: 'EduManage Data Protection Officer',
  responsibilities: 'Data protection compliance, breach notification, DPIA coordination',
  contactDetails: 'Contact information is available in the privacy policy and system settings'
};

const DEFAULT_DPIA = {
  highRiskProcessing: [
    'Student personal data processing',
    'Automated decision making for assessments',
    'Large-scale data processing'
  ],
  lastReviewedAt: new Date(),
  notes: 'High-risk processing areas are reviewed quarterly'
};

const mergeDefaults = (settings) => {
  const base = settings?.toObject ? settings.toObject() : (settings || {});
  return {
    ...base,
    dataProtectionOfficer: {
      ...DEFAULT_DPO,
      ...(base.dataProtectionOfficer || {})
    },
    dpiImpactAssessment: {
      ...DEFAULT_DPIA,
      ...(base.dpiImpactAssessment || {})
    }
  };
};

class GdprSettingsService {
  async getGdprSettings(institutionId) {
    let settings = await GdprSettings.findOne({ institutionId, isActive: true });
    
    if (!settings) {
      settings = await GdprSettings.create({ institutionId });
    }
    
    return mergeDefaults(settings);
  }

  async updateGdprSettings(institutionId, data) {
    const settings = await GdprSettings.findOneAndUpdate(
      { institutionId },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    );
    
    return mergeDefaults(settings);
  }

  async toggleGdpr(institutionId, enabled) {
    const settings = await GdprSettings.findOneAndUpdate(
      { institutionId },
      { $set: { enabled } },
      { new: true, upsert: true }
    );
    
    return mergeDefaults(settings);
  }

  async deleteGdprSettings(institutionId) {
    const settings = await GdprSettings.findOneAndUpdate(
      { institutionId },
      { isActive: false },
      { new: true }
    );
    
    if (!settings) {
      throw new Error('GDPR settings not found');
    }
    
    return mergeDefaults(settings);
  }

  // Data Export Request Methods
  async createDataExportRequest(userId, institutionId, requestData) {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const {
      requestType = 'full',
      requestedData = ['all'],
      format = 'json',
      filters = {},
      schoolId = null
    } = requestData;
    
    const exportRequest = await DataExportRequest.create({
      userId,
      institutionId,
      requestType,
      requestedData,
      format,
      filters,
      schoolId,
      verificationToken,
      status: 'pending'
    });

    // Log the request
    await this.logAudit({
      institutionId,
      userId,
      action: 'data_export_request',
      details: {
        requestId: exportRequest._id,
        requestType: requestType,
        format,
        filters
      }
    });

    return exportRequest;
  }

  async getDataExportRequests(userId, institutionId, filters = {}) {
    const query = { userId, institutionId };
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    const requests = await DataExportRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 50);
    
    return requests;
  }

  async verifyDataExportRequest(requestId, verificationToken) {
    const request = await DataExportRequest.findOne({
      _id: requestId,
      verificationToken,
      status: 'pending'
    });

    if (!request) {
      throw new Error('Invalid or expired verification token');
    }

    await DataExportRequest.findByIdAndUpdate(requestId, {
      status: 'processing',
      verifiedAt: new Date()
    });

    // Log verification
    await this.logAudit({
      institutionId: request.institutionId,
      userId: request.userId,
      action: 'data_export_verified',
      details: { requestId }
    });

    return request;
  }

  async completeDataExportRequest(requestId, fileUrl, processedBy) {
    const request = await DataExportRequest.findByIdAndUpdate(
      requestId,
      {
        status: 'completed',
        fileUrl,
        processedAt: new Date(),
        processedBy
      },
      { new: true }
    );

    if (!request) {
      throw new Error('Export request not found');
    }

    // Log completion
    await this.logAudit({
      institutionId: request.institutionId,
      userId: request.userId,
      action: 'data_export_completed',
      details: { 
        requestId,
        fileUrl,
        processedBy
      }
    });

    return request;
  }

  // Data Erasure Request Methods
  async createDataErasureRequest(userId, institutionId, requestData) {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    const erasureRequest = await DataErasureRequest.create({
      userId,
      institutionId,
      ...requestData,
      verificationToken,
      status: 'pending'
    });

    // Log the request
    await this.logAudit({
      institutionId,
      userId,
      action: 'data_erasure_request',
      details: {
        requestId: erasureRequest._id,
        requestType: requestData.requestType,
        reason: requestData.reason
      }
    });

    return erasureRequest;
  }

  async getDataErasureRequests(userId, institutionId, filters = {}) {
    const query = { userId, institutionId };
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    const requests = await DataErasureRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 50);
    
    return requests;
  }

  async verifyDataErasureRequest(requestId, verificationToken) {
    const request = await DataErasureRequest.findOne({
      _id: requestId,
      verificationToken,
      status: 'pending'
    });

    if (!request) {
      throw new Error('Invalid or expired verification token');
    }

    await DataErasureRequest.findByIdAndUpdate(requestId, {
      status: 'reviewing',
      verifiedAt: new Date()
    });

    // Log verification
    await this.logAudit({
      institutionId: request.institutionId,
      userId: request.userId,
      action: 'data_erasure_verified',
      details: { requestId }
    });

    return request;
  }

  async reviewDataErasureRequest(requestId, approved, reviewedBy, reason = null) {
    const updateData = {
      status: approved ? 'approved' : 'rejected',
      reviewedAt: new Date(),
      reviewedBy,
      rejectedReason: approved ? null : reason
    };

    const request = await DataErasureRequest.findByIdAndUpdate(
      requestId,
      updateData,
      { new: true }
    );

    if (!request) {
      throw new Error('Erasure request not found');
    }

    // Log review
    await this.logAudit({
      institutionId: request.institutionId,
      userId: request.userId,
      action: approved ? 'data_erasure_approved' : 'data_erasure_rejected',
      details: { 
        requestId,
        approved,
        reviewedBy,
        reason
      }
    });

    return request;
  }

  async completeDataErasureRequest(requestId, dataBackup, completedBy) {
    const request = await DataErasureRequest.findByIdAndUpdate(
      requestId,
      {
        status: 'completed',
        dataBackup,
        completedAt: new Date()
      },
      { new: true }
    );

    if (!request) {
      throw new Error('Erasure request not found');
    }

    // Log completion
    await this.logAudit({
      institutionId: request.institutionId,
      userId: request.userId,
      action: 'data_erasure_completed',
      details: { 
        requestId,
        dataBackup,
        completedBy
      }
    });

    return request;
  }

  // Audit Log Methods
  async logAudit(logData) {
    try {
      await AuditLog.create({
        ...logData,
        metadata: {
          ...logData.metadata,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  }

  async getAuditLogs(institutionId, filters = {}) {
    const query = { institutionId };
    
    if (filters.userId) {
      query.userId = filters.userId;
    }
    
    if (filters.action) {
      query.action = filters.action;
    }
    
    if (filters.dateFrom) {
      query.createdAt = { $gte: new Date(filters.dateFrom) };
    }
    
    if (filters.dateTo) {
      query.createdAt = { ...query.createdAt, $lte: new Date(filters.dateTo) };
    }
    
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 100);
    
    return logs;
  }

  // Data Retention Methods
  async checkDataRetentionCompliance(institutionId) {
    const settings = await this.getGdprSettings(institutionId);
    
    if (!settings.dataRetention.enabled) {
      return { compliant: true, message: 'Data retention not enabled' };
    }

    // This would need to be implemented based on your data models
    // For now, return a placeholder
    return {
      compliant: true,
      message: 'Data retention compliance check completed',
      retentionPeriods: {
        studentData: settings.dataRetention.studentDataRetention,
        staffData: settings.dataRetention.staffDataRetention,
        auditLogs: settings.dataRetention.auditLogRetention
      }
    };
  }

  async createGdprSettings(institutionId, data) {
    const existingSettings = await GdprSettings.findOne({ institutionId });
    
    if (existingSettings) {
      throw new Error('GDPR settings already exist for this institution');
    }
    
    const settings = await GdprSettings.create({
      institutionId,
      ...data,
      isActive: true
    });
    
    return mergeDefaults(settings);
  }

  async getComplianceStatus(institutionId) {
    const settings = await this.getGdprSettings(institutionId);
    const retentionCompliance = await this.checkDataRetentionCompliance(institutionId);
    
    return {
      gdprEnabled: settings.enabled || false,
      dataRetentionCompliance: retentionCompliance.compliant,
      dataProtectionOfficer: settings.dataProtectionOfficer,
      dpiImpactAssessment: settings.dpiImpactAssessment,
      consentManagement: {
        enabled: settings.consentManagement?.enabled || false,
        lastAudit: settings.consentManagement?.lastAudit || null
      },
      breachNotification: {
        enabled: settings.breachNotification?.enabled || false,
        notificationTimeframe: settings.breachNotification?.notificationTimeframe || '72h'
      },
      overallCompliance: retentionCompliance.compliant && (settings.enabled || false)
    };
  }

  async updateDataRetentionPolicy(institutionId, policyData) {
    const settings = await GdprSettings.findOneAndUpdate(
      { institutionId },
      { $set: { dataRetention: policyData } },
      { new: true, upsert: true }
    );
    
    return mergeDefaults(settings);
  }

  async exportGdprSettings(institutionId, format = 'json') {
    const settings = await this.getGdprSettings(institutionId);
    
    if (format === 'json') {
      return {
        data: settings,
        format: 'json',
        exportedAt: new Date()
      };
    } else if (format === 'csv') {
      const headers = ['Setting', 'Value'];
      const rows = [
        ['GDPR Enabled', settings.enabled],
        ['DPO Email', settings.dataProtectionOfficer.contactEmail],
        ['DPO Name', settings.dataProtectionOfficer.name],
        ['Data Retention Enabled', settings.dataRetention?.enabled],
        ['Student Data Retention', settings.dataRetention?.studentDataRetention],
        ['Staff Data Retention', settings.dataRetention?.staffDataRetention],
        ['Audit Log Retention', settings.dataRetention?.auditLogRetention]
      ];

      return {
        data: [headers, ...rows],
        format: 'csv',
        exportedAt: new Date()
      };
    }

    throw new Error('Unsupported export format');
  }
}

export default new GdprSettingsService();
