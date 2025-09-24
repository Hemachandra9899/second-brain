import mongoose from 'mongoose'

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.log("❌ MongoDB connection failed:", error.message);
    process.exit(1); // optional: stop server if DB fails
  }
}
