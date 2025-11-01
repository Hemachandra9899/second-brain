import pkg from "pg";
const { Client } = pkg;

const client = new Client({
  user: process.env.PGUSER || "neondb_owner",
  host: process.env.PGHOST || "ep-frosty-shape-adp817jm-pooler.c-2.us-east-1.aws.neon.tech",
  database: process.env.PGDATABASE || "neondb",
  password: process.env.PGPASSWORD || "npg_fwR8WlzMSGk0",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

try {
  await client.connect();
  console.log("✅ Connected to Neon PostgreSQL Database");
} catch (err) {
  console.error("❌ Database connection error:", err.message);
}

export { client };
