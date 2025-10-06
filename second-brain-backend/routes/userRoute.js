import express from "express";
import { getFreeEmbedding, index } from "../services/embedding.js";
import Groq from "groq-sdk";

const router = express.Router();

// init Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ==========================
// POST /note → Save note + embedding
// ==========================
router.post("/note", async (req, res) => {
  try {
    const { title, description } = req.body;

    // 1️⃣ generate embedding
    const embedding = await getFreeEmbedding(`${title} ${description}`);

    const id = `note_${Date.now()}`; // unique ID
    console.log("✅ Generated embedding for note");

    // 2️⃣ Prepare record for Pinecone
    const records = [
      {
        id: id,
        values: embedding,
        metadata: {
          title,
          description,
          createdAt: new Date().toISOString(),
        },
      },
    ];

    // 3️⃣ Upsert to Pinecone
    const result = await index.upsert(records);
    console.log("✅ Pinecone upsert result:", result);

    res.status(201).json({
      message: "Note saved successfully",
      note: { id, title, description },
    });
  } catch (err) {
    console.error("❌ Error saving note:", err);
    res.status(500).json({ error: "Failed to save note" });
  }
});

// ==========================
// GET /note?query=... → Semantic search + AI answer
// ==========================
router.get("/note", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "Query required" });

    // 1️⃣ Convert query into embedding
    const queryVector = await getFreeEmbedding(query);
    console.log("✅ Generated embedding for query");

    // 2️⃣ Search in Pinecone
    const searchResponse = await index.query({
      vector: queryVector,
      topK: 5,
      includeMetadata: true,
    });

    const matches = searchResponse.matches || [];
    if (matches.length === 0) {
      return res.json({ answer: "I couldn’t find anything relevant." });
    }

    // Format results into a text block
    const formattedResults = matches.map(
      (m, i) => `${i + 1}. ${m.metadata?.title} - ${m.metadata?.description}`
    ).join("\n");

    // 3️⃣ Ask Groq model to summarize
    const completion = await groq.chat.completions.create({
      model: "gemma2-9b-it",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful and friendly assistant. Your task is to read user queries and the retrieved notes, then provide a clear, concise, and human-like answer in natural language. Avoid repeating raw note data; instead, summarize and combine the relevant information into a coherent response. If the notes are insufficient, politely indicate that and offer general advice or suggestions. If the user's query does not match any notes in the database, clearly state: 'I do not have this task in the list, but here’s what I can suggest:' and then provide helpful guidance or suggestions."
        },
        {
          role: "user",
          content: `The user asked: "${query}". Here are the relevant notes retrieved from the database:\n${formattedResults}\n\nPlease provide a single, well-written, conversational answer that addresses the user's query, integrating the notes where appropriate.`
        }
      ]
      
      
    });

    const aiAnswer = completion.choices[0].message.content.trim();

    // 4️⃣ Send back only AI answer (not JSON objects)
    res.send(aiAnswer);
  } catch (err) {
    console.error("❌ Error searching notes:", err);
    res.status(500).json({ message: "Error searching notes" });
  }
});

// ==========================
// DELETE /note/:id
// ==========================
router.delete("/note/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await index.delete({
      ids: [id],
      namespace: "",
    });
    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting note:", err);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

export default router;
