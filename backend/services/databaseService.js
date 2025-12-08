import sequelize from '../config/database.js';

// Test database connection and exit if failed
export const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection successful!');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};