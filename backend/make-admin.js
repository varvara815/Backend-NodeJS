import { User } from './models/index.js';
import sequelize from './config/database.js';

const makeAdmin = async () => {
  const email = process.argv[2];

  if (!email) {
    console.error('Please provide an email address.');
    console.log('Usage: node backend/make-admin.js <user-email>');
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    const user = await User.findOne({ where: { email } });

    if (user) {
      user.role = 'admin';
      await user.save();
      console.log(`Successfully updated user ${email} to admin.`);
    } else {
      console.log(`User with email ${email} not found.`);
    }
  } catch (error) {
    console.error('Unable to connect to the database or update user:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

makeAdmin();
