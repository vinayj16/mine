import VehicleMaintenance from '../models/VehicleMaintenance.js';
import { Vehicle } from '../models/Transport.js';
import logger from '../utils/logger.js';
import { successResponse, errorResponse, createdResponse } from '../utils/apiResponse.js';

export const getVehicleMaintenances = async (req, res, next) => {
  try {
    logger.info('Fetching vehicle maintenances');
    const { institutionId, vehicleId, status, maintenanceType } = req.query;
    const filter = { isDeleted: false };

    if (institutionId) filter.institutionId = institutionId;
    if (institutionId) filter.institutionId = institutionId;
    if (vehicleId) filter.vehicleId = vehicleId;
    if (status) filter.status = status;
    if (maintenanceType) filter.maintenanceType = maintenanceType;

    const maintenances = await VehicleMaintenance.find(filter)
      .populate('vehicleId', 'registrationNumber model make')
      .populate('assignedTo', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ scheduledDate: -1 });

    return successResponse(res, maintenances, 'Vehicle maintenances fetched successfully');
  } catch (error) {
    logger.error('Error fetching vehicle maintenances:', error);
    next(error);
  }
};

export const getVehicleMaintenanceById = async (req, res, next) => {
  try {
    logger.info('Fetching vehicle maintenance by ID');
    const { id } = req.params;

    const maintenance = await VehicleMaintenance.findOne({ _id: id, isDeleted: false })
      .populate('vehicleId', 'registrationNumber model make')
      .populate('assignedTo', 'name email')
      .populate('approvedBy', 'name email');

    if (!maintenance) {
      return errorResponse(res, 'Vehicle maintenance not found', 404);
    }

    return successResponse(res, maintenance, 'Vehicle maintenance fetched successfully');
  } catch (error) {
    logger.error('Error fetching vehicle maintenance:', error);
    next(error);
  }
};

export const createVehicleMaintenance = async (req, res, next) => {
  try {
    logger.info('Creating vehicle maintenance');
    const {
      vehicleId,
      vehicleNumber,
      maintenanceType,
      description,
      scheduledDate,
      priority,
      cost,
      performedBy,
      serviceProvider,
      partsReplaced,
      odometerReading,
      nextMaintenanceDate,
      notes,
      assignedTo
    } = req.body;

    const institutionId = req.user.institutionId;

    // Validate vehicle exists
    const vehicle = await Vehicle.findOne({ _id: vehicleId, isDeleted: false });
    if (!vehicle) {
      return errorResponse(res, 'Vehicle not found', 404);
    }

    const maintenance = await VehicleMaintenance.create({
      vehicleId,
      vehicleNumber: vehicleNumber || vehicle.vehicleNumber,
      institutionId,
      institutionId,
      maintenanceType,
      description,
      scheduledDate: new Date(scheduledDate),
      priority,
      cost: cost || 0,
      performedBy,
      serviceProvider,
      partsReplaced,
      odometerReading,
      nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : null,
      notes,
      assignedTo,
      metadata: {
        createdBy: req.user._id
      }
    });

    return createdResponse(res, maintenance, 'Vehicle maintenance created successfully');
  } catch (error) {
    logger.error('Error creating vehicle maintenance:', error);
    next(error);
  }
};

export const updateVehicleMaintenance = async (req, res, next) => {
  try {
    logger.info('Updating vehicle maintenance');
    const { id } = req.params;
    const {
      maintenanceType,
      description,
      scheduledDate,
      completedDate,
      status,
      priority,
      cost,
      performedBy,
      serviceProvider,
      partsReplaced,
      odometerReading,
      nextMaintenanceDate,
      notes,
      assignedTo
    } = req.body;

    const maintenance = await VehicleMaintenance.findOne({ _id: id, isDeleted: false });
    if (!maintenance) {
      return errorResponse(res, 'Vehicle maintenance not found', 404);
    }

    // Update fields
    if (maintenanceType) maintenance.maintenanceType = maintenanceType;
    if (description) maintenance.description = description;
    if (scheduledDate) maintenance.scheduledDate = new Date(scheduledDate);
    if (completedDate) maintenance.completedDate = new Date(completedDate);
    if (status) maintenance.status = status;
    if (priority) maintenance.priority = priority;
    if (cost !== undefined) maintenance.cost = cost;
    if (performedBy) maintenance.performedBy = performedBy;
    if (serviceProvider) maintenance.serviceProvider = serviceProvider;
    if (partsReplaced) maintenance.partsReplaced = partsReplaced;
    if (odometerReading !== undefined) maintenance.odometerReading = odometerReading;
    if (nextMaintenanceDate) maintenance.nextMaintenanceDate = new Date(nextMaintenanceDate);
    if (notes) maintenance.notes = notes;
    if (assignedTo) maintenance.assignedTo = assignedTo;

    maintenance.metadata.updatedBy = req.user._id;
    await maintenance.save();

    return successResponse(res, maintenance, 'Vehicle maintenance updated successfully');
  } catch (error) {
    logger.error('Error updating vehicle maintenance:', error);
    next(error);
  }
};

export const deleteVehicleMaintenance = async (req, res, next) => {
  try {
    logger.info('Deleting vehicle maintenance');
    const { id } = req.params;

    const maintenance = await VehicleMaintenance.findOne({ _id: id, isDeleted: false });
    if (!maintenance) {
      return errorResponse(res, 'Vehicle maintenance not found', 404);
    }

    maintenance.isDeleted = true;
    maintenance.metadata.updatedBy = req.user._id;
    await maintenance.save();

    return successResponse(res, null, 'Vehicle maintenance deleted successfully');
  } catch (error) {
    logger.error('Error deleting vehicle maintenance:', error);
    next(error);
  }
};

export const getMaintenanceStats = async (req, res, next) => {
  try {
    logger.info('Fetching maintenance statistics');
    const { institutionId } = req.query;
    const filter = { isDeleted: false };

    if (institutionId) filter.institutionId = institutionId;
    if (institutionId) filter.institutionId = institutionId;

    const total = await VehicleMaintenance.countDocuments(filter);
    const scheduled = await VehicleMaintenance.countDocuments({ ...filter, status: 'scheduled' });
    const inProgress = await VehicleMaintenance.countDocuments({ ...filter, status: 'in-progress' });
    const completed = await VehicleMaintenance.countDocuments({ ...filter, status: 'completed' });
    const pending = await VehicleMaintenance.countDocuments({ ...filter, status: 'pending' });

    const totalCost = await VehicleMaintenance.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$cost' } } }
    ]);

    const stats = {
      total,
      scheduled,
      inProgress,
      completed,
      pending,
      totalCost: totalCost[0]?.total || 0
    };

    return successResponse(res, stats, 'Maintenance statistics fetched successfully');
  } catch (error) {
    logger.error('Error fetching maintenance statistics:', error);
    next(error);
  }
};

export default {
  getVehicleMaintenances,
  getVehicleMaintenanceById,
  createVehicleMaintenance,
  updateVehicleMaintenance,
  deleteVehicleMaintenance,
  getMaintenanceStats
};
