import StaffDocument from '../models/StaffDocument.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Validation constants
const VALID_STATUSES = ['pending', 'approved', 'rejected', 'expired', 'archived'];
const VALID_DOCUMENT_TYPES = ['resume', 'certificate', 'id_proof', 'address_proof', 'qualification', 'experience', 'medical', 'police_verification', 'contract', 'other'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const ALLOWED_FILE_TYPES = /pdf|doc|docx|jpg|jpeg|png/;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_NAME_LENGTH = 200;
const MAX_NOTES_LENGTH = 1000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = 'uploads/staff-documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const extname = ALLOWED_FILE_TYPES.test(path.extname(file.originalname).toLowerCase());
    const mimetype = ALLOWED_FILE_TYPES.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed'));
  }
}).single('document');

// Helper function to validate MongoDB ObjectId
const validateObjectId = (id, fieldName = 'ID') => {
  if (!id) {
    return fieldName + ' is required';
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate date
const validateDate = (dateString, fieldName = 'Date') => {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Create staff document
const createStaffDocument = async (req, res) => {
  try {
    logger.info('Creating staff document');
    
    if (!req.file) {
      return validationErrorResponse(res, ['No file uploaded']);
    }
    
    const { staff, documentType, documentName, expiryDate, status, notes } = req.body;
    const userId = req.user?.id;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!staff) {
      errors.push('Staff ID is required');
    } else {
      const staffError = validateObjectId(staff, 'Staff ID');
      if (staffError) errors.push(staffError);
    }
    
    if (!documentType || documentType.trim().length === 0) {
      errors.push('Document type is required');
    } else if (!VALID_DOCUMENT_TYPES.includes(documentType)) {
      errors.push('Invalid document type. Must be one of: ' + VALID_DOCUMENT_TYPES.join(', '));
    }
    
    if (documentName && documentName.length > MAX_NAME_LENGTH) {
      errors.push('Document name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (expiryDate) {
      const dateError = validateDate(expiryDate, 'Expiry date');
      if (dateError) {
        errors.push(dateError);
      } else {
        const expiry = new Date(expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (expiry < today) {
          errors.push('Expiry date cannot be in the past');
        }
      }
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (notes && notes.length > MAX_NOTES_LENGTH) {
      errors.push('Notes must not exceed ' + MAX_NOTES_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      // Clean up uploaded file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return validationErrorResponse(res, errors);
    }
    
    const count = await StaffDocument.countDocuments({ institution: tenantId });
    const documentId = 'DOC' + String(count + 1).padStart(6, '0');
    
    const document = new StaffDocument({
      documentId,
      staff,
      documentType,
      documentName: documentName || req.file.originalname,
      fileName: req.file.filename,
      fileUrl: '/uploads/staff-documents/' + req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      expiryDate: expiryDate || null,
      status: status || 'pending',
      notes: notes || '',
      institution: tenantId,
      uploadedBy: userId
    });
    
    await document.save();
    
    const populatedDoc = await StaffDocument.findById(document._id)
      .populate('staff', 'name email phone avatar')
      .populate('uploadedBy', 'name');
    
    logger.info('Staff document uploaded successfully:', { documentId: document.documentId, staff });
    return createdResponse(res, populatedDoc, 'Document uploaded successfully');
  } catch (error) {
    logger.error('Error creating staff document:', error);
    // Clean up uploaded file if database save fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return errorResponse(res, error.message);
  }
};

// Get document by ID
const getStaffDocumentById = async (req, res) => {
  try {
    logger.info('Fetching staff document by ID');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Document ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const document = await StaffDocument.findOne({
      _id: id,
      institution: tenantId
    })
      .populate('staff', 'name email phone avatar')
      .populate('uploadedBy', 'name');
    
    if (!document) {
      return notFoundResponse(res, 'Document not found');
    }
    
    logger.info('Staff document fetched successfully:', { documentId: id });
    return successResponse(res, document, 'Document retrieved successfully');
  } catch (error) {
    logger.error('Error fetching staff document:', error);
    return errorResponse(res, error.message);
  }
};

// Get all staff documents
const getAllStaffDocuments = async (req, res) => {
  try {
    logger.info('Fetching all staff documents');
    
    const { status, documentType, staff, search, page, limit, sortBy, sortOrder } = req.query;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (documentType && !VALID_DOCUMENT_TYPES.includes(documentType)) {
      errors.push('Invalid document type. Must be one of: ' + VALID_DOCUMENT_TYPES.join(', '));
    }
    
    if (staff) {
      const staffError = validateObjectId(staff, 'Staff ID');
      if (staffError) errors.push(staffError);
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (sortOrder && !VALID_SORT_ORDERS.includes(sortOrder)) {
      errors.push('Invalid sort order. Must be one of: ' + VALID_SORT_ORDERS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { institution: tenantId };
    
    if (status) query.status = status;
    if (documentType) query.documentType = documentType;
    if (staff) query.staff = staff;
    if (search) {
      query.$or = [
        { documentName: { $regex: search, $options: 'i' } },
        { documentId: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (pageNum - 1) * limitNum;
    const sortField = sortBy || 'uploadDate';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortOptions = {};
    sortOptions[sortField] = sortDirection;
    
    const [documents, total] = await Promise.all([
      StaffDocument.find(query)
        .populate('staff', 'name email phone avatar')
        .populate('uploadedBy', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      StaffDocument.countDocuments(query)
    ]);
    
    const pagination = {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum,
      hasNextPage: pageNum < Math.ceil(total / limitNum),
      hasPrevPage: pageNum > 1
    };
    
    logger.info('Staff documents fetched successfully:', { count: documents.length, total });
    return successResponse(res, {
      documents,
      pagination
    }, 'Documents retrieved successfully');
  } catch (error) {
    logger.error('Error fetching staff documents:', error);
    return errorResponse(res, error.message);
  }
};

// Update document details (not the file)
const updateStaffDocument = async (req, res) => {
  try {
    logger.info('Updating staff document');
    
    const { id } = req.params;
    const { documentName, documentType, expiryDate, status, notes } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Document ID');
    if (idError) errors.push(idError);
    
    if (documentName !== undefined) {
      if (!documentName || documentName.trim().length === 0) {
        errors.push('Document name cannot be empty');
      } else if (documentName.length > MAX_NAME_LENGTH) {
        errors.push('Document name must not exceed ' + MAX_NAME_LENGTH + ' characters');
      }
    }
    
    if (documentType !== undefined) {
      if (!documentType || documentType.trim().length === 0) {
        errors.push('Document type cannot be empty');
      } else if (!VALID_DOCUMENT_TYPES.includes(documentType)) {
        errors.push('Invalid document type. Must be one of: ' + VALID_DOCUMENT_TYPES.join(', '));
      }
    }
    
    if (expiryDate !== undefined && expiryDate !== null) {
      const dateError = validateDate(expiryDate, 'Expiry date');
      if (dateError) errors.push(dateError);
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (notes !== undefined && notes.length > MAX_NOTES_LENGTH) {
      errors.push('Notes must not exceed ' + MAX_NOTES_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const allowedUpdates = ['documentName', 'documentType', 'expiryDate', 'status', 'notes'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    const document = await StaffDocument.findOneAndUpdate(
      { _id: id, institution: tenantId },
      updates,
      { new: true, runValidators: true }
    )
      .populate('staff', 'name email phone avatar')
      .populate('uploadedBy', 'name');
    
    if (!document) {
      return notFoundResponse(res, 'Document not found');
    }
    
    logger.info('Staff document updated successfully:', { documentId: id });
    return successResponse(res, document, 'Document updated successfully');
  } catch (error) {
    logger.error('Error updating staff document:', error);
    return errorResponse(res, error.message);
  }
};

// Delete document
const deleteStaffDocument = async (req, res) => {
  try {
    logger.info('Deleting staff document');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Document ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const document = await StaffDocument.findOneAndDelete({
      _id: id,
      institution: tenantId
    });
    
    if (!document) {
      return notFoundResponse(res, 'Document not found');
    }
    
    // Delete physical file
    const filePath = path.join(process.cwd(), 'uploads/staff-documents', document.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    logger.info('Staff document deleted successfully:', { documentId: id });
    return successResponse(res, null, 'Document deleted successfully');
  } catch (error) {
    logger.error('Error deleting staff document:', error);
    return errorResponse(res, error.message);
  }
};

// Download document
const downloadStaffDocument = async (req, res) => {
  try {
    logger.info('Downloading staff document');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Document ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const document = await StaffDocument.findOne({
      _id: id,
      institution: tenantId
    });
    
    if (!document) {
      return notFoundResponse(res, 'Document not found');
    }
    
    const filePath = path.join(process.cwd(), 'uploads/staff-documents', document.fileName);
    
    if (!fs.existsSync(filePath)) {
      return errorResponse(res, 'File not found on server', 404);
    }
    
    logger.info('Staff document downloaded successfully:', { documentId: id });
    res.download(filePath, document.documentName);
  } catch (error) {
    logger.error('Error downloading staff document:', error);
    return errorResponse(res, error.message);
  }
};

// Get documents by status
const getStaffDocumentsByStatus = async (req, res) => {
  try {
    logger.info('Fetching staff documents by status');
    
    const { status } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const documents = await StaffDocument.find({ status, institution: tenantId })
      .populate('staff', 'name email phone avatar')
      .populate('uploadedBy', 'name')
      .sort({ uploadDate: -1 });
    
    logger.info('Staff documents fetched by status successfully:', { status, count: documents.length });
    return successResponse(res, documents, 'Documents retrieved successfully');
  } catch (error) {
    logger.error('Error fetching staff documents by status:', error);
    return errorResponse(res, error.message);
  }
};

// Get documents by staff
const getStaffDocumentsByStaff = async (req, res) => {
  try {
    logger.info('Fetching staff documents by staff');
    
    const { staffId } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const staffIdError = validateObjectId(staffId, 'Staff ID');
    if (staffIdError) errors.push(staffIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const documents = await StaffDocument.find({ staff: staffId, institution: tenantId })
      .populate('staff', 'name email phone avatar')
      .populate('uploadedBy', 'name')
      .sort({ uploadDate: -1 });
    
    logger.info('Staff documents fetched by staff successfully:', { staffId, count: documents.length });
    return successResponse(res, documents, 'Documents retrieved successfully');
  } catch (error) {
    logger.error('Error fetching staff documents by staff:', error);
    return errorResponse(res, error.message);
  }
};

// Get documents by type
const getStaffDocumentsByType = async (req, res) => {
  try {
    logger.info('Fetching staff documents by type');
    
    const { documentType } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!documentType) {
      errors.push('Document type is required');
    } else if (!VALID_DOCUMENT_TYPES.includes(documentType)) {
      errors.push('Invalid document type. Must be one of: ' + VALID_DOCUMENT_TYPES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const documents = await StaffDocument.find({ documentType, institution: tenantId })
      .populate('staff', 'name email phone avatar')
      .populate('uploadedBy', 'name')
      .sort({ uploadDate: -1 });
    
    logger.info('Staff documents fetched by type successfully:', { documentType, count: documents.length });
    return successResponse(res, documents, 'Documents retrieved successfully');
  } catch (error) {
    logger.error('Error fetching staff documents by type:', error);
    return errorResponse(res, error.message);
  }
};

// Update status
const updateStaffDocumentStatus = async (req, res) => {
  try {
    logger.info('Updating staff document status');
    
    const { id } = req.params;
    const { status } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Document ID');
    if (idError) errors.push(idError);
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const document = await StaffDocument.findOneAndUpdate(
      { _id: id, institution: tenantId },
      { status },
      { new: true, runValidators: true }
    )
      .populate('staff', 'name email phone avatar')
      .populate('uploadedBy', 'name');
    
    if (!document) {
      return notFoundResponse(res, 'Document not found');
    }
    
    logger.info('Staff document status updated successfully:', { documentId: id, status });
    return successResponse(res, document, 'Document status updated successfully');
  } catch (error) {
    logger.error('Error updating staff document status:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk update status
const bulkUpdateStaffDocumentStatus = async (req, res) => {
  try {
    logger.info('Bulk updating staff document status');
    
    const { documentIds, status } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!documentIds || !Array.isArray(documentIds)) {
      errors.push('Document IDs must be an array');
    } else if (documentIds.length === 0) {
      errors.push('Document IDs array cannot be empty');
    } else if (documentIds.length > 100) {
      errors.push('Cannot update more than 100 documents at once');
    } else {
      for (const id of documentIds) {
        const idError = validateObjectId(id, 'Document ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await StaffDocument.updateMany(
      { _id: { $in: documentIds }, institution: tenantId },
      { status }
    );
    
    logger.info('Staff document status bulk updated successfully:', { count: result.modifiedCount, status });
    return successResponse(res, { modifiedCount: result.modifiedCount }, 'Documents status updated successfully');
  } catch (error) {
    logger.error('Error bulk updating staff document status:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete documents
const bulkDeleteStaffDocuments = async (req, res) => {
  try {
    logger.info('Bulk deleting staff documents');
    
    const { documentIds } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!documentIds || !Array.isArray(documentIds)) {
      errors.push('Document IDs must be an array');
    } else if (documentIds.length === 0) {
      errors.push('Document IDs array cannot be empty');
    } else if (documentIds.length > 100) {
      errors.push('Cannot delete more than 100 documents at once');
    } else {
      for (const id of documentIds) {
        const idError = validateObjectId(id, 'Document ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const documents = await StaffDocument.find({
      _id: { $in: documentIds },
      institution: tenantId
    });
    
    // Delete physical files
    documents.forEach(doc => {
      const filePath = path.join(process.cwd(), 'uploads/staff-documents', doc.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    
    const result = await StaffDocument.deleteMany({
      _id: { $in: documentIds },
      institution: tenantId
    });
    
    logger.info('Staff documents bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Documents deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting staff documents:', error);
    return errorResponse(res, error.message);
  }
};

// Get document statistics
const getStaffDocumentStatistics = async (req, res) => {
  try {
    logger.info('Fetching staff document statistics');
    
    const tenantId = req.tenantId;
    
    const [
      totalDocuments,
      pendingDocuments,
      approvedDocuments,
      rejectedDocuments,
      expiredDocuments,
      archivedDocuments,
      documentsByType,
      documentsByStaff
    ] = await Promise.all([
      StaffDocument.countDocuments({ institution: tenantId }),
      StaffDocument.countDocuments({ institution: tenantId, status: 'pending' }),
      StaffDocument.countDocuments({ institution: tenantId, status: 'approved' }),
      StaffDocument.countDocuments({ institution: tenantId, status: 'rejected' }),
      StaffDocument.countDocuments({ institution: tenantId, status: 'expired' }),
      StaffDocument.countDocuments({ institution: tenantId, status: 'archived' }),
      StaffDocument.aggregate([
        { $match: { institution: new mongoose.Types.ObjectId(tenantId) } },
        { $group: { _id: '$documentType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      StaffDocument.aggregate([
        { $match: { institution: new mongoose.Types.ObjectId(tenantId) } },
        { $group: { _id: '$staff', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);
    
    const statistics = {
      total: totalDocuments,
      byStatus: {
        pending: pendingDocuments,
        approved: approvedDocuments,
        rejected: rejectedDocuments,
        expired: expiredDocuments,
        archived: archivedDocuments
      },
      byType: documentsByType.map(item => ({
        type: item._id,
        count: item.count
      })),
      topStaff: documentsByStaff.map(item => ({
        staffId: item._id,
        count: item.count
      }))
    };
    
    logger.info('Staff document statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching staff document statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Search documents
const searchStaffDocuments = async (req, res) => {
  try {
    logger.info('Searching staff documents');
    
    const { q } = req.query;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!q || q.trim().length === 0) {
      errors.push('Search query is required');
    } else if (q.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const documents = await StaffDocument.find({
      institution: tenantId,
      $or: [
        { documentName: { $regex: q, $options: 'i' } },
        { documentId: { $regex: q, $options: 'i' } },
        { documentType: { $regex: q, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } }
      ]
    })
      .populate('staff', 'name email phone avatar')
      .populate('uploadedBy', 'name')
      .limit(50);
    
    logger.info('Staff documents searched successfully:', { query: q, count: documents.length });
    return successResponse(res, documents, 'Search results retrieved successfully');
  } catch (error) {
    logger.error('Error searching staff documents:', error);
    return errorResponse(res, error.message);
  }
};

// Export documents
const exportStaffDocuments = async (req, res) => {
  try {
    logger.info('Exporting staff documents');
    
    const { format, status, documentType, staff } = req.query;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (documentType && !VALID_DOCUMENT_TYPES.includes(documentType)) {
      errors.push('Invalid document type. Must be one of: ' + VALID_DOCUMENT_TYPES.join(', '));
    }
    
    if (staff) {
      const staffError = validateObjectId(staff, 'Staff ID');
      if (staffError) errors.push(staffError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { institution: tenantId };
    if (status) query.status = status;
    if (documentType) query.documentType = documentType;
    if (staff) query.staff = staff;
    
    const documents = await StaffDocument.find(query)
      .populate('staff', 'name email phone avatar')
      .populate('uploadedBy', 'name')
      .sort({ uploadDate: -1 });
    
    const exportData = {
      format: format.toLowerCase(),
      data: documents,
      exportedAt: new Date().toISOString(),
      totalRecords: documents.length
    };
    
    logger.info('Staff documents exported successfully:', { format, count: documents.length });
    return successResponse(res, exportData, 'Documents exported successfully');
  } catch (error) {
    logger.error('Error exporting staff documents:', error);
    return errorResponse(res, error.message);
  }
};

// Get expiring documents
const getExpiringStaffDocuments = async (req, res) => {
  try {
    logger.info('Fetching expiring staff documents');
    
    const { days } = req.query;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const daysNum = parseInt(days) || 30;
    
    if (daysNum < 1 || daysNum > 365) {
      errors.push('Days must be between 1 and 365');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysNum);
    
    const documents = await StaffDocument.find({
      institution: tenantId,
      expiryDate: {
        $gte: today,
        $lte: futureDate
      },
      status: { $ne: 'expired' }
    })
      .populate('staff', 'name email phone avatar')
      .populate('uploadedBy', 'name')
      .sort({ expiryDate: 1 });
    
    logger.info('Expiring staff documents fetched successfully:', { days: daysNum, count: documents.length });
    return successResponse(res, documents, 'Expiring documents retrieved successfully');
  } catch (error) {
    logger.error('Error fetching expiring staff documents:', error);
    return errorResponse(res, error.message);
  }
};

// Get expired documents
const getExpiredStaffDocuments = async (req, res) => {
  try {
    logger.info('Fetching expired staff documents');
    
    const tenantId = req.tenantId;
    
    const today = new Date();
    
    const documents = await StaffDocument.find({
      institution: tenantId,
      expiryDate: { $lt: today }
    })
      .populate('staff', 'name email phone avatar')
      .populate('uploadedBy', 'name')
      .sort({ expiryDate: -1 });
    
    logger.info('Expired staff documents fetched successfully:', { count: documents.length });
    return successResponse(res, documents, 'Expired documents retrieved successfully');
  } catch (error) {
    logger.error('Error fetching expired staff documents:', error);
    return errorResponse(res, error.message);
  }
};

// Archive document
const archiveStaffDocument = async (req, res) => {
  try {
    logger.info('Archiving staff document');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Document ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const document = await StaffDocument.findOneAndUpdate(
      { _id: id, institution: tenantId },
      { status: 'archived' },
      { new: true, runValidators: true }
    )
      .populate('staff', 'name email phone avatar')
      .populate('uploadedBy', 'name');
    
    if (!document) {
      return notFoundResponse(res, 'Document not found');
    }
    
    logger.info('Staff document archived successfully:', { documentId: id });
    return successResponse(res, document, 'Document archived successfully');
  } catch (error) {
    logger.error('Error archiving staff document:', error);
    return errorResponse(res, error.message);
  }
};

// Restore archived document
const restoreStaffDocument = async (req, res) => {
  try {
    logger.info('Restoring archived staff document');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Document ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const document = await StaffDocument.findOneAndUpdate(
      { _id: id, institution: tenantId },
      { status: 'pending' },
      { new: true, runValidators: true }
    )
      .populate('staff', 'name email phone avatar')
      .populate('uploadedBy', 'name');
    
    if (!document) {
      return notFoundResponse(res, 'Document not found');
    }
    
    logger.info('Staff document restored successfully:', { documentId: id });
    return successResponse(res, document, 'Document restored successfully');
  } catch (error) {
    logger.error('Error restoring staff document:', error);
    return errorResponse(res, error.message);
  }
};

// Export multer upload middleware
export { upload };

// Export all functions
export default {
  upload,
  createStaffDocument,
  getStaffDocumentById,
  getAllStaffDocuments,
  updateStaffDocument,
  deleteStaffDocument,
  downloadStaffDocument,
  getStaffDocumentsByStatus,
  getStaffDocumentsByStaff,
  getStaffDocumentsByType,
  updateStaffDocumentStatus,
  bulkUpdateStaffDocumentStatus,
  bulkDeleteStaffDocuments,
  getStaffDocumentStatistics,
  searchStaffDocuments,
  exportStaffDocuments,
  getExpiringStaffDocuments,
  getExpiredStaffDocuments,
  archiveStaffDocument,
  restoreStaffDocument
};
