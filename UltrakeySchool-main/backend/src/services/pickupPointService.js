import PickupPoint from '../models/PickupPoint.js';

class PickupPointService {
  async getAllPickupPoints(institutionId, filters = {}) {
    const query = { institutionId, isActive: true };
    
    if (filters.status) query.status = filters.status;
    if (filters.routeId) query.routeId = filters.routeId;
    
    const pickupPoints = await PickupPoint.find(query)
      .populate('routeId', 'name')
      .sort({ createdAt: -1 });
    
    return pickupPoints;
  }

  async getPickupPointById(id, institutionId) {
    const pickupPoint = await PickupPoint.findOne({ 
      _id: id, 
      institutionId, 
      isActive: true 
    }).populate('routeId');
    
    if (!pickupPoint) {
      throw new Error('Pickup point not found');
    }
    
    return pickupPoint;
  }

  async createPickupPoint(institutionId, data) {
    const pickupPoint = await PickupPoint.create({
      institutionId,
      ...data
    });
    
    return await this.getPickupPointById(pickupPoint._id, institutionId);
  }

  async updatePickupPoint(id, institutionId, data) {
    const pickupPoint = await PickupPoint.findOneAndUpdate(
      { _id: id, institutionId, isActive: true },
      { $set: data },
      { new: true, runValidators: true }
    ).populate('routeId');
    
    if (!pickupPoint) {
      throw new Error('Pickup point not found');
    }
    
    return pickupPoint;
  }

  async deletePickupPoint(id, institutionId) {
    const pickupPoint = await PickupPoint.findOneAndUpdate(
      { _id: id, institutionId, isActive: true },
      { isActive: false },
      { new: true }
    );
    
    if (!pickupPoint) {
      throw new Error('Pickup point not found');
    }
    
    return pickupPoint;
  }

  async bulkDeletePickupPoints(ids, institutionId) {
    const result = await PickupPoint.updateMany(
      { _id: { $in: ids }, institutionId, isActive: true },
      { isActive: false }
    );
    
    return result;
  }

  async getPickupPointsByRoute(routeId, institutionId) {
    return await PickupPoint.find({ 
      routeId, 
      institutionId, 
      isActive: true 
    }).sort({ name: 1 });
  }
}

export default new PickupPointService();
