import ReportTemplate from '../models/reportTemplate.js';
import ScheduledReport from '../models/scheduledReport.js';
import jobService from './jobService.js';
import attendanceService from './attendanceService.js';
import feeService from './feeService.js';
import Student from '../models/Student.js';
import mongoose from 'mongoose';

class ScheduledReportService {
  async createTemplate(data) {
    return ReportTemplate.create(data);
  }

  async listTemplates(institutionId) {
    return ReportTemplate.find({ institution: institutionId }).sort({ createdAt: -1 });
  }

  async prepareSchedule(payload) {
    const scheduleDoc = await ScheduledReport.create(payload);

    await jobService.addReportJob('scheduled_report',
      { scheduleId: scheduleDoc._id.toString() },
      {
        repeat: {
          cron: payload.schedule.cron,
          tz: payload.schedule.timezone || 'UTC'
        },
        jobId: scheduled_report_
      }
    );

    return scheduleDoc;
  }

  async listSchedules(institutionId) {
    return ScheduledReport.find({ institution: institutionId })
      .populate('template')
      .sort({ createdAt: -1 });
  }

  async runScheduledReport(scheduleId) {
    const schedule = await ScheduledReport.findById(scheduleId).populate('template');
    if (!schedule) {
      throw new Error('Scheduled report not found');
    }

    if (schedule.status !== 'active') {
      throw new Error('Scheduled report is not active');
    }

    const payload = await this.generateReportPayload(schedule.template, {
      institutionId: schedule.institution,
      params: schedule.params
    });

    schedule.lastRunAt = new Date();
    schedule.lastRunResult = payload ? 'success' : 'empty';
    await schedule.save();

    return payload;
  }

  async generateReportPayload(template, context) {
    if (!template) {
      throw new Error('Report template missing');
    }

    switch (template.reportType) {
      case 'attendance': {
        const attendance = await attendanceService.getBulkAttendance(
          context.institutionId,
          'student',
          new Date()
        );

        const totalStudents = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;
        const summary = {
          totalStudents,
          present,
          absent: attendance.filter(a => a.status === 'absent').length,
          percentage: totalStudents > 0 ? parseFloat(((present / totalStudents) * 100).toFixed(2)) : 0
        };

        return { type: 'attendance', summary, records: attendance.slice(0, 50) };
      }
      case 'fees': {
        const period = template.parameters?.period || context.params?.period || 'monthly';
        const format = template.format || context.params?.format || 'summary';
        const feesReport = await feeService.getFeesReport(context.institutionId, period, format);
        return { type: 'fees', period, format, report: feesReport };
      }
      case 'student_summary': {
        const students = await Student.find({ schoolId: context.institutionId })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('firstName lastName classId rollNumber');

        return {
          type: 'student_summary',
          students: students.map(student => ({
            id: student._id,
            name: `${student.firstName}`.trim(),
            classId: student.classId,
            rollNumber: student.rollNumber
          }))
        };
      }
      default:
        return {
          type: 'custom',
          message: 'Custom report type does not have a preview yet',
          metadata: template.parameters
        };
    }
  }
}

export default new ScheduledReportService();
