import FileManager from '../models/FileManager.js';

class FileManagerService {
  async createItem(itemData) {
    const item = new FileManager(itemData);
    
    if (item.parentId) {
      await this.updateFolderSize(item.parentId, item.size);
      await this.updateFolderFileCount(item.parentId, 1);
    }
    
    return await item.save();
  }

  async getItemById(id) {
    return await FileManager.findById(id).populate('sharedWith', 'name email');
  }

  async getAllItems(filters = {}) {
    const query = { status: 'active' };
    
    if (filters.ownerId) query.ownerId = filters.ownerId;
    if (filters.institutionId) query.institutionId = filters.institutionId;
    if (filters.parentId !== undefined) query.parentId = filters.parentId || null;
    if (filters.type) query.type = filters.type;
    if (filters.fileType) query.fileType = filters.fileType;
    if (filters.isFavorite !== undefined) query.isFavorite = filters.isFavorite;
    if (filters.isShared !== undefined) query.isShared = filters.isShared;
    
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    const sort = filters.sortBy || '-createdAt';
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 100;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      FileManager.find(query).sort(sort).skip(skip).limit(limit).populate('sharedWith', 'name email'),
      FileManager.countDocuments(query)
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateItem(id, updateData) {
    const oldItem = await FileManager.findById(id);
    if (!oldItem) throw new Error('Item not found');
    
    const item = await FileManager.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    
    if (oldItem.size !== item.size && item.parentId) {
      const sizeDiff = item.size - oldItem.size;
      await this.updateFolderSize(item.parentId, sizeDiff);
    }
    
    return item;
  }

  async deleteItem(id) {
    const item = await FileManager.findById(id);
    if (!item) throw new Error('Item not found');
    
    if (item.type === 'folder') {
      await FileManager.deleteMany({ parentId: id });
    }
    
    if (item.parentId) {
      await this.updateFolderSize(item.parentId, -item.size);
      await this.updateFolderFileCount(item.parentId, -1);
    }
    
    return await FileManager.findByIdAndDelete(id);
  }

  async moveToTrash(id) {
    const item = await FileManager.findByIdAndUpdate(id, { status: 'trash', deletedAt: new Date() }, { new: true });
    
    if (item.type === 'folder') {
      await FileManager.updateMany({ parentId: id }, { status: 'trash', deletedAt: new Date() });
    }
    
    return item;
  }

  async restoreItem(id) {
    const item = await FileManager.findByIdAndUpdate(id, { status: 'active', deletedAt: null }, { new: true });
    
    if (item.type === 'folder') {
      await FileManager.updateMany({ parentId: id }, { status: 'active', deletedAt: null });
    }
    
    return item;
  }

  async toggleFavorite(id) {
    const item = await FileManager.findById(id);
    if (!item) throw new Error('Item not found');
    
    item.isFavorite = !item.isFavorite;
    return await item.save();
  }

  async shareItem(id, userIds) {
    return await FileManager.findByIdAndUpdate(
      id,
      { isShared: true, $addToSet: { sharedWith: { $each: userIds } } },
      { new: true }
    );
  }

  async unshareItem(id, userIds) {
    const item = await FileManager.findByIdAndUpdate(
      id,
      { $pull: { sharedWith: { $in: userIds } } },
      { new: true }
    );
    
    if (item.sharedWith.length === 0) {
      item.isShared = false;
      await item.save();
    }
    
    return item;
  }

  async moveItem(id, newParentId) {
    const item = await FileManager.findById(id);
    if (!item) throw new Error('Item not found');
    
    if (item.parentId) {
      await this.updateFolderSize(item.parentId, -item.size);
      await this.updateFolderFileCount(item.parentId, -1);
    }
    
    item.parentId = newParentId || null;
    await item.save();
    
    if (newParentId) {
      await this.updateFolderSize(newParentId, item.size);
      await this.updateFolderFileCount(newParentId, 1);
    }
    
    return item;
  }

  async copyItem(id, newParentId) {
    const item = await FileManager.findById(id).lean();
    if (!item) throw new Error('Item not found');
    
    delete item._id;
    delete item.createdAt;
    delete item.updatedAt;
    item.parentId = newParentId || null;
    item.name = `${item.name} (Copy)`;
    
    return await this.createItem(item);
  }

  async updateFolderSize(folderId, sizeDiff) {
    await FileManager.findByIdAndUpdate(folderId, { $inc: { size: sizeDiff } });
    
    const folder = await FileManager.findById(folderId);
    if (folder && folder.parentId) {
      await this.updateFolderSize(folder.parentId, sizeDiff);
    }
  }

  async updateFolderFileCount(folderId, countDiff) {
    await FileManager.findByIdAndUpdate(folderId, { $inc: { fileCount: countDiff } });
  }

  async getStorageInfo(ownerId, institutionId) {
    const query = { status: 'active' };
    if (ownerId) query.ownerId = ownerId;
    if (institutionId) query.institutionId = institutionId;

    const items = await FileManager.find(query);
    const used = items.reduce((sum, item) => sum + item.size, 0);
    const total = 1073741824; // 1GB
    const percentage = (used / total) * 100;

    return { used, total, limit: total, percentage };
  }

  async getStatistics(ownerId, institutionId) {
    const query = { status: 'active' };
    if (ownerId) query.ownerId = ownerId;
    if (institutionId) query.institutionId = institutionId;

    const [folders, files, favorites, shared, byFileType] = await Promise.all([
      FileManager.countDocuments({ ...query, type: 'folder' }),
      FileManager.countDocuments({ ...query, type: 'file' }),
      FileManager.countDocuments({ ...query, isFavorite: true }),
      FileManager.countDocuments({ ...query, isShared: true }),
      FileManager.aggregate([
        { $match: { ...query, type: 'file' } },
        { $group: { _id: '$fileType', count: { $sum: 1 } } }
      ])
    ]);

    return {
      folders,
      files,
      favorites,
      shared,
      byFileType: byFileType.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {})
    };
  }

