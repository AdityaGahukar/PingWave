import { sendWelcomeEmail } from '../emails/emailHandlers.js';
import { generateToken } from '../lib/utils.js';
import User from '../models/user.model.js';
import bcrypt from "bcryptjs"
import { ENV } from '../lib/env.js';
import cloudinary from '../lib/cloudinary.js';

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

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            });

            try {
                await sendWelcomeEmail(savedUser.fullName, savedUser.email, ENV.CLIENT_URL);
            } catch (error){
                console.error("Failed to send welcome email after signup:", error);
            }
        } else {
            res.status(400).json({message: "Invalid user data"});
        }
    }
    catch (error) {
        console.log("Error in signup controller: ", error);
        res.status(500).json({message: "Internal server error"});
    }
}

export const login = async (req, res) => {
    const {email, password} = req.body;

    try {
        if(!email || !password){
            return res.status(400).json({message: "All fields are required"});
        }

        const user = await User.findOne({email});
        if(!user){
            // never tell the user whether the email or password is incorrect for security reasons (to prevent user enumeration attacks)
            return res.status(400).json({message: "Invalid email or password"});
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            return res.status(400).json({message: "Invalid email or password"});
        }

        generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        });
    } catch (error){
        console.error("Error in login controller: ", error);
        res.status(500).json({message: "Internal server error"});
    }
};

export const logout = (_, res) => {
    res.cookie("jwt", "", {maxAge: 0});  // expire the cookie immediately
    res.status(200).json({message: "Logged out successfully"});
};

export const updateProfilePic = async (req, res) => {
    try {
        const { profilePic } = req.body;  // new profile picture URL
        if(!profilePic) return res.status(400).json({ message: "Profile picture is required" }); 

        const userId = req.user._id;  // obtained from protectRoute middleware
        
        const uploadResponse = await cloudinary.uploader.upload(profilePic);  // upload to Cloudinary

        const updatedUser = await User.findByIdAndUpdate(  // update user in DB
            userId,
            { profilePic: uploadResponse.secure_url },
            { new: true, select: "-password -__v" }  // return the updated document excluding password and __v
        );

        res.status(200).json(updatedUser);  // return the updated user object
    } catch (error) {
        console.error("Error in updateProfilePic controller: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}