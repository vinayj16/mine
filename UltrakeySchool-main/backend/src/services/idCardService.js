import QRCode from 'qrcode';
import User from '../models/User.js';
import logger from '../utils/logger.js';

class IDCardService {
  /**
   * Generate student ID card data
   * @param {string} studentId - Student ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object} ID card data
   */
  async generateStudentIDCard(studentId, tenantId) {
    try {
      const student = await User.findOne({
        _id: studentId,
        tenant: tenantId,
        role: 'student',
      }).populate('institution');

      if (!student) {
        throw new Error('Student not found');
      }

      // Generate QR code with student information
      const qrData = JSON.stringify({
        id: student._id,
        admissionNumber: student.admissionNumber,
        name: `${student.firstName} ${student.lastName}`,
        institution: student.institution?.name,
        validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      });

      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 200,
        margin: 1,
      });

      // Generate barcode (Code 128)
      const barcodeData = student.admissionNumber || student._id.toString();

      const idCardData = {
        student: {
          id: student._id,
          admissionNumber: student.admissionNumber,
          firstName: student.firstName,
          lastName: student.lastName,
          fullName: `${student.firstName} ${student.lastName}`,
          email: student.email,
          phone: student.phone,
          photo: student.photo,
          dateOfBirth: student.dateOfBirth,
          bloodGroup: student.bloodGroup,
          class: student.currentClass,
          section: student.currentSection,
          rollNumber: student.rollNumber,
        },
        institution: {
          name: student.institution?.name,
          logo: student.institution?.logo,
          address: student.institution?.address,
          phone: student.institution?.phone,
          email: student.institution?.email,
          website: student.institution?.website,
        },
        qrCode: qrCodeDataURL,
        barcode: barcodeData,
        issueDate: new Date().toISOString(),
        validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        cardNumber: `ID-${student.admissionNumber || student._id.toString().slice(-8).toUpperCase()}`,
      };

