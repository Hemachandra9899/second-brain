import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config()
// OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
 
});

// Pinecone index
export const index = pinecone.Index("second-brain");

// Optional: check connection
export const initPinecone = async () => {
  try {
    const stats = await index.describeIndexStats();
    console.log("✅ Pinecone index ready:", stats);
  } catch (err) {
    console.error("❌ Error initializing Pinecone:", err);
    throw err;
  }
};
