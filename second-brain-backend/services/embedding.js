import { pipeline } from "@xenova/transformers";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config()
// OpenAI client
// export const groq = new Groq({
//   apiKey: process.env.GROQ_API_KEY,
// });

// Load Hugging Face embedding model
const embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2" // free model
  );
// Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
 
});
//embd
export const getFreeEmbedding = async (text) => {
    const output = await embedder(text, { pooling: "mean", normalize: true });
    return Array.from(output.data); // Convert tensor → JS array
  };
//create the function for creating the groq
// export const groqemb=async(text)=>{
//     try{
//         const response= await groq.embeddings.create({
//             model: "llama-3.1-8b-instant", // free embedding model on Groq
//             input: text,
//         })
//         return response.data[0].embedding// return a vector 
//     }
//     catch(err){
//         console.log(err)
//     }
// };

// Pinecone index
export const index = pinecone.Index("second-brain-free");

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
