import { response } from "express";
import Message from "../models/message.model.js";
import multer from 'multer';
import path from 'path';
import cloudinary from "../lib/cloudinary.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) // Appending extension
  }
});

const upload = multer({ storage: storage });
async function uploadFiletoCloudinary(file, folder, quality) {
  const options = {
    folder: folder, // folder name
    resource_type: "auto", //it detects automatically file type
  };
  if (quality) {
    options.quality = quality;
  }
  return await cloudinary.uploader.upload(file.path, options);
}




export const sendMessage = 
  async (req, res) => {
    console.log("file ",req.file)
    const { recipientId, content } = req.body;

    try {
      console.log(
        "1"
      )
      const messageData = {
        sender: req.user._id,
        recipient: recipientId,
        deliveryStatus: 'sent'
      };
      console.log(
        "2"
      )
      // if (!messageData.content && !messageData.image) {
      //   return res.status(400).json({ message: "Message must contain either text or an image" });
      // }

      messageData.content = content;
      console.log(
        "3",
      )
      let response;
      console.log("file ",req.file)
      if (req.file) {
console.log(
  "Ef"
)
        response = await uploadFiletoCloudinary(req.file, "normalpractice");
        messageData.image = response?.secure_url|| "";
      }



      const message = new Message(messageData);
      await message.save();
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Server error" });
    }
  }




export const updateDeliveryStatus = async (req, res) => {
  const { messageId } = req.params;
  const { status } = req.body;

  try {
    const message = await Message.findByIdAndUpdate(
      messageId, 
      { deliveryStatus: status }, 
      { new: true }
    );
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    res.json(message);
  } catch (error) {
    console.error("Error updating delivery status:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getChatHistory = async (req, res) => {
  const { recipientId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: recipientId },
        { sender: recipientId, recipient: req.user._id },
      ],
    }).sort({ timestamp: 1 });

    // Mark recipient's messages as seen
    await Message.updateMany(
      { sender: recipientId, recipient: req.user._id, deliveryStatus: { $ne: 'seen' } },
      { $set: { deliveryStatus: 'seen' } }
    );

    // Mark sender's unseen messages as delivered
    await Message.updateMany(
      { sender: req.user._id, recipient: recipientId, deliveryStatus: 'sent' },
      { $set: { deliveryStatus: 'delivered' } }
    );

    res.json(messages);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Server error" });
  }
};