const User = require('../models/User');
const { sendWelcomeEmail } = require('../services/emailService');

const normalizeString = (value) => {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  return v ? v : null;
};

const normalizeNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const normalizeDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : value;
};

function generatePassword(length = 10) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i += 1) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

const mapUserPayload = (userData) => ({
  name: normalizeString(userData.name),
  email: normalizeString(userData.email)?.toLowerCase() || null,
  role: normalizeString(userData.role)?.toLowerCase() || null,
  department: normalizeString(userData.department),
  profilePhoto: normalizeString(userData.profilePhoto),
  phone: normalizeString(userData.phone),
  bio: normalizeString(userData.bio),
  collegeId: normalizeString(userData.collegeId),
  rollNo: normalizeString(userData.rollNo),
  rollNumber: normalizeString(userData.rollNumber),
  registrationNo: normalizeString(userData.registrationNo),
  batch: normalizeString(userData.batch),
  course: normalizeString(userData.course),
  section: normalizeString(userData.section),
  semester: normalizeNumber(userData.semester),
  year: normalizeString(userData.year),
  academicYear: normalizeString(userData.academicYear),
  admissionDate: normalizeDate(userData.admissionDate),
  gender: normalizeString(userData.gender),
  dateOfBirth: normalizeDate(userData.dateOfBirth),
  bloodGroup: normalizeString(userData.bloodGroup),
  fatherName: normalizeString(userData.fatherName),
  motherName: normalizeString(userData.motherName),
  guardianPhone: normalizeString(userData.guardianPhone),
  address: normalizeString(userData.address),
  city: normalizeString(userData.city),
  state: normalizeString(userData.state),
  pincode: normalizeString(userData.pincode),
  permanentAddress: normalizeString(userData.permanentAddress),
  employeeId: normalizeString(userData.employeeId),
  designation: normalizeString(userData.designation),
  qualification: normalizeString(userData.qualification),
  specialization: normalizeString(userData.specialization),
  experience: normalizeNumber(userData.experience),
  joiningDate: normalizeDate(userData.joiningDate)
});

const bulkImportUsers = async (req, res) => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of users to import'
      });
    }

    const validRoles = ['student', 'teacher', 'director'];
    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    for (let i = 0; i < users.length; i += 1) {
      const rowNum = i + 1;
      const payload = mapUserPayload(users[i] || {});

      try {
        if (!payload.name || !payload.email || !payload.role) {
          results.failed.push({
            row: rowNum,
            email: payload.email || 'N/A',
            reason: 'Missing required fields (name, email, role)'
          });
          continue;
        }

        if (!validRoles.includes(payload.role)) {
          results.failed.push({
            row: rowNum,
            email: payload.email,
            reason: `Invalid role. Must be: ${validRoles.join(', ')}`
          });
          continue;
        }

        const existingEmail = await User.findOne({ where: { email: payload.email } });
        if (existingEmail) {
          results.skipped.push({
            row: rowNum,
            email: payload.email,
            reason: 'Email already registered'
          });
          continue;
        }

        if (payload.collegeId) {
          const existingCollegeId = await User.findOne({ where: { collegeId: payload.collegeId } });
          if (existingCollegeId) {
            results.failed.push({ row: rowNum, email: payload.email, reason: 'College ID already exists' });
            continue;
          }
        }

        if (payload.rollNo) {
          const existingRollNo = await User.findOne({ where: { rollNo: payload.rollNo } });
          if (existingRollNo) {
            results.failed.push({ row: rowNum, email: payload.email, reason: 'Roll number already exists' });
            continue;
          }
        }

        if (payload.employeeId) {
          const existingEmployeeId = await User.findOne({ where: { employeeId: payload.employeeId } });
          if (existingEmployeeId) {
            results.failed.push({ row: rowNum, email: payload.email, reason: 'Employee ID already exists' });
            continue;
          }
        }

        const providedPassword = normalizeString(users[i]?.password);
        const password = providedPassword || generatePassword();

        const newUser = await User.create({
          ...payload,
          password,
          isActive: true
        });

        if (providedPassword) {
          sendWelcomeEmail(newUser).catch((err) => {
            console.error('Failed to send welcome email:', err.message);
          });
        } else {
          sendWelcomeEmail(newUser, password).catch((err) => {
            console.error('Failed to send welcome email:', err.message);
          });
        }

        results.success.push({
          row: rowNum,
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
          collegeId: newUser.collegeId,
          rollNo: newUser.rollNo,
          employeeId: newUser.employeeId,
          password: providedPassword ? 'provided' : password
        });
      } catch (error) {
        console.error(`Bulk import row ${rowNum} error:`, error);
        results.failed.push({
          row: rowNum,
          email: payload.email || 'N/A',
          reason: 'Invalid user data'
        });
      }
    }

    const summary = {
      total: users.length,
      successful: results.success.length,
      failed: results.failed.length,
      skipped: results.skipped.length
    };

    return res.json({
      success: true,
      message: `Import completed: ${summary.successful} created, ${summary.failed} failed, ${summary.skipped} skipped`,
      summary,
      results
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    });
  }
};

const downloadTemplate = (_req, res) => {
  const csvContent = [
    'name,email,password,role,department,collegeId,rollNo,registrationNo,batch,course,section,semester,academicYear,phone,gender,dateOfBirth,employeeId,designation',
    'Alice Johnson,alice@college.edu,student123,student,BCA,ABC/2021/001,CS21001,REG001,2021-2024,BCA,A,5,2023-2024,+91XXXXXXXXXX,Female,2003-08-14,,',
    'Bob Smith,bob@college.edu,teacher123,teacher,Computer Science,,,,,,,,,+91XXXXXXXXXX,Male,,EMP001,Assistant Professor'
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=users-template.csv');
  return res.send(csvContent);
};

module.exports = {
  bulkImportUsers,
  downloadTemplate
};
