import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import {
  Edit,
  Loader,
  MessageCircle,
  Send,
  Share2,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import PostAction from "./PostAction";
import EditPost from "./EditPost";

const Post = ({ post }) => {
  const { postId } = useParams();
  console.log("post", post);
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const isOwner = authUser._id === post.author._id;
  const isLiked = post.likes.includes(authUser._id);
  const queryClient = useQueryClient();
  console.log("postq2", post);
  const { mutate: deletePost, isPending: isDeletingPost } = useMutation({
    mutationFn: async () => {
      await axiosInstance.delete(`/posts/delete/${post._id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: createComment, isPending: isAddingComment } = useMutation({
    mutationFn: async (newComment) => {
      await axiosInstance.post(`/posts/${post._id}/comment`, {
        content: newComment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Comment added successfully");
    },
    onError: (err) => {
      toast.error(err.response.data.message || "Failed to add comment");
    },
  });

  const { mutate: likePost, isPending: isLikingPost } = useMutation({
    mutationFn: async () => {
      await axiosInstance.post(`/posts/${post._id}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const handleDeletePost = () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    deletePost();
  };
  const { mutate: deleteComment, isPending: isDeletingComment } = useMutation({
    mutationFn: async (newComment) => {
      await axiosInstance.post(`/posts/deleteComment`, newComment);
    },
    onSuccess: (res) => {
      console.log("response ", res);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Comment added successfully");
    },
    onError: (err) => {
      toast.error(err.response.data.message || "Failed to add comment");
    },
  });
  const handleLikePost = async () => {
    if (isLikingPost) return;
    likePost();
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      createComment(newComment);
      setNewComment("");
      setComments([
        ...comments,
        {
          content: newComment,
          user: {
            _id: authUser._id,
            name: authUser.name,
            profilePicture: authUser.profilePicture,
          },
          createdAt: new Date(),
        },
      ]);
    }
  };
  const handleEditPost = () => {
    setIsEdit(true);
  };

  const handleDeleteComment = (id) => {
    deleteComment({
      commentId: id,
      postId: post._id,
    });
  };
  return (
    <>
      <div className="bg-secondary rounded-lg shadow mb-4">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Link to={`/profile/${post?.author?.username}`}>
                <img
                  src={post.author.profilePicture || "/avatar.png"}
                  alt={post.author.name}
                  className="size-10 rounded-full mr-3"
                />
              </Link>

              <div>
                <Link to={`/profile/${post?.author?.username}`}>
                  <h3 className="font-semibold">{post.author.name}</h3>
                </Link>
                <p className="text-xs text-info">Loop</p>
                <p className="text-xs text-info">
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
            {isOwner && (
              <div className=" flex flex-row gap-1">
                <button
                  onClick={handleEditPost}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={handleDeletePost}
                  className="text-red-500 hover:text-red-700"
                >
                  {isDeletingPost ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </div>
            )}
          </div>
          <p className="mb-4">{post.content}</p>

          {/* Displaying image if available */}
          {post.contentimg && (
            <img
              src={post.contentimg}
              alt="Post content"
              className="rounded-lg w-full mb-4"
            />
          )}

          {/* Displaying video if available */}
          {post.contentvideo && (
            <video controls className="rounded-lg w-full mb-4">
              <source src={post.contentvideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}

          <div className="flex justify-between text-info">
            <PostAction
              icon={
                <ThumbsUp
                  size={18}
                  className={isLiked ? "text-blue-500  fill-blue-300" : ""}
                />
              }
              text={`Like (${post.likes.length})`}
              onClick={handleLikePost}
            />

            <PostAction
              icon={<MessageCircle size={18} />}
              text={`Comment (${comments.length})`}
              onClick={() => setShowComments(!showComments)}
            />
          </div>
        </div>

        {showComments && (
          <div className="px-6  bg-gradient-to-b from-gray-50 to-white rounded-lg shadow-lg">
            <div className=" max-h-44 overflow-y-auto custom-scrollbar">
              {comments.map((comment) => (
                <div
                  key={comment._id}
                  className="mb-4 bg-white p-4 rounded-lg shadow-sm flex items-start transition-all duration-300 hover:shadow-md"
                >
                  <img
                    src={comment.user.profilePicture || "/avatar.png"}
                    alt={comment.user.name}
                    className="w-10 h-10 rounded-full mr-4 flex-shrink-0 border-2 border-primary"
                  />
                  <div className="flex-grow">
                    <div className="flex items-center mb-2">
                      <span className="font-bold text-gray-800 mr-2">
                        {comment.user.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.createdAt))}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                  {authUser?._id === comment.user._id ||
                  authUser?._id === post.author._id ? (
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            <form
              onSubmit={handleAddComment}
              className="flex items-center bg-white rounded-full shadow-md"
            >
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-grow p-3 rounded-l-full bg-transparent focus:outline-none"
              />
              <button
                type="submit"
                className="bg-primary text-white p-3 rounded-full hover:bg-primary-dark transition duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                disabled={isAddingComment}
              >
                {isAddingComment ? (
                  <Loader size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {isEdit && <EditPost post={post} onClose={() => setIsEdit(false)} />}
    </>
  );
};

export default Post;
