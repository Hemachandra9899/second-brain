import express from "express";
import { index } from "../services/embedding.js"; 

const router = express.Router();

// ==========================
// POST /note → Save note + embedding
// ==========================
router.post("/note", async (req, res) => {
    try {
      const { title, description } = req.body;
      
      // 1️⃣ generate mock embedding for testing
      const embedding = Array(1536).fill(0).map(() => Math.random());
    
      const id = `note_${Date.now()}`; // Generate unique ID
      
      console.log("✅ Generated embedding for note");
      
      // 2️⃣ Prepare record for Pinecone
      const records = [
        {
          id: id,
          values: embedding, // Use the 1536-dimensional embedding
          metadata: { 
            title: title,
            description: description,
            createdAt: new Date().toISOString()
          },
        }
      ];
      
      // 3️⃣ Upsert to Pinecone
      const result = await index.upsert(records);
      
      console.log("✅ Pinecone upsert result:", result);
  
      res.status(201).json({
        message: "Note saved successfully",
        note: { id, title, description }
      });
    } catch (err) {
      console.error("❌ Error saving note:", err);
      res.status(500).json({ error: "Failed to save note" });
    }
});
// ==========================
// GET /note?query=... → Semantic search
// ==========================
router.get("/note", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "Query required" });

    const queryVector = Array(1536).fill(0).map(() => Math.random());
    console.log("✅ Pinecone query vector:", queryVector);

    const searchResponse = await index.query({
      topK: 5,
      vector: queryVector,
      includeMetadata: true,
      namespace: ""
    });

    const matches = searchResponse.matches || [];

    res.json(matches.map(match => ({
      id: match.id,
      score: match.score,
      title: match.metadata?.title,
      description: match.metadata?.description
    })));
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
      namespace: ""
    });
    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting note:", err);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

export default router;
