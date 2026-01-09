import User from './models/User.js';
import sequelize from './config/database.js';

async function makeAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const user = await User.findOne({ where: { email: 'admin1@gmail.com' } });
    if (user) {
      await user.update({ role: 'admin' });
      console.log('User admin1@gmail.com is now an admin');
    } else {
      console.log('User not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

makeAdmin();
