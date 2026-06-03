import mongoose from 'mongoose';
import TransportRoute from '../models/TransportRoute.js';

class TransportRouteService {
  async getAllRoutes(institutionId, filters = {}) {
    let query = {};
    
    // If institutionId is provided, filter by it
    if (institutionId) {
      // Check if it's a valid ObjectId or string
      const isValidObjectId = mongoose.Types.ObjectId.isValid(institutionId);
      
      if (isValidObjectId) {
        query = {
          $or: [
            { institutionId: institutionId },
            { tenant: institutionId }
          ],
          isActive: { $ne: false }
        };
      } else {
        // If not valid ObjectId, try as string (for some cases)
        query = {
          $or: [
            { institutionId: institutionId },
            { tenant: institutionId }
          ],
          isActive: { $ne: false }
        };
      }
    } else {
      // Get all active routes
      query = { isActive: { $ne: false } };
    }
    
    // Map frontend status to our data format
    if (filters.status) {
      if (filters.status === 'active') {
        query.status = { $in: ['Active', 'active'] };
      } else if (filters.status === 'inactive') {
        query.status = { $in: ['Inactive', 'inactive'] };
      }
    }
    
    // Support both name and routeName (from generated data)
    if (filters.name) {
      query.$or = [
        { name: { $regex: filters.name, $options: 'i' } },
        { routeName: { $regex: filters.name, $options: 'i' } }
      ];
    }
    
    const routes = await TransportRoute.find(query).sort({ createdAt: -1 });
    
    // Transform routes to match frontend expected format
    return routes.map(route => ({
      _id: route._id,
      name: route.name || route.routeName || 'Unnamed Route',
      description: route.description || `Route from ${route.startPoint || 'Start'} to ${route.endPoint || 'End'}`,
      startTime: route.startTime || '07:00',
      endTime: route.endTime || '08:30',
      stops: route.stops?.length || 0,
      status: route.status?.toLowerCase() || 'active',
      vehicle: route.vehicle,
      driver: route.driver,
      startPoint: route.startPoint,
      endPoint: route.endPoint,
      distance: route.distance,
      fare: route.fare,
      createdAt: route.createdAt
    }));
  }

  async getRouteById(id, institutionId) {
    const route = await TransportRoute.findOne({ 
      _id: id, 
      $or: [
        { institutionId: institutionId },
        { tenant: institutionId }
      ]
    });
    
    if (!route) {
      throw new Error('Route not found');
    }
    
    return route;
  }

  async createRoute(institutionId, data) {
    const routeData = {
      institutionId,
      name: data.name || data.routeName,
      startPoint: data.startPoint || 'Start Point',
      endPoint: data.endPoint || 'End Point',
      distance: data.distance || 0,
      estimatedTime: data.estimatedTime || 30,
      status: data.status || 'Active',
      isActive: true
    };
    
    const route = await TransportRoute.create(routeData);
    
    return route;
  }

  async updateRoute(id, institutionId, data) {
    const updateData = { ...data };
    if (data.name) updateData.name = data.name;
    if (data.status) updateData.status = data.status;
    
    const route = await TransportRoute.findOneAndUpdate(
      { 
        _id: id, 
        $or: [
          { institutionId: institutionId },
          { tenant: institutionId }
        ]
      },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!route) {
      throw new Error('Route not found');
    }
    
    return route;
  }

  async deleteRoute(id, institutionId) {
    const route = await TransportRoute.findOneAndUpdate(
      { 
        _id: id, 
        $or: [
          { institutionId: institutionId },
          { tenant: institutionId }
        ]
      },
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
