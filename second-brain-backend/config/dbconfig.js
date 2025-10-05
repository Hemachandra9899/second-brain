// config/dbconfig.js
import pkg from "pg";
const { Client } = pkg;

const client = new Client({
  user: process.env.DB_USER || "chandra",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "nodelogin",
  password: process.env.DB_PASSWORD || "phr@9899",
  port: process.env.DB_PORT || 5432,
});

await client.connect();

console.log("✅ Connected to PostgreSQL");

export { client };   