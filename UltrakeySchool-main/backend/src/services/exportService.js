import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import DataExportRequest from '../models/DataExportRequest.js';
import Student from '../models/Student.js';
import StudentResult from '../models/StudentResult.js';
import StudentAttendance from '../models/StudentAttendance.js';
import Fee from '../models/Fee.js';
import Notification from '../models/Notification.js';
import storageService from './storageService.js';
import logger from '../utils/logger.js';

const RECORD_LIMIT = Math.min(parseInt(process.env.EXPORT_RECORD_LIMIT, 10) || 800, 2000);
const EXPORT_FOLDER = process.env.EXPORT_FOLDER || 'exports';

const applyFilters = (base, filters, allowedFields = []) => {
  const query = { ...base };
  if (!filters || typeof filters !== 'object') {
    return query;
  }

  allowedFields.forEach((field) => {
    if (filters[field] !== undefined && filters[field] !== null) {
      query[field] = filters[field];
    }
  });

  return query;
};

const formatLimit = (filters) => {
  if (!filters || typeof filters !== 'object') {
    return RECORD_LIMIT;
  }
  const requested = parseInt(filters.limit, 10);
  if (Number.isNaN(requested)) {
    return RECORD_LIMIT;
  }
  return Math.min(requested, RECORD_LIMIT);
};

const flattenValue = (value) => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(flattenValue).join('; ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const convertRecordsToCsv = (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return '';
  }

  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const header = keys.join(',');

  const lines = rows.map((row) => {
    return keys
      .map((key) => {
        const raw = flattenValue(row[key]);
        const escaped = raw.replace(/"/g, '""').replace(/\n/g, ' ');
        return `"${escaped}"`;
      })
      .join(',');
  });

  return [header, ...lines].join('\n');
};

const buildCsvPayload = (datasets) => {
  const sections = Object.entries(datasets).map(([label, rows]) => {
    const header = `Dataset: ${label} - ${rows.length} records`;
    const body = convertRecordsToCsv(rows);
    return `${header}\n${body || 'No records available'}\n`;
  });
  return Buffer.from(sections.join('\n'), 'utf-8');
};

const buildExcelPayload = async (datasets) => {
  const workbook = new ExcelJS.Workbook();

  Object.entries(datasets).forEach(([label, rows]) => {
    const sheetName = label.substring(0, 30) || 'Export';
    const worksheet = workbook.addWorksheet(sheetName);

    if (!rows || rows.length === 0) {
      worksheet.addRow(['No records available']);
      return;
    }

    const keys = Array.from(new Set(rows.flatMap((record) => Object.keys(record))));
    worksheet.addRow(keys);

    rows.forEach((record) => {
      const row = keys.map((key) => flattenValue(record[key]));
      worksheet.addRow(row);
    });

    worksheet.columns.forEach((column, index) => {
      const sampleHeader = keys[index] || '';
      column.width = Math.min(Math.max(sampleHeader.length + 5, 10), 60);
    });
  });

  return workbook.xlsx.writeBuffer();
};

const buildPdfPayload = (datasets) =>
  new Promise((resolve, reject) => {
    const buffers = [];
    const doc = new PDFDocument({ autoFirstPage: false });

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.addPage();
    doc.fontSize(20).text('Data Export', { align: 'center' });
    doc.moveDown();

    Object.entries(datasets).forEach(([label, rows]) => {
      doc.addPage();
      doc.fontSize(14).text(`${label.toUpperCase()} (${rows.length} records)`, {
        underline: true
      });
      doc.moveDown(0.5);

      if (!rows || rows.length === 0) {
        doc.fontSize(10).text('No records available');
      } else {
        rows.slice(0, 15).forEach((row) => {
          doc.fontSize(9).text(JSON.stringify(row));
          doc.moveDown(0.3);
        });
        if (rows.length > 15) {
          doc.fontSize(9).text(`...and ${rows.length - 15} more records`);
        }
      }

      doc.moveDown();
    });

    doc.end();
  });

