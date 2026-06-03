import mongoose from 'mongoose';
import TransportReport from '../models/TransportReport.js';
import TransportAssignment from '../models/TransportAssignment.js';
import { StudentTransport, TransportRoute, Vehicle } from '../models/Transport.js';
import Driver from '../models/Driver.js';

class TransportReportService {
  async getAllReports(institutionId, filters = {}) {
    try {
      const query = { 
        $or: [
          { institutionId: institutionId },
          { tenant: institutionId }
        ],
        isActive: true 
      };
      
      if (filters.reportType) query.reportType = filters.reportType;
      if (filters.status) query.status = filters.status;
      if (filters.period) query.period = filters.period;
      
      const reports = await TransportReport.find(query)
        .sort({ generatedDate: -1 });
      
      return reports;
    } catch (error) {
      console.error('Error in getAllReports:', error);
      return [];
    }
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
    try {
      console.log('Generating report in service with institutionId:', institutionId);
      console.log('Report data:', JSON.stringify(data, null, 2));

      // Ensure institutionId is an ObjectId
      const id = typeof institutionId === 'string' ? new mongoose.Types.ObjectId(institutionId) : institutionId;

      const report = await TransportReport.create({
        institutionId: id,
        ...data,
        generatedDate: data.generatedDate || new Date()
      });
      
      console.log('Report created successfully:', report._id);
      return report;
    } catch (error) {
      console.error('Error creating transport report in service:', error);
      throw new Error('Failed to create report: ' + error.message);
    }
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
    try {
      // Handle different field names across models
      const routeQuery = { $or: [{ tenant: institutionId }, { institutionId: institutionId }], status: 'Active' };
      const vehicleQuery = { $or: [{ tenant: institutionId }, { institutionId: institutionId }], status: { $in: ['Active', 'active'] } };
      const studentQuery = { $or: [{ tenant: institutionId }, { institutionId: institutionId }], status: 'Active' };
      const assignmentQuery = { $or: [{ tenant: institutionId }, { institutionId: institutionId }], isActive: true };
      
      const [
        totalRoutes,
        activeVehicles,
        totalStudents,
        totalAssignments
      ] = await Promise.all([
        TransportRoute.countDocuments(routeQuery).catch(() => 0),
        Vehicle.countDocuments(vehicleQuery).catch(() => 0),
        StudentTransport.countDocuments(studentQuery).catch(() => 0),
        TransportAssignment.countDocuments(assignmentQuery).catch(() => 0)
      ]);
      
      return {
        totalRoutes,
        totalVehicles: activeVehicles,
        totalStudents,
        activeAssignments: totalAssignments || totalStudents,
        byRoute: [],
        byVehicle: []
      };
    } catch (error) {
      console.error('Error in getTransportStatistics:', error);
      return {
        totalRoutes: 0,
        totalVehicles: 0,
        totalStudents: 0,
        activeAssignments: 0,
        byRoute: [],
        byVehicle: []
      };
    }
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
