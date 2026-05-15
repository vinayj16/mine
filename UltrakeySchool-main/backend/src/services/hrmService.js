import Staff from '../models/Staff.js';
import Department from '../models/Department.js';
import Designation from '../models/Designation.js';
import Leave from '../models/Leave.js';

class HRMService {
  // Staff Management
  async createStaff(data) {
    const staff = new Staff(data);
    return await staff.save();
  }

  async getAllStaff(filters = {}) {
    const query = {};
    
    if (filters.department) query.department = filters.department;
    if (filters.designation) query.designation = filters.designation;
    if (filters.employmentStatus) query.employmentStatus = filters.employmentStatus;
    if (filters.employeeType) query.employeeType = filters.employeeType;

    return await Staff.find(query).sort({ createdAt: -1 });
  }

  async getStaffById(id) {
    return await Staff.findOne({ staffId: id });
  }

  async updateStaff(id, data) {
    return await Staff.findOneAndUpdate(
      { staffId: id },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async deleteStaff(id) {
    return await Staff.findOneAndDelete({ staffId: id });
  }

  async searchStaff(query) {
    const searchRegex = new RegExp(query, 'i');
    return await Staff.find({
      $or: [
        { fullName: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex }
      ]
    }).sort({ fullName: 1 });
  }

  async getStaffByDepartment(departmentId) {
    return await Staff.find({ department: departmentId }).sort({ fullName: 1 });
  }

  async getStaffByDesignation(designationId) {
    return await Staff.find({ designation: designationId }).sort({ fullName: 1 });
  }

  async getStaffByStatus(status) {
    return await Staff.find({ employmentStatus: status }).sort({ fullName: 1 });
  }

  async updateSalary(id, salaryData) {
    return await Staff.findOneAndUpdate(
      { staffId: id },
      { $set: { salary: salaryData } },
      { new: true }
    );
  }

  async addAttendance(id, attendanceData) {
    return await Staff.findOneAndUpdate(
      { staffId: id },
      { $push: { attendance: attendanceData } },
      { new: true }
    );
  }

  async updatePerformanceRating(id, rating) {
    return await Staff.findOneAndUpdate(
      { staffId: id },
      { $set: { performanceRating: rating } },
      { new: true }
    );
  }

  // Department Management
  async createDepartment(data) {
    const department = new Department(data);
    return await department.save();
  }

  async getAllDepartments(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    return await Department.find(query).sort({ name: 1 });
  }

  async getDepartmentById(id) {
    return await Department.findOne({ departmentId: id });
  }

  async updateDepartment(id, data) {
    return await Department.findOneAndUpdate(
      { departmentId: id },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async deleteDepartment(id) {
    return await Department.findOneAndDelete({ departmentId: id });
  }

  // Designation Management
  async createDesignation(data) {
    const designation = new Designation(data);
    return await designation.save();
  }

  async getAllDesignations(filters = {}) {
    const query = {};
    if (filters.department) query.department = filters.department;
    if (filters.status) query.status = filters.status;
    return await Designation.find(query).sort({ level: 1 });
  }

  async getDesignationById(id) {
    return await Designation.findOne({ designationId: id });
  }

  async updateDesignation(id, data) {
    return await Designation.findOneAndUpdate(
      { designationId: id },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async deleteDesignation(id) {
    return await Designation.findOneAndDelete({ designationId: id });
  }

  // Leave Management
  async createLeave(data) {
    const leave = new Leave(data);
    return await leave.save();
  }

  async getAllLeaves(filters = {}) {
    const query = {};
    if (filters.staffId) query.staffId = filters.staffId;
    if (filters.status) query.status = filters.status;
    if (filters.leaveType) query.leaveType = filters.leaveType;
    return await Leave.find(query).sort({ appliedOn: -1 });
  }

  async getLeaveById(id) {
    return await Leave.findOne({ leaveId: id });
  }

  async updateLeave(id, data) {
    return await Leave.findOneAndUpdate(
      { leaveId: id },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async deleteLeave(id) {
    return await Leave.findOneAndDelete({ leaveId: id });
  }

  async approveLeave(id, approvedBy) {
    return await Leave.findOneAndUpdate(
      { leaveId: id },
      { 
        $set: { 
          status: 'approved',
          approvedBy,
          approvedOn: new Date()
        } 
      },
      { new: true }
    );
  }

  async rejectLeave(id, approvedBy, comments) {
    return await Leave.findOneAndUpdate(
      { leaveId: id },
      { 
        $set: { 
          status: 'rejected',
          approvedBy,
          approvedOn: new Date(),
          comments
        } 
      },
      { new: true }
    );
  }

  async getPendingLeaves() {
    return await Leave.find({ status: 'pending' }).sort({ appliedOn: 1 });
  }

  async getLeavesByStaffId(staffId) {
    return await Leave.find({ staffId }).sort({ startDate: -1 });
  }

  // Analytics & Reports
  async getHRMStats() {
    const totalStaff = await Staff.countDocuments();
    const activeStaff = await Staff.countDocuments({ employmentStatus: 'active' });
    const departments = await Department.countDocuments();
    const designations = await Designation.countDocuments();
    const totalLeaves = await Leave.countDocuments();
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
    const approvedLeaves = await Leave.countDocuments({ status: 'approved' });

    const byEmploymentType = {
      permanent: await Staff.countDocuments({ employeeType: 'permanent' }),
      contract: await Staff.countDocuments({ employeeType: 'contract' }),
      partTime: await Staff.countDocuments({ employeeType: 'part-time' }),
      intern: await Staff.countDocuments({ employeeType: 'intern' })
    };

    const genderDistribution = {
      male: await Staff.countDocuments({ gender: 'male' }),
      female: await Staff.countDocuments({ gender: 'female' }),
      other: await Staff.countDocuments({ gender: 'other' })
    };

    const departmentList = await Department.find({ status: 'active' });
    const byDepartment = departmentList.map(dept => ({
      name: dept.name,
      employeeCount: dept.employeeCount,
      budget: dept.budget
    }));

    return {
      totalStaff,
      activeStaff,
      departments,
      designations,
      totalLeaves,
      pendingLeaves,
      approvedLeaves,
      byEmploymentType,
      genderDistribution,
      byDepartment
    };
  }

  async calculateLeaveBalance(staffId) {
    const staff = await this.getStaffById(staffId);
    if (!staff) return null;

    const baseAnnualLeave = 24;
    const baseCasualLeave = 12;
    const baseSickLeave = 6;

    const staffLeaves = await this.getLeavesByStaffId(staffId);
    const approvedLeaves = staffLeaves.filter(leave => leave.status === 'approved');

    const usedCasual = approvedLeaves
      .filter(leave => leave.leaveType === 'casual')
      .reduce((sum, leave) => sum + leave.days, 0);

    const usedSick = approvedLeaves
      .filter(leave => leave.leaveType === 'sick')
      .reduce((sum, leave) => sum + leave.days, 0);

    const usedAnnual = approvedLeaves
      .filter(leave => leave.leaveType === 'annual')
      .reduce((sum, leave) => sum + leave.days, 0);

    return {
      casual: baseCasualLeave - usedCasual,
      sick: baseSickLeave - usedSick,
      annual: baseAnnualLeave - usedAnnual,
      maternity: staff.gender === 'female' ? 84 : 0,
      paternity: staff.gender === 'male' ? 7 : 0
    };
  }

  async getStaffAttendanceSummary(staffId, month) {
    const staff = await this.getStaffById(staffId);
    if (!staff || !staff.attendance) {
      return { totalDays: 0, presentDays: 0, absentDays: 0, leaveDays: 0, attendancePercentage: 0 };
    }

    const monthAttendance = staff.attendance.filter(att => att.date.startsWith(month));

    const totalDays = monthAttendance.length;
    const presentDays = monthAttendance.filter(att => att.status === 'present').length;
    const absentDays = monthAttendance.filter(att => att.status === 'absent').length;
    const leaveDays = monthAttendance.filter(att => att.status === 'leave').length;

    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      leaveDays,
      attendancePercentage: Math.round(attendancePercentage * 100) / 100
    };
  }

  async getPayrollReport(month) {
    const staff = await Staff.find({ employmentStatus: 'active' });
    
    const payrollData = staff.map(s => ({
      employeeId: s.employeeId,
      fullName: s.fullName,
      department: s.departmentName,
      designation: s.designationName,
      basicSalary: s.salary.basic,
      totalEarnings: s.salary.totalEarnings,
      totalDeductions: s.salary.totalDeductions,
      netSalary: s.salary.netSalary
    }));

    const totalPayroll = payrollData.reduce((sum, p) => sum + p.netSalary, 0);
    const totalEarnings = payrollData.reduce((sum, p) => sum + p.totalEarnings, 0);
    const totalDeductions = payrollData.reduce((sum, p) => sum + p.totalDeductions, 0);

    return {
      month,
      employeeCount: payrollData.length,
      totalPayroll,
      totalEarnings,
      totalDeductions,
      payrollData
    };
  }
}

export default new HRMService();
