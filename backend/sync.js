const { sequelize } = require('./config/database');
const User = require('./models/User');
const Content = require('./models/Content');

const syncDB = async () => {
  try {
    console.log('Syncing database...');
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully');

    // Check if tables exist
    const [users] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='users';");
    const [contents] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='contents';");

    console.log('Users table exists:', users.length > 0);
    console.log('Contents table exists:', contents.length > 0);

  } catch (error) {
    console.error('Sync error:', error);
  } finally {
    await sequelize.close();
  }
};

syncDB();