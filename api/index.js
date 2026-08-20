import "dotenv/config";
import app from "../backend/app.js";
import { connectDB } from "../backend/config/db.js";

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (error) {
    console.error("Vercel DB Connection Error:", error);
  }
  return app(req, res);
}
