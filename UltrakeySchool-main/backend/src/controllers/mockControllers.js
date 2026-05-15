import mongoose from 'mongoose';
import { successResponse, errorResponse, createdResponse } from '../utils/apiResponse.js';

const getDb = () => mongoose.connection.db;

export const getAllStorageProviders = async (req, res) => {
  try {
    const db = getDb();
    const providers = await db.collection('storagesettings').find({}).toArray();
    return successResponse(res, providers.length ? providers : [
      { id: 'local', name: 'Local Storage', type: 'local', status: 'active' }
    ], 'Storage providers retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createSchoolSettings = async (req, res) => {
  try {
    const db = getDb();
    const settings = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
    const result = await db.collection('schoolsettings').insertOne(settings);
    return createdResponse(res, { ...settings, _id: result.insertedId }, 'School settings created successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createNotice = async (req, res) => {
  try {
    const db = getDb();
    const { institutionId } = req.user;
    const notice = {
      ...req.body,
      institutionId: institutionId || req.body.institutionId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await db.collection('notices').insertOne(notice);
    return createdResponse(res, { ...notice, _id: result.insertedId }, 'Notice created successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createTodo = async (req, res) => {
  try {
    const db = getDb();
    const { userId, institutionId } = req.user;
    const todo = {
      ...req.body,
      userId: userId || req.body.userId,
      institutionId: institutionId || req.body.institutionId,
      status: req.body.status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await db.collection('todos').insertOne(todo);
    return createdResponse(res, { ...todo, _id: result.insertedId }, 'Todo created successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const markAttendance = async (req, res) => {
  try {
    const db = getDb();
    const { institutionId, userId } = req.user;
    const { studentId, date, status, remarks } = req.body;
    
    const attendance = {
      studentId: studentId || req.body.studentId,
      date: date ? new Date(date) : new Date(),
      status: status || 'present',
      remarks: remarks || '',
      markedBy: userId,
      institutionId: institutionId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('studentattendances').insertOne(attendance);
    return createdResponse(res, { ...attendance, _id: result.insertedId }, 'Attendance marked successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getAllPermissions = async (req, res) => {
  try {
    const db = getDb();
    const permissions = await db.collection('permissions').find({}).toArray();
    if (permissions.length === 0) {
      return successResponse(res, [
        { id: 'users.view', name: 'View Users', module: 'users' },
        { id: 'users.create', name: 'Create Users', module: 'users' },
        { id: 'users.edit', name: 'Edit Users', module: 'users' },
        { id: 'users.delete', name: 'Delete Users', module: 'users' }
      ], 'Permissions retrieved successfully');
    }
    return successResponse(res, permissions, 'Permissions retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createSyllabus = async (req, res) => {
  try {
    const db = getDb();
    const { institutionId } = req.user;
    const syllabus = {
      ...req.body,
      institutionId: institutionId || req.body.institutionId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await db.collection('syllabuses').insertOne(syllabus);
    return createdResponse(res, { ...syllabus, _id: result.insertedId }, 'Syllabus created successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getResults = async (req, res) => {
  try {
    const db = getDb();
    const { institutionId } = req.user;
    const results = await db.collection('studentresults').find({ 
      institutionId: institutionId || req.query.institutionId 
    }).toArray();
    return successResponse(res, results, 'Results retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getAllAssignments = async (req, res) => {
  try {
    const db = getDb();
    const { institutionId } = req.user;
    const assignments = await db.collection('homeworks').find({ 
      institutionId: institutionId || req.query.institutionId 
    }).toArray();
    return successResponse(res, assignments, 'Assignments retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getAllReports = async (req, res) => {
  try {
    const db = getDb();
    const { institutionId } = req.user;
    const reports = await db.collection('reports').find({ 
      institutionId: institutionId || req.query.institutionId 
    }).toArray();
    return successResponse(res, reports, 'Reports retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getAllRoutes = async (req, res) => {
  try {
    const db = getDb();
    const { institutionId } = req.user;
    const routes = await db.collection('transportroutes').find({ 
      institutionId: institutionId || req.query.institutionId 
    }).toArray();
    return successResponse(res, routes, 'Routes retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getAllPickupPoints = async (req, res) => {
  try {
    const db = getDb();
    const { institutionId } = req.user;
    const pickupPoints = await db.collection('pickuppoints').find({ 
      institutionId: institutionId || req.query.institutionId 
    }).toArray();
    return successResponse(res, pickupPoints, 'Pickup points retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getAcademicStructure = async (req, res) => {
  try {
    const db = getDb();
    const { institutionId } = req.user;
    const instId = institutionId || req.query.institutionId;
    
    const departments = await db.collection('departments').find({ institutionId: instId }).toArray();
    const classes = await db.collection('classes').find({ institutionId: instId }).toArray();
    const subjects = await db.collection('subjects').find({ institutionId: instId }).toArray();
    
    return successResponse(res, {
      departments,
      programs: classes,
      courses: subjects
    }, 'Academic structure retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createSport = async (req, res) => {
  try {
    const db = getDb();
    const { institutionId } = req.user;
    const sport = {
      ...req.body,
      institutionId: institutionId || req.body.institutionId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await db.collection('sports').insertOne(sport);
    return createdResponse(res, { ...sport, _id: result.insertedId }, 'Sport created successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const create = async (req, res) => {
  try {
    const db = getDb();
    const player = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
    const result = await db.collection('players').insertOne(player);
    return createdResponse(res, { ...player, _id: result.insertedId }, 'Player created successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createScholarship = async (req, res) => {
  try {
    const db = getDb();
    const { institutionId } = req.user;
    const scholarship = {
      ...req.body,
      institutionId: institutionId || req.body.institutionId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await db.collection('scholarships').insertOne(scholarship);
    return createdResponse(res, { ...scholarship, _id: result.insertedId }, 'Scholarship created successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createQuestion = async (req, res) => {
  try {
    const db = getDb();
    const question = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
    const result = await db.collection('questionbanks').insertOne(question);
    return createdResponse(res, { ...question, _id: result.insertedId }, 'Question created successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createAdmission = async (req, res) => {
  try {
    const db = getDb();
    const { institutionId } = req.user;
    const admission = {
      ...req.body,
      institutionId: institutionId || req.body.institutionId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await db.collection('admissionapplications').insertOne(admission);
    return createdResponse(res, { ...admission, _id: result.insertedId }, 'Admission created successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createBlog = async (req, res) => {
  try {
    const db = getDb();
    const blog = { ...req.body, status: 'draft', createdAt: new Date(), updatedAt: new Date() };
    const result = await db.collection('blogs').insertOne(blog);
    return createdResponse(res, { ...blog, _id: result.insertedId }, 'Blog post created successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createLibraryItem = async (req, res) => {
  try {
    const db = getDb();
    const { institutionId } = req.user;
    const item = {
      ...req.body,
      institutionId: institutionId || req.body.institutionId,
      status: 'available',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await db.collection('librarybooks').insertOne(item);
    return createdResponse(res, { ...item, _id: result.insertedId }, 'Library item created successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const markAdvancedAttendance = async (req, res) => {
  try {
    const db = getDb();
    const { institutionId, userId } = req.user;
    const attendance = {
      ...req.body,
      markedBy: userId,
      institutionId: institutionId || req.body.institutionId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await db.collection('attendances').insertOne(attendance);
    return createdResponse(res, { ...attendance, _id: result.insertedId }, 'Advanced attendance marked successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getPaymentGateway = async (req, res) => {
  try {
    const db = getDb();
    const gateways = await db.collection('paymentgatewaysettings').find({}).toArray();
    return successResponse(res, gateways.length ? gateways : { gateways: [] }, 'Payment gateways retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createFeeReminder = async (req, res) => {
  try {
    const db = getDb();
    const reminder = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
    const result = await db.collection('feereminders').insertOne(reminder);
    return createdResponse(res, { ...reminder, _id: result.insertedId }, 'Fee reminder created successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createCustomField = async (req, res) => {
  try {
    const db = getDb();
    const field = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
    const result = await db.collection('customfields').insertOne(field);
    return createdResponse(res, { ...field, _id: result.insertedId }, 'Custom field created successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getCalendar = async (req, res) => {
  try {
    const db = getDb();
    const { institutionId } = req.user;
    const events = await db.collection('events').find({ 
      institutionId: institutionId || req.query.institutionId 
    }).toArray();
    return successResponse(res, { events }, 'Calendar retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createCallLog = async (req, res) => {
  try {
    const db = getDb();
    const { userId, institutionId } = req.user;
    const callLog = {
      ...req.body,
      userId: userId || req.body.userId,
      institutionId: institutionId || req.body.institutionId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await db.collection('calllogs').insertOne(callLog);
    return createdResponse(res, { ...callLog, _id: result.insertedId }, 'Call log created successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createChat = async (req, res) => {
  try {
    const db = getDb();
    const { userId, institutionId } = req.user;
    const chat = {
      ...req.body,
      senderId: userId || req.body.senderId,
      institutionId: institutionId || req.body.institutionId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await db.collection('conversations').insertOne(chat);
    return createdResponse(res, { ...chat, _id: result.insertedId }, 'Chat created successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getDrivers = async (req, res) => {
  try {
    const db = getDb();
    const { institutionId } = req.user;
    const drivers = await db.collection('drivers').find({ 
      institutionId: institutionId || req.query.institutionId 
    }).toArray();
    return successResponse(res, { drivers }, 'Drivers retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getEmailSettings = async (req, res) => {
  try {
    const db = getDb();
    const settings = await db.collection('emailsettings').find({}).toArray();
    return successResponse(res, settings.length ? settings[0] : { settings: {} }, 'Email settings retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getGdprSettings = async (req, res) => {
  try {
    const db = getDb();
    const settings = await db.collection('gdprsettings').find({}).toArray();
    return successResponse(res, settings.length ? settings[0] : { settings: {} }, 'GDPR settings retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const db = getDb();
    const { institutionId } = req.user;
    const instId = institutionId || req.query.institutionId;
    
    const totalStudents = await db.collection('users').countDocuments({ institutionId: instId, role: 'student' });
    const totalTeachers = await db.collection('users').countDocuments({ institutionId: instId, role: 'teacher' });
    const totalParents = await db.collection('users').countDocuments({ institutionId: instId, role: 'parent' });
    const totalStaff = await db.collection('users').countDocuments({ institutionId: instId, role: 'staff_member' });
    
    return successResponse(res, {
      totalStudents,
      totalTeachers,
      totalParents,
      totalStaff,
      analytics: { totalStudents, totalTeachers, totalParents, totalStaff }
    }, 'Analytics retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getBranches = async (req, res) => {
  try {
    const db = getDb();
    const { institutionId } = req.user;
    const branches = await db.collection('branches').find({ 
      institutionId: institutionId || req.query.institutionId 
    }).toArray();
    return successResponse(res, { branches }, 'Branches retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export default {
  getAllStorageProviders,
  createSchoolSettings,
  createNotice,
  createTodo,
  markAttendance,
  getAllPermissions,
  createSyllabus,
  getResults,
  getAllAssignments,
  getAllReports,
  getAllRoutes,
  getAllPickupPoints,
  getAcademicStructure,
  createSport,
  create,
  createScholarship,
  createQuestion,
  createAdmission,
  createBlog,
  createLibraryItem,
  markAdvancedAttendance,
  getPaymentGateway,
  createFeeReminder,
  createCustomField,
  getCalendar,
  createCallLog,
  createChat,
  getDrivers,
  getEmailSettings,
  getGdprSettings,
  getAnalytics,
  getBranches
};