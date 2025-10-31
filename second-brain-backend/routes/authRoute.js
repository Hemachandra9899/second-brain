import express from "express";
import bcrypt from "bcrypt";
import { client } from "../config/dbconfig.js";

const authroute = express.Router(); // use Router() not express()

// 🧩 REGISTER ROUTE
authroute.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const checkUserQuery = "SELECT * FROM users WHERE email = $1 LIMIT 1";
    const checkUser = await client.query(checkUserQuery, [email]);

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into DB
    const insertQuery = `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email;
    `;
    const values = [name, email, hashedPassword];
    const result = await client.query(insertQuery, values);

    // Send success response
    return res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error in /register:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🧩 LOGIN ROUTE
authroute.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "All fields are required" });

    const query = `SELECT * FROM users WHERE email = $1 LIMIT 1`;
    const result = await client.query(query, [email]);

    if (result.rows.length === 0)
      return res.status(400).json({ error: "User not found" });

    const user = result.rows[0];
    const is_match = await bcrypt.compare(password, user.password);

    if (!is_match)
      return res.status(400).json({ error: "Invalid credentials" });

    res.status(200).json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("❌ Error in /login:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🧩 LOGOUT ROUTE
authroute.get("/logout", (req, res) => {
  res.send("Logout route - implement session or token removal if needed");
});

export default authroute;