      logger.info(`ID card generated for student: ${student._id}`);
      return idCardData;
    } catch (error) {
      logger.error(`Error generating student ID card: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate teacher ID card data
   * @param {string} teacherId - Teacher ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object} ID card data
   */
  async generateTeacherIDCard(teacherId, tenantId) {
    try {
      const teacher = await User.findOne({
        _id: teacherId,
        tenant: tenantId,
        role: 'teacher',
      }).populate('institution');

      if (!teacher) {
        throw new Error('Teacher not found');
      }

      // Generate QR code with teacher information
      const qrData = JSON.stringify({
        id: teacher._id,
        employeeId: teacher.employeeId,
        name: `${teacher.firstName} ${teacher.lastName}`,
        institution: teacher.institution?.name,
        validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      });

      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 200,
        margin: 1,
      });

      const barcodeData = teacher.employeeId || teacher._id.toString();

      const idCardData = {
        teacher: {
          id: teacher._id,
          employeeId: teacher.employeeId,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          fullName: `${teacher.firstName} ${teacher.lastName}`,
          email: teacher.email,
          phone: teacher.phone,
          photo: teacher.photo,
          dateOfBirth: teacher.dateOfBirth,
          bloodGroup: teacher.bloodGroup,
          department: teacher.department,
          designation: teacher.designation,
          joiningDate: teacher.joiningDate,
        },
        institution: {
          name: teacher.institution?.name,
          logo: teacher.institution?.logo,
          address: teacher.institution?.address,
          phone: teacher.institution?.phone,
          email: teacher.institution?.email,
          website: teacher.institution?.website,
        },
        qrCode: qrCodeDataURL,
        barcode: barcodeData,
        issueDate: new Date().toISOString(),
        validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        cardNumber: `EMP-${teacher.employeeId || teacher._id.toString().slice(-8).toUpperCase()}`,
      };

      logger.info(`ID card generated for teacher: ${teacher._id}`);
      return idCardData;
    } catch (error) {
      logger.error(`Error generating teacher ID card: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate staff ID card data
   * @param {string} staffId - Staff ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object} ID card data
   */
  async generateStaffIDCard(staffId, tenantId) {
    try {
      const staff = await User.findOne({
        _id: staffId,
        tenant: tenantId,
        role: { $in: ['staff', 'librarian', 'accountant', 'transport_manager', 'hostel_warden'] },
      }).populate('institution');

      if (!staff) {
        throw new Error('Staff not found');
      }

      // Generate QR code with staff information
      const qrData = JSON.stringify({
        id: staff._id,
        employeeId: staff.employeeId,
        name: `${staff.firstName} ${staff.lastName}`,
        institution: staff.institution?.name,
        validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      });

      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 200,
        margin: 1,
      });

      const barcodeData = staff.employeeId || staff._id.toString();

      const idCardData = {
        staff: {
          id: staff._id,
          employeeId: staff.employeeId,
          firstName: staff.firstName,
          lastName: staff.lastName,
          fullName: `${staff.firstName} ${staff.lastName}`,
          email: staff.email,
          phone: staff.phone,
          photo: staff.photo,
          dateOfBirth: staff.dateOfBirth,
          bloodGroup: staff.bloodGroup,
          department: staff.department,
          designation: staff.designation,
          role: staff.role,
          joiningDate: staff.joiningDate,
        },
        institution: {
          name: staff.institution?.name,
          logo: staff.institution?.logo,
          address: staff.institution?.address,
          phone: staff.institution?.phone,
          email: staff.institution?.email,
          website: staff.institution?.website,
        },
        qrCode: qrCodeDataURL,
        barcode: barcodeData,
        issueDate: new Date().toISOString(),
        validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        cardNumber: `STAFF-${staff.employeeId || staff._id.toString().slice(-8).toUpperCase()}`,
      };

      logger.info(`ID card generated for staff: ${staff._id}`);
      return idCardData;
    } catch (error) {
      logger.error(`Error generating staff ID card: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify ID card QR code
   * @param {string} qrData - QR code data
   * @returns {Object} Verification result
   */
  async verifyIDCard(qrData) {
    try {
      const data = JSON.parse(qrData);
      
      // Check if card is still valid
      const validUntil = new Date(data.validUntil);
      const now = new Date();
      
      if (now > validUntil) {
        return {
          valid: false,
          reason: 'ID card has expired',
          data: null,
        };
      }

      // Verify user exists
      const user = await User.findById(data.id).populate('institution');
      
      if (!user) {
        return {
          valid: false,
          reason: 'User not found',
          data: null,
        };
      }

      if (user.status !== 'active') {
        return {
          valid: false,
          reason: 'User account is not active',
          data: null,
        };
      }

      return {
        valid: true,
        reason: 'ID card is valid',
        data: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          institution: user.institution?.name,
          photo: user.photo,
          validUntil: data.validUntil,
        },
      };
    } catch (error) {
      logger.error(`Error verifying ID card: ${error.message}`);
      return {
        valid: false,
        reason: 'Invalid QR code data',
        data: null,
      };
    }
  }

  /**
   * Generate bulk ID cards
   * @param {Array} userIds - Array of user IDs
   * @param {string} tenantId - Tenant ID
   * @param {string} userType - User type (student, teacher, staff)
   * @returns {Array} Array of ID card data
   */
  async generateBulkIDCards(userIds, tenantId, userType) {
    try {
      const idCards = [];
      
      for (const userId of userIds) {
        let idCard;
        
        switch (userType) {
          case 'student':
            idCard = await this.generateStudentIDCard(userId, tenantId);
            break;
          case 'teacher':
            idCard = await this.generateTeacherIDCard(userId, tenantId);
            break;
          case 'staff':
            idCard = await this.generateStaffIDCard(userId, tenantId);
            break;
          default:
            throw new Error(`Invalid user type: ${userType}`);
        }
        
        idCards.push(idCard);
      }

      logger.info(`Bulk ID cards generated: ${idCards.length} cards`);
      return idCards;
    } catch (error) {
      logger.error(`Error generating bulk ID cards: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get ID card template settings
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Template settings
   */
  async getIDCardTemplate(tenantId) {
    try {
      // This would typically fetch from a settings table
      // For now, return default template
      return {
        layout: 'standard', // standard, compact, detailed
        orientation: 'portrait', // portrait, landscape
        size: 'cr80', // cr80 (standard credit card size), custom
        colors: {
          primary: '#3b82f6',
          secondary: '#64748b',
          text: '#1e293b',
          background: '#ffffff',
        },
        fields: {
          showPhoto: true,
          showQRCode: true,
          showBarcode: true,
          showBloodGroup: true,
          showAddress: false,
          showEmergencyContact: false,
        },
        branding: {
          showLogo: true,
          showInstitutionName: true,
          showAddress: true,
          showWebsite: true,
        },
      };
    } catch (error) {
      logger.error(`Error fetching ID card template: ${error.message}`);
      throw error;
    }
  }
}

export default new IDCardService();
