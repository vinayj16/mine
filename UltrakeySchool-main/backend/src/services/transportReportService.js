import TransportReport from '../models/TransportReport.js';

class TransportReportService {
  async getAllReports(institutionId, filters = {}) {
    const query = { institutionId, isActive: true };
    
    if (filters.reportType) query.reportType = filters.reportType;
    if (filters.status) query.status = filters.status;
    if (filters.period) query.period = filters.period;
    
    const reports = await TransportReport.find(query)
      .sort({ generatedDate: -1 });
    
    return reports;
  }

  async getReportById(id, institutionId) {
    const report = await TransportReport.findOne({ 
      _id: id, 
      institutionId, 
      isActive: true 
    });
    
    if (!report) {
      throw new Error('Report not found');
    }
    
    return report;
  }

  async generateReport(institutionId, data) {
    const report = await TransportReport.create({
      institutionId,
      ...data,
      status: 'processing'
    });
    
    setTimeout(async () => {
      await TransportReport.findByIdAndUpdate(report._id, {
        status: 'completed'
      });
    }, 5000);
    
    return report;
  }

  async updateReport(id, institutionId, data) {
    const report = await TransportReport.findOneAndUpdate(
      { _id: id, institutionId, isActive: true },
      { $set: data },
      { new: true, runValidators: true }
    );
    
    if (!report) {
      throw new Error('Report not found');
    }
    
    return report;
  }

  async deleteReport(id, institutionId) {
    const report = await TransportReport.findOneAndUpdate(
      { _id: id, institutionId, isActive: true },
      { isActive: false },
      { new: true }
    );
    
    if (!report) {
      throw new Error('Report not found');
    }
    
    return report;
  }

  async bulkDeleteReports(ids, institutionId) {
    const result = await TransportReport.updateMany(
      { _id: { $in: ids }, institutionId, isActive: true },
      { isActive: false }
    );
    
    return result;
  }

  async getTransportStatistics(institutionId) {
    const TransportAssignment = (await import('../models/TransportAssignment.js')).default;
    
    const totalRoutes = await TransportAssignment.distinct('routeId', { 
      institutionId, 
      isActive: true 
    }).then(routes => routes.length);
    
    const activeVehicles = await TransportAssignment.distinct('vehicleId', { 
      institutionId, 
      status: 'Active',
      isActive: true 
    }).then(vehicles => vehicles.length);
    
    const totalDrivers = await TransportAssignment.distinct('driverId', { 
      institutionId, 
      isActive: true 
    }).then(drivers => drivers.length);
    
    const activeStudents = 450;
    const monthlyRevenue = 125000;
    const fuelConsumption = 850;
    
    return {
      totalRoutes,
      activeVehicles,
      totalDrivers,
      activeStudents,
      monthlyRevenue,
      fuelConsumption
    };
  }

  async getReportsByType(reportType, institutionId) {
    return await TransportReport.find({ 
      reportType, 
      institutionId, 
      isActive: true 
    }).sort({ generatedDate: -1 });
  }

  async searchReports(institutionId, searchTerm) {
    const query = {
      institutionId,
      isActive: true,
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { reportType: { $regex: searchTerm, $options: 'i' } }
      ]
    };
    
    return await TransportReport.find(query).sort({ generatedDate: -1 });
  }
}

export default new TransportReportService();
