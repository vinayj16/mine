import Organization from '../models/Organization.js';

class OrganizationService {
  async create(data) {
    return await Organization.create(data);
  }

  async findAll(filters = {}) {
    return await Organization.find(filters).sort({ createdAt: -1 });
  }

  async findById(id) {
    const org = await Organization.findById(id);
    if (!org) throw new Error('Organization not found');
    return org;
  }

  async findByCode(code) {
    const org = await Organization.findOne({ code });
    if (!org) throw new Error('Organization not found');
    return org;
  }

  async update(id, updates) {
    const org = await Organization.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!org) throw new Error('Organization not found');
    return org;
  }

  async delete(id) {
    const org = await Organization.findByIdAndDelete(id);
    if (!org) throw new Error('Organization not found');
    return org;
  }

  async updateSubscription(id, plan, startDate, endDate) {
    return await Organization.findByIdAndUpdate(id, {
      subscription: { plan, startDate, endDate }
    }, { new: true });
  }
}

export default new OrganizationService();
