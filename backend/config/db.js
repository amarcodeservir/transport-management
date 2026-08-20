import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/transport_management";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log("--- SUCCESS ---");
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    console.log("---------------");
  } catch (error) {
    console.error("--- DATABASE CONNECTION ERROR ---");
    console.error(`Target MONGO_URI: ${MONGO_URI}`);
    console.error(`Error: ${error.message}`);
    console.error("---------------------------------");
    console.error("SUGGESTION: Ensure MongoDB service is running on your machine or Atlas URI is valid.");
    console.error("---------------------------------");
    process.exit(1);
  }
};
