import mongoose from "mongoose";
const winston = require("winston");
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.DB || "mongodb://localhost:27017/admin_panel",
      {
        // user: process.env.DB_USERNAME,
        // pass: process.env.DB_PWD,
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
      }
    );
    winston.info(`MongoDB connected to:${conn.connection.host}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

export default connectDB;
