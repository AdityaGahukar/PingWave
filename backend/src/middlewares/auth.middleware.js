import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { ENV } from "../lib/env.js";

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;  // the token is stored in a cookie named 'jwt'
        if (!token) return res.status(401).json({ message: "Unauthorized: No token provided" });  // 1. no token found

        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        if(!decoded) return res.status(401).json({ message: "Unauthorized: Invalid token" });  // 2. token tampered or expired

        const user = await User.findById(decoded.userId).select("-password -__v");  // fetch user from DB using the id stored in token (excluding sensitive fields)
        if(!user) return res.status(401).json({ message: "Unauthorized: User not found" });  // 3. user no longer exists

        req.user = user; // Attach user to request object  --> makes user accessible in the next route handler (e.g. req.user.name, req.user._id, etc.)
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.log("Error in protectRoute middleware: ", error);
        res.status(500).json({ message: "Server error" });
    }
}