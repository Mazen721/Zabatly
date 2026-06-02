const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', 'server', '.env') });

const connectDB = require('../server/config/db');
const User = require('../server/models/User');

const run = async () => {
  await connectDB();
  
  try {
    const users = await User.find({});
    console.log(`Found ${users.length} users in the database.`);
    
    for (const user of users) {
      console.log(`\nTesting save for user: ${user.name} (${user.email}) [Role: ${user.role}]`);
      try {
        await user.save();
        console.log(`✅ Successfully saved user ${user.name}`);
      } catch (err) {
        console.error(`❌ FAILED to save user ${user.name}:`);
        console.error(err);
      }
    }
  } catch (err) {
    console.error('Error running test:', err);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

run();
