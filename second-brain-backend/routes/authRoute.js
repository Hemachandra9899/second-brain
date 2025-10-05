import express from 'express';
import bcrypt from 'bcrypt';
import {client} from "../config/dbconfig.js";
const authroute=express()

authroute.post('/login',async(req,res)=>{
  try{
    const {email,password}=req.body
    if(!email || !password){
        res.status(400).json({error:"All fields are required"})
    }
    console.log(email,password)
    const query =`SELECT * FROM users WHERE email=$1 LIMIT 1`
    console.log(query)
    const result = await client.query(query,[email])
    console.log(result)
    if(result.rows.length===0) {
      return res.status(400).json({error:"User not found"})
    }
    const user=result.rows[0]
    console.log(user)
    const is_match = await bcrypt.compare(password , user.password)
    if(!is_match){
      return res.status(400).json({error:"Invalid credentials"})
    }
    res.status(200).json({message:"Login successful",user})
    

  }catch(err){
    console.log(err)
  }
})


authroute.get('/logout',(req, res)=>{
    res.send('logout page')
})
authroute.post("/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;
  
      // basic validation
      if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const query = `
        INSERT INTO users (name, email, password)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const values = [name, email, hashedPassword];
  
      const result = await client.query(query, values);
  
      res.status(201).json(result.rows[0]); // send back inserted user
    } catch (err) {
      console.error("❌ Error inserting user:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

export default authroute;