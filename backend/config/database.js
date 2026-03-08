const { Sequelize } = require('sequelize');
const pg = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const hasDatabaseUrl = Boolean((process.env.DATABASE_URL || '').trim());
const requiredEnv = hasDatabaseUrl ? [] : ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST'];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
const isProduction = process.env.NODE_ENV === 'production';

if (missingEnv.length > 0) {
  console.error(`Missing required database env vars: ${missingEnv.join(', ')}`);
}

const sequelize = hasDatabaseUrl
  ? new Sequelize((process.env.DATABASE_URL || '').trim(), {
      dialect: 'postgres',
      dialectModule: pg,
      logging: false,
      dialectOptions: isProduction
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          }
        : undefined,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    })
  : new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    // Keep pg in the serverless bundle; Sequelize loads it dynamically otherwise.
    dialectModule: pg,
    logging: false,
    dialectOptions: isProduction
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      : undefined,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

const testConnection = async () => {
  try {
    if (!hasDatabaseUrl && missingEnv.length > 0) {
      throw new Error(`Database configuration missing: ${missingEnv.join(', ')}`);
    }

    await sequelize.authenticate();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Unable to connect to database:', error);
    throw error;
  }
};

module.exports = { sequelize, testConnection };
