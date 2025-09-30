import express from 'express';
import {client} from "../config/dbconfig.js";
const authroute=express()

authroute.get('/login',(req,res)=>{
    res.send('login page')
})
authroute.get('/register',(req, res)=>{
    res.send('register page')
})
authroute.get('/logout',(req, res)=>{
    res.send('logout page')
})
authroute.post("/users", async (req, res) => {
    try {
      const { name, email, password } = req.body;
  
      // basic validation
      if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }
  
      const query = `
        INSERT INTO users (name, email, password)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const values = [name, email, password];
  
      const result = await client.query(query, values);
  
      res.status(201).json(result.rows[0]); // send back inserted user
    } catch (err) {
      console.error("❌ Error inserting user:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

export default authroute;