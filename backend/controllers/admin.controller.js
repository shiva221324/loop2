import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import Admin from "../models/admin.model.js";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import ConnectionRequest from "../models/connectionRequest.model.js";
import Message from "../models/message.model.js";
import Notification from "../models/notification.model.js";
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await Admin.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create and send token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });
    await res.cookie("jwt-linkedin", token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.json({ message: "Logged in successfully", role: "admin" });
  } catch (error) {
    console.error("Error in login controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message }); // Handle any errors
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find posts by the user ID
    const posts = await Post.find({ author: userId })
      .populate("author", "name username profilePicture headline")
      .populate("comments.user", "name profilePicture")
      .sort({ createdAt: -1 });

    console.log(posts);
    // Check if posts exist
    if (!posts) {
      return res.status(404).json({ message: "No posts found for this user." });
    }

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deletePost = async (req, res) => {
  const { postId } = req.params;
  console.log("postid", postId);
  try {
    // Find the post by ID and delete it
    const deletedPost = await Post.findByIdAndDelete(postId);

    // Check if the post was found and deleted
    if (!deletedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const freezeUser = async (req, res) => {
  const { userId } = req.params;
  console.log("req.body", req.body);
  const { freeze } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { isFreezed: freeze },
      { new: true } // Return the updated document
    );
    console.log("user", user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: `Account ${freeze ? "frozen" : "unfrozen"} successfully`,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};

export const deleteUser = async (req, res) => {
  console.log("delete");
  const userId = req.params.id;
  console.log("deleting user", userId);
  try {
    // Step 1: Delete the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 2: Delete related connection requests
    await ConnectionRequest.deleteMany({
      $or: [{ sender: userId }, { recipient: userId }],
    });

    // Step 3: Delete related messages
    await Message.deleteMany({
      $or: [{ sender: userId }, { recipient: userId }],
    });

    // Step 4: Delete related notifications
    await Notification.deleteMany({
      $or: [{ recipient: userId }, { relatedUser: userId }],
    });

    // Step 5: Delete related posts by the user
    await Post.deleteMany({ author: userId });

    // Step 6: Remove user's comments and likes from other posts
    await Post.updateMany(
      {},
      {
        $pull: {
          comments: { user: userId },
          likes: userId,
        },
      }
    );

    // Step 7: Delete the user
    await User.findByIdAndDelete(userId);

    res
      .status(200)
      .json({ message: "User and related data deleted successfully" });
  } catch (error) {
    console.error("Error deleting user and related data:", error);
    res.status(500).json({ message: "Server error" });
  }
};
