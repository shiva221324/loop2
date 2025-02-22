import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect("mongodb://localhost:27017/clone");
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// mongodb+srv://sanjayketham2004:eHUeqz4cpunDlOvB@clone.aamrs.mongodb.net/?retryWrites=true&w=majority&appName=Clone