const buildExportPayload = async (datasets, format) => {
  switch (format) {
    case 'csv':
      return {
        buffer: buildCsvPayload(datasets),
        extension: 'csv',
        mimetype: 'text/csv'
      };
    case 'pdf': {
      const buffer = await buildPdfPayload(datasets);
      return {
        buffer,
        extension: 'pdf',
        mimetype: 'application/pdf'
      };
    }
    case 'xlsx': {
      const buffer = await buildExcelPayload(datasets);
      return {
        buffer,
        extension: 'xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    }
    default:
      return {
        buffer: Buffer.from(JSON.stringify(datasets, null, 2), 'utf-8'),
        extension: 'json',
        mimetype: 'application/json'
      };
  }
};

const uploadExportFile = async (request, payload) => {
  const fileName = `data_export_${request._id}_${Date.now()}.${payload.extension}`;
  const uploadResult = await storageService.uploadFile(
    {
      buffer: payload.buffer,
      originalname: fileName,
      mimetype: payload.mimetype,
      size: payload.buffer.length
    },
      {
        folder: EXPORT_FOLDER,
        fileName,
        institutionId: request.institutionId,
        isPublic: false,
        processImage: false
      }
    );

  if (!uploadResult.success) {
    throw new Error(uploadResult.error || 'Export upload failed');
  }

  return uploadResult.file;
};

const DATA_FETCHERS = {
  personal: async (request, filters) => {
    const baseQuery = {};
    if (request.schoolId) {
      baseQuery.schoolId = request.schoolId;
    }
    const query = applyFilters(baseQuery, filters, ['classId', 'sectionId', 'status', 'academicYear']);
    return Student.find(query)
      .select('admissionNumber rollNumber firstName lastName email phone classId sectionId academicYear status')
      .lean()
      .limit(formatLimit(filters));
  },
  academic: async (request, filters) => {
    const baseQuery = {};
    if (request.schoolId) {
      baseQuery.schoolId = request.schoolId;
    }
    const query = applyFilters(baseQuery, filters, ['classId', 'academicYear', 'term', 'status']);
    return StudentResult.find(query)
      .select('studentId examId classId academicYear term overallGrade percentage subjects')
      .lean()
      .limit(formatLimit(filters));
  },
  financial: async (request, filters) => {
    const baseQuery = {};
    if (request.schoolId) {
      baseQuery.schoolId = request.schoolId;
    }
    const query = applyFilters(baseQuery, filters, ['status', 'feeType', 'academicYear', 'month', 'year']);
    return Fee.find(query)
      .select('studentId feeType amount dueDate status paidAmount remainingAmount academicYear term year month')
      .lean()
      .limit(formatLimit(filters));
  },
  attendance: async (request, filters) => {
    const baseQuery = {};
    if (request.institutionId) {
      baseQuery.institutionId = request.institutionId;
    }
    if (filters && (filters.startDate || filters.endDate)) {
      baseQuery.date = {};
      if (filters.startDate) baseQuery.date.$gte = new Date(filters.startDate);
      if (filters.endDate) baseQuery.date.$lte = new Date(filters.endDate);
    }
    const query = applyFilters(baseQuery, filters, ['className', 'section', 'attendance']);
    return StudentAttendance.find(query)
      .select('studentId studentName className section date attendance markedByName period subject notes')
      .lean()
      .limit(formatLimit(filters));
  },
  communication: async (request, filters) => {
    const baseQuery = {};
    if (request.schoolId) {
      baseQuery.schoolId = request.schoolId;
    }
    const query = applyFilters(baseQuery, filters, ['type', 'isRead']);
    return Notification.find(query)
      .select('recipientId type title message isRead createdAt')
      .lean()
      .limit(formatLimit(filters));
  }
};

const normalizeRequestedData = (items = []) => {
  const normalized = new Set();
  const available = Object.keys(DATA_FETCHERS);

  items.forEach((item) => {
    if (!item) return;
    if (item === 'all') {
      available.forEach((type) => normalized.add(type));
    } else if (available.includes(item)) {
      normalized.add(item);
    }
  });

  if (normalized.size === 0) {
    normalized.add('personal');
  }

  return Array.from(normalized);
};

class ExportService {
  async processExport(requestId) {
    const request = await DataExportRequest.findById(requestId);
    if (!request) {
      throw new Error('Export request not found');
    }

    if (request.status === 'completed') {
      return request;
    }

    await DataExportRequest.findByIdAndUpdate(request._id, { status: 'processing' });

    try {
      const datasets = {};
      const requestedData = normalizeRequestedData(request.requestedData);

      for (const type of requestedData) {
        const fetcher = DATA_FETCHERS[type];
        if (!fetcher) continue;
        const typeFilters = (request.filters && request.filters[type]) || request.filters;
        try {
          const result = await fetcher(request, typeFilters);
          datasets[type] = result || [];
        } catch (error) {
          logger.error(`Failed to fetch dataset ${type}`, {
            requestId,
            error: error.message
          });
        }
      }

      if (Object.keys(datasets).length === 0) {
        throw new Error('No datasets were fetched for export');
      }

      const payload = await buildExportPayload(datasets, request.format);
      const file = await uploadExportFile(request, payload);

      return DataExportRequest.findByIdAndUpdate(
        requestId,
        {
          status: 'completed',
          fileUrl: file.url,
          processedAt: new Date(),
          processedBy: request.userId,
          exports: {
            datasets: requestedData,
            fileKey: file.key
          }
        },
        { new: true }
      );
    } catch (error) {
      await DataExportRequest.findByIdAndUpdate(requestId, {
        status: 'failed',
        reason: error.message
      });
      throw error;
    }
  }
}

export default new ExportService();
