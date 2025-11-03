import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getAllContacts = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId}}).select("-password");  // find all users except the logged-in user

        res.status(200).json({ users: filteredUsers });
    } catch (error) {
        console.log("Error in getAllContacts: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getMessagesByUserId = async (req, res) => {
    try {
        const myId = req.user._id;
        const { id: userToChatId } = req.params;

        const messages = await Message.find({
            $or: [
                {senderId: myId, receiverId: userToChatId},
                {senderId: userToChatId, receiverId: myId}
            ]
        });

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessagesByUserId controller: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const sendMessage = async (req, res) => {
    try {
        const {text, image} = req.body;
        const {id: receiverId} = req.params;
        const senderId = req.user._id;

        if(!text && !image){
            return res.status(400).json({ message: "Message text or image is required." });
        }
        if(senderId.equals(receiverId)){
            return  res.status(400).json({ message: "You cannot send message to yourself." });
        }
        const receiverExists = await User.exists({ _id: receiverId });
        if(!receiverExists){
            return res.status(404).json({ message: "Receiver user not found." });
        }

        let imageUrl;
        if (image) {
            // upload base64 image to cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });

        await newMessage.save();  // save message to the database

        const receiverSocketId = getReceiverSocketId(receiverId);
        if(receiverSocketId){  // the receiver user is online
            io.to(receiverSocketId).emit("newMessage", newMessage);  // send the new message to the receiver in real-time
        }

        res.status(201).json({ message: "Message sent successfully", newMessage });
    } catch (error) {
        console.log("Error in sendMessage controller: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const getChatPartners = async (req, res) => {
    try {   
        const loggedInUserId = req.user._id;

        // Find all the messages where logged-in user is either sender or receiver
        const messages = await Message.find({
            $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }]
        });

        // Extract unique user IDs of chat partners
        // 1. Set to avoid duplicates, then convert back to array
        // 2. map through messages to get the other party's ID
        const chatPartnerIds = [
            ...new Set(
                messages.map((msg) => 
                    msg.senderId.toString() === loggedInUserId.toString() ? msg.receiverId.toString() : msg.senderId.toString()
                )
            ),
        ];

        const chatPartners = await User.find({ _id: { $in: chatPartnerIds}}).select("-password");

        res.status(200).json({ chatPartners });
    } catch (error) {
        console.log("Error in getChatPartners controller: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


/*
Optimal aggregation approach for getting chat partners (using MongoDB aggregation pipeline):
const chatPartnerIds = await Message.aggregate([
  {
    $match: {
      $or: [
        { senderId: loggedInUserId },
        { receiverId: loggedInUserId },
      ],
    },
  },
  {
    $project: {
      partnerId: {
        $cond: [
          { $eq: ["$senderId", loggedInUserId] },
          "$receiverId",
          "$senderId",
        ],
      },
    },
  },
  { $group: { _id: "$partnerId" } },
]);

const chatPartners = await User.find({
  _id: { $in: chatPartnerIds.map((doc) => doc._id) },
}).select("-password");

*/