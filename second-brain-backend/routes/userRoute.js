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
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are an assistant that summarizes semantic search results into a natural, conversational answer.",
        },
        {
          role: "user",
          content: `User asked: "${query}". Here are the retrieved notes:\n${formattedResults}\n\nPlease give a helpful, human-like answer.`,
        },
      ],
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
