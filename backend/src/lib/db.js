// allow us to connect to the database
import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch(error){
        console.error(`Error connecting to MONGODB: ${error.message}`);
        process.exit(1);  // 1 status code means failure, 0 means success
    }
}