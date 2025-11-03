import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { ENV } from '../lib/env.js';
import { SocketAddress } from 'net';

export const socketAuthMiddleware = async (socket, next) => {
    try {
        // extract token from http-only cookies
        const token = socket.handshake.headers.cookie
            ?.split('; ')
            .find(row => row.startsWith('jwt='))
            ?.split('=')[1];

        if(!token) {
            console.log("Socket connection rejected: No token provided");
            return next(new Error("Unauthorized: No token provided"));
        }

        // verify the token
        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        if(!decoded) {
            console.log("Socket connection rejected: Invalid token");
            return next(new Error("Unauthorized: Invalid token"));
        }
        
        // find the user from the database
        const user = await User.findById(decoded.userId).select('-password');
        if(!user){
            console.log("Socket connection rejected: User not found");
            return next(new Error("Unauthorized: User not found")); 
        }

        // attach user information to socket object
        socket.user = user;
        socket.userId = user._id.toString();

        console.log(`Socket authenticated for user: ${user.fullName} (${user._id})`);

        next();    // proceed to the next middleware or connection handler
    } catch (error) {
        console.log("Socket connection rejected:", error.message);
        return next(new Error("Unauthorized: " + error.message));
    }
};