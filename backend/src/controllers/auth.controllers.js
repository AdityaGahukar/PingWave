import { generateToken } from '../lib/utils.js';
import User from '../models/User.model.js';
import bcrypt from "bcryptjs"

export const signup = async (req, res) => {
    const {fullName, email, password} = req.body;

    try{
        if(!fullName || !email || !password){
            return res.status(400).json({message: "All fields are required"});
        }

        if(password.length < 6){
            return  res.status(400).json({message: "Password must be at least 6 characters long"});
        }

        // check if email is valid: regex (regular expression)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            return res.status(400).json({message: "Invalid email format"});
        }
        
        // Check if the user already exists using the email entered
        const user = await User.findOne({email});
        if(user) return res.status(400).json({message: "Email already exists"}); 

        // 12345 -> $dasdfasf_?asdfasfd   ==> password hashing
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName, 
            email,
            password: hashedPassword
        })

        if(newUser){
            const savedUser = await newUser.save();  // Save the user first and then issue the auth cookie
            generateToken(newUser._id, res);

            return res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            });
        } else {
            return res.status(400).json({message: "Invalid user data"});
        }
    }
    catch (error) {
        console.log("Error in signup controller: ", error);
        res.status(500).json({message: "Internal server error"});
    }
}