const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: {
        msg: 'Email already exists'
      },
      validate: {
        isEmail: {
          msg: 'Must be a valid email address'
        }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: {
          args: [6, 255],
          msg: 'Password must be at least 6 characters'
        }
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [2, 100],
          msg: 'Name must be between 2 and 100 characters'
        }
      }
    },
    role: {
      type: DataTypes.ENUM('student', 'teacher', 'director'),
      allowNull: false,
      defaultValue: 'student'
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    profilePhoto: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    collegeId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    rollNo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    rollNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    registrationNo: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    batch: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    course: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    section: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    semester: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    year: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    academicYear: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    admissionDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },

    gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other', 'Prefer not to say'),
      allowNull: true
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    bloodGroup: {
      type: DataTypes.STRING(5),
      allowNull: true
    },

    fatherName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    motherName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    guardianPhone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },

    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    permanentAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    employeeId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    designation: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    qualification: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    specialization: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    experience: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    joiningDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    resetToken: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    resetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  },
  {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  }
);

User.prototype.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
