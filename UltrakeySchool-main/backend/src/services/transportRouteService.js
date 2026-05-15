import TransportRoute from '../models/TransportRoute.js';

class TransportRouteService {
  async getAllRoutes(institutionId, filters = {}) {
    const query = { institutionId, isActive: true };
    
    if (filters.status) query.status = filters.status;
    if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
    
    const routes = await TransportRoute.find(query).sort({ createdAt: -1 });
    
    return routes;
  }

  async getRouteById(id, institutionId) {
    const route = await TransportRoute.findOne({ 
      _id: id, 
      institutionId, 
      isActive: true 
    });
    
    if (!route) {
      throw new Error('Route not found');
    }
    
    return route;
  }

  async createRoute(institutionId, data) {
    const route = await TransportRoute.create({
      institutionId,
      ...data
    });
    
    return route;
  }

  async updateRoute(id, institutionId, data) {
    const route = await TransportRoute.findOneAndUpdate(
      { _id: id, institutionId, isActive: true },
      { $set: data },
      { new: true, runValidators: true }
    );
    
    if (!route) {
      throw new Error('Route not found');
    }
    
    return route;
  }

  async deleteRoute(id, institutionId) {
    const route = await TransportRoute.findOneAndUpdate(
      { _id: id, institutionId, isActive: true },
      { isActive: false },
      { new: true }
    );
    
    if (!route) {
      throw new Error('Route not found');
    }
    
    return route;
  }

  async bulkDeleteRoutes(ids, institutionId) {
    const result = await TransportRoute.updateMany(
      { _id: { $in: ids }, institutionId, isActive: true },
      { isActive: false }
    );
    
    return result;
  }

  async getActiveRoutes(institutionId) {
    return await TransportRoute.find({ 
      institutionId, 
      status: 'Active',
      isActive: true 
    }).sort({ name: 1 });
  }
}

export default new TransportRouteService();
