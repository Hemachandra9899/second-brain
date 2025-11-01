// config/dbconfig.js
import pkg from "pg";
const { Client } = pkg;

// Create client instance
const client = new Client({
  user: process.env.PGUSER || "neondb_owner",
  host:
    process.env.PGHOST ||
    "ep-frosty-shape-adp817jm-pooler.c-2.us-east-1.aws.neon.tech",
  database: process.env.PGDATABASE || "neondb",
  password: process.env.PGPASSWORD || "npg_fwR8WlzMSGk0",
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: false, // ✅ required for Neon
  },
});

// ✅ Wrap connection inside async function to avoid top-level await crash
(async () => {
  try {
    await client.connect();
    console.log("✅ Connected to Neon PostgreSQL Database");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
})();

export { client };
