import TransportAssignment from '../models/TransportAssignment.js';

class TransportAssignmentService {
  async getAllAssignments(institutionId, filters = {}) {
    // Support both institutionId and tenant (from our generated data)
    const query = {
      $or: [
        { institutionId: institutionId },
        { tenant: institutionId }
      ],
      isActive: { $ne: false }
    };
    
    if (filters.routeId) query.routeId = filters.routeId;
    if (filters.pickupPointId) query.pickupPointId = filters.pickupPointId;
    if (filters.vehicleId) query.vehicleId = filters.vehicleId;
    if (filters.driverId) query.driverId = filters.driverId;
    
    if (filters.status) {
      if (filters.status === 'active') {
        query.status = { $in: ['Active', 'active'] };
      } else if (filters.status === 'inactive') {
        query.status = { $in: ['Inactive', 'inactive'] };
      }
    }
    
    if (filters.academicYear) query.academicYear = filters.academicYear;
    
    const assignments = await TransportAssignment.find(query)
      .sort({ createdAt: -1 });
    
    // Transform to match frontend expected format
    return assignments.map(assignment => ({
      _id: assignment._id,
      route: assignment.routeId?._id || assignment.routeId || assignment.routeName || 'N/A',
      routeName: assignment.routeId?.name || assignment.routeName || 'Route',
      pickupPoint: assignment.pickupPointId?._id || assignment.pickupPointId || assignment.pickupPoint || 'N/A',
      pickupTime: assignment.pickupTime || '07:30 AM',
      vehicleNumber: assignment.vehicleId?.vehicleNumber || assignment.vehicleId || assignment.vehicle?.number || 'N/A',
      driver: {
        name: assignment.driverId?.name || assignment.driver?.name || 'Unassigned',
        contact: assignment.driverId?.phone || assignment.driver?.phone || 'N/A'
      },
      status: assignment.status || 'Active',
      studentId: assignment.studentId,
      studentName: assignment.studentName,
      createdAt: assignment.createdAt
    }));
  }

  async getAssignmentById(id, institutionId) {
    const assignment = await TransportAssignment.findOne({ 
      _id: id, 
      $or: [
        { institutionId: institutionId },
        { tenant: institutionId }
      ]
    });
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    
    return assignment;
  }

  async createAssignment(institutionId, data) {
    const assignmentData = {
      institutionId,
      routeId: data.routeId || data.route,
      pickupPointId: data.pickupPointId || data.pickupPoint,
      vehicleId: data.vehicleId || data.vehicleId,
      driverId: data.driverId || data.driver?._id,
      academicYear: data.academicYear || '2025-2026',
      status: 'Active',
      isActive: true,
      studentId: data.studentId,
      studentName: data.studentName,
      pickupPoint: data.pickupPoint,
      pickupTime: data.pickupTime
    };

    const assignment = await TransportAssignment.create(assignmentData);
    
    return {
      _id: assignment._id,
      route: assignment.routeId,
      routeName: data.routeName || 'Route',
      pickupPoint: assignment.pickupPointId || assignment.pickupPoint,
      pickupTime: assignment.pickupTime || '07:30 AM',
      vehicleNumber: data.vehicleNumber || 'N/A',
      driver: { name: data.driverName || 'Unassigned', contact: data.driverContact || '' },
      status: assignment.status,
      createdAt: assignment.createdAt
    };
  }

  async updateAssignment(id, institutionId, data) {
    const updateData = { ...data };
    if (data.status) updateData.status = data.status;
    
    const assignment = await TransportAssignment.findOneAndUpdate(
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
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    
    return assignment;
  }

  async deleteAssignment(id, institutionId) {
    const assignment = await TransportAssignment.findOneAndUpdate(
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
