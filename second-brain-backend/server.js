import dotenv from "dotenv";
dotenv.config(); // Must be first
import {client} from "./config/dbconfig.js";
import authrouter from "./routes/authRoute.js";
import express from "express";
import cors from "cors";
import router from "./routes/userRoute.js"; // your new semantic search routes
import { initPinecone } from "./services/embedding.js";

const app = express();
const PORT = process.env.PORT || 5005;


app.use(cors({
  origin: 'http://localhost:5173', // Your React app URL
  credentials: true
}));
app.use(express.json());
app.use("/", router);
app.use("/auth",authrouter);
//connect to the pg database
const result = await client.query("SELECT * FROM users");

app.listen(PORT, async () => {
  try {
    await initPinecone();
    console.log("✅ Pinecone initialized");
    console.log(`🚀 Server running on port ${PORT}`);
  } catch (err) {
    console.error("❌ Error initializing Pinecone:", err);
  }
});
