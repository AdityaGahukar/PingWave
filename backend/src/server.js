// const express = require('express'); --> common js syntax
import express from 'express'; // --> ES6 module js syntax
import path from 'path';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import {connectDB} from './lib/db.js';
import { ENV } from './lib/env.js';

const app = express(); 
const __dirname = path.resolve();


const PORT = ENV.PORT || 3000;

// Global middlewares: 
app.use(express.json()); // req.body --> to parse json body (middleware to handle json data sent from user/client)
app.use(cookieParser()); // to parse cookies from request headers

// routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// make ready for deployment
if(ENV.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get("*", (_, res) => {
        res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
    });
}

app.listen(PORT , () => {
    console.log("Server running on port: " + PORT)
    connectDB();
});