  async getRecentItems(ownerId, institutionId, days = 7) {
    const query = { status: 'active', updatedAt: { $gte: new Date(Date.now() - days * 86400000) } };
    if (ownerId) query.ownerId = ownerId;
    if (institutionId) query.institutionId = institutionId;

    return await FileManager.find(query).sort('-updatedAt').limit(20);
  }

  async searchItems(searchTerm, ownerId, institutionId) {
    const query = { status: 'active', $text: { $search: searchTerm } };
    if (ownerId) query.ownerId = ownerId;
    if (institutionId) query.institutionId = institutionId;

    return await FileManager.find(query).sort({ score: { $meta: 'textScore' } }).limit(50);
  }

  async bulkDeleteItems(itemIds) {
    const items = await FileManager.find({ _id: { $in: itemIds } });
    
    for (const item of items) {
      if (item.type === 'folder') {
        await FileManager.deleteMany({ parentId: item._id });
      }
      
      if (item.parentId) {
        await this.updateFolderSize(item.parentId, -item.size);
        await this.updateFolderFileCount(item.parentId, -1);
      }
    }
    
    const result = await FileManager.deleteMany({ _id: { $in: itemIds } });
    return result;
  }

  async bulkMoveToTrash(itemIds) {
    const items = await FileManager.find({ _id: { $in: itemIds } });
    
    for (const item of items) {
      if (item.type === 'folder') {
        await FileManager.updateMany({ parentId: item._id }, { status: 'trash', deletedAt: new Date() });
      }
    }
    
    const result = await FileManager.updateMany(
      { _id: { $in: itemIds } },
      { status: 'trash', deletedAt: new Date() }
    );
    return result;
  }

  async exportItems(format = 'json', filters = {}) {
    const query = { status: 'active' };
    
    if (filters.ownerId) query.ownerId = filters.ownerId;
    if (filters.institutionId) query.institutionId = filters.institutionId;
    if (filters.type) query.type = filters.type;

    const items = await FileManager.find(query).populate('sharedWith', 'name email');

    if (format === 'json') {
      return {
        data: items,
        format: 'json',
        exportedAt: new Date()
      };
    } else if (format === 'csv') {
      const headers = ['Name', 'Type', 'Size', 'Created At', 'Owner', 'Shared'];
      const rows = items.map(item => [
        item.name,
        item.type,
        item.size,
        item.createdAt,
        item.ownerId,
        item.isShared ? 'Yes' : 'No'
      ]);

      return {
        data: [headers, ...rows],
        format: 'csv',
        exportedAt: new Date()
      };
    }

    throw new Error('Unsupported export format');
  }
}

export default new FileManagerService();
