import Institution from '../models/Institution.js';

class TenantService {
  async getTenants(options = {}) {
    const { page = 1, limit = 20, search, status } = options;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const [tenants, total] = await Promise.all([
      Institution.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Institution.countDocuments(query)
    ]);
    
    return {
      data: tenants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async createTenant(tenantData) {
    const tenant = await Institution.create(tenantData);
    return tenant;
  }

  async getTenantById(tenantId) {
    const tenant = await Institution.findById(tenantId);
    
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    
    return tenant;
  }

  async updateTenant(tenantId, updateData) {
    const tenant = await Institution.findByIdAndUpdate(
      tenantId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    
    return tenant;
  }

  async deleteTenant(tenantId) {
    const tenant = await Institution.findByIdAndUpdate(
      tenantId,
      { $set: { isActive: false, status: 'inactive' } },
      { new: true }
    );
    
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    
    return tenant;
  }
}

export default new TenantService();
