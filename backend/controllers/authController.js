const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');

const getClientBaseUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');

const generateToken = (userId) => jwt.sign(
  { userId },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);

const normalizeNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const normalizeString = (value) => {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  return v ? v : null;
};

const normalizeDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : value;
};

const buildProfileFields = (payload = {}, includeMissing = true) => {
  const schema = {
    department: normalizeString,
    profilePhoto: normalizeString,
    phone: normalizeString,
    bio: normalizeString,
    collegeId: normalizeString,
    rollNo: normalizeString,
    rollNumber: normalizeString,
    registrationNo: normalizeString,
    batch: normalizeString,
    course: normalizeString,
    section: normalizeString,
    semester: normalizeNumber,
    year: normalizeString,
    academicYear: normalizeString,
    admissionDate: normalizeDate,
    gender: normalizeString,
    dateOfBirth: normalizeDate,
    bloodGroup: normalizeString,
    fatherName: normalizeString,
    motherName: normalizeString,
    guardianPhone: normalizeString,
    address: normalizeString,
    city: normalizeString,
    state: normalizeString,
    pincode: normalizeString,
    permanentAddress: normalizeString,
    employeeId: normalizeString,
    designation: normalizeString,
    qualification: normalizeString,
    specialization: normalizeString,
    experience: normalizeNumber,
    joiningDate: normalizeDate
  };

  return Object.entries(schema).reduce((acc, [key, normalizer]) => {
    if (!includeMissing && !(key in payload)) {
      return acc;
    }
    acc[key] = normalizer(payload[key]);
    return acc;
  }, {});
};

