// const express = require('express'); --> common js syntax
import express from 'express'; // --> ES6 module js syntax
import dotenv from 'dotenv';

import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';

dotenv.config();

const app = express(); 
const PORT = process.env.PORT || 3000;

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

app.listen(PORT , () => console.log("Server running on port: " + PORT));