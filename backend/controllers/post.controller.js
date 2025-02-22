import cloudinary from "../lib/cloudinary.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";
import { sendCommentNotificationEmail } from "../emails/emailHandlers.js";
import path from "path";
import multer from "multer";

export const getFeedPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      author: { $in: [...req.user.connections, req.user._id] },
    })
      .populate("author", "name username profilePicture headline")
      .populate("comments.user", "name profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error in getFeedPosts controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Set up multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Specify the directory to save files
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Set up multer for image and video uploads
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg" && ext !== ".mp4") {
      return cb(new Error("Only images and videos are allowed"));
    }
    cb(null, true);
  },
});

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


// Post creation controller
export const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    console.log("content: ", content);
    let newPost = { author: req.user._id, content };
    let check = false;
    console.log("req", req.files.video);
    let response;
    let post;
    // Add image URL to post if an image is uploaded
    if (req.files.image) {
      check = true;
      response = await uploadFiletoCloudinary(
        req.files.image[0],
        "normalpractice"
      );
      post = new Post({
        ...newPost,
        contentimg: response.secure_url,
      });
      // newPost.contentimg = `/uploads/${req.files.image[0].filename}`;
    }

    // Add video URL to post if a video is uploaded
    if (req.files.video) {
      check = true;

      response = await uploadFiletoCloudinary(
        req.files.video[0],
        "normalpractice"
      );
      post = new Post({
        ...newPost,
        contentvideo: response.secure_url,
      });
      // newPost.contentvideo = `/uploads/${req.files.video[0].filename}`;
    }
    if (!check) {
      post = new Post({
        ...newPost,
      });
    }
    console.log("response: ", response);
    // Create and save the post

    await post.save();

    res.status(201).json(post);
  } catch (error) {
    console.error("Error in createPost controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const editPost = async (req, res) => {
  try {
    const { id } = req.params; // assuming the post ID is passed in the URL
    const { content } = req.body;
    console.log("id ", id, content);
    // Find the post by ID
    let post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Update the post content
    if (content) {
      post.content = content;
    }

    let check = false;
    let response;

    if (req.files.image) {
      check = true;
      response = await uploadFiletoCloudinary(
        req.files.image[0],
        "normalpractice"
      );
      post.contentimg = response.secure_url;
    }

    // Update video URL if a new video is uploaded
    if (req.files.video) {
      check = true;
      response = await uploadFiletoCloudinary(
        req.files.video[0],
        "normalpractice"
      );
      post.contentvideo = response.secure_url;
    }

    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.error("Error in editPost controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // check if the current user is the author of the post
    if (post.author.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this post" });
    }

    // delete the image from cloudinary as well!
    if (post.image) {
      await cloudinary.uploader.destroy(
        post.image.split("/").pop().split(".")[0]
      );
    }

    await Post.findByIdAndDelete(id);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("Error in delete post controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPostById = async (req, res) => {
  try {
    const id = req.params.id;
    const post = await Post.findById(id)
      .populate("author", "name username profilePicture headline")
      .populate("comments.user", "name profilePicture username headline");

    res.status(200).json(post);
  } catch (error) {
    console.error("Error in getPostById controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createComment = async (req, res) => {
  try {
    const id = req.params.id;
    const { content } = req.body;

    const post = await Post.findByIdAndUpdate(
      id,
      {
        $push: { comments: { user: req.user._id, content } },
      },
      { new: true }
    ).populate("author", "name email username headline profilePicture");

    // create a notification if the comment owner is not the post owner
    if (post.author._id.toString() !== req.user._id.toString()) {
      const newNotification = new Notification({
        recipient: post.author,
        type: "comment",
        relatedUser: req.user._id,
        relatedPost: id,
      });

      await newNotification.save();

      try {
        const postUrl = process.env.CLIENT_URL + "/post/" + id;
        await sendCommentNotificationEmail(
          post.author.email,
          post.author.name,
          req.user.name,
          postUrl,
          content
        );
      } catch (error) {
        console.log("Error in sending comment notification email:", error);
      }
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Error in createComment controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const likePost = async (req, res) => {
  try {
    const id = req.params.id;
    const post = await Post.findById(id);
    const userId = req.user._id;

    if (post.likes.includes(userId)) {
      // unlike the post
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // like the post
      post.likes.push(userId);
      // create a notification if the post owner is not the user who liked
      if (post.author.toString() !== userId.toString()) {
        const newNotification = new Notification({
          recipient: post.author,
          type: "like",
          relatedUser: userId,
          relatedPost: id,
        });

        await newNotification.save();
      }
    }

    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.error("Error in likePost controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.body;
    console.log("delete comment", postId, commentId);
    const post = await Post.findByIdAndUpdate(
      postId,
      { $pull: { comments: { _id: commentId } } },
      { new: true }
    ).populate("author", "name email username headline profilePicture");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Error in deleteComment controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};