const sanitizeUserResponse = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  department: user.department,
  profilePhoto: user.profilePhoto,
  phone: user.phone,
  isActive: user.isActive,
  collegeId: user.collegeId,
  rollNo: user.rollNo,
  rollNumber: user.rollNumber,
  registrationNo: user.registrationNo,
  batch: user.batch,
  course: user.course,
  section: user.section,
  semester: user.semester,
  year: user.year,
  academicYear: user.academicYear,
  employeeId: user.employeeId,
  designation: user.designation,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedName = (name || '').trim();
    const normalizedRole = (role || '').trim().toLowerCase();

    if (!normalizedEmail || !password || !normalizedName || !normalizedRole) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: email, password, name, role'
      });
    }

    if (normalizedRole !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Public registration is only allowed for student accounts'
      });
    }

    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      email: normalizedEmail,
      password,
      name: normalizedName,
      role: normalizedRole,
      ...buildProfileFields(req.body, true),
      isActive: true
    });

    const token = generateToken(user.id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: sanitizeUserResponse(user)
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const createUserByDirector = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedRole = (role || '').trim().toLowerCase();
    const normalizedName = (name || '').trim();

    if (!normalizedEmail || !password || !normalizedName || !normalizedRole) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: email, password, name, role'
      });
    }

    if (!['student', 'teacher', 'director'].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be student, teacher, or director'
      });
    }

    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      email: normalizedEmail,
      password,
      name: normalizedName,
      role: normalizedRole,
      ...buildProfileFields(req.body, true),
      isActive: true
    });

    const mailResult = await sendWelcomeEmail(user, password);
    if (!mailResult?.success) {
      console.error('Failed to send welcome email:', mailResult?.error || mailResult?.message || 'Unknown error');
    }

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: sanitizeUserResponse(user)
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: sanitizeUserResponse(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'resetToken', 'resetExpires'] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, user: sanitizeUserResponse(user) });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAllStudents = async (req, res) => {
  try {
    let students = await User.findAll({
      where: { role: 'student', isActive: true },
      attributes: { exclude: ['password', 'resetToken', 'resetExpires'] },
      order: [['name', 'ASC']]
    });

    if (students.length === 0) {
      students = await User.findAll({
        where: { role: 'student' },
        attributes: { exclude: ['password', 'resetToken', 'resetExpires'] },
        order: [['name', 'ASC']]
      });
    }

    return res.json({ success: true, count: students.length, students });
  } catch (error) {
    console.error('Get students error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch students' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { isActive: true },
      attributes: { exclude: ['password', 'resetToken', 'resetExpires'] },
      order: [['role', 'ASC'], ['name', 'ASC']]
    });

    return res.json({ success: true, count: users.length, users });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.json({ success: true, message: 'If that email exists, a reset link was sent.' });
    }

    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

      await user.update({
        resetToken: crypto.createHash('sha256').update(resetToken).digest('hex'),
        resetExpires
      });

      const mailResult = await sendPasswordResetEmail(user, resetToken);
      if (!mailResult?.success) {
        console.error('Failed to send reset email:', mailResult?.error || mailResult?.message || 'Unknown error');
      }

      console.log('\nRESET LINK:', `${getClientBaseUrl()}/reset-password/${resetToken}\n`);
    }

    return res.json({ success: true, message: 'If that email exists, a reset link was sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const normalizedToken = decodeURIComponent((token || '').trim());
    if (!normalizedToken) {
      return res.status(400).json({ success: false, message: 'Token is invalid or has expired.' });
    }

    const hashedToken = crypto.createHash('sha256').update(normalizedToken).digest('hex');
    const user = await User.findOne({ where: { resetToken: hashedToken } });

    if (!user || !user.resetExpires || new Date(user.resetExpires).getTime() <= Date.now()) {
      return res.status(400).json({ success: false, message: 'Token is invalid or has expired.' });
    }

    await user.update({
      password,
      resetToken: null,
      resetExpires: null
    });

    return res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
};

const verifyAccessCode = async (req, res) => {
  try {
    const { accessCode } = req.body;

    if (!accessCode) {
      return res.status(400).json({ success: false, message: 'Access code is required' });
    }

    const validCode = process.env.DIRECTOR_ACCESS_CODE;
    if (!validCode) {
      return res.status(500).json({ success: false, message: 'Access code system not configured' });
    }

    if (String(accessCode).trim() !== validCode) {
      return res.status(401).json({ success: false, message: 'Invalid access code. Please check and try again.' });
    }

    return res.json({ success: true, message: 'Access code verified successfully' });
  } catch (error) {
    console.error('Verify access code error:', error);
    return res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

const registerDirector = async (req, res) => {
  try {
    const { accessCode, collegeName, name, email, password } = req.body;
    const normalizedAccessCode = (accessCode || '').trim();
    const normalizedCollegeName = (collegeName || '').trim();
    const normalizedName = (name || '').trim();
    const normalizedEmail = (email || '').trim().toLowerCase();

    const validCode = process.env.DIRECTOR_ACCESS_CODE;
    if (!validCode) {
      return res.status(500).json({ success: false, message: 'Access code system not configured' });
    }

    if (!normalizedAccessCode || normalizedAccessCode !== validCode) {
      return res.status(401).json({ success: false, message: 'Invalid access code' });
    }

    if (!normalizedName || !normalizedEmail || !password || !normalizedCollegeName) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and college name are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const exists = await User.findOne({ where: { email: normalizedEmail } });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
      role: 'director',
      department: normalizedCollegeName,
      isActive: true
    });

    const token = generateToken(user.id);

    sendWelcomeEmail(user).catch((err) => {
      console.error('Failed to send welcome email:', err.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Director account created successfully',
      token,
      user: sanitizeUserResponse(user)
    });
  } catch (error) {
    console.error('Register director error:', error);
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const payload = {
      name: normalizeString(req.body.name) ?? user.name,
      ...buildProfileFields(req.body, false)
    };

    delete payload.email;
    delete payload.password;
    delete payload.role;

    await user.update(payload);

    return res.json({
      success: true,
      message: 'User updated successfully',
      user: sanitizeUserResponse(user)
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

module.exports = {
  register,
  createUserByDirector,
  login,
  getMe,
  getAllStudents,
  getAllUsers,
  forgotPassword,
  resetPassword,
  verifyAccessCode,
  registerDirector,
  updateUser
};
