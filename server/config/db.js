const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Attempt to connect to the database
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // If successful, print the host name in the terminal
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If failed, print the error and stop the server
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;