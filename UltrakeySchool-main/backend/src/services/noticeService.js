import Notice from '../models/Notice.js';

class NoticeService {
  async createNotice(noticeData) {
    const notice = new Notice(noticeData);
    return await notice.save();
  }

  async getNoticeById(noticeId) {
    return await Notice.findById(noticeId)
      .populate('institutionId', 'name type')
      .populate('metadata.createdBy', 'name email')
      .populate('metadata.updatedBy', 'name email')
      .populate('viewedBy.userId', 'name email');
  }

  async getNoticeByNoticeId(noticeId) {
    return await Notice.findOne({ noticeId, isDeleted: false })
      .populate('institutionId', 'name type')
      .populate('metadata.createdBy', 'name email');
  }

  async getAllNotices(filters = {}, options = {}) {
    const {
      institutionId,
      academicYear,
      status,
      priority,
      recipient,
      startDate,
      endDate,
      search
    } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = 'publishDate',
      sortOrder = 'desc'
    } = options;

    const query = { isDeleted: false };

    if (institutionId) query.institutionId = institutionId;
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (recipient) query.recipients = recipient;

    if (startDate || endDate) {
      query.publishDate = {};
      if (startDate) query.publishDate.$gte = new Date(startDate);
      if (endDate) query.publishDate.$lte = new Date(endDate);
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [notices, total] = await Promise.all([
      Notice.find(query)
        .populate('institutionId', 'name type')
        .populate('metadata.createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Notice.countDocuments(query)
    ]);

    return {
      notices,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateNotice(noticeId, updateData) {
    const notice = await Notice.findById(noticeId);
    
    if (!notice) {
      throw new Error('Notice not found');
    }

    Object.assign(notice, updateData);
    return await notice.save();
  }

  async deleteNotice(noticeId) {
    const notice = await Notice.findById(noticeId);
    
    if (!notice) {
      throw new Error('Notice not found');
    }

    notice.isDeleted = true;
    return await notice.save();
  }

  async bulkDelete(noticeIds) {
    return await Notice.updateMany(
      { _id: { $in: noticeIds } },
      { isDeleted: true }
    );
  }

  async updateStatus(noticeId, status) {
    return await Notice.findByIdAndUpdate(
      noticeId,
      { status },
      { new: true, runValidators: true }
    );
  }

  async getNoticesByRecipient(recipient, institutionId, academicYear) {
    const query = {
      recipients: recipient,
      status: 'published',
      publishDate: { $lte: new Date() },
      isDeleted: false
    };

    if (institutionId) query.institutionId = institutionId;
    if (academicYear) query.academicYear = academicYear;

    return await Notice.find(query)
      .populate('metadata.createdBy', 'name')
      .sort({ publishDate: -1 });
  }

  async getPublishedNotices(institutionId, academicYear) {
    const query = {
      status: 'published',
      publishDate: { $lte: new Date() },
      isDeleted: false
    };

    if (institutionId) query.institutionId = institutionId;
    if (academicYear) query.academicYear = academicYear;

    return await Notice.find(query)
      .populate('metadata.createdBy', 'name')
      .sort({ publishDate: -1 });
  }

  async getUpcomingNotices(institutionId, academicYear) {
    const query = {
      status: 'published',
      publishDate: { $gt: new Date() },
      isDeleted: false
    };

    if (institutionId) query.institutionId = institutionId;
    if (academicYear) query.academicYear = academicYear;

    return await Notice.find(query)
      .populate('metadata.createdBy', 'name')
      .sort({ publishDate: 1 });
  }

  async incrementViews(noticeId, userId) {
    const notice = await Notice.findById(noticeId);
    
    if (!notice) {
      throw new Error('Notice not found');
    }

    const alreadyViewed = notice.viewedBy.some(
      view => view.userId.toString() === userId
    );

    if (!alreadyViewed) {
      notice.views += 1;
      notice.viewedBy.push({
        userId,
        viewedAt: new Date()
      });
      await notice.save();
    }

    return notice;
  }

  async getNoticeStatistics(institutionId, academicYear) {
    const query = { isDeleted: false };
    
    if (institutionId) query.institutionId = institutionId;
    if (academicYear) query.academicYear = academicYear;

    const [
      totalNotices,
      publishedNotices,
      draftNotices,
      archivedNotices,
      noticesByPriority,
      noticesByRecipient,
      recentNotices
    ] = await Promise.all([
      Notice.countDocuments(query),
      Notice.countDocuments({ ...query, status: 'published' }),
      Notice.countDocuments({ ...query, status: 'draft' }),
      Notice.countDocuments({ ...query, status: 'archived' }),
      Notice.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ]),
      Notice.aggregate([
        { $match: query },
        { $unwind: '$recipients' },
        {
          $group: {
            _id: '$recipients',
            count: { $sum: 1 }
          }
        }
      ]),
      Notice.countDocuments({
        ...query,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);

    return {
      totalNotices,
      publishedNotices,
      draftNotices,
      archivedNotices,
      noticesByPriority,
      noticesByRecipient,
      recentNotices
    };
  }

  async searchNotices(searchTerm, institutionId) {
    const query = {
      isDeleted: false,
      $text: { $search: searchTerm }
    };

    if (institutionId) {
      query.institutionId = institutionId;
    }

    return await Notice.find(query)
      .populate('institutionId', 'name type')
      .populate('metadata.createdBy', 'name email')
      .sort({ score: { $meta: 'textScore' } })
      .limit(20);
  }

  async addAttachment(noticeId, attachmentData) {
    const notice = await Notice.findById(noticeId);
    
    if (!notice) {
      throw new Error('Notice not found');
    }

    notice.attachments.push({
      ...attachmentData,
      uploadedAt: new Date()
    });

    return await notice.save();
  }

  async removeAttachment(noticeId, attachmentId) {
    const notice = await Notice.findById(noticeId);
    
    if (!notice) {
      throw new Error('Notice not found');
    }

    notice.attachments = notice.attachments.filter(
      att => att._id.toString() !== attachmentId
    );

    return await notice.save();
  }
}

export default new NoticeService();
