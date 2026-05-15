import Driver from '../models/Driver.js';

class DriverService {
  async getAllDrivers(institutionId, filters = {}) {
    const query = { institutionId, isActive: true };
    
    if (filters.status) query.status = filters.status;
    if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
    
    const drivers = await Driver.find(query).sort({ createdAt: -1 });
    
    return drivers;
  }

  async getDriverById(id, institutionId) {
    const driver = await Driver.findOne({ 
      _id: id, 
      institutionId, 
      isActive: true 
    });
    
    if (!driver) {
      throw new Error('Driver not found');
    }
    
    return driver;
  }

  async createDriver(institutionId, data) {
    const existingDriver = await Driver.findOne({
      licenseNumber: data.licenseNumber,
      isActive: true
    });

    if (existingDriver) {
      throw new Error('Driver with this license number already exists');
    }

    const driver = await Driver.create({
      institutionId,
      ...data
    });
    
    return driver;
  }

  async updateDriver(id, institutionId, data) {
    if (data.licenseNumber) {
      const existingDriver = await Driver.findOne({
        licenseNumber: data.licenseNumber,
        _id: { $ne: id },
        isActive: true
      });

      if (existingDriver) {
        throw new Error('Driver with this license number already exists');
      }
    }

    const driver = await Driver.findOneAndUpdate(
      { _id: id, institutionId, isActive: true },
      { $set: data },
      { new: true, runValidators: true }
    );
    
    if (!driver) {
      throw new Error('Driver not found');
    }
    
    return driver;
  }

  async deleteDriver(id, institutionId) {
    const driver = await Driver.findOneAndUpdate(
      { _id: id, institutionId, isActive: true },
      { isActive: false },
      { new: true }
    );
    
    if (!driver) {
      throw new Error('Driver not found');
    }
    
    return driver;
  }

  async bulkDeleteDrivers(ids, institutionId) {
    const result = await Driver.updateMany(
      { _id: { $in: ids }, institutionId, isActive: true },
      { isActive: false }
    );
    
    return result;
  }

  async getActiveDrivers(institutionId) {
    return await Driver.find({ 
      institutionId, 
      status: 'Active',
      isActive: true 
    }).sort({ name: 1 });
  }

  async searchDrivers(institutionId, searchTerm) {
    const query = {
      institutionId,
      isActive: true,
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
        { licenseNumber: { $regex: searchTerm, $options: 'i' } }
      ]
    };
    
    return await Driver.find(query).sort({ name: 1 });
  }

  async getDriverStatistics(institutionId) {
    const totalDrivers = await Driver.countDocuments({
      institutionId,
      isActive: true
    });

    const activeDrivers = await Driver.countDocuments({
      institutionId,
      status: 'Active',
      isActive: true
    });

    const inactiveDrivers = await Driver.countDocuments({
      institutionId,
      status: 'Inactive',
      isActive: true
    });

    return {
      totalDrivers,
      activeDrivers,
      inactiveDrivers
    };
  }

  async getDriversWithExpiringLicenses(institutionId, days = 30) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const drivers = await Driver.find({
      institutionId,
      isActive: true,
      licenseExpiryDate: { $lte: expiryDate }
    }).sort({ licenseExpiryDate: 1 });

    return drivers;
  }

  async assignDriverToVehicle(driverId, vehicleId, institutionId) {
    const driver = await Driver.findOneAndUpdate(
      { _id: driverId, institutionId, isActive: true },
      { assignedVehicle: vehicleId },
      { new: true, runValidators: true }
    );

    if (!driver) {
      throw new Error('Driver not found');
    }

    return driver;
  }

  async exportDrivers(institutionId, format = 'json') {
    const drivers = await Driver.find({
      institutionId,
      isActive: true
    }).sort({ name: 1 });

    if (format === 'json') {
      return {
        data: drivers,
        format: 'json',
        exportedAt: new Date()
      };
    } else if (format === 'csv') {
      const headers = ['Name', 'License Number', 'Phone', 'Status', 'License Expiry'];
      const rows = drivers.map(driver => [
        driver.name,
        driver.licenseNumber,
        driver.phone,
        driver.status,
        driver.licenseExpiry
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

export default new DriverService();
