import TransportAssignment from '../models/TransportAssignment.js';

class TransportAssignmentService {
  async getAllAssignments(institutionId, filters = {}) {
    const query = { institutionId, isActive: true };
    
    if (filters.routeId) query.routeId = filters.routeId;
    if (filters.pickupPointId) query.pickupPointId = filters.pickupPointId;
    if (filters.vehicleId) query.vehicleId = filters.vehicleId;
    if (filters.driverId) query.driverId = filters.driverId;
    if (filters.status) query.status = filters.status;
    if (filters.academicYear) query.academicYear = filters.academicYear;
    
    const assignments = await TransportAssignment.find(query)
      .populate('routeId', 'name startPoint endPoint')
      .populate('pickupPointId', 'name address location')
      .populate('vehicleId', 'vehicleNumber registrationNumber type capacity')
      .populate('driverId', 'name phone email licenseNumber')
      .sort({ createdAt: -1 });
    
    return assignments;
  }

  async getAssignmentById(id, institutionId) {
    const assignment = await TransportAssignment.findOne({ 
      _id: id, 
      institutionId, 
      isActive: true 
    })
      .populate('routeId')
      .populate('pickupPointId')
      .populate('vehicleId')
      .populate('driverId');
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    
    return assignment;
  }

  async createAssignment(institutionId, data) {
    const existingAssignment = await TransportAssignment.findOne({
      institutionId,
      routeId: data.routeId,
      pickupPointId: data.pickupPointId,
      vehicleId: data.vehicleId,
      academicYear: data.academicYear,
      isActive: true
    });

    if (existingAssignment) {
      throw new Error('This vehicle is already assigned to this route and pickup point');
    }

    const assignment = await TransportAssignment.create({
      institutionId,
      ...data
    });
    
    return await this.getAssignmentById(assignment._id, institutionId);
  }

  async updateAssignment(id, institutionId, data) {
    const assignment = await TransportAssignment.findOneAndUpdate(
      { _id: id, institutionId, isActive: true },
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate('routeId')
      .populate('pickupPointId')
      .populate('vehicleId')
      .populate('driverId');
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    
    return assignment;
  }

  async deleteAssignment(id, institutionId) {
    const assignment = await TransportAssignment.findOneAndUpdate(
      { _id: id, institutionId, isActive: true },
      { isActive: false },
      { new: true }
    );
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    
    return assignment;
  }

  async bulkDeleteAssignments(ids, institutionId) {
    const result = await TransportAssignment.updateMany(
      { _id: { $in: ids }, institutionId, isActive: true },
      { isActive: false }
    );
    
    return result;
  }

  async getAssignmentsByRoute(routeId, institutionId) {
    return await TransportAssignment.find({ 
      routeId, 
      institutionId, 
      isActive: true 
    })
      .populate('pickupPointId')
      .populate('vehicleId')
      .populate('driverId');
  }

  async getAssignmentsByVehicle(vehicleId, institutionId) {
    return await TransportAssignment.find({ 
      vehicleId, 
      institutionId, 
      isActive: true 
    })
      .populate('routeId')
      .populate('pickupPointId')
      .populate('driverId');
  }
}

export default new TransportAssignmentService();
