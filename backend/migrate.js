import sequelize from './config/database.js';
import './models/Article.js'; // Register model with Sequelize

async function migrate() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection successful!');

    console.log('Creating tables...');
    await sequelize.sync({ force: false });
    console.log('Tables created successfully!');

    console.log('Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();