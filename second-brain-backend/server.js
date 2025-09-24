import express from 'express';
import dotenv from 'dotenv';
import route from './routes/userRoute.js';
import {connectDB} from './config/modelConfig.js';
import cors from 'cors';
dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use("/",route);
app.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on port ${PORT}`);
});