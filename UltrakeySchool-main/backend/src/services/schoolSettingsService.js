import SchoolSettings from '../models/SchoolSettings.js';

class SchoolSettingsService {
  async createSchoolSettings(settingsData) {
    const existingSettings = await SchoolSettings.findOne({
      institutionId: settingsData.institutionId
    });

    if (existingSettings) {
      throw new Error('School settings already exist for this institution');
    }

    const settings = new SchoolSettings(settingsData);
    return await settings.save();
  }

  async getSchoolSettingsById(settingsId) {
    return await SchoolSettings.findById(settingsId)
      .populate('institutionId', 'name type')
      .populate('metadata.createdBy', 'name')
      .populate('metadata.updatedBy', 'name');
  }

  async getSchoolSettingsByInstitution(institutionId) {
    return await SchoolSettings.findOne({ institutionId })
      .populate('institutionId', 'name type');
  }

  async updateSchoolSettings(institutionId, updateData) {
    const settings = await SchoolSettings.findOne({ institutionId });
    
    if (!settings) {
      const newSettings = new SchoolSettings({
        institutionId,
        ...updateData
      });
      return await newSettings.save();
    }

    Object.assign(settings, updateData);
    return await settings.save();
  }

  async updateBasicInfo(institutionId, basicInfo, userId) {
    const settings = await SchoolSettings.findOne({ institutionId });
    
    if (!settings) {
      throw new Error('School settings not found');
    }

    settings.basicInfo = { ...settings.basicInfo, ...basicInfo };
    settings.metadata.updatedBy = userId;
    return await settings.save();
  }

  async updateAcademicSettings(institutionId, academicSettings, userId) {
    const settings = await SchoolSettings.findOne({ institutionId });
    
    if (!settings) {
      throw new Error('School settings not found');
    }

    settings.academicSettings = { ...settings.academicSettings, ...academicSettings };
    settings.metadata.updatedBy = userId;
    return await settings.save();
  }

  async updateExamSettings(institutionId, examSettings, userId) {
    const settings = await SchoolSettings.findOne({ institutionId });
    
    if (!settings) {
      throw new Error('School settings not found');
    }

    settings.examSettings = { ...settings.examSettings, ...examSettings };
    settings.metadata.updatedBy = userId;
    return await settings.save();
  }

  async updateAttendanceSettings(institutionId, attendanceSettings, userId) {
    const settings = await SchoolSettings.findOne({ institutionId });
    
    if (!settings) {
      throw new Error('School settings not found');
    }

    settings.attendanceSettings = { ...settings.attendanceSettings, ...attendanceSettings };
    settings.metadata.updatedBy = userId;
    return await settings.save();
  }

  async updateFeeSettings(institutionId, feeSettings, userId) {
    const settings = await SchoolSettings.findOne({ institutionId });
    
    if (!settings) {
      throw new Error('School settings not found');
    }

    settings.feeSettings = { ...settings.feeSettings, ...feeSettings };
    settings.metadata.updatedBy = userId;
    return await settings.save();
  }

  async updateNotificationSettings(institutionId, notificationSettings, userId) {
    const settings = await SchoolSettings.findOne({ institutionId });
    
    if (!settings) {
      throw new Error('School settings not found');
    }

    settings.notificationSettings = { ...settings.notificationSettings, ...notificationSettings };
    settings.metadata.updatedBy = userId;
    return await settings.save();
  }

  async updateLogo(institutionId, logoData, userId) {
    const settings = await SchoolSettings.findOne({ institutionId });
    
    if (!settings) {
      throw new Error('School settings not found');
    }

    settings.logo = logoData;
    settings.metadata.updatedBy = userId;
    return await settings.save();
  }

  async updateStatus(institutionId, status, userId) {
    const settings = await SchoolSettings.findOne({ institutionId });
    
    if (!settings) {
      throw new Error('School settings not found');
    }

    settings.status = status;
    settings.metadata.updatedBy = userId;
    return await settings.save();
  }

  async getAllSchoolSettings(filters = {}, options = {}) {
    const {
      status,
      academicYear,
      search
    } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const query = {};

    if (status) query.status = status;
    if (academicYear) query['academicSettings.academicYear'] = academicYear;

    if (search) {
      query.$or = [
        { 'basicInfo.schoolName': { $regex: search, $options: 'i' } },
        { 'basicInfo.email': { $regex: search, $options: 'i' } },
        { 'basicInfo.phoneNumber': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [settings, total] = await Promise.all([
      SchoolSettings.find(query)
        .populate('institutionId', 'name type')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      SchoolSettings.countDocuments(query)
    ]);

    return {
      settings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async deleteSchoolSettings(institutionId) {
    return await SchoolSettings.findOneAndDelete({ institutionId });
  }

  async getSchoolSettingsStatistics() {
    const [
      totalSchools,
      activeSchools,
      inactiveSchools,
      settingsByAcademicYear
    ] = await Promise.all([
      SchoolSettings.countDocuments(),
      SchoolSettings.countDocuments({ status: 'active' }),
      SchoolSettings.countDocuments({ status: 'inactive' }),
      SchoolSettings.aggregate([
        {
          $group: {
            _id: '$academicSettings.academicYear',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } }
      ])
    ]);

    return {
      totalSchools,
      activeSchools,
      inactiveSchools,
      settingsByAcademicYear
    };
  }
}

export default new SchoolSettingsService();
