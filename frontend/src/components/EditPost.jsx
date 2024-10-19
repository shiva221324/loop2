import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Image, Loader, Video, X } from "lucide-react";

const EditPost = ({ post, onClose }) => {
  const [content, setContent] = useState(post.content);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(post.contentimg); // Existing image
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(post.contentvideo); // Existing video
  const queryClient = useQueryClient();

  const { mutate: editpostMutation, isPending } = useMutation({
    mutationFn: async (formData) => {
      const res = await axiosInstance.post(`/posts/edit/${post._id}`, formData);
      return res.data;
    },
    onSuccess: (post) => {
      toast.success("Post edited successfully");
      onClose();
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err) => {
      toast.error(err.response.data.message || "Failed to update post");
    },
  });

  const handlePostUpdate = async () => {
    try {
      const formData = new FormData();
      formData.append("content", content);

      if (image) {
        formData.append("image", image);
      }

      if (video) {
        formData.append("video", video);
      }

      editpostMutation(formData);
    } catch (error) {
      console.error("Error in handlePostUpdate:", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const fileType = file?.type.split("/")[0];

    if (fileType === "image") {
      setImage(file);
      setVideo(null); // Clear video if image is selected
      readFileAsDataURL(file).then(setImagePreview);
      setVideoPreview(null);
    } else if (fileType === "video") {
      setVideo(file);
      setImage(null); // Clear image if video is selected
      setImagePreview(null);
      readFileAsDataURL(file).then(setVideoPreview);
    }
  };

  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-white bg-opacity-70 backdrop-blur-md">
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-8 rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 ease-out">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Update Your Post
        </h2>

        <div className="space-y-6">
          <textarea
            placeholder="What's on your mind?"
            className="w-full p-4 rounded-xl bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none transition-all duration-200 min-h-[120px] shadow-inner"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {imagePreview && (
            <div className="mt-4 rounded-xl overflow-hidden shadow-lg">
              <img
                src={imagePreview}
                alt="Selected"
                className="w-full h-40 object-contain"
              />
            </div>
          )}

          {videoPreview && (
            <div className="mt-4 rounded-xl overflow-hidden shadow-lg">
              <video
                controls
                src={videoPreview}
                className="w-full h-40 object-contain"
              />
            </div>
          )}

          <div className="flex justify-between items-center">
            <label className="flex items-center text-blue-500 hover:text-blue-400 transition-colors duration-200 cursor-pointer group">
              <Image
                size={20}
                className="mr-2 group-hover:scale-110 transition-transform duration-200"
              />
              <span className="text-sm font-medium">Change Photo/Video</span>
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            <div className="flex space-x-4">
              <button
                className="bg-gray-300 text-gray-600 rounded-lg px-6 py-2 hover:bg-gray-400 transition-all duration-200 shadow-md hover:shadow-lg"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg px-6 py-2 hover:from-blue-600 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                onClick={handlePostUpdate}
              >
                {isPending ? (
                  <Loader className="size-5 animate-spin" />
                ) : (
                  "Update"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPost;
