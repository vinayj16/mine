import express from "express";
import { authenticate, authorize } from "../middleware/authGuard.js";
import Institution from "../models/Institution.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router();
router.use(authenticate);

// Generate institution code
const generateInstitutionCode = (type, name) => {
  const prefix = type.substring(0, 3).toUpperCase();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}-${randomNum}-${timestamp}`;
};

// Create institution with admin and principal
router.post("/create", async (req, res) => {
  try {
    const {
      name,
      type,
      email,
      phone,
      address,
      city,
      state,
      country,
      adminName,
      adminEmail,
      principalName,
      principalEmail,
    } = req.body;

    if (
      !name ||
      !type ||
      !email ||
      !adminName ||
      !adminEmail ||
      !principalName ||
      !principalEmail
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Missing required fields: name, type, email, adminName, adminEmail, principalName, principalEmail",
        });
    }

    const existingInstitution = await Institution.findOne({
      email: email.toLowerCase(),
    });
    if (existingInstitution) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Institution with this email already exists",
        });
    }

    const institutionCode = generateInstitutionCode(type, name);

    const institution = new Institution({
      name,
      type,
      instituteCode: institutionCode,
      email: email.toLowerCase(),
      phone,
      address,
      city,
      state,
      country,
      status: "active",
      createdBy: req.user.id,
      subscription: {
        planName: "Basic",
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: "active",
      },
    });
    await institution.save();

    // Create institution admin
    const adminPassword = "inst123";
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

    const institutionAdmin = new User({
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: hashedAdminPassword,
      role: "institution_admin",
      institutionId: institution._id,
      institutionCode,
      phone: phone || "",
      status: "active",
      isEmailVerified: true,
    });
    await institutionAdmin.save();

    // Create principal admin
    const principalPassword = "prin123";
    const hashedPrincipalPassword = await bcrypt.hash(principalPassword, 10);

    const principalAdmin = new User({
      name: principalName,
      email: principalEmail.toLowerCase(),
      password: hashedPrincipalPassword,
      role: "principal",
      institutionId: institution._id,
      institutionCode,
      phone: phone || "",
      status: "active",
      isEmailVerified: true,
    });
    await principalAdmin.save();

    institution.adminId = institutionAdmin._id;
    institution.principalId = principalAdmin._id;
    await institution.save();

    res.status(201).json({
      success: true,
      message: "Institution created successfully with admin and principal",
      data: {
        institution: {
          _id: institution._id,
          name: institution.name,
          instituteCode: institution.instituteCode,
          type: institution.type,
          email: institution.email,
          phone: institution.phone,
        },
        admin: {
          _id: institutionAdmin._id,
          name: institutionAdmin.name,
          email: institutionAdmin.email,
          role: institutionAdmin.role,
          temporaryPassword: adminPassword,
        },
        principal: {
          _id: principalAdmin._id,
          name: principalAdmin.name,
          email: principalAdmin.email,
          role: principalAdmin.role,
          temporaryPassword: principalPassword,
        },
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create institution",
        error: error.message,
      });
  }
});

// Create multiple users under institution
router.post("/:institutionId/users", async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { users } = req.body;

    const institution = await Institution.findById(institutionId);
    if (!institution)
      return res
        .status(404)
        .json({ success: false, message: "Institution not found" });

    const createdUsers = [];
    for (const userData of users) {
      const {
        name,
        email,
        role,
        phone,
        department,
        class: className,
        section,
      } = userData;

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) continue;

      const tempPassword = `${role.substring(0, 3)}123456`;
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const newUser = new User({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        institutionId: institution._id,
        institutionCode: institution.instituteCode,
        phone: phone || "",
        department: department || "",
        class: className || "",
        section: section || "",
        status: "active",
        isEmailVerified: true,
      });
      await newUser.save();

      createdUsers.push({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        temporaryPassword: tempPassword,
      });
    }

    res
      .status(201)
      .json({
        success: true,
        message: `Created ${createdUsers.length} users`,
        data: {
          institution: {
            _id: institution._id,
            name: institution.name,
            instituteCode: institution.instituteCode,
          },
          createdUsers,
        },
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create users",
        error: error.message,
      });
  }
});

// Get institution users (by institutionId or institutionCode)
router.get("/:institutionId/users", async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { role, search, status } = req.query;

    // First, try to resolve the institution to also get its code
    let institutionCode = null;
    try {
      const institution = await Institution.findById(institutionId)
        .select("instituteCode")
        .lean();
      if (institution) institutionCode = institution.instituteCode;
    } catch (_) {
      // institutionId may not be a valid ObjectId — skip
    }

    // Build query: match by institutionId OR institutionCode (covers all user creation patterns)
    const orConditions = [
      { institutionId: institutionId },
      { institution: institutionId },
    ];
    if (institutionCode) {
      orConditions.push({ institutionCode: institutionCode });
    }

    const query = { $or: orConditions };
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$and = [{ $or: orConditions }];
      delete query.$or;
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      });
    }

    const users = await User.find(query)
      .select("-password -refreshToken")
      .sort({ role: 1, createdAt: -1 });

    const usersByRole = users.reduce((acc, user) => {
      if (!acc[user.role]) acc[user.role] = [];
      acc[user.role].push(user);
      return acc;
    }, {});

    const stats = {
      totalUsers: users.length,
      teachers: users.filter((u) => u.role === "teacher").length,
      students: users.filter((u) => u.role === "student").length,
      parents: users.filter((u) => u.role === "parent").length,
      admins: users.filter((u) =>
        ["admin", "institution_admin", "principal"].includes(u.role),
      ).length,
      staff: users.filter((u) =>
        [
          "accountant",
          "librarian",
          "hr_manager",
          "hostel_warden",
          "transport_manager",
          "staff_member",
        ].includes(u.role),
      ).length,
      activeUsers: users.filter((u) => u.status === "active").length,
      inactiveUsers: users.filter((u) => u.status !== "active").length,
    };

    res.json({
      success: true,
      data: { users, usersByRole, stats, total: users.length },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch users",
        error: error.message,
      });
  }
});

// Get institution details
router.get("/:institutionId/details", async (req, res) => {
  try {
    const { institutionId } = req.params;
    const institution = await Institution.findById(institutionId);
    if (!institution)
      return res
        .status(404)
        .json({ success: false, message: "Institution not found" });

    // Query users with both institutionId and institution fields
    const users = await User.find({
      $or: [{ institutionId: institutionId }, { institution: institutionId }],
    }).select("-password");

    const stats = {
      totalUsers: users.length,
      teachers: users.filter((u) => u.role === "teacher").length,
      students: users.filter((u) => u.role === "student").length,
      parents: users.filter((u) => u.role === "parent").length,
      admins: users.filter((u) =>
        ["admin", "institution_admin", "institution_owner"].includes(u.role),
      ).length,
      staff: users.filter((u) =>
        [
          "accountant",
          "librarian",
          "hr_manager",
          "hostel_warden",
          "transport_manager",
        ].includes(u.role),
      ).length,
      activeUsers: users.filter((u) => u.status === "active").length,
    };

    res.json({ success: true, data: { institution, users, stats } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch institution details",
        error: error.message,
      });
  }
});

export default router;